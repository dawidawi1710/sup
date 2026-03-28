import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLowStockEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  // ── 1. Run daily deductions ────────────────────────────────────────────────

  const [allSupplements, skippedToday, deductedToday] = await Promise.all([
    prisma.supplement.findMany({ include: { persons: true } }),
    prisma.skippedIntake.findMany({ where: { date: todayDate } }),
    prisma.deductionLog.findMany({ where: { date: todayDate } }),
  ]);

  for (const s of allSupplements) {
    const pkgUnits: number[] = s.packageUnits ? JSON.parse(s.packageUnits) : [];
    if (pkgUnits.length === 0) continue;

    const personDeductions: { personId: number; units: number }[] = [];
    for (const sp of s.persons) {
      if (!sp.takingDaily || !sp.unitsPerDay) continue;
      if (skippedToday.some((si) => si.personId === sp.personId && si.supplementId === s.id)) continue;
      if (deductedToday.some((dl) => dl.personId === sp.personId && dl.supplementId === s.id)) continue;
      personDeductions.push({ personId: sp.personId, units: sp.unitsPerDay });
    }

    if (personDeductions.length === 0) continue;

    const toDeduct = personDeductions.reduce((a, b) => a + b.units, 0);
    let remaining = toDeduct;
    const newPkgUnits = pkgUnits.map((units) => {
      if (remaining <= 0) return units;
      const taken = Math.min(remaining, units);
      remaining -= taken;
      return Math.max(0, units - taken);
    });

    await prisma.$transaction([
      prisma.supplement.update({
        where: { id: s.id },
        data: {
          packageUnits: JSON.stringify(newPkgUnits),
          unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
          amountOfPackages: newPkgUnits.length,
        },
      }),
      ...personDeductions.map((pd) =>
        prisma.deductionLog.create({
          data: { date: todayDate, personId: pd.personId, supplementId: s.id, unitsDeducted: pd.units },
        }),
      ),
    ]);
  }

  // ── 2. Check stock levels and send emails ─────────────────────────────────

  const users = await prisma.user.findMany({
    where: { email: { not: null } },
    include: {
      supplements: {
        include: { persons: true },
      },
    },
  });

  for (const user of users) {
    const critical: { name: string; daysLeft: number }[] = [];
    const warning: { name: string; daysLeft: number }[] = [];

    for (const s of user.supplements) {
      const unitsLeft = s.unitsLeft ?? 0;
      const combinedUnitsPerDay = s.persons
        .filter((sp) => sp.takingDaily && sp.unitsPerDay)
        .reduce((sum, sp) => sum + (sp.unitsPerDay ?? 0), 0);

      if (combinedUnitsPerDay <= 0 || unitsLeft <= 0) continue;

      const daysLeft = Math.floor(unitsLeft / combinedUnitsPerDay);
      const label = `${s.activeIngredient} (${s.brand})`;

      if (daysLeft < 7) {
        critical.push({ name: label, daysLeft });
      } else if (daysLeft < 14) {
        warning.push({ name: label, daysLeft });
      }
    }

    if (critical.length === 0 && warning.length === 0) continue;

    const to = user.notificationEmail ?? user.email!;
    try {
      await sendLowStockEmail(to, critical, warning);
    } catch (e) {
      console.error(`Failed to send email to ${to}:`, e);
    }
  }

  return NextResponse.json({ ok: true });
}

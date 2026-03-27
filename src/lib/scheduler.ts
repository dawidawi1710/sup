import cron from "node-cron";
import { prisma } from "./prisma";

let task: ReturnType<typeof cron.schedule> | null = null;

export async function runDailyDeduction() {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  const [supplements, skippedToday] = await Promise.all([
    prisma.supplement.findMany({ include: { persons: true } }),
    prisma.skippedIntake.findMany({ where: { date: todayDate } }),
  ]);

  for (const s of supplements) {
    const pkgUnits: number[] = s.packageUnits ? JSON.parse(s.packageUnits) : [];
    if (pkgUnits.length === 0) continue;

    let toDeduct = 0;
    for (const sp of s.persons) {
      if (!sp.takingDaily || !sp.unitsPerDay) continue;
      if (sp.startDate && sp.startDate.toISOString().split("T")[0] > todayStr) continue;
      const isSkipped = skippedToday.some(
        (si) => si.personId === sp.personId && si.supplementId === s.id,
      );
      if (isSkipped) continue;
      toDeduct += sp.unitsPerDay;
    }

    if (toDeduct === 0) continue;

    let remaining = toDeduct;
    const newPkgUnits = pkgUnits.map((units) => {
      if (remaining <= 0) return units;
      const taken = Math.min(remaining, units);
      remaining -= taken;
      return Math.max(0, units - taken);
    });

    await prisma.supplement.update({
      where: { id: s.id },
      data: {
        packageUnits: JSON.stringify(newPkgUnits),
        unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
        amountOfPackages: newPkgUnits.length,
      },
    });
  }
}

export function reschedule(timeStr: string) {
  if (task) {
    task.stop();
    task = null;
  }
  const [h, m] = timeStr.split(":");
  task = cron.schedule(`${m} ${h} * * *`, runDailyDeduction);
}

export async function initScheduler() {
  const setting = await prisma.settings.findUnique({ where: { key: "deductionTime" } });
  const time = setting?.value ?? "22:00";
  reschedule(time);
}

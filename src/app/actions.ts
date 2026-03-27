"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ── Supplement ────────────────────────────────────────────────────────────────

function parseSupplementFormData(formData: FormData) {
  const amountOfUnits = parseInt(formData.get("amountOfUnits") as string);
  const amountOfPackages = parseInt(formData.get("amountOfPackages") as string);
  return {
    activeIngredient: formData.get("activeIngredient") as string,
    dosePerUnit: formData.get("dosePerUnit") as string,
    amountOfUnits,
    amountOfPackages,
    brand: formData.get("brand") as string,
    source: formData.get("source") as string,
    costPerPackage: parseFloat(formData.get("costPerPackage") as string),
    unitsLeft: amountOfUnits * amountOfPackages,
    packageUnits: JSON.stringify(Array(amountOfPackages).fill(amountOfUnits)),
  };
}

export async function createSupplement(formData: FormData) {
  const [persons, maxOrder] = await Promise.all([
    prisma.person.findMany({ select: { id: true } }),
    prisma.supplement.aggregate({ _max: { order: true } }),
  ]);
  await prisma.supplement.create({
    data: {
      ...parseSupplementFormData(formData),
      order: (maxOrder._max.order ?? 0) + 1,
      persons: { create: persons.map((p) => ({ personId: p.id })) },
    },
  });
  revalidatePath("/");
}

export async function reorderSupplements(ids: number[]) {
  await Promise.all(
    ids.map((id, index) => prisma.supplement.update({ where: { id }, data: { order: index } }))
  );
  revalidatePath("/");
}

export async function updateSupplement(id: number, formData: FormData) {
  await prisma.supplement.update({ where: { id }, data: parseSupplementFormData(formData) });
  revalidatePath("/");
}

export async function deleteSupplement(id: number) {
  await prisma.supplement.delete({ where: { id } });
  revalidatePath("/");
}

export async function updatePackageUnits(id: number, units: number[]) {
  await prisma.supplement.update({
    where: { id },
    data: {
      packageUnits: JSON.stringify(units),
      unitsLeft: units.reduce((a, b) => a + b, 0),
      amountOfPackages: units.length,
    },
  });
  revalidatePath("/");
}

// ── Person ────────────────────────────────────────────────────────────────────

export async function createPerson(name: string) {
  const supplements = await prisma.supplement.findMany({ select: { id: true } });
  await prisma.person.create({
    data: {
      name,
      supplementPersons: { create: supplements.map((s) => ({ supplementId: s.id })) },
    },
  });
  revalidatePath("/");
}

export async function deletePerson(id: number) {
  await prisma.person.delete({ where: { id } });
  revalidatePath("/");
}

export async function renamePerson(id: number, name: string) {
  await prisma.person.update({ where: { id }, data: { name } });
  revalidatePath("/");
}

// ── SupplementPerson ──────────────────────────────────────────────────────────

export async function updateSupplementPerson(
  personId: number,
  supplementId: number,
  data: { takingDaily?: boolean; unitsPerDay?: number | null; startDate?: string | null }
) {
  const { startDate, ...rest } = data;
  const existing = await prisma.supplementPerson.findUnique({
    where: { personId_supplementId: { personId, supplementId } },
    select: { startDate: true },
  });
  const autoDate = data.takingDaily === true && !existing?.startDate ? new Date() : undefined;
  const dbData = {
    ...rest,
    ...(startDate !== undefined
      ? { startDate: startDate ? new Date(startDate + "T00:00:00.000Z") : null }
      : autoDate ? { startDate: autoDate }
      : {}),
  };
  await prisma.supplementPerson.upsert({
    where: { personId_supplementId: { personId, supplementId } },
    create: { personId, supplementId, ...dbData, ...(autoDate && !dbData.startDate ? { startDate: autoDate } : {}) },
    update: dbData,
  });
  revalidatePath("/");
}

export async function setAllTakingDaily(value: boolean) {
  await prisma.supplementPerson.updateMany({ data: { takingDaily: value } });
  revalidatePath("/");
}

// ── SkippedIntake ──────────────────────────────────────────────────────────────

// ── Settings ──────────────────────────────────────────────────────────────────

export async function updateDeductionTime(time: string) {
  await prisma.settings.upsert({
    where: { key: "deductionTime" },
    create: { key: "deductionTime", value: time },
    update: { value: time },
  });
  const { reschedule } = await import("@/lib/scheduler");
  reschedule(time);
  revalidatePath("/");
}

export async function triggerDeductionNow() {
  const { runDailyDeduction } = await import("@/lib/scheduler");
  await runDailyDeduction();
  revalidatePath("/");
}

// ── DeductionLog ──────────────────────────────────────────────────────────────

export async function deductAllForPerson(personId: number) {
  const todayStr = new Date().toISOString().split("T")[0];
  const todayDate = new Date(todayStr + "T00:00:00.000Z");

  const [sps, alreadyLogged] = await Promise.all([
    prisma.supplementPerson.findMany({
      where: { personId, takingDaily: true },
      include: { supplement: true },
    }),
    prisma.deductionLog.findMany({ where: { date: todayDate, personId } }),
  ]);

  // Already deducted all active supplements today — nothing to do
  const activeSps = sps.filter((sp) => sp.unitsPerDay && (!sp.startDate || sp.startDate.toISOString().split("T")[0] <= todayStr));
  if (alreadyLogged.length > 0 && alreadyLogged.length >= activeSps.length) return;

  const loggedIds = new Set(alreadyLogged.map((l) => l.supplementId));

  for (const sp of sps) {
    if (!sp.unitsPerDay) continue;
    if (sp.startDate && sp.startDate.toISOString().split("T")[0] > todayStr) continue;
    if (loggedIds.has(sp.supplementId)) continue;

    const pkgUnits: number[] = sp.supplement.packageUnits
      ? JSON.parse(sp.supplement.packageUnits)
      : [];
    if (pkgUnits.length === 0) continue;

    const toDeduct = sp.unitsPerDay;
    let remaining = toDeduct;
    const newPkgUnits = pkgUnits.map((units) => {
      if (remaining <= 0) return units;
      const taken = Math.min(remaining, units);
      remaining -= taken;
      return Math.max(0, units - taken);
    });

    await prisma.$transaction([
      prisma.supplement.update({
        where: { id: sp.supplementId },
        data: {
          packageUnits: JSON.stringify(newPkgUnits),
          unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
          amountOfPackages: newPkgUnits.length,
        },
      }),
      prisma.deductionLog.create({
        data: { date: todayDate, personId, supplementId: sp.supplementId, unitsDeducted: toDeduct, source: "manual" },
      }),
    ]);
  }

  revalidatePath("/");
}

export async function revertAllForPerson(personId: number) {
  const todayDate = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");

  const logs = await prisma.deductionLog.findMany({
    where: { date: todayDate, personId },
    include: { supplement: true },
  });

  for (const log of logs) {
    const pkgUnits: number[] = log.supplement.packageUnits
      ? JSON.parse(log.supplement.packageUnits)
      : [];
    const newPkgUnits = [...pkgUnits];
    if (newPkgUnits.length > 0) {
      newPkgUnits[0] += log.unitsDeducted;
    }

    await prisma.$transaction([
      prisma.supplement.update({
        where: { id: log.supplementId },
        data: {
          packageUnits: JSON.stringify(newPkgUnits),
          unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
          amountOfPackages: newPkgUnits.length,
        },
      }),
      prisma.deductionLog.delete({
        where: { date_personId_supplementId: { date: todayDate, personId, supplementId: log.supplementId } },
      }),
    ]);
  }

  revalidatePath("/");
}

export async function skipIntake(dateStr: string, personId: number, supplementId: number) {
  const date = new Date(dateStr + "T00:00:00.000Z");

  const log = await prisma.deductionLog.findUnique({
    where: { date_personId_supplementId: { date, personId, supplementId } },
    include: { supplement: true },
  });

  await prisma.skippedIntake.upsert({
    where: { date_personId_supplementId: { date, personId, supplementId } },
    create: { date, personId, supplementId },
    update: {},
  });

  if (log && !log.reversed) {
    const pkgUnits: number[] = log.supplement.packageUnits
      ? JSON.parse(log.supplement.packageUnits)
      : [];
    const newPkgUnits = [...pkgUnits];
    if (newPkgUnits.length > 0) newPkgUnits[0] += log.unitsDeducted;
    await prisma.$transaction([
      prisma.supplement.update({
        where: { id: supplementId },
        data: {
          packageUnits: JSON.stringify(newPkgUnits),
          unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
          amountOfPackages: newPkgUnits.length,
        },
      }),
      prisma.deductionLog.update({
        where: { date_personId_supplementId: { date, personId, supplementId } },
        data: { reversed: true },
      }),
    ]);
  }

  revalidatePath("/");
}

export async function unskipIntake(dateStr: string, personId: number, supplementId: number) {
  const date = new Date(dateStr + "T00:00:00.000Z");

  const log = await prisma.deductionLog.findUnique({
    where: { date_personId_supplementId: { date, personId, supplementId } },
    include: { supplement: true },
  });

  await prisma.skippedIntake.delete({
    where: { date_personId_supplementId: { date, personId, supplementId } },
  });

  if (log?.reversed) {
    const pkgUnits: number[] = log.supplement.packageUnits
      ? JSON.parse(log.supplement.packageUnits)
      : [];
    let remaining = log.unitsDeducted;
    const newPkgUnits = pkgUnits.map((units) => {
      if (remaining <= 0) return units;
      const taken = Math.min(remaining, units);
      remaining -= taken;
      return Math.max(0, units - taken);
    });
    await prisma.$transaction([
      prisma.supplement.update({
        where: { id: supplementId },
        data: {
          packageUnits: JSON.stringify(newPkgUnits),
          unitsLeft: newPkgUnits.reduce((a, b) => a + b, 0),
          amountOfPackages: newPkgUnits.length,
        },
      }),
      prisma.deductionLog.update({
        where: { date_personId_supplementId: { date, personId, supplementId } },
        data: { reversed: false },
      }),
    ]);
  }

  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

// ── Supplement ────────────────────────────────────────────────────────────────

function parseSupplementFormData(formData: FormData) {
  const amountOfUnits = parseInt(formData.get("amountOfUnits") as string);
  const amountOfPackages = parseInt(formData.get("amountOfPackages") as string);
  const startDateStr = formData.get("startDate") as string | null;
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
    startDate: startDateStr ? new Date(startDateStr) : null,
  };
}

export async function createSupplement(formData: FormData) {
  const persons = await prisma.person.findMany({ select: { id: true } });
  await prisma.supplement.create({
    data: {
      ...parseSupplementFormData(formData),
      persons: { create: persons.map((p) => ({ personId: p.id })) },
    },
  });
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
      startDate: new Date(),
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
  data: { takingDaily?: boolean; unitsPerDay?: number | null }
) {
  await prisma.supplementPerson.upsert({
    where: { personId_supplementId: { personId, supplementId } },
    create: { personId, supplementId, ...data },
    update: data,
  });
  revalidatePath("/");
}

export async function setAllTakingDaily(value: boolean) {
  await prisma.supplementPerson.updateMany({ data: { takingDaily: value } });
  revalidatePath("/");
}

// ── SkippedIntake ──────────────────────────────────────────────────────────────

export async function skipIntake(dateStr: string, personId: number, supplementId: number) {
  const date = new Date(dateStr + "T00:00:00.000Z");
  await prisma.skippedIntake.upsert({
    where: { date_personId_supplementId: { date, personId, supplementId } },
    create: { date, personId, supplementId },
    update: {},
  });
  revalidatePath("/");
}

export async function unskipIntake(dateStr: string, personId: number, supplementId: number) {
  const date = new Date(dateStr + "T00:00:00.000Z");
  await prisma.skippedIntake.delete({
    where: { date_personId_supplementId: { date, personId, supplementId } },
  });
  revalidatePath("/");
}

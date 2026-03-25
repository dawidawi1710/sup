"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function parseSupplementFormData(formData: FormData) {
  const unitsPerDayRaw = formData.get("unitsPerDay") as string;
  const amountOfUnits = parseInt(formData.get("amountOfUnits") as string);
  const amountOfPackages = parseInt(formData.get("amountOfPackages") as string);
  const fullUnits = Array(amountOfPackages).fill(amountOfUnits);
  return {
    activeIngredient: formData.get("activeIngredient") as string,
    dosePerUnit: formData.get("dosePerUnit") as string,
    amountOfUnits,
    amountOfPackages,
    brand: formData.get("brand") as string,
    source: formData.get("source") as string,
    costPerPackage: parseFloat(formData.get("costPerPackage") as string),
    unitsPerDay: unitsPerDayRaw ? parseInt(unitsPerDayRaw) : null,
    unitsLeft: amountOfUnits * amountOfPackages,
    packageUnits: JSON.stringify(fullUnits),
  };
}

export async function createSupplement(formData: FormData) {
  await prisma.supplement.create({ data: parseSupplementFormData(formData) });
  revalidatePath("/");
}

export async function updateSupplement(id: number, formData: FormData) {
  await prisma.supplement.update({
    where: { id },
    data: parseSupplementFormData(formData),
  });
  revalidatePath("/");
}

export async function deleteSupplement(id: number) {
  await prisma.supplement.delete({ where: { id } });
  revalidatePath("/");
}

export async function setTakingDaily(id: number, value: boolean) {
  await prisma.supplement.update({ where: { id }, data: { takingDaily: value } });
  revalidatePath("/");
}

export async function updatePackageUnits(id: number, units: number[]) {
  const unitsLeft = units.reduce((a, b) => a + b, 0);
  await prisma.supplement.update({
    where: { id },
    data: { packageUnits: JSON.stringify(units), unitsLeft },
  });
  revalidatePath("/");
}

export async function setAllTakingDaily(value: boolean) {
  await prisma.supplement.updateMany({ data: { takingDaily: value } });
  revalidatePath("/");
}

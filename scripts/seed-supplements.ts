import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.SEED_USER_ID;
  if (!userId) throw new Error("Set SEED_USER_ID env var to your user id before seeding");

  await prisma.supplement.createMany({
    data: [
      {
        userId,
        brand: "Altapharma",
        activeIngredient: "B-Komplex Depot",
        dosePerUnit: "",
        amountOfUnits: 60,
        amountOfPackages: 1,
        source: "Rossmann",
        costPerPackage: 2.29,
      },
      {
        userId,
        brand: "Doppelherz",
        activeIngredient: "Omega-3 vegan (DHA/EPA)",
        dosePerUnit: "250mg DHA/EPA (1000mg Omega-3)",
        amountOfUnits: 60,
        amountOfPackages: 1,
        source: "Rossmann",
        costPerPackage: 7.99,
      },
      {
        userId,
        brand: "Doctor's Best",
        activeIngredient: "CoQ10",
        dosePerUnit: "100mg",
        amountOfUnits: 120,
        amountOfPackages: 1,
        source: "iHerb",
        costPerPackage: 19.43,
      },
      {
        userId,
        brand: "Now Foods",
        activeIngredient: "Maca",
        dosePerUnit: "500mg",
        amountOfUnits: 250,
        amountOfPackages: 1,
        source: "iHerb",
        costPerPackage: 16.14,
      },
      {
        userId,
        brand: "Nature's Way",
        activeIngredient: "Choline",
        dosePerUnit: "500mg",
        amountOfUnits: 100,
        amountOfPackages: 1,
        source: "iHerb",
        costPerPackage: 11.40,
      },
      {
        userId,
        brand: "Carlson",
        activeIngredient: "Folic Acid",
        dosePerUnit: "400mcg",
        amountOfUnits: 300,
        amountOfPackages: 1,
        source: "",
        costPerPackage: 10.43,
      },
    ],
  });
  console.log("Done.");
}

main().finally(() => prisma.$disconnect());

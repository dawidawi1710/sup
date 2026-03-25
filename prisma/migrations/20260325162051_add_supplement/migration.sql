/*
  Warnings:

  - You are about to drop the `Placeholder` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Placeholder";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Supplement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activeIngredient" TEXT NOT NULL,
    "dosePerUnit" TEXT NOT NULL,
    "amountOfUnits" INTEGER NOT NULL,
    "amountOfPackages" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "costPerPackage" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

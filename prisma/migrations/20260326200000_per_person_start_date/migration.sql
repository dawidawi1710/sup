-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SupplementPerson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "takingDaily" BOOLEAN NOT NULL DEFAULT false,
    "unitsPerDay" INTEGER,
    "startDate" DATETIME,
    FOREIGN KEY ("supplementId") REFERENCES "Supplement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SupplementPerson" ("id", "personId", "supplementId", "takingDaily", "unitsPerDay") SELECT "id", "personId", "supplementId", "takingDaily", "unitsPerDay" FROM "SupplementPerson";
DROP TABLE "SupplementPerson";
ALTER TABLE "new_SupplementPerson" RENAME TO "SupplementPerson";
CREATE UNIQUE INDEX "SupplementPerson_personId_supplementId_key" ON "SupplementPerson"("personId" ASC, "supplementId" ASC);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable (drop startDate from Supplement)
CREATE TABLE "new_Supplement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "activeIngredient" TEXT NOT NULL,
    "dosePerUnit" TEXT NOT NULL,
    "amountOfUnits" INTEGER NOT NULL,
    "amountOfPackages" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "costPerPackage" REAL NOT NULL,
    "unitsLeft" INTEGER,
    "packageUnits" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Supplement" ("id", "activeIngredient", "dosePerUnit", "amountOfUnits", "amountOfPackages", "brand", "source", "costPerPackage", "unitsLeft", "packageUnits", "createdAt") SELECT "id", "activeIngredient", "dosePerUnit", "amountOfUnits", "amountOfPackages", "brand", "source", "costPerPackage", "unitsLeft", "packageUnits", "createdAt" FROM "Supplement";
DROP TABLE "Supplement";
ALTER TABLE "new_Supplement" RENAME TO "Supplement";

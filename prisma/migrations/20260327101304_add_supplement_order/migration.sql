-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "packageSetAt" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Supplement" ("activeIngredient", "amountOfPackages", "amountOfUnits", "brand", "costPerPackage", "createdAt", "dosePerUnit", "id", "packageSetAt", "packageUnits", "source", "unitsLeft") SELECT "activeIngredient", "amountOfPackages", "amountOfUnits", "brand", "costPerPackage", "createdAt", "dosePerUnit", "id", "packageSetAt", "packageUnits", "source", "unitsLeft" FROM "Supplement";
DROP TABLE "Supplement";
ALTER TABLE "new_Supplement" RENAME TO "Supplement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

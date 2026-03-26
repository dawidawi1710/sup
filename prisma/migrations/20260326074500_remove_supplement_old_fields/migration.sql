-- Recreate Supplement table without takingDaily and unitsPerDay columns
PRAGMA foreign_keys=off;

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

INSERT INTO "new_Supplement" ("id","activeIngredient","dosePerUnit","amountOfUnits","amountOfPackages","brand","source","costPerPackage","unitsLeft","packageUnits","createdAt")
SELECT "id","activeIngredient","dosePerUnit","amountOfUnits","amountOfPackages","brand","source","costPerPackage","unitsLeft","packageUnits","createdAt"
FROM "Supplement";

DROP TABLE "Supplement";
ALTER TABLE "new_Supplement" RENAME TO "Supplement";

PRAGMA foreign_keys=on;

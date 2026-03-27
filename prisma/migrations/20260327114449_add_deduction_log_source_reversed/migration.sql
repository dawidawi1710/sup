-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeductionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "unitsDeducted" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "reversed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "DeductionLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeductionLog_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DeductionLog" ("date", "id", "personId", "supplementId", "unitsDeducted") SELECT "date", "id", "personId", "supplementId", "unitsDeducted" FROM "DeductionLog";
DROP TABLE "DeductionLog";
ALTER TABLE "new_DeductionLog" RENAME TO "DeductionLog";
CREATE UNIQUE INDEX "DeductionLog_date_personId_supplementId_key" ON "DeductionLog"("date", "personId", "supplementId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

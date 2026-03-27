-- CreateTable
CREATE TABLE "DeductionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "unitsDeducted" INTEGER NOT NULL,
    CONSTRAINT "DeductionLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DeductionLog_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DeductionLog_date_personId_supplementId_key" ON "DeductionLog"("date", "personId", "supplementId");

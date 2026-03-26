-- CreateTable
CREATE TABLE "SkippedIntake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    CONSTRAINT "SkippedIntake_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SkippedIntake_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SkippedIntake_date_personId_supplementId_key" ON "SkippedIntake"("date", "personId", "supplementId");

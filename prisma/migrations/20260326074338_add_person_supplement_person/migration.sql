-- CreateTable
CREATE TABLE "Person" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SupplementPerson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "takingDaily" BOOLEAN NOT NULL DEFAULT false,
    "unitsPerDay" INTEGER,
    CONSTRAINT "SupplementPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplementPerson_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplementPerson_personId_supplementId_key" ON "SupplementPerson"("personId", "supplementId");

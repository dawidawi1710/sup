-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplementPerson" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "takingDaily" BOOLEAN NOT NULL DEFAULT false,
    "unitsPerDay" INTEGER,

    CONSTRAINT "SupplementPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplement" (
    "id" SERIAL NOT NULL,
    "activeIngredient" TEXT NOT NULL,
    "dosePerUnit" TEXT NOT NULL,
    "amountOfUnits" INTEGER NOT NULL,
    "amountOfPackages" INTEGER NOT NULL,
    "brand" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "costPerPackage" DOUBLE PRECISION NOT NULL,
    "unitsLeft" INTEGER,
    "packageUnits" TEXT,
    "packageSetAt" TIMESTAMP(3),
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeductionLog" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,
    "unitsDeducted" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "reversed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeductionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "SkippedIntake" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "personId" INTEGER NOT NULL,
    "supplementId" INTEGER NOT NULL,

    CONSTRAINT "SkippedIntake_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupplementPerson_personId_supplementId_key" ON "SupplementPerson"("personId", "supplementId");

-- CreateIndex
CREATE UNIQUE INDEX "DeductionLog_date_personId_supplementId_key" ON "DeductionLog"("date", "personId", "supplementId");

-- CreateIndex
CREATE UNIQUE INDEX "SkippedIntake_date_personId_supplementId_key" ON "SkippedIntake"("date", "personId", "supplementId");

-- AddForeignKey
ALTER TABLE "SupplementPerson" ADD CONSTRAINT "SupplementPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplementPerson" ADD CONSTRAINT "SupplementPerson_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionLog" ADD CONSTRAINT "DeductionLog_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeductionLog" ADD CONSTRAINT "DeductionLog_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkippedIntake" ADD CONSTRAINT "SkippedIntake_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkippedIntake" ADD CONSTRAINT "SkippedIntake_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "Supplement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

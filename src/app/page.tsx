import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SupplementsClient from "./SupplementsClient";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/api/auth/signin");
  const userId = session.user.id;

  const todayDate = new Date(new Date().toISOString().split("T")[0] + "T00:00:00.000Z");

  const [persons, supplements, rawSkipped, deductionTimeSetting, rawDeductedToday, rawAllLogs] = await Promise.all([
    prisma.person.findMany({ where: { userId }, orderBy: { id: "asc" } }),
    prisma.supplement.findMany({
      where: { userId },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      include: { persons: { include: { person: true } } },
    }),
    prisma.skippedIntake.findMany({ where: { person: { userId } } }),
    prisma.settings.findUnique({ where: { key: "deductionTime" } }),
    prisma.deductionLog.findMany({ where: { date: todayDate, person: { userId } } }),
    prisma.deductionLog.findMany({ where: { person: { userId } } }),
  ]);

  const serialized = supplements.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    persons: s.persons.map((sp) => ({ ...sp })),
  }));

  const skippedIntakes = rawSkipped.map((si) => ({
    date: si.date.toISOString().split("T")[0],
    personId: si.personId,
    supplementId: si.supplementId,
  }));

  const deductedToday = rawDeductedToday.map((dl) => ({
    personId: dl.personId,
    supplementId: dl.supplementId,
    unitsDeducted: dl.unitsDeducted,
  }));

  const allDeductionLogs = rawAllLogs.map((dl) => ({
    date: dl.date.toISOString().split("T")[0],
    personId: dl.personId,
    supplementId: dl.supplementId,
    source: dl.source,
    reversed: dl.reversed,
    unitsDeducted: dl.unitsDeducted,
  }));

  return (
    <main className="min-h-screen bg-white">
      <SupplementsClient
        persons={persons}
        supplements={serialized}
        skippedIntakes={skippedIntakes}
        deductionTime={deductionTimeSetting?.value ?? "22:00"}
        deductedToday={deductedToday}
        allDeductionLogs={allDeductionLogs}
      />
    </main>
  );
}

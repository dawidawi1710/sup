import { prisma } from "@/lib/prisma";
import SupplementsClient from "./SupplementsClient";

export default async function Home() {
  const [persons, supplements, rawSkipped] = await Promise.all([
    prisma.person.findMany({ orderBy: { id: "asc" } }),
    prisma.supplement.findMany({
      orderBy: { createdAt: "desc" },
      include: { persons: { include: { person: true } } },
    }),
    prisma.skippedIntake.findMany(),
  ]);

  const serialized = supplements.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    packageSetAt: s.packageSetAt ? s.packageSetAt.toISOString() : null,
    persons: s.persons.map((sp) => ({
      ...sp,
      startDate: sp.startDate ? sp.startDate.toISOString() : null,
    })),
  }));

  const skippedIntakes = rawSkipped.map((si) => ({
    date: si.date.toISOString().split("T")[0],
    personId: si.personId,
    supplementId: si.supplementId,
  }));

  return (
    <main className="flex min-h-screen flex-col items-center px-8 py-12">
      <SupplementsClient persons={persons} supplements={serialized} skippedIntakes={skippedIntakes} />
    </main>
  );
}

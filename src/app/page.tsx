import { prisma } from "@/lib/prisma";
import SupplementsClient from "./SupplementsClient";

export default async function Home() {
  const [persons, supplements] = await Promise.all([
    prisma.person.findMany({ orderBy: { id: "asc" } }),
    prisma.supplement.findMany({
      orderBy: { createdAt: "desc" },
      include: { persons: { include: { person: true } } },
    }),
  ]);

  return (
    <main className="flex min-h-screen flex-col items-center px-8 py-12">
      <SupplementsClient persons={persons} supplements={supplements} />
    </main>
  );
}

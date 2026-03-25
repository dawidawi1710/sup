import { prisma } from "@/lib/prisma";
import SupplementsClient from "./SupplementsClient";

export default async function Home() {
  const supplements = await prisma.supplement.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="flex min-h-screen flex-col items-center px-8 py-12">
      <SupplementsClient supplements={supplements} />
    </main>
  );
}

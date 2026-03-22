import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SimulationLibrary } from "@/components/dashboard/simulation-library";

export default async function SimulationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const sims = await db.savedSimulation.findMany({
    where: { userId: session.user.id },
    orderBy: { savedAt: "desc" },
    take: 200,
  });

  const serialized = sims.map((s) => ({
    ...s,
    savedAt: s.savedAt.toISOString(),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--txt-1)" }}>
          Simulation Library
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--txt-4)" }}>
          Bookmarked routes and auto-saved opportunities. Pin, annotate, and export.
        </p>
      </div>
      <SimulationLibrary initialSims={serialized} />
    </div>
  );
}

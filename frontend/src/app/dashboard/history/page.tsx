import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ExecutionHistory } from "@/components/dashboard/execution-history";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const records = await db.executionRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { startedAt: "desc" },
    take: 200,
  });

  const serialized = records.map((r) => ({
    ...r,
    startedAt: r.startedAt.toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "var(--txt-1)" }}>
          Execution History
        </h1>
        <p className="mt-0.5 text-sm" style={{ color: "var(--txt-4)" }}>
          Every route execution — approved, rejected, and fallback. Click a row to expand details.
        </p>
      </div>
      <ExecutionHistory executions={serialized} />
    </div>
  );
}

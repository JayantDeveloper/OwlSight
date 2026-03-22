import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ExecutionConfigClient } from "@/components/settings/execution-config-client";
import { db } from "@/lib/db";

export default async function ExecutionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const conn = await db.executionConnection.findUnique({ where: { userId: session.user.id } });

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <h2 className="mb-1 text-base font-semibold" style={{ color: "var(--txt-1)" }}>Execution</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--txt-3)" }}>
        Configure your Hummingbot connection and execution mode. Live mode requires a running Hummingbot instance.
      </p>
      <ExecutionConfigClient
        initialMode={conn?.mode ?? "mock"}
        initialUrl={conn?.hummingbotUrl ?? ""}
        initialStatus={conn?.status ?? "disconnected"}
      />
    </div>
  );
}

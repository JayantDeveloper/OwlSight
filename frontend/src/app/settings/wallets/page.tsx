import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { WalletsClient } from "@/components/settings/wallets-client";
import { db } from "@/lib/db";

export default async function WalletsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const wallets = await db.linkedWallet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <h2 className="mb-1 text-base font-semibold" style={{ color: "var(--txt-1)" }}>Wallets</h2>
      <p className="mb-6 text-sm" style={{ color: "var(--txt-3)" }}>
        Connect Solana and EVM wallets. OwlSight never stores private keys — only your public address.
      </p>
      <WalletsClient initialWallets={wallets} />
    </div>
  );
}

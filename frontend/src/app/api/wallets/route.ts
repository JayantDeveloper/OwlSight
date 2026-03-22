import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const wallets = await db.linkedWallet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ wallets });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ecosystem, address, chainId, network, walletType, label } = await req.json();
  if (!ecosystem || !address) {
    return NextResponse.json({ error: "ecosystem and address required" }, { status: 400 });
  }

  try {
    const wallet = await db.linkedWallet.upsert({
      where: { userId_ecosystem_address: { userId: session.user.id, ecosystem, address } },
      create: { userId: session.user.id, ecosystem, address, chainId, network, walletType, label },
      update: { chainId, network, walletType, label },
    });
    return NextResponse.json({ wallet }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to save wallet" }, { status: 500 });
  }
}

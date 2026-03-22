import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const wallet = await db.linkedWallet.findUnique({ where: { id } });
  if (!wallet || wallet.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.linkedWallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

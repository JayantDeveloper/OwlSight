import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sim = await db.savedSimulation.findUnique({ where: { id } });
  if (!sim || sim.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { label, notes, pinned } = body;

  const updated = await db.savedSimulation.update({
    where: { id },
    data: {
      ...(label !== undefined ? { label } : {}),
      ...(notes !== undefined ? { notes } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
    },
  });

  return NextResponse.json({ simulation: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const sim = await db.savedSimulation.findUnique({ where: { id } });
  if (!sim || sim.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.savedSimulation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

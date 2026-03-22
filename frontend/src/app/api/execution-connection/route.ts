import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conn = await db.executionConnection.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ connection: conn });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { mode, hummingbotUrl, status } = await req.json();

  const conn = await db.executionConnection.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, mode, hummingbotUrl, status },
    update: { mode, hummingbotUrl, status },
  });
  return NextResponse.json({ connection: conn });
}

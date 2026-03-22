import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  const user = await db.user.update({
    where: { id: session.user.id },
    data: { name },
    select: { id: true, name: true, email: true },
  });
  return NextResponse.json({ user });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const record = await db.executionRecord.findUnique({ where: { id } });

  if (!record || record.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    execution: {
      ...record,
      timeline: record.timeline ? JSON.parse(record.timeline) : [],
    },
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const records = await db.executionRecord.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
    },
    orderBy: { startedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ executions: records });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    simulationId,
    executionId,
    requestId,
    opportunityId,
    assetSymbol,
    buyChain,
    sellChain,
    bridgeName,
    notionalUsd,
    expectedNetProfitUsd,
    confidenceScore,
    executionModeRequested,
    executionModeUsed,
    status,
    fallbackReason,
    rejectionReason,
    timeline,
    completedAt,
  } = body;

  if (!executionId || !opportunityId || !status) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const record = await db.executionRecord.create({
      data: {
        userId: session.user.id,
        simulationId: simulationId ?? null,
        executionId,
        requestId: requestId ?? null,
        opportunityId,
        assetSymbol: assetSymbol ?? "",
        buyChain: buyChain ?? "",
        sellChain: sellChain ?? "",
        bridgeName: bridgeName ?? "",
        notionalUsd: notionalUsd ?? 0,
        expectedNetProfitUsd: expectedNetProfitUsd ?? 0,
        confidenceScore: confidenceScore ?? 0,
        executionModeRequested: executionModeRequested ?? "mock",
        executionModeUsed: executionModeUsed ?? "mock",
        status,
        fallbackReason: fallbackReason ?? null,
        rejectionReason: rejectionReason ?? null,
        timeline: timeline ? JSON.stringify(timeline) : null,
        completedAt: completedAt ? new Date(completedAt) : null,
      },
    });
    return NextResponse.json({ execution: record }, { status: 201 });
  } catch (err) {
    console.error("Failed to save execution:", err);
    return NextResponse.json({ error: "Failed to save execution" }, { status: 500 });
  }
}

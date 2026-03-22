import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pinned = searchParams.get("pinned");

  const sims = await db.savedSimulation.findMany({
    where: {
      userId: session.user.id,
      ...(pinned === "true" ? { pinned: true } : {}),
    },
    orderBy: { savedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ simulations: sims });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    opportunityId,
    assetSymbol,
    buyChain,
    buyVenue,
    sellChain,
    sellVenue,
    bridgeName,
    notionalUsd,
    grossSpreadBps,
    expectedNetProfitUsd,
    confidenceScore,
    estimatedFeesUsd,
    estimatedSlippageBps,
    estimatedBridgeLatencySec,
    approvalStage,
    approvalReason,
    monteCarlo,
    costBreakdown,
    label,
    notes,
  } = body;

  if (!opportunityId || !assetSymbol || !buyChain || !sellChain) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const sim = await db.savedSimulation.create({
      data: {
        userId: session.user.id,
        opportunityId,
        assetSymbol,
        buyChain,
        buyVenue: buyVenue ?? "",
        sellChain,
        sellVenue: sellVenue ?? "",
        bridgeName: bridgeName ?? "",
        notionalUsd: notionalUsd ?? 0,
        grossSpreadBps: grossSpreadBps ?? 0,
        expectedNetProfitUsd: expectedNetProfitUsd ?? 0,
        confidenceScore: confidenceScore ?? 0,
        estimatedFeesUsd: estimatedFeesUsd ?? 0,
        estimatedSlippageBps: estimatedSlippageBps ?? 0,
        estimatedBridgeLatencySec: estimatedBridgeLatencySec ?? 0,
        approvalStage: approvalStage ?? "pending",
        approvalReason: approvalReason ?? null,
        monteCarlo: monteCarlo ? JSON.stringify(monteCarlo) : null,
        costBreakdown: costBreakdown ? JSON.stringify(costBreakdown) : null,
        label: label ?? null,
        notes: notes ?? null,
      },
    });
    return NextResponse.json({ simulation: sim }, { status: 201 });
  } catch (err) {
    console.error("Failed to save simulation:", err);
    return NextResponse.json({ error: "Failed to save simulation" }, { status: 500 });
  }
}

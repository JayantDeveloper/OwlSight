import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ status: "error" }, { status: 400 });
  }

  const base = url.replace(/\/$/, "");
  for (const path of ["/", "/health"]) {
    try {
      const res = await fetch(base + path, {
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return NextResponse.json({ status: "connected" });
    } catch {
      // try next path
    }
  }

  return NextResponse.json({ status: "error" });
}

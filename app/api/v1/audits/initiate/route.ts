import { NextResponse } from "next/server";
import { AuditStoreError, initiateAuditCycle } from "@/lib/auditStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const cycle = await initiateAuditCycle(payload);
    return NextResponse.json(cycle, { status: 201 });
  } catch (error) {
    const status = error instanceof AuditStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to initiate audit cycle.";
    return NextResponse.json({ error: message }, { status });
  }
}

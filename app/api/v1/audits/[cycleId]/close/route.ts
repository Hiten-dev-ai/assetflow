import { NextResponse } from "next/server";
import { AuditStoreError, closeAuditCycle } from "@/lib/auditStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cycleId: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { cycleId } = await context.params;
    const payload = await request.json();
    const result = await closeAuditCycle(cycleId, payload);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof AuditStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to close audit cycle.";
    return NextResponse.json({ error: message }, { status });
  }
}

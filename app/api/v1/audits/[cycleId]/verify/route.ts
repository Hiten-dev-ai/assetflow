import { NextResponse } from "next/server";
import { AuditStoreError, verifyAuditItem } from "@/lib/auditStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cycleId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { cycleId } = await context.params;
    const payload = await request.json();
    const result = await verifyAuditItem(cycleId, payload);
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof AuditStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to verify audit item.";
    return NextResponse.json({ error: message }, { status });
  }
}

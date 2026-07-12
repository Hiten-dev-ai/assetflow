import { NextResponse } from "next/server";
import { AuditStoreError, extendAuditCycle } from "@/lib/auditStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ cycleId: string }> };
export async function PATCH(request: Request, context: Context) {
  try { const { cycleId } = await context.params; return NextResponse.json(await extendAuditCycle(cycleId, await request.json())); }
  catch (error) { const status = error instanceof AuditStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to extend audit cycle." }, { status }); }
}

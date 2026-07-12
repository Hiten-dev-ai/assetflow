import { NextResponse } from "next/server";
import { AuditStoreError, generateDiscrepancyReport } from "@/lib/auditStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ cycleId: string }> };
export async function POST(request: Request, context: Context) {
  try { const { cycleId } = await context.params; return NextResponse.json(await generateDiscrepancyReport(cycleId, await request.json()), { status: 201 }); }
  catch (error) { const status = error instanceof AuditStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to generate discrepancy report." }, { status }); }
}

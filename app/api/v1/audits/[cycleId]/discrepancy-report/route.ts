import { NextResponse } from "next/server";
import { AuditStoreError, getDiscrepancyReport } from "@/lib/auditStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cycleId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { cycleId } = await context.params;
    const report = await getDiscrepancyReport(cycleId);
    return NextResponse.json(report);
  } catch (error) {
    const status = error instanceof AuditStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to load audit discrepancy report.";
    return NextResponse.json({ error: message }, { status });
  }
}

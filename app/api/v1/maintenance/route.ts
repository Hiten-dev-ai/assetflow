import { NextResponse } from "next/server";
import { listMaintenanceRequests, MaintenanceStoreError } from "@/lib/maintenanceStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { try { return NextResponse.json({ requests: await listMaintenanceRequests() }); } catch (error) { const status = error instanceof MaintenanceStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load maintenance requests." }, { status }); } }

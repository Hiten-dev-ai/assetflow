import { NextResponse } from "next/server";
import { getMaintenanceRequest, MaintenanceStoreError } from "@/lib/maintenanceStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ requestId: string }> };
export async function GET(_request: Request, context: Context) { try { const { requestId } = await context.params; return NextResponse.json(await getMaintenanceRequest(Number(requestId))); } catch (error) { const status = error instanceof MaintenanceStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load maintenance request." }, { status }); } }

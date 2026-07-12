import { NextResponse } from "next/server";
import { createMaintenanceRequest, MaintenanceStoreError } from "@/lib/maintenanceStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try { return NextResponse.json(await createMaintenanceRequest(await request.json()), { status: 201 }); }
  catch (error) { const status = error instanceof MaintenanceStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create maintenance request." }, { status }); }
}

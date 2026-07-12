import { NextResponse } from "next/server";
import { MaintenanceStoreError, startMaintenanceWork } from "@/lib/maintenanceStore";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ requestId: string }> };
export async function PATCH(request: Request, context: Context) { try { const { requestId } = await context.params; return NextResponse.json(await startMaintenanceWork(Number(requestId), await request.json())); } catch (error) { const status = error instanceof MaintenanceStoreError ? error.status : 400; return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to start maintenance work." }, { status }); } }

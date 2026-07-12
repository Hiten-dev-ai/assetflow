import { NextResponse } from "next/server";
import { AssetStoreError, createAsset, listAssets } from "@/lib/assetsStore";
import { logActivity, currentUserFromRequest } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const assets = await listAssets();
    return NextResponse.json(assets);
  } catch (error) {
    const status = error instanceof AssetStoreError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load assets.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const asset = await createAsset(payload);
    const user = await currentUserFromRequest(request);
    await logActivity({ kind: "Asset", title: "Asset registered", description: `${asset.tag} - ${asset.name}`, actorId: user?.employeeId, target: asset.tag, severity: "Success" });
    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    const status = error instanceof AssetStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to create asset.";
    return NextResponse.json({ error: message }, { status });
  }
}

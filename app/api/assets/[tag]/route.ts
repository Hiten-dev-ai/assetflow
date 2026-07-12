import { NextResponse } from "next/server";
import { AssetStoreError, deleteAsset, updateAsset } from "@/lib/assetsStore";
import { currentUserFromRequest, logActivity } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tag: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { tag } = await context.params;
    const payload = await request.json();
    const asset = await updateAsset(tag, payload);
    const user = await currentUserFromRequest(request);
    await logActivity({ kind: "Asset", title: "Asset updated", description: `${asset.tag} - ${asset.name}`, actorId: user?.employeeId, target: asset.tag, severity: "Info" });
    return NextResponse.json(asset);
  } catch (error) {
    const status = error instanceof AssetStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to update asset.";
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { tag } = await context.params;
    await deleteAsset(tag);
    const user = await currentUserFromRequest(_request);
    await logActivity({ kind: "Asset", title: "Asset deleted", description: tag, actorId: user?.employeeId, target: tag, severity: "Warning" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AssetStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to delete asset.";
    return NextResponse.json({ error: message }, { status });
  }
}

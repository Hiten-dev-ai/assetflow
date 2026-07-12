import { NextResponse } from "next/server";
import { AssetStoreError, deleteAsset, updateAsset } from "@/lib/assetsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ tag: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { tag } = await context.params;
    const payload = await request.json();
    const asset = await updateAsset(tag, payload);
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
    return NextResponse.json({ ok: true });
  } catch (error) {
    const status = error instanceof AssetStoreError ? error.status : 400;
    const message = error instanceof Error ? error.message : "Unable to delete asset.";
    return NextResponse.json({ error: message }, { status });
  }
}
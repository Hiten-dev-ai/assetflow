import { fail, ok } from "@/lib/apiResponse";
import { requireRole, requireUser, saveCategory } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager"]);
    return ok(await saveCategory(await request.json()), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

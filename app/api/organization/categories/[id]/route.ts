import { fail, ok } from "@/lib/apiResponse";
import { requireRole, requireUser, saveCategory } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager"]);
    const { id } = await context.params;
    return ok(await saveCategory(await request.json(), id));
  } catch (error) {
    return fail(error);
  }
}

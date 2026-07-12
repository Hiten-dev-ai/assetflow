import { fail, ok } from "@/lib/apiResponse";
import { requireRole, requireUser, saveEmployee } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin"]);
    const { id } = await context.params;
    return ok(await saveEmployee(await request.json(), id));
  } catch (error) {
    return fail(error);
  }
}

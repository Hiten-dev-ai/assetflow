import { fail, ok } from "@/lib/apiResponse";
import { requireRole, requireUser, transitionMaintenanceRequest } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager"]);
    const { id } = await context.params;
    return ok(await transitionMaintenanceRequest(id, await request.json(), user));
  } catch (error) {
    return fail(error);
  }
}

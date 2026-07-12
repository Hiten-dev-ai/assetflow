import { fail, ok } from "@/lib/apiResponse";
import { decideTransfer, requireRole, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager", "Department Head"]);
    const { id } = await context.params;
    return ok(await decideTransfer(id, "APPROVED", user));
  } catch (error) {
    return fail(error);
  }
}

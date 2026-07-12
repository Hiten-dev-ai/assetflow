import { fail, ok } from "@/lib/apiResponse";
import { closeAudit, getAudit, requireRole, requireUser, verifyAuditItem } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ cycleId: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireUser(request);
    const { cycleId } = await context.params;
    return ok(await getAudit(cycleId));
  } catch (error) {
    return fail(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { cycleId } = await context.params;
    return ok(await verifyAuditItem(cycleId, await request.json(), user));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager"]);
    const { cycleId } = await context.params;
    return ok(await closeAudit(cycleId, user));
  } catch (error) {
    return fail(error);
  }
}

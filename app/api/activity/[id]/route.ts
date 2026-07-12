import { fail, ok } from "@/lib/apiResponse";
import { requireUser, updateActivityStatus, type ActivityStatus } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await requireUser(request);
    const { id } = await context.params;
    const payload = await request.json() as { status?: ActivityStatus };
    return ok(await updateActivityStatus(id, payload.status ?? "Read"));
  } catch (error) {
    return fail(error);
  }
}

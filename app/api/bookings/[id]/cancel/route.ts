import { fail, ok } from "@/lib/apiResponse";
import { cancelBooking, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireUser(request);
    const { id } = await context.params;
    return ok(await cancelBooking(id, user));
  } catch (error) {
    return fail(error);
  }
}

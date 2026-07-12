import { fail, ok } from "@/lib/apiResponse";
import { dashboardSummary, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    return ok(await dashboardSummary());
  } catch (error) {
    return fail(error);
  }
}

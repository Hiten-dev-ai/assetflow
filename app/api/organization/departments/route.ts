import { fail, ok } from "@/lib/apiResponse";
import { requireRole, requireUser, saveDepartment } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin"]);
    return ok(await saveDepartment(await request.json()), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

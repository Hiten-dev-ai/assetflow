import { fail, ok } from "@/lib/apiResponse";
import { createAudit, listAudits, requireRole, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    return ok(await listAudits());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    requireRole(user, ["Admin", "Asset Manager"]);
    return ok(await createAudit(await request.json(), user), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

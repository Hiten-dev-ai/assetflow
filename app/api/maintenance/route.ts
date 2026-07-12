import { fail, ok } from "@/lib/apiResponse";
import { createMaintenance, listMaintenance, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    return ok(await listMaintenance());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    return ok(await createMaintenance(await request.json(), user), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

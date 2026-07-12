import { fail, ok } from "@/lib/apiResponse";
import { currentUserFromRequest } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = await currentUserFromRequest(request);
    if (!user) return ok({ user: null }, { status: 401 });
    return ok({ user });
  } catch (error) {
    return fail(error);
  }
}

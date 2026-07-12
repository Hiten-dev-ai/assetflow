import { fail, ok } from "@/lib/apiResponse";
import { clearAuthCookieHeader, signOutUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await signOutUser(request);
    return ok({ ok: true }, { headers: { "Set-Cookie": clearAuthCookieHeader() } });
  } catch (error) {
    return fail(error);
  }
}

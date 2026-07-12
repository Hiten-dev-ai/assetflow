import { fail, ok } from "@/lib/apiResponse";
import { authCookieHeader, signInUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const result = await signInUser(await request.json());
    return ok({ user: result.user }, { headers: { "Set-Cookie": authCookieHeader(result.sessionId) } });
  } catch (error) {
    return fail(error);
  }
}

import { fail, ok } from "@/lib/apiResponse";
import { signUpUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return ok(await signUpUser(await request.json()), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

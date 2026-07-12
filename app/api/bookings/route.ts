import { fail, ok } from "@/lib/apiResponse";
import { createBooking, listBookings, requireUser } from "@/lib/erpStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireUser(request);
    return ok(await listBookings());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser(request);
    return ok(await createBooking(await request.json(), user), { status: 201 });
  } catch (error) {
    return fail(error);
  }
}

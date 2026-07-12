import { NextResponse } from "next/server";
import { ErpError } from "./erpStore";

export function ok<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function fail(error: unknown) {
  const status = error instanceof ErpError ? error.status : 500;
  const message = error instanceof Error ? error.message : "Unable to complete the request.";
  const details = error instanceof ErpError ? error.details : undefined;
  return NextResponse.json({ error: message, details }, { status });
}

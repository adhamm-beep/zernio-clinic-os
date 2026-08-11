import { NextResponse } from "next/server";

const allowedStatuses = new Set(["paid", "pending", "failed", "cancelled"]);

export function GET(request: Request) {
  const supplied = new URL(request.url).searchParams.get("status") ?? "pending";
  const status = allowedStatuses.has(supplied) ? supplied : "pending";
  return NextResponse.redirect(`panthera://payment/${status}`);
}

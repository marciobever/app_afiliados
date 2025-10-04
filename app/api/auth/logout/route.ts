import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res as any);
  return res;
}

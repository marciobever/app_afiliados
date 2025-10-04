// lib/session.ts
import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE = "app_session";
const secret = new TextEncoder().encode(process.env.APP_SESSION_SECRET || "dev-secret");

export { SESSION_COOKIE };

export async function signSession(payload: { userId: string; orgId: string }) {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySession(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as { userId: string; orgId: string; iat: number; exp: number };
}
// lib/auth.ts
import { cookies as nextCookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";

const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";
const COOKIE_NAME = "app_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

type SessionPayload = {
  userId: string; // pode vir antigo: "user:email" | "email" | uuid
  orgId: string;
};

/* ---------- helpers ---------- */
function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

/** Gera um UUID v4-like determinístico a partir de uma string */
function uuidFromString(input: string): string {
  const hex = createHash("sha256").update(input).digest("hex");
  const s = hex.slice(0, 32).split("");
  s[12] = "4"; // version
  // variant
  s[16] = ((parseInt(s[16], 16) & 0x3) | 0x8).toString(16);
  return `${s.slice(0,8).join("")}-${s.slice(8,12).join("")}-${s.slice(12,16).join("")}-${s.slice(16,20).join("")}-${s.slice(20,32).join("")}`;
}

/** Normaliza qualquer userId não-UUID para um UUID estável */
export function normalizeUserId(userId: string): string {
  if (!userId) return uuidFromString("anon");
  if (isUuid(userId)) return userId;
  return uuidFromString(userId); // ex.: "user:email" -> UUID estável
}

/* ---------- jwt ---------- */
export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, APP_SESSION_SECRET, { expiresIn: "30d" });
}
export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, APP_SESSION_SECRET) as SessionPayload;
}

/* ---------- cookies ---------- */
export function createSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = createSessionToken(payload);
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,           // HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    domain: COOKIE_DOMAIN,  // ex.: "app.seureview.com.br" (ou deixe vazio)
  });
}
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    domain: COOKIE_DOMAIN,
  });
}

/**
 * Lê o contexto do usuário (compat com cookies antigos)
 * - Se `req` for passado (Route Handlers), lê de req.cookies
 * - Senão, lê de `next/headers`.cookies() (server components/actions)
 * Retorna SEMPRE userId normalizado (UUID).
 */
export function getUserContext(req?: NextRequest) {
  const token = req
    ? req.cookies.get(COOKIE_NAME)?.value
    : nextCookies().get(COOKIE_NAME)?.value;

  if (!token) throw new Error("no_session");
  const { userId, orgId } = verifySessionToken(token);
  if (!userId || !orgId) throw new Error("bad_session");
  const userIdNorm = normalizeUserId(String(userId));
  return { userIdNorm, orgId };
}

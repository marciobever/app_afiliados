// lib/auth.ts
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";
const COOKIE_NAME = "app_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

export type SessionPayload = {
  userId: string; // sempre UUID agora
  orgId: string;  // ex.: "default" ou ID real da org
};

/* -------------------------------------------------------
 * Criação e verificação de tokens de sessão
 * ----------------------------------------------------- */

/** Cria um JWT com validade de 30 dias */
export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, APP_SESSION_SECRET, { expiresIn: "30d" });
}

/** Verifica e decodifica o JWT */
export function verifySessionToken(token: string): SessionPayload {
  const raw = jwt.verify(token, APP_SESSION_SECRET) as
    | SessionPayload
    | { userIdNorm?: string; orgId?: string };

  const userId =
    (raw as any).userId ??
    (raw as any).userIdNorm ??
    "";

  const orgId = (raw as any).orgId ?? "default";

  if (!userId) throw new Error("bad_session_user");
  return { userId, orgId };
}

/* -------------------------------------------------------
 * Manipulação de cookies
 * ----------------------------------------------------- */

/** Cria e grava o cookie de sessão seguro */
export function createSessionCookie(res: NextResponse, payload: SessionPayload) {
  const token = createSessionToken(payload);
  // @ts-ignore NextResponse.cookies existe em runtime
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    domain: COOKIE_DOMAIN, // ex.: .receitapopular.com.br
  });
}

/** Apaga o cookie de sessão */
export function clearSessionCookie(res: NextResponse) {
  // @ts-ignore
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

/* -------------------------------------------------------
 * Leitura segura da sessão no server-side
 * ----------------------------------------------------- */

/**
 * Retorna o userId/orgId da sessão atual.
 * Nunca lança erro — devolve { userId: null, orgId: null } se inválido.
 */
export function getUserContext():
  | SessionPayload
  | { userId: null; orgId: null } {
  try {
    const c = cookies();
    const token = c.get(COOKIE_NAME)?.value;
    if (!token) throw new Error("no_session");
    return verifySessionToken(token);
  } catch {
    return { userId: null, orgId: null };
  }
}

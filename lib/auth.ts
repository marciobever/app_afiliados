// lib/auth.ts
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "app_session";
const SECRET = process.env.APP_SESSION_SECRET || "";
if (!SECRET) console.warn("[auth] APP_SESSION_SECRET ausente!");

const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined; // ex.: .seureview.com.br
const PROD = process.env.NODE_ENV === "production";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

type SessionPayload = { userId: string; orgId: string; iat: number; exp: number };

// helpers base64url
function b64u(s: Buffer | string) {
  return Buffer.from(s).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function ub64u(s: string) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}

// assina payload => token compacto (header.payload.sig)
function sign(payload: Omit<SessionPayload, "iat" | "exp">, maxAgeSec = MAX_AGE_SECONDS) {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + maxAgeSec;
  const body: SessionPayload = { ...payload, iat, exp };
  const h = b64u(JSON.stringify(header));
  const p = b64u(JSON.stringify(body));
  const mac = createHmac("sha256", SECRET).update(`${h}.${p}`).digest();
  const s = b64u(mac);
  return `${h}.${p}.${s}`;
}

function verify(token: string): SessionPayload | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const mac = createHmac("sha256", SECRET).update(`${h}.${p}`).digest();
    const sig = ub64u(s);
    if (mac.length !== sig.length || !timingSafeEqual(mac, sig)) return null;
    const payload = JSON.parse(ub64u(p).toString("utf8")) as SessionPayload;
    if (!payload?.userId || !payload?.orgId) return null;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}

function cookieOptions(maxAge = MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    secure: PROD,
    sameSite: "lax" as const,
    maxAge,
    path: "/",
    domain: COOKIE_DOMAIN, // ex.: .seureview.com.br
  };
}

/** Lê e valida o cookie de sessão; renova (rolling) de forma transparente. */
export function getUserContext(): { userId: string | null; orgId: string | null } {
  const jar = cookies();
  const tok = jar.get(SESSION_COOKIE)?.value;
  if (!tok) return { userId: null, orgId: null };

  const payload = verify(tok);
  if (!payload) {
    // cookie inválido/expirado => limpa silenciosamente
    try { jar.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 }); } catch {}
    return { userId: null, orgId: null };
  }

  // rolling session: renova se passou > 25% do tempo
  const now = Math.floor(Date.now() / 1000);
  const lifetime = payload.exp - payload.iat;
  const elapsed = now - payload.iat;
  if (elapsed > lifetime * 0.25) {
    const fresh = sign({ userId: payload.userId, orgId: payload.orgId }, MAX_AGE_SECONDS);
    try { jar.set(SESSION_COOKIE, fresh, cookieOptions()); } catch {}
  }

  return { userId: payload.userId, orgId: payload.orgId };
}

/** Seta o cookie de sessão na resposta. */
export function createSessionCookie(
  res: NextResponse,
  data: { userId: string; orgId: string },
  maxAgeSec = MAX_AGE_SECONDS
) {
  const token = sign({ userId: data.userId, orgId: data.orgId }, maxAgeSec);
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(maxAgeSec));
}

/** Remove o cookie de sessão. */
export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
}

/** Helper para handlers que exigem sessão. */
export function requireSession() {
  const { userId, orgId } = getUserContext();
  if (!userId || !orgId) throw new Error("unauthorized");
  return { userId, orgId };
}

// (Opcional) obtém IP/UA para auditoria
export function getRequestMeta() {
  const h = headers();
  return {
    ip: h.get("x-forwarded-for") || h.get("x-real-ip") || "",
    ua: h.get("user-agent") || "",
  };
}

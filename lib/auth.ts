// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";
const COOKIE_NAME = "app_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

type SessionPayload = {
  userId: string;
  orgId: string;
};

export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, APP_SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, APP_SESSION_SECRET) as SessionPayload;
}

/** cria o cookie de sessão na resposta */
export function createSessionCookie(res: Response, payload: SessionPayload) {
  const token = createSessionToken(payload);
  // @ts-ignore - NextResponse tem .cookies.set
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,           // HTTPS
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    domain: COOKIE_DOMAIN,  // app.seureview.com.br
  });
}

/** apaga cookie de sessão */
export function clearSessionCookie(res: Response) {
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

/** lê contexto do usuário a partir do cookie (em rotas server-side) */
export function getUserContext() {
  const c = cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("no_session");
  const { userId, orgId } = verifySessionToken(token);
  if (!userId || !orgId) throw new Error("bad_session");
  return { userId, orgId };
}
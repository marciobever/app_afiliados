// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";
const COOKIE_NAME = "app_session

O deploy quebrou por um erro de **TypeScript**: o `getUserContext()` (ou sua tipagem) hoje está como `{ userIdNorm, orgId }`, mas no código você usa `ctx.userId`. Basta alinhar isso.

## Opção A (recomendada): padronizar `getUserContext` para sempre retornar `userId`
Edite **`lib/auth.ts`** e garanta que a função retorne **userId** (e, se quiser, mantenha `userIdNorm` como alias para compatibilidade):

```ts
// lib/auth.ts
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";
const COOKIE_NAME = "app_session";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

type SessionPayload = {
  userId: string; // sempre UUID
  orgId: string;
};

export function createSessionToken(payload: SessionPayload) {
  return jwt.sign(payload, APP_SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, APP_SESSION_SECRET) as SessionPayload;
}

export function createSessionCookie(res: Response, payload: SessionPayload) {
  const token = createSessionToken(payload);
  // @ts-ignore
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    domain: COOKIE_DOMAIN,
  });
}

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

// ✅ SEMPRE retorna { userId, orgId }. Mantém userIdNorm só por compat.
export function getUserContext(): { userId: string; orgId: string; userIdNorm: string } {
  const c = cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) throw new Error("no_session");
  const { userId, orgId } = verifySessionToken(token);
  if (!userId || !orgId) throw new Error("bad_session");
  return { userId, orgId, userIdNorm: userId };
}

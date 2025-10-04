import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUserContext } from "@/lib/auth";

const META_APP_ID =
  process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";
const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";

// ajuste as permissões conforme precisar
const META_SCOPES =
  process.env.META_SCOPES ||
  [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

// Assina um payload com HMAC (anti-tampering)
function sign(payload: string) {
  return crypto.createHmac("sha256", APP_SESSION_SECRET).update(payload).digest("base64url");
}

export async function GET() {
  if (!META_APP_ID || !META_REDIRECT_URI) {
    return NextResponse.json(
      { error: "META_APP_ID/META_REDIRECT_URI ausentes" },
      { status: 500 }
    );
  }

  // Exige sessão válida
  let userId: string;
  try {
    const ctx = getUserContext();
    userId = ctx.userId; // UUID vindo do cookie
  } catch {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  // payload + assinatura
  const payload = JSON.stringify({
    u: userId,
    n: crypto.randomBytes(8).toString("hex"),
    t: Date.now(),
  });
  const state = Buffer.from(
    JSON.stringify({ p: payload, s: sign(payload) })
  ).toString("base64url");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("redirect_uri", META_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES);
  url.searchParams.set("display", "popup"); // opcional, melhora UX

  return NextResponse.redirect(url.toString(), { status: 302 });
}

import { NextResponse } from "next/server";
import crypto from "crypto";
import { getUserContext } from "@/lib/auth";

const META_APP_ID =
  process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";

// ajuste as permissões conforme for precisar
const META_SCOPES =
  process.env.META_SCOPES ||
  [
    "pages_manage_posts",
    "pages_read_engagement",
    "pages_show_list",
    "instagram_basic",
    "instagram_content_publish",
  ].join(",");

export async function GET() {
  if (!META_APP_ID || !META_REDIRECT_URI) {
    return NextResponse.json(
      { error: "META_APP_ID/META_REDIRECT_URI ausentes" },
      { status: 500 }
    );
  }

  // pega userId do cookie (precisa estar logado)
  let userId = "anonymous";
  try {
    const ctx = getUserContext();
    userId = ctx.userId;
  } catch {
    // se quiser obrigar login, troque por 401
  }

  // gera um state (anti-CSRF) contendo userId + nonce
  const statePayload = JSON.stringify({
    u: userId,
    n: crypto.randomBytes(8).toString("hex"),
    t: Date.now(),
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const url = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  url.searchParams.set("client_id", META_APP_ID);
  url.searchParams.set("redirect_uri", META_REDIRECT_URI);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", META_SCOPES);

  return NextResponse.redirect(url.toString(), { status: 302 });
}
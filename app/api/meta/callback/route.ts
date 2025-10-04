import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

const META_APP_ID =
  process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";
const APP_SESSION_SECRET = process.env.APP_SESSION_SECRET || "dev-secret";

type DebugTokenResp = {
  data?: {
    app_id: string;
    type: string;
    application: string;
    expires_at: number;
    is_valid: boolean;
    issued_at: number;
    scopes: string[];
    user_id?: string;
  };
};

function html(body: string) {
  const page = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Meta Callback</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#111}
.card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;padding:20px}
</style>
</head>
<body>
  <div class="card">${body}</div>
  <script>
    if (window.opener) { try { window.opener.postMessage({ meta_connected: true }, "*"); } catch {} }
  </script>
</body></html>`;
  return new NextResponse(page, { headers: { "content-type": "text/html; charset=utf-8" }});
}

function sign(payload: string) {
  return crypto.createHmac("sha256", APP_SESSION_SECRET).update(payload).digest("base64url");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) return html("Conexão cancelada: " + error);
    if (!code || !state) return html("Parâmetros ausentes.");

    // sessão obrigatória
    let userId: string;
    let orgId: string;
    try {
      const ctx = getUserContext();
      userId = ctx.userId; // UUID
      orgId = ctx.orgId;
    } catch {
      return html("Sessão inválida. Faça login e tente conectar novamente.");
    }

    if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
      return html("Meta App mal configurado no servidor (.env).");
    }

    // validação forte do state (assinado no /api/meta/login)
    let okState = false;
    try {
      const wrapped = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      const payload: string = wrapped?.p;
      const sig: string = wrapped?.s;
      if (payload && sig && sign(payload) === sig) {
        const decoded = JSON.parse(payload);
        if (decoded?.u === userId) okState = true;
      }
    } catch {}
    if (!okState) return html("State inválido para este usuário.");

    // 1) code -> short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        redirect_uri: META_REDIRECT_URI,
        code,
      }),
      { method: "GET" }
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) return html("Erro ao trocar code: " + JSON.stringify(tokenJson));
    const shortToken = tokenJson.access_token as string;
    const shortExpiresIn = tokenJson.expires_in as number | undefined;

    // 2) debug_token -> meta user + scopes
    const appAccessToken = `${META_APP_ID}|${META_APP_SECRET}`;
    const debugRes = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?` +
      new URLSearchParams({ input_token: shortToken, access_token: appAccessToken }),
      { method: "GET" }
    );
    const debugJson = (await debugRes.json()) as DebugTokenResp;
    const metaUserId = debugJson?.data?.user_id || null;
    const grantedScopes = debugJson?.data?.scopes || [];

    // 3) short -> long-lived
    const longRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: META_APP_ID,
        client_secret: META_APP_SECRET,
        fb_exchange_token: shortToken,
      }),
      { method: "GET" }
    );
    const longJson = await longRes.json();
    const longToken =
      longRes.ok && longJson.access_token ? (longJson.access_token as string) : shortToken;
    const longExpiresIn =
      longRes.ok && typeof longJson.expires_in === "number"
        ? (longJson.expires_in as number)
        : shortExpiresIn ?? null;

    // 4) upsert no Supabase
    const sb = supabaseAdmin();
    const payload = {
      user_id: userId,       // UUID
      org_id: orgId,         // text
      provider: "meta",      // text
      meta_user_id: metaUserId, // text
      access_token: longToken,  // text
      granted_scopes: grantedScopes, // jsonb (ou text[])
      obtained_at: new Date().toISOString(), // timestamptz
      expires_in: longExpiresIn, // int4
    };

    const { error: upsertErr } = await sb
      .from("social_integrations")
      .upsert(payload, { onConflict: "user_id,provider" });

    if (upsertErr) return html("Erro ao salvar no Supabase: " + upsertErr.message);

    return html(`✅ Conexão com Meta concluída!<br/>Você já pode fechar esta janela.`);
  } catch (e: any) {
    return html("Erro inesperado: " + (e?.message || String(e)));
  }
}

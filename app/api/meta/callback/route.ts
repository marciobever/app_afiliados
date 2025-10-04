import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getUserContext } from "@/lib/auth";

const META_APP_ID =
  process.env.NEXT_PUBLIC_META_APP_ID || process.env.META_APP_ID || "";
const META_APP_SECRET = process.env.META_APP_SECRET || "";
const META_REDIRECT_URI = process.env.META_REDIRECT_URI || "";

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) return html("Conexão cancelada: " + error);
    if (!code || !state) return html("Parâmetros ausentes.");

    // recuperar usuário logado (cookie)
    let userId: string;
    let orgId: string;
    try {
      const ctx = getUserContext();
      userId = ctx.userId;
      orgId = ctx.orgId;
    } catch {
      return html("Sessão inválida. Faça login e tente conectar novamente.");
    }

    if (!META_APP_ID || !META_APP_SECRET || !META_REDIRECT_URI) {
      return html("Meta App mal configurado no servidor (.env).");
    }

    // validação básica do state: confere que o user do state é o mesmo da sessão
    try {
      const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (decoded?.u && decoded.u !== userId) {
        return html("State inválido para este usuário.");
      }
    } catch {
      // se falhar parse, segue — mas recomendado manter essa checagem
    }

    // 1) Troca code -> short-lived token
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
    if (!tokenRes.ok) {
      return html("Erro ao trocar code: " + JSON.stringify(tokenJson));
    }
    const shortToken = tokenJson.access_token as string;
    const shortExpiresIn = tokenJson.expires_in as number | undefined;

    // 2) Debug do token para pegar user_id e scopes
    const appAccessToken = `${META_APP_ID}|${META_APP_SECRET}`;
    const debugRes = await fetch(
      `https://graph.facebook.com/v19.0/debug_token?` +
        new URLSearchParams({
          input_token: shortToken,
          access_token: appAccessToken,
        }),
      { method: "GET" }
    );
    const debugJson = (await debugRes.json()) as DebugTokenResp;
    const metaUserId = debugJson?.data?.user_id || null;
    const grantedScopes = debugJson?.data?.scopes || [];

    // 3) Troca por long-lived token (recomendado)
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
    // se falhar, continua com short-lived
    const longToken =
      longRes.ok && longJson.access_token ? (longJson.access_token as string) : shortToken;
    const longExpiresIn =
      longRes.ok && typeof longJson.expires_in === "number"
        ? (longJson.expires_in as number)
        : shortExpiresIn ?? null;

    // 4) Salva/atualiza no Supabase (tabela: social_integrations)
    const sb = supabaseAdmin();
    const payload = {
      user_id: userId,
      org_id: orgId,
      provider: "meta",
      meta_user_id: metaUserId,
      access_token: longToken,
      granted_scopes: grantedScopes,
      obtained_at: new Date().toISOString(),
      expires_in: longExpiresIn,
    };

    // upsert por (user_id, provider) — precisa de UNIQUE(user_id, provider) na tabela
    const { error: upsertErr } = await sb
      .from("social_integrations")
      .upsert(payload, { onConflict: "user_id,provider" });

    if (upsertErr) {
      return html("Erro ao salvar no Supabase: " + upsertErr.message);
    }

    // 5) Resposta amigável
    return html(
      `✅ Conexão com Meta concluída!<br/>` +
        `Você já pode fechar esta janela.`
    );
  } catch (e: any) {
    return html("Erro inesperado: " + (e?.message || String(e)));
  }
}

function html(body: string) {
  const page = `<!doctype html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Meta Callback</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#111}
  .card{max-width:560px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;padding:20px}
</style>
</head>
<body>
  <div class="card">${body}</div>
  <script>
    // tenta avisar a janela que abriu o popup
    if (window.opener) {
      try { window.opener.postMessage({ meta_connected: true }, "*"); } catch {}
    }
  </script>
</body>
</html>`;
  return new NextResponse(page, {
    headers: { "content-type": "text/html; charset=utf-8" },
    status: 200,
  });
}
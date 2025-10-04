import { NextRequest, NextResponse } from "next/server";
import { createSessionCookie } from "@/lib/auth";

/**
 * DEV-ONLY LOGIN
 * - GET: formulário simples no navegador
 * - POST: recebe { email?, userId?, orgId? } e cria cookie de sessão
 */
export async function GET() {
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Dev Login</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;padding:24px;color:#111}
.card{max-width:460px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;padding:20px}
label{display:block;margin:8px 0 4px}
input{width:100%;padding:10px;border:1px solid #ddd;border-radius:8px}
button{margin-top:12px;padding:10px 14px;border-radius:8px;background:#111827;color:#fff;border:0}
small{display:block;margin-top:8px;color:#666}
</style>
</head>
<body>
  <div class="card">
    <h2>Dev Login</h2>
    <form method="post" action="/api/dev/login">
      <label>Email (opcional)</label>
      <input name="email" type="email" placeholder="voce@exemplo.com" />

      <label>User ID (opcional)</label>
      <input name="userId" type="text" placeholder="user:meu-id" />

      <label>Org ID (opcional)</label>
      <input name="orgId" type="text" value="default" />

      <button type="submit">Entrar</button>
      <small>Cria um cookie de sessão de desenvolvimento.</small>
    </form>
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const ctype = req.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      body = await req.json().catch(() => ({}));
    } else if (ctype.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await req.json().catch(() => ({}));
    }

    const email = (body?.email ?? "").toString().trim();
    const providedUserId = (body?.userId ?? "").toString().trim();
    const orgId = (body?.orgId ?? "default").toString().trim();

    const userId =
      providedUserId ||
      (email ? `user:${email}` : `anon:${Date.now().toString(36)}`);

    const res = NextResponse.json({ ok: true, userId, orgId });
    await createSessionCookie(res, { userId, orgId });
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Erro no dev login" },
      { status: 400 }
    );
  }
}
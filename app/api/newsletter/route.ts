// app/api/newsletter/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "invalid_email" }, { status: 400 });
    }
    // TODO: salvar no seu provedor (Mailchimp, Brevo, Supabase, etc.)
    console.log("[newsletter] novo cadastro:", email);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "newsletter_failed", message: e?.message }, { status: 500 });
  }
}

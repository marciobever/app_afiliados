// app/api/dashboard/services/summary/route.ts
import { NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin";

/**
 * GET /api/dashboard/services/summary
 * Retorna contagens para os cards de Serviços no dashboard.
 */
export async function GET() {
  try {
    const sb = supabaseAdmin();

    const [links, clicks, watches, prices] = await Promise.all([
      sb.from("Produto_Afiliado.short_links").select("id", { count: "exact", head: true }),
      sb.from("Produto_Afiliado.short_link_clicks").select("id", { count: "exact", head: true }),
      sb.from("Produto_Afiliado.price_watchlists").select("id", { count: "exact", head: true }),
      sb.from("Produto_Afiliado.price_snapshots").select("id", { count: "exact", head: true }),
    ]);

    return NextResponse.json({
      ok: true,
      links: links.count ?? 0,
      clicks: clicks.count ?? 0,
      watches: watches.count ?? 0,
      prices: prices.count ?? 0,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "summary_error" }, { status: 500 });
  }
}

"use client";
import React, { useEffect, useMemo, useState } from "react";

type MapRow = { id: string; media_id: string; product_url: string; data_criacao?: string };
type ExecRow = { id: string; mode: string; finished?: boolean; startedAt?: string; stoppedAt?: string; status?: string };

function cx(...a: Array<string | false | null | undefined>) { return a.filter(Boolean).join(" "); }

export default function InstagramBotPage() {
  // --- State ---
  const [rows, setRows] = useState<MapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mediaId, setMediaId] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [filter, setFilter] = useState("");
  const [execs, setExecs] = useState<any[]>([]);
  const [testMedia, setTestMedia] = useState("");
  const [testText, setTestText] = useState("quero");
  const [testing, setTesting] = useState(false);

  async function loadMap() {
    const url = filter ? `/api/media-map?mediaId=${encodeURIComponent(filter)}` : "/api/media-map";
    const res = await fetch(url);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
  }
  async function loadExecs() {
    const res = await fetch("/api/bots/ig/executions");
    if (!res.ok) return;
    const data = await res.json();
    setExecs(Array.isArray(data?.data) ? data.data : []);
  }

  useEffect(() => { loadMap(); loadExecs(); }, []);
  useEffect(() => { loadMap(); }, [filter]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaId || !productUrl) return;
    setLoading(true);
    const res = await fetch("/api/media-map", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ media_id: mediaId.trim(), product_url: productUrl.trim() })
    });
    setLoading(false);
    if (res.ok) {
      setMediaId(""); setProductUrl("");
      loadMap();
    } else {
      const j = await res.json().catch(()=> ({}));
      alert(j.error || "Erro ao criar mapeamento");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Remover este mapeamento?")) return;
    const res = await fetch(`/api/media-map/${id}`, { method: "DELETE" });
    if (res.ok) loadMap();
  }

  async function onTest() {
    setTesting(true);
    const res = await fetch("/api/bots/ig/test", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ mediaId: testMedia.trim() || undefined, text: testText || undefined })
    });
    setTesting(false);
    const j = await res.json().catch(()=> ({}));
    const ok = j?.ok; const status = j?.status;
    alert(ok ? `Webhook OK (${status})` : `Falhou (${status})`);
    loadExecs();
  }

  return (
    <main className="p-6 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Instagram BOT — Comentário “quero”</h1>
        <p className="text-sm opacity-70">Mapeie <code>mediaId</code> → <code>product_url</code>, teste o webhook e acompanhe execuções do n8n.</p>
      </header>

      {/* Mapeamento */}
      <section className="grid md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-2xl">
          <h2 className="text-lg font-medium mb-3">Novo mapeamento</h2>
          <form onSubmit={onCreate} className="grid gap-3">
            <input placeholder="media_id (ex.: 17900000000000000)" value={mediaId} onChange={e=>setMediaId(e.target.value)} required />
            <input placeholder="product_url (Shopee/Amazon/Meli...)" value={productUrl} onChange={e=>setProductUrl(e.target.value)} required />
            <button className="btn btn-primary" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</button>
          </form>
        </div>

        <div className="p-4 border rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium">Mapeamentos</h2>
            <input placeholder="Filtrar por media_id..." className="max-w-xs" value={filter} onChange={e=>setFilter(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 pr-2">media_id</th>
                  <th className="py-2 pr-2">product_url</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{r.media_id}</td>
                    <td className="py-2 pr-2 break-all">
                      <a href={r.product_url} target="_blank" className="underline">{r.product_url}</a>
                    </td>
                    <td className="py-2">
                      <button className="btn btn-outline" onClick={()=>onDelete(r.id)}>Remover</button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td className="py-4 opacity-60" colSpan={3}>Nenhum mapeamento ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Teste rápido */}
      <section className="p-4 border rounded-2xl">
        <h2 className="text-lg font-medium mb-3">Teste rápido (POST no webhook do n8n)</h2>
        <div className="grid md:grid-cols-3 gap-3">
          <input placeholder="media_id (opcional)" value={testMedia} onChange={e=>setTestMedia(e.target.value)} />
          <input placeholder='texto do comentário (default "quero")' value={testText} onChange={e=>setTestText(e.target.value)} />
          <button className="btn btn-primary" onClick={onTest} disabled={testing}>{testing ? "Testando..." : "Disparar teste"}</button>
        </div>
        <p className="text-xs opacity-70 mt-2">Isso simula o evento do Instagram e aciona o seu workflow (dedupe + busca no Postgres + DM + reply).</p>
      </section>

      {/* Execuções n8n */}
      <section className="p-4 border rounded-2xl">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-medium">Execuções recentes (n8n)</h2>
          <button className="btn btn-outline" onClick={loadExecs}>Atualizar</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-2">ID</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2 pr-2">Início</th>
                <th className="py-2">Fim</th>
              </tr>
            </thead>
            <tbody>
              {execs.map((e:any) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{e.id}</td>
                  <td className="py-2 pr-2">{e.status || (e.finished ? "success" : "running")}</td>
                  <td className="py-2 pr-2">{e.startedAt ? new Date(e.startedAt).toLocaleString() : "—"}</td>
                  <td className="py-2">{e.stoppedAt ? new Date(e.stoppedAt).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {!execs.length && (
                <tr><td className="py-4 opacity-60" colSpan={4}>Sem execuções listadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

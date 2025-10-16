// app/dashboard/bots/instagram/page.tsx
"use client";
import * as React from "react";
import {
  SectionHeader,
  Card,
  CardHeader,
  CardBody,
  Input,
  Button,
  Badge,
} from "@/components/ui";

type MapRow = { id: string; media_id: string; product_url: string; data_criacao?: string };
type ExecRow = { id: string; status?: string; startedAt?: string; stoppedAt?: string; finished?: boolean };
type Keyword = { id: string | number; keyword: string; active: boolean; created_at?: string };

function norm(s = "") {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function InstagramBotsPage() {
  // ---------- mapping ----------
  const [rows, setRows] = React.useState<MapRow[]>([]);
  const [mediaId, setMediaId] = React.useState("");
  const [productUrl, setProductUrl] = React.useState("");
  const [mapLoading, setMapLoading] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  // ---------- keywords ----------
  const [keywords, setKeywords] = React.useState<Keyword[]>([]);
  const [newKw, setNewKw] = React.useState("");
  const [kwLoading, setKwLoading] = React.useState(false);
  const [probe, setProbe] = React.useState("");
  const [probeHit, setProbeHit] = React.useState<string[] | null>(null);

  // ---------- executions / test ----------
  const [execs, setExecs] = React.useState<ExecRow[]>([]);
  const [testMedia, setTestMedia] = React.useState("");
  const [testText, setTestText] = React.useState("quero");
  const [testing, setTesting] = React.useState(false);

  // ======= LOADERS =======
  async function loadMap() {
    const url = filter ? `/api/media-map?mediaId=${encodeURIComponent(filter)}` : "/api/media-map";
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json().catch(() => []);
    setRows(Array.isArray(data) ? data : []);
  }
  async function loadExecs() {
    const res = await fetch("/api/bots/ig/executions", { cache: "no-store" });
    const j = await res.json().catch(() => ({ data: [] }));
    setExecs(Array.isArray(j?.data) ? j.data : []);
  }
  async function loadKeywords() {
    const r = await fetch("/api/bots/ig/keywords", { cache: "no-store" });
    const j = await r.json().catch(() => ({ ok: false, data: [] }));
    setKeywords(j?.ok ? j.data : []);
  }

  React.useEffect(() => {
    loadMap(); loadExecs(); loadKeywords();
  }, []);
  React.useEffect(() => { const t = setTimeout(loadMap, 250); return () => clearTimeout(t); }, [filter]);

  // ======= MAP: CRUD =======
  async function onCreateMap(e: React.FormEvent) {
    e.preventDefault();
    if (!mediaId || !productUrl) return;
    setMapLoading(true);
    const res = await fetch("/api/media-map", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media_id: mediaId.trim(), product_url: productUrl.trim() }),
    });
    setMapLoading(false);
    if (res.ok) {
      setMediaId(""); setProductUrl(""); loadMap();
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j?.error || "Erro ao criar mapeamento");
    }
  }
  async function onDeleteMap(id: string) {
    if (!confirm("Remover este mapeamento?")) return;
    const res = await fetch(`/api/media-map/${id}`, { method: "DELETE" });
    if (res.ok) loadMap();
  }

  // ======= KEYWORDS: CRUD =======
  async function addKeyword(e: React.FormEvent) {
    e.preventDefault();
    const kw = newKw.trim();
    if (!kw) return;
    setKwLoading(true);
    const r = await fetch("/api/bots/ig/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: kw }),
    });
    setKwLoading(false);
    if (r.ok) { setNewKw(""); loadKeywords(); } else { alert("Não foi possível criar."); }
  }

  async function toggleKeyword(k: Keyword) {
    const r = await fetch(`/api/bots/ig/keywords/${k.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !k.active }),
    });
    if (r.ok) loadKeywords();
  }

  async function removeKeyword(k: Keyword) {
    if (!confirm(`Remover a palavra "${k.keyword}"?`)) return;
    const r = await fetch(`/api/bots/ig/keywords/${k.id}`, { method: "DELETE" });
    if (r.ok) loadKeywords();
  }

  // Teste local: mostra se o comentário acionaria com palavras ativas
  React.useEffect(() => {
    if (!probe) { setProbeHit(null); return; }
    const base = norm(probe);
    const hits = keywords.filter(k => k.active).map(k => k.keyword).filter(k => base.includes(norm(k)));
    setProbeHit(hits);
  }, [probe, keywords]);

  // ======= N8N test =======
  async function onTestWebhook() {
    setTesting(true);
    const res = await fetch("/api/bots/ig/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId: testMedia.trim() || undefined, text: testText || undefined }),
    });
    setTesting(false);
    const j = await res.json().catch(() => ({}));
    alert(j?.ok ? `Webhook OK (${j.status})` : `Falhou (${j?.status || "erro"})`);
    loadExecs();
  }

  // ================= UI =================
  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      <SectionHeader
        emoji="🤖"
        title="Bots (Instagram)"
        subtitle="Configure palavras-chave que disparam a resposta e mapeie media_id → product_url."
      />

      {/* Palavras-chave */}
      <Card className="mt-4">
        <CardHeader
          title="Palavras-chave"
          subtitle='Ex.: "quero", "manda link", "eu quero", "link", "me chama"…'
          right={<Badge>{keywords.filter(k => k.active).length} ativas</Badge>}
        />
        <CardBody>
          <form onSubmit={addKeyword} className="grid sm:grid-cols-[1fr_auto] gap-3 max-w-2xl">
            <Input
              placeholder='Nova palavra ou frase (ex.: "manda link")'
              value={newKw}
              onChange={(e) => setNewKw(e.target.value)}
            />
            <Button type="submit" disabled={kwLoading}>
              {kwLoading ? "Adicionando…" : "Adicionar"}
            </Button>
          </form>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b">
                  <th className="py-2 pr-4">Palavra/expressão</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((k) => (
                  <tr key={k.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{k.keyword}</td>
                    <td className="py-2 pr-4">
                      {k.active ? <Badge tone="success">ativa</Badge> : <Badge>inativa</Badge>}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => toggleKeyword(k)}>
                          {k.active ? "Desativar" : "Ativar"}
                        </Button>
                        <Button variant="ghost" onClick={() => removeKeyword(k)}>Remover</Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!keywords.length && (
                  <tr><td className="py-3 text-[#6B7280]" colSpan={3}>Nenhuma palavra-chave ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Teste local de frase */}
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 max-w-3xl mt-5">
            <Input placeholder='Teste: "quero link desse produto"' value={probe} onChange={(e)=>setProbe(e.target.value)} />
            <div className="flex items-center">
              {probeHit && (probeHit.length ? <Badge tone="success">vai responder</Badge> : <Badge>não responde</Badge>)}
            </div>
          </div>
          {probeHit && !!probeHit.length && (
            <div className="text-xs text-[#6B7280] mt-2">
              Acionou por conter: <strong>{probeHit.join(", ")}</strong>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Mapeamentos media_id → product_url */}
      <Card className="mt-6">
        <CardHeader title="Mapeamentos" subtitle="Defina o link do produto por publicação (media_id)." />
        <CardBody>
          <form onSubmit={onCreateMap} className="grid md:grid-cols-[1fr_1fr_auto] gap-3 max-w-4xl">
            <Input placeholder="media_id (ex.: 17900000000000000)" value={mediaId} onChange={(e)=>setMediaId(e.target.value)} />
            <Input placeholder="product_url (Shopee/Amazon/Meli…)" value={productUrl} onChange={(e)=>setProductUrl(e.target.value)} />
            <Button type="submit" disabled={mapLoading}>{mapLoading ? "Salvando…" : "Salvar"}</Button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-[#6B7280]">Total: {rows.length}</div>
            <Input
              placeholder="Filtrar por media_id…"
              className="max-w-xs"
              value={filter}
              onChange={(e)=>setFilter(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b">
                  <th className="py-2 pr-3">media_id</th>
                  <th className="py-2 pr-3">product_url</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{r.media_id}</td>
                    <td className="py-2 pr-3 break-all">
                      <a href={r.product_url} target="_blank" rel="noreferrer" className="text-[#EE4D2D] hover:underline">
                        {r.product_url}
                      </a>
                    </td>
                    <td className="py-2">
                      <Button variant="outline" onClick={() => onDeleteMap(r.id)}>Remover</Button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td className="py-3 text-[#6B7280]" colSpan={3}>Nenhum mapeamento ainda.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Teste webhook + Execuções */}
      <Card className="mt-6">
        <CardHeader title="Teste rápido (webhook do n8n)" subtitle="Simula comentário do Instagram e dispara seu workflow." />
        <CardBody>
          <div className="grid md:grid-cols-[1fr_1fr_auto] gap-3 max-w-4xl">
            <Input placeholder="media_id (opcional)" value={testMedia} onChange={(e)=>setTestMedia(e.target.value)} />
            <Input placeholder='texto do comentário (ex.: "quero link")' value={testText} onChange={(e)=>setTestText(e.target.value)} />
            <Button onClick={onTestWebhook} disabled={testing}>{testing ? "Testando…" : "Disparar teste"}</Button>
          </div>

          <div className="flex items-center justify-between mt-6">
            <h3 className="font-semibold">Execuções recentes (n8n)</h3>
            <Button variant="outline" onClick={loadExecs}>Atualizar</Button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#6B7280] border-b">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Início</th>
                  <th className="py-2">Fim</th>
                </tr>
              </thead>
              <tbody>
                {execs.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{e.id}</td>
                    <td className="py-2 pr-3">{e.status || (e.finished ? "success" : "running")}</td>
                    <td className="py-2 pr-3">{e.startedAt ? new Date(e.startedAt).toLocaleString() : "—"}</td>
                    <td className="py-2">{e.stoppedAt ? new Date(e.stoppedAt).toLocaleString() : "—"}</td>
                  </tr>
                ))}
                {!execs.length && (
                  <tr><td className="py-3 text-[#6B7280]" colSpan={4}>Sem execuções listadas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

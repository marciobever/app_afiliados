"use client";

import * as React from "react";
import ScheduleModal from "./ScheduleModal";

type MinimalProduct = {
  id?: string;
  title?: string;
  url?: string;
  image?: string;
  price?: number | null;
  rating?: number | null;
};

type Props = {
  /** ID do post salvo no app */
  postId: string;
  /** Provider/plataforma selecionados no Composer (opcional) */
  provider?: "instagram" | "meta";
  platform?: "instagram" | "facebook" | "x";
  /** Campos opcionais para repassar ao n8n (mesma estrutura já usada) */
  caption?: string;
  image_url?: string;
  link?: string;
  product?: MinimalProduct;
  context?: Record<string, any>;
  /** Callback quando publicar/agendar concluir OK (para fechar o composer, recarregar lista etc.) */
  onDone?: (result?: any) => void;
};

export default function ScheduleControls({
  postId,
  provider,
  platform,
  caption,
  image_url,
  link,
  product,
  context,
  onDone,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<null | "publish" | "schedule">(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  async function callPublishEndpoint(body: any) {
    const res = await fetch(`/api/posts/${encodeURIComponent(postId)}/publish`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json?.error || "Falha ao enviar ao orquestrador");
    }
    return json;
  }

  async function handlePublishNow() {
    setBusy("publish");
    setMsg(null);
    try {
      const payload = {
        provider,
        platform,
        caption,
        image_url,
        link,
        product,
        context,
      };
      const result = await callPublishEndpoint(payload);
      setMsg("Enviado para publicação.");
      onDone?.(result);
    } catch (e: any) {
      setMsg(e?.message || "Erro ao publicar");
    } finally {
      setBusy(null);
    }
  }

  async function handleSchedule(iso: string) {
    setBusy("schedule");
    setMsg(null);
    try {
      const payload = {
        provider,
        platform,
        caption,
        image_url,
        link,
        product,
        context,
        scheduleTime: iso,
      };
      const result = await callPublishEndpoint(payload);
      setMsg("Agendamento criado.");
      setOpen(false);
      onDone?.(result);
    } catch (e: any) {
      setMsg(e?.message || "Erro ao agendar");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* feedback leve sem dependências */}
      {msg && <div className="text-xs text-gray-600 mr-2">{msg}</div>}

      <button
        type="button"
        className="px-3 py-2 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-60"
        onClick={() => setOpen(true)}
        disabled={busy !== null}
      >
        Agendar
      </button>

      <button
        type="button"
        className="px-3 py-2 rounded-md bg-[#EE4D2D] text-white text-sm hover:bg-[#D8431F] disabled:opacity-60"
        onClick={handlePublishNow}
        disabled={busy !== null}
      >
        {busy === "publish" ? "Publicando…" : "Publicar agora"}
      </button>

      {/* Modal */}
      <ScheduleModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleSchedule}
      />
    </div>
  );
}

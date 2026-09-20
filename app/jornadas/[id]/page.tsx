"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  nome: string;
  contato: string | null;
  canal: string;
  campanha: string | null;
  conjunto: string | null;
  anuncio: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  etapa: string;
  dispositivo: string | null;
  cidade: string | null;
  fbclid: string | null;
  gclid: string | null;
  evento_meta: string[] | null;
  created_at: string;
};

type Evento = {
  id: string;
  tipo: string;
  descricao: string;
  meta: Record<string, string> | null;
  created_at: string;
};

type Anotacao = {
  id: string;
  texto: string;
  created_at: string;
};

type TimelineItem = {
  id: string;
  kind: "evento" | "anotacao";
  tipo?: string;
  descricao: string;
  created_at: string;
};

const etapas = [
  { value: "novo", label: "Novo" },
  { value: "em_conversa", label: "Em conversa" },
  { value: "qualificado", label: "Qualificado" },
  { value: "agendado", label: "Agendado" },
  { value: "negociando", label: "Negociando" },
  { value: "venda_fechada", label: "Venda fechada" },
  { value: "nao_qualificado", label: "Não qualificado" },
];

const etapaParaEvento: Record<string, string | null> = {
  novo: "Lead", em_conversa: "Lead", qualificado: null,
  agendado: "Schedule", negociando: null,
  venda_fechada: "Purchase", nao_qualificado: null,
};

function tipoIcon(tipo: string) {
  const icons: Record<string, string> = {
    entrada: "ti-user-plus",
    etapa: "ti-arrows-exchange",
    capi: "ti-brand-meta",
    contato: "ti-phone",
    anotacao: "ti-note",
  };
  return icons[tipo] || "ti-circle";
}

function tipoColor(tipo: string) {
  const colors: Record<string, string> = {
    entrada: "var(--sub)",
    etapa: "var(--sub)",
    capi: "var(--sub)",
    contato: "var(--sub)",
    anotacao: "var(--sub)",
  };
  return colors[tipo] || "var(--muted)";
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatarTelefone(contato: string | null) {
  if (!contato) return "—";
  const num = contato.replace(/\D/g, "");
  if (num.length === 13)
    return `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`;
  return contato;
}

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 16,
};

export default function JornadaLead() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    carregarTudo();
  }, [id]);

  async function carregarTudo() {
    const [{ data: leadData }, { data: eventosData }, { data: anotacoesData }] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("lead_eventos").select("*").eq("lead_id", id).order("created_at", { ascending: true }),
      supabase.from("lead_anotacoes").select("*").eq("lead_id", id).order("created_at", { ascending: true }),
    ]);
    if (leadData) setLead(leadData);
    if (eventosData) setEventos(eventosData);
    if (anotacoesData) setAnotacoes(anotacoesData);

    // Se não tem evento de entrada, cria
    if (leadData && (!eventosData || eventosData.length === 0)) {
      await supabase.from("lead_eventos").insert({
        lead_id: id,
        tipo: "entrada",
        descricao: `Lead entrou via ${leadData.canal}${leadData.campanha ? ` — campanha: ${leadData.campanha}` : ""}`,
        created_at: leadData.created_at,
      });
      const { data: novosEventos } = await supabase
        .from("lead_eventos").select("*").eq("lead_id", id).order("created_at", { ascending: true });
      if (novosEventos) setEventos(novosEventos);
    }
  }

  async function mudarEtapa(novaEtapa: string) {
    if (!lead) return;
    setAtualizando(true);
    await supabase.from("leads").update({ etapa: novaEtapa }).eq("id", id);

    const etapaAnterior = etapas.find((e) => e.value === lead.etapa)?.label || lead.etapa;
    const etapaNova = etapas.find((e) => e.value === novaEtapa)?.label || novaEtapa;

    await supabase.from("lead_eventos").insert({
      lead_id: id,
      tipo: "etapa",
      descricao: `Etapa alterada: ${etapaAnterior} → ${etapaNova}`,
    });

    const evento = etapaParaEvento[novaEtapa];
    if (evento) {
      await fetch("/api/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: id, evento }),
      });
      await supabase.from("lead_eventos").insert({
        lead_id: id,
        tipo: "capi",
        descricao: `Evento Meta CAPI disparado: ${evento}`,
      });
      mostrarToast(`✓ Evento ${evento} enviado ao Meta`);
    }

    setLead((prev) => prev ? { ...prev, etapa: novaEtapa } : prev);
    await carregarEventos();
    setAtualizando(false);
  }

  async function carregarEventos() {
    const { data } = await supabase
      .from("lead_eventos").select("*").eq("lead_id", id).order("created_at", { ascending: true });
    if (data) setEventos(data);
  }

  async function salvarAnotacao() {
    if (!novaAnotacao.trim()) return;
    setSalvando(true);
    await supabase.from("lead_anotacoes").insert({ lead_id: id, texto: novaAnotacao.trim() });
    setNovaAnotacao("");
    const { data } = await supabase
      .from("lead_anotacoes").select("*").eq("lead_id", id).order("created_at", { ascending: true });
    if (data) setAnotacoes(data);
    setSalvando(false);
  }

  async function deletarAnotacao(anotacaoId: string) {
    await supabase.from("lead_anotacoes").delete().eq("id", anotacaoId);
    setAnotacoes((prev) => prev.filter((a) => a.id !== anotacaoId));
  }

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Mescla eventos e anotações na timeline
  const timeline: TimelineItem[] = [
    ...eventos.map((e) => ({ id: e.id, kind: "evento" as const, tipo: e.tipo, descricao: e.descricao, created_at: e.created_at })),
    ...anotacoes.map((a) => ({ id: a.id, kind: "anotacao" as const, tipo: "anotacao", descricao: a.texto, created_at: a.created_at })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  if (!lead) {
    return (
      <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "var(--muted)", fontSize: 14 }}>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>

        {/* Toast */}
        {toast && (
          <div style={{
            position: "fixed", bottom: 24, right: 24, zIndex: 999,
            background: "var(--s3)", border: "1px solid var(--border2)",
            color: "var(--text)", padding: "10px 16px", borderRadius: 8,
            fontSize: 12, fontFamily: "monospace",
          }}>{toast}</div>
        )}

        {/* Topbar */}
        <div style={{
          padding: "14px 22px", borderBottom: "1px solid var(--border)",
          background: "var(--s1)", display: "flex", alignItems: "center",
          gap: 12, flexShrink: 0,
        }}>
          <button
            onClick={() => router.push("/jornadas")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, display: "flex", alignItems: "center" }}
          >
            <i className="ti ti-arrow-left" />
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--s4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: "var(--sub)" }}>
            {lead.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>{lead.nome}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{formatarTelefone(lead.contato)}</div>
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, padding: "18px 22px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, alignItems: "start" }}>

          {/* Timeline */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>Timeline</div>
            <div style={{ position: "relative" }}>
              {/* Linha vertical */}
              <div style={{ position: "absolute", left: 15, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />

              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {timeline.map((item, i) => (
                  <div key={item.id} style={{ display: "flex", gap: 14, paddingBottom: i < timeline.length - 1 ? 20 : 0 }}>
                    {/* Ícone */}
                    <div style={{
                      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                      background: "var(--s3)", border: "1px solid var(--border2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      zIndex: 1, position: "relative",
                    }}>
                      <i className={`ti ${tipoIcon(item.tipo || "anotacao")}`} style={{ fontSize: 13, color: tipoColor(item.tipo || "anotacao") }} />
                    </div>

                    {/* Conteúdo */}
                    <div style={{ flex: 1, background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginTop: 2 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 13, color: item.kind === "anotacao" ? "var(--text)" : "var(--sub)" }}>
                          {item.descricao}
                        </div>
                        {item.kind === "anotacao" && (
                          <button
                            onClick={() => deletarAnotacao(item.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 12, flexShrink: 0 }}
                          >
                            <i className="ti ti-trash" />
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 4 }}>
                        {formatarData(item.created_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {timeline.length === 0 && (
                  <div style={{ paddingLeft: 44, color: "var(--muted)", fontSize: 13 }}>Nenhum evento ainda</div>
                )}
              </div>
            </div>

            {/* Nova anotação */}
            <div style={{ marginTop: 20, background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.3px" }}>NOVA ANOTAÇÃO</div>
              <textarea
                value={novaAnotacao}
                onChange={(e) => setNovaAnotacao(e.target.value)}
                placeholder="Escreva uma observação sobre este lead..."
                rows={3}
                style={{
                  width: "100%", background: "var(--s2)", border: "1px solid var(--border2)",
                  borderRadius: 6, padding: "8px 10px", fontSize: 13, color: "var(--text)",
                  resize: "vertical", outline: "none", fontFamily: "inherit",
                }}
              />
              <button
                onClick={salvarAnotacao}
                disabled={salvando || !novaAnotacao.trim()}
                style={{
                  marginTop: 8, padding: "7px 16px", borderRadius: 6, fontSize: 13,
                  fontWeight: 500, border: "none", cursor: "pointer",
                  background: "var(--s4)", color: "var(--text)",
                  opacity: salvando || !novaAnotacao.trim() ? 0.5 : 1,
                }}
              >
                {salvando ? "Salvando..." : "Salvar anotação"}
              </button>
            </div>
          </div>

          {/* Painel lateral */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Etapa */}
            <div style={card}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px" }}>ETAPA</div>
              <select
                value={lead.etapa}
                disabled={atualizando}
                onChange={(e) => mudarEtapa(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: 6, fontSize: 13,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--text)", cursor: "pointer", opacity: atualizando ? 0.5 : 1,
                }}
              >
                {etapas.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
              </select>
            </div>

            {/* Contato */}
            <div style={card}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px" }}>CONTATO</div>
              {[
                { label: "Telefone", value: formatarTelefone(lead.contato) },
                { label: "Canal", value: lead.canal },
                { label: "Cidade", value: lead.cidade },
                { label: "Dispositivo", value: lead.dispositivo },
              ].filter((i) => i.value).map((i) => (
                <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{i.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>{i.value}</span>
                </div>
              ))}
              {lead.contato && (
                <a
                  href={`https://wa.me/${lead.contato.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    marginTop: 12, padding: "8px", borderRadius: 6, fontSize: 13,
                    background: "var(--s3)", color: "var(--text)", border: "1px solid var(--border2)",
                    textDecoration: "none",
                  }}
                >
                  <i className="ti ti-brand-whatsapp" style={{ fontSize: 14 }} />
                  Abrir WhatsApp
                </a>
              )}
            </div>

            {/* Rastreamento */}
            <div style={card}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px" }}>RASTREAMENTO</div>
              {[
                { label: "Campanha", value: lead.campanha },
                { label: "Conjunto", value: lead.conjunto },
                { label: "Anúncio", value: lead.anuncio },
                { label: "UTM Source", value: lead.utm_source },
                { label: "UTM Medium", value: lead.utm_medium },
                { label: "FBCLID", value: lead.fbclid ? "✓ Capturado" : null },
                { label: "GCLID", value: lead.gclid ? "✓ Capturado" : null },
              ].filter((i) => i.value).map((i) => (
                <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{i.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace", maxWidth: 160, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.value}</span>
                </div>
              ))}
            </div>

            {/* Eventos Meta */}
            {lead.evento_meta && lead.evento_meta.length > 0 && (
              <div style={card}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px" }}>EVENTOS META CAPI</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {lead.evento_meta.map((ev, i) => (
                    <span key={i} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 12, background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)", fontFamily: "monospace" }}>
                      → {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Datas */}
            <div style={card}>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10, letterSpacing: "0.5px" }}>DATAS</div>
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>Entrada</span>
                <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>{formatarData(lead.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

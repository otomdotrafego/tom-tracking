"use client";
import { useEffect, useState } from "react";
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

const canalIcon: Record<string, string> = {
  WhatsApp: "ti-brand-whatsapp",
  Instagram: "ti-brand-instagram",
  Google: "ti-brand-google",
  "Meta Ads": "ti-brand-meta",
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

function tempoRelativo(data: string) {
  const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

const card: React.CSSProperties = {
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 14,
  marginBottom: 10,
};

export default function JornadasPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadSelecionado, setLeadSelecionado] = useState<Lead | null>(null);
  const [busca, setBusca] = useState("");
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setLeads(data);
          selecionarLead(data[0]);
        }
      });
  }, []);

  async function selecionarLead(lead: Lead) {
    setLeadSelecionado(lead);
    setEventos([]);
    setAnotacoes([]);
    setNovaAnotacao("");

    const [{ data: eventosData }, { data: anotacoesData }] = await Promise.all([
      supabase.from("lead_eventos").select("*").eq("lead_id", lead.id).order("created_at", { ascending: true }),
      supabase.from("lead_anotacoes").select("*").eq("lead_id", lead.id).order("created_at", { ascending: true }),
    ]);

    // Cria evento de entrada se não existir
    if (!eventosData || eventosData.length === 0) {
      await supabase.from("lead_eventos").insert({
        lead_id: lead.id,
        tipo: "entrada",
        descricao: `Lead entrou via ${lead.canal}${lead.campanha ? ` — campanha: ${lead.campanha}` : ""}`,
        created_at: lead.created_at,
      });
      const { data: novos } = await supabase
        .from("lead_eventos").select("*").eq("lead_id", lead.id).order("created_at", { ascending: true });
      if (novos) setEventos(novos);
    } else {
      setEventos(eventosData);
    }

    if (anotacoesData) setAnotacoes(anotacoesData);
  }

  async function mudarEtapa(novaEtapa: string) {
    if (!leadSelecionado) return;
    setAtualizando(true);

    await supabase.from("leads").update({ etapa: novaEtapa }).eq("id", leadSelecionado.id);

    const etapaAnterior = etapas.find((e) => e.value === leadSelecionado.etapa)?.label || leadSelecionado.etapa;
    const etapaNova = etapas.find((e) => e.value === novaEtapa)?.label || novaEtapa;

    await supabase.from("lead_eventos").insert({
      lead_id: leadSelecionado.id,
      tipo: "etapa",
      descricao: `Etapa: ${etapaAnterior} → ${etapaNova}`,
    });

    const evento = etapaParaEvento[novaEtapa];
    if (evento) {
      await fetch("/api/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: leadSelecionado.id, evento }),
      });
      await supabase.from("lead_eventos").insert({
        lead_id: leadSelecionado.id,
        tipo: "capi",
        descricao: `Meta CAPI: → ${evento}`,
      });
      mostrarToast(`✓ Evento ${evento} enviado ao Meta`);
    }

    const lead_atualizado = { ...leadSelecionado, etapa: novaEtapa };
    setLeadSelecionado(lead_atualizado);
    setLeads((prev) => prev.map((l) => (l.id === leadSelecionado.id ? lead_atualizado : l)));

    const { data: novosEventos } = await supabase
      .from("lead_eventos").select("*").eq("lead_id", leadSelecionado.id).order("created_at", { ascending: true });
    if (novosEventos) setEventos(novosEventos);
    setAtualizando(false);
  }

  async function salvarAnotacao() {
    if (!novaAnotacao.trim() || !leadSelecionado) return;
    setSalvando(true);
    await supabase.from("lead_anotacoes").insert({ lead_id: leadSelecionado.id, texto: novaAnotacao.trim() });
    setNovaAnotacao("");
    const { data } = await supabase
      .from("lead_anotacoes").select("*").eq("lead_id", leadSelecionado.id).order("created_at", { ascending: true });
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

  const timeline: TimelineItem[] = [
    ...eventos.map((e) => ({ id: e.id, kind: "evento" as const, tipo: e.tipo, descricao: e.descricao, created_at: e.created_at })),
    ...anotacoes.map((a) => ({ id: a.id, kind: "anotacao" as const, tipo: "anotacao", descricao: a.texto, created_at: a.created_at })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const filtrados = leads.filter(
    (l) => l.nome.toLowerCase().includes(busca.toLowerCase()) || (l.contato || "").includes(busca)
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <Sidebar />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: "var(--s3)", border: "1px solid var(--border2)",
          color: "var(--text)", padding: "10px 16px", borderRadius: 8,
          fontSize: 12, fontFamily: "monospace",
        }}>{toast}</div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          padding: "14px 22px", borderBottom: "1px solid var(--border)",
          background: "var(--s1)", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: -0.2 }}>Jornadas</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{leads.length} leads</div>
          </div>
        </div>

        {/* Master-Detail */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* Lista de leads (esquerda) */}
          <div style={{
            width: 280, flexShrink: 0, borderRight: "1px solid var(--border)",
            display: "flex", flexDirection: "column", background: "var(--s1)",
          }}>
            {/* Busca */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative" }}>
                <i className="ti ti-search" style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--muted)" }} />
                <input
                  type="text"
                  placeholder="Buscar lead..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  style={{
                    width: "100%", paddingLeft: 28, paddingRight: 10, paddingTop: 6, paddingBottom: 6,
                    borderRadius: 6, fontSize: 12, border: "1px solid var(--border2)",
                    background: "var(--s2)", color: "var(--text)", outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Lista */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtrados.map((l) => (
                <div
                  key={l.id}
                  onClick={() => selecionarLead(l)}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: leadSelecionado?.id === l.id ? "var(--s3)" : "transparent",
                    borderLeft: leadSelecionado?.id === l.id ? "2px solid var(--sub)" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (leadSelecionado?.id !== l.id) e.currentTarget.style.background = "var(--s2)"; }}
                  onMouseLeave={(e) => { if (leadSelecionado?.id !== l.id) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: "var(--s4)", border: "1px solid var(--border2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 600, color: "var(--sub)",
                    }}>
                      {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.nome}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                        {etapas.find((e) => e.value === l.etapa)?.label || l.etapa} · {tempoRelativo(l.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detalhe (direita) */}
          {leadSelecionado ? (
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* Timeline */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                {/* Header do lead */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "var(--s4)", border: "1px solid var(--border2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, color: "var(--sub)",
                  }}>
                    {leadSelecionado.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>{leadSelecionado.nome}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace" }}>{formatarTelefone(leadSelecionado.contato)}</div>
                  </div>
                  {leadSelecionado.contato && (
                    <a
                      href={`https://wa.me/${leadSelecionado.contato.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
                        padding: "7px 14px", borderRadius: 6, fontSize: 13,
                        background: "var(--s3)", color: "var(--text)", border: "1px solid var(--border2)",
                        textDecoration: "none",
                      }}
                    >
                      <i className="ti ti-brand-whatsapp" style={{ fontSize: 14 }} />
                      WhatsApp
                    </a>
                  )}
                </div>

                {/* Timeline */}
                <div style={{ fontSize: 12, fontWeight: 500, color: "var(--muted)", marginBottom: 14, letterSpacing: "0.5px" }}>TIMELINE</div>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 1, background: "var(--border)" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {timeline.map((item, i) => (
                      <div key={item.id} style={{ display: "flex", gap: 14, paddingBottom: i < timeline.length - 1 ? 16 : 0 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                          background: "var(--s3)", border: "1px solid var(--border2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          zIndex: 1, position: "relative",
                        }}>
                          <i className={`ti ${tipoIcon(item.tipo || "anotacao")}`} style={{ fontSize: 12, color: "var(--sub)" }} />
                        </div>
                        <div style={{ flex: 1, background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 7, padding: "9px 13px", marginTop: 1 }}>
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
                          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace", marginTop: 3 }}>
                            {formatarData(item.created_at)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {timeline.length === 0 && (
                      <div style={{ paddingLeft: 42, color: "var(--muted)", fontSize: 13 }}>Nenhum evento ainda</div>
                    )}
                  </div>
                </div>

                {/* Nova anotação */}
                <div style={{ marginTop: 20, background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>NOVA ANOTAÇÃO</div>
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

              {/* Painel lateral direito */}
              <div style={{ width: 280, flexShrink: 0, borderLeft: "1px solid var(--border)", overflowY: "auto", padding: "20px 16px", background: "var(--s1)" }}>

                {/* Etapa */}
                <div style={card}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>ETAPA</div>
                  <select
                    value={leadSelecionado.etapa}
                    disabled={atualizando}
                    onChange={(e) => mudarEtapa(e.target.value)}
                    style={{
                      width: "100%", padding: "7px 10px", borderRadius: 6, fontSize: 13,
                      border: "1px solid var(--border2)", background: "var(--s3)",
                      color: "var(--text)", cursor: "pointer", opacity: atualizando ? 0.5 : 1,
                    }}
                  >
                    {etapas.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </div>

                {/* Contato */}
                <div style={card}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>CONTATO</div>
                  {[
                    { label: "Telefone", value: formatarTelefone(leadSelecionado.contato) },
                    { label: "Canal", value: leadSelecionado.canal },
                    { label: "Cidade", value: leadSelecionado.cidade },
                    { label: "Dispositivo", value: leadSelecionado.dispositivo },
                  ].filter((i) => i.value).map((i) => (
                    <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{i.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>{i.value}</span>
                    </div>
                  ))}
                </div>

                {/* Rastreamento */}
                <div style={card}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>RASTREAMENTO</div>
                  {[
                    { label: "Campanha", value: leadSelecionado.campanha },
                    { label: "Conjunto", value: leadSelecionado.conjunto },
                    { label: "Anúncio", value: leadSelecionado.anuncio },
                    { label: "UTM Source", value: leadSelecionado.utm_source },
                    { label: "UTM Medium", value: leadSelecionado.utm_medium },
                    { label: "FBCLID", value: leadSelecionado.fbclid ? "✓ Capturado" : null },
                    { label: "GCLID", value: leadSelecionado.gclid ? "✓ Capturado" : null },
                  ].filter((i) => i.value).map((i) => (
                    <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{i.label}</span>
                      <span style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace", maxWidth: 140, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.value}</span>
                    </div>
                  ))}
                </div>

                {/* Eventos Meta */}
                {leadSelecionado.evento_meta && leadSelecionado.evento_meta.length > 0 && (
                  <div style={card}>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>EVENTOS META</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {leadSelecionado.evento_meta.map((ev, i) => (
                        <span key={i} style={{ padding: "2px 7px", borderRadius: 4, fontSize: 11, background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)", fontFamily: "monospace" }}>
                          → {ev}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data */}
                <div style={card}>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>ENTRADA</div>
                  <div style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace" }}>{formatarData(leadSelecionado.created_at)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
              Selecione um lead para ver a jornada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

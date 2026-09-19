"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  nome: string;
  contato: string;
  canal: string;
  campanha: string;
  etapa: string;
  created_at: string;
};

const canalIcon: Record<string, string> = {
  WhatsApp: "ti-brand-whatsapp",
  Instagram: "ti-brand-instagram",
  Google: "ti-brand-google",
  "Meta Ads": "ti-brand-meta",
};

const etapaParaEvento: Record<string, string | null> = {
  novo: "Lead",
  em_conversa: "Lead",
  qualificado: null,
  agendado: "Schedule",
  negociando: null,
  venda_fechada: "Purchase",
  nao_qualificado: null,
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

function tempoRelativo(data: string) {
  const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: 14,
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [canalFiltro, setCanalFiltro] = useState("Todos");
  const [etapaFiltro, setEtapaFiltro] = useState("Todas as etapas");
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  }

  async function atualizarEtapa(leadId: string, novaEtapa: string) {
    setAtualizando(leadId);
    await supabase.from("leads").update({ etapa: novaEtapa }).eq("id", leadId);
    const evento = etapaParaEvento[novaEtapa];
    if (evento) {
      try {
        await fetch("/api/capi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, evento }),
        });
        mostrarToast(`✓ Evento ${evento} enviado ao Meta`);
      } catch {
        mostrarToast("Erro ao enviar evento ao Meta");
      }
    }
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)));
    setAtualizando(null);
  }

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const leadsFiltrados = leads.filter((l) => {
    const porCanal = canalFiltro === "Todos" || l.canal === canalFiltro;
    const porEtapa = etapaFiltro === "Todas as etapas" || l.etapa === etapaFiltro;
    return porCanal && porEtapa;
  });

  const total = leads.length;
  const abertas = leads.filter((l) => l.etapa === "em_conversa").length;
  const vendas = leads.filter((l) => l.etapa === "venda_fechada").length;
  const txConversao = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";

  const porCanal = ["WhatsApp", "Instagram", "Google", "Meta Ads"].map((c) => ({
    canal: c, icon: canalIcon[c],
    valor: leads.filter((l) => l.canal === c).length,
  }));
  const maxCanal = Math.max(...porCanal.map((c) => c.valor), 1);

  const funilEtapas = [
    { label: "Leads", valor: total },
    { label: "Em conversa", valor: leads.filter((l) => l.etapa === "em_conversa").length },
    { label: "Qualificado", valor: leads.filter((l) => l.etapa === "qualificado").length },
    { label: "Agendado", valor: leads.filter((l) => l.etapa === "agendado").length },
    { label: "Venda", valor: vendas },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: "var(--s3)", border: "1px solid var(--border2)",
          color: "var(--text)", padding: "10px 16px", borderRadius: 8,
          fontSize: 15, fontFamily: "monospace",
        }}>{toast}</div>
      )}

      {/* Topbar */}
      <div style={{
        padding: isMobile ? "12px 14px" : "13px 18px",
        borderBottom: "1px solid var(--border)",
        background: "var(--s1)",
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        marginTop: isMobile ? 48 : 0,
      }}>
        <div>
          <div style={{ fontSize: isMobile ? 13 : 14, fontWeight: 500, letterSpacing: -0.2, color: "var(--text)" }}>
            Painel de rastreamento
          </div>
          <div style={{ fontSize: 16, color: "var(--muted)", marginTop: 1 }}>
            {total} leads cadastrados
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isMobile && (
            <div style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 16,
              color: "var(--sub)", padding: "4px 9px", borderRadius: 20,
              border: "1px solid var(--border)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sub)", display: "inline-block" }} />
              Ao vivo
            </div>
          )}
          <select
            value={canalFiltro}
            onChange={(e) => setCanalFiltro(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 7, fontSize: 16,
              border: "1px solid var(--border2)", background: "var(--s2)",
              color: "var(--sub)", cursor: "pointer",
            }}
          >
            <option value="Todos">Todas as origens</option>
            <option>WhatsApp</option>
            <option>Meta Ads</option>
            <option>Google</option>
            <option>Instagram</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: isMobile ? "12px 14px" : "16px 18px" }}>

        {/* Metrics — 2 colunas no mobile, 4 no desktop */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
          gap: 12, marginBottom: 18,
        }}>
          {[
            { label: "Total de leads", value: total },
            { label: "Em conversa", value: abertas },
            { label: "Vendas fechadas", value: vendas },
            { label: "Taxa de conversão", value: `${txConversao}%` },
          ].map((m) => (
            <div key={m.label} style={card}>
              <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 500, color: "var(--text)", fontFamily: "monospace", letterSpacing: -1 }}>
                {loading ? "..." : m.value}
              </div>
              <div style={{ fontSize: 16, color: "var(--muted)", marginTop: 3 }}>dados reais</div>
            </div>
          ))}
        </div>

        {/* Channels + Funnel — empilhados no mobile */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: 12, marginBottom: 18,
        }}>
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Leads por canal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {porCanal.map((c) => (
                <div key={c.canal} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--s3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${c.icon}`} style={{ fontSize: 15, color: "var(--sub)" }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 17, color: "var(--sub)" }}>{c.canal}</div>
                  <div style={{ flex: 2, height: 3, background: "var(--s3)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(c.valor / maxCanal) * 100}%`, height: "100%", background: "var(--s4)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 16, fontFamily: "monospace", color: "var(--muted)", minWidth: 20, textAlign: "right" }}>{c.valor}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 12 }}>Funil de conversão</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {funilEtapas.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 16, color: "var(--muted)", width: 70, flexShrink: 0 }}>{f.label}</div>
                  <div style={{ flex: 1, height: 19, background: "var(--s3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: total > 0 ? `${(f.valor / total) * 100}%` : "0%",
                      height: "100%", background: "var(--s4)", borderRadius: 4,
                      display: "flex", alignItems: "center", padding: "0 7px",
                      fontSize: 15, fontFamily: "monospace", color: "var(--sub)",
                    }}>{f.valor}</div>
                  </div>
                  <div style={{ fontSize: 16, fontFamily: "monospace", color: "var(--muted)", minWidth: 30, textAlign: "right" }}>
                    {total > 0 ? `${Math.round((f.valor / total) * 100)}%` : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads table — scroll horizontal só na tabela no mobile */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <div style={{ padding: "13px 18px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>Leads recentes</span>
            <select
              value={etapaFiltro}
              onChange={(e) => setEtapaFiltro(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 5, fontSize: 16, border: "1px solid var(--border2)", background: "var(--s2)", color: "var(--sub)" }}
            >
              <option>Todas as etapas</option>
              {etapas.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          {/* Scroll só na tabela, não na página toda */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 500 : "auto" }}>
              <thead>
                <tr>
                  {(isMobile
                    ? ["Lead", "Etapa", "Recebido"]
                    : ["Lead", "Canal", "Campanha", "Etapa", "Recebido", "Meta"]
                  ).map((h) => (
                    <th key={h} style={{ padding: "10px 18px", fontSize: 15, color: "var(--muted)", textAlign: "left", fontWeight: 400, borderBottom: "1px solid var(--border)", letterSpacing: "0.3px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 15 }}>Carregando...</td></tr>
                ) : leadsFiltrados.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 15 }}>Nenhum lead encontrado</td></tr>
                ) : leadsFiltrados.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "11px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--s4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 500, color: "var(--sub)", flexShrink: 0 }}>
                          {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 17, color: "var(--text)" }}>{l.nome}</div>
                          <div style={{ fontSize: 16, fontFamily: "monospace", color: "var(--muted)" }}>{l.contato}</div>
                        </div>
                      </div>
                    </td>
                    {!isMobile && (
                      <>
                        <td style={{ padding: "11px 18px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 3, fontSize: 16, background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)" }}>
                            <i className={`ti ${canalIcon[l.canal] || "ti-circle"}`} style={{ fontSize: 15 }} /> {l.canal}
                          </span>
                        </td>
                        <td style={{ padding: "11px 18px", fontSize: 16, fontFamily: "monospace", color: "var(--muted)" }}>{l.campanha}</td>
                      </>
                    )}
                    <td style={{ padding: "11px 18px" }}>
                      <select
                        value={l.etapa}
                        disabled={atualizando === l.id}
                        onChange={(e) => atualizarEtapa(l.id, e.target.value)}
                        style={{ padding: "3px 7px", borderRadius: 4, fontSize: 16, border: "1px solid var(--border)", background: "var(--s2)", color: "var(--text)", cursor: "pointer", opacity: atualizando === l.id ? 0.5 : 1 }}
                      >
                        {etapas.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: "11px 18px", fontSize: 16, fontFamily: "monospace", color: "var(--muted)" }}>{tempoRelativo(l.created_at)}</td>
                    {!isMobile && (
                      <td style={{ padding: "11px 18px" }}>
                        <span style={{ fontSize: 15, color: "var(--muted)", fontFamily: "monospace" }}>
                          {etapaParaEvento[l.etapa] ? `→ ${etapaParaEvento[l.etapa]}` : "—"}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

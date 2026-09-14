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

export default function Dashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [canalFiltro, setCanalFiltro] = useState("Todos");
  const [etapaFiltro, setEtapaFiltro] = useState("Todas as etapas");

  useEffect(() => {
    async function fetchLeads() {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setLeads(data);
      setLoading(false);
    }
    fetchLeads();
  }, []);

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
    canal: c,
    icon: canalIcon[c],
    valor: leads.filter((l) => l.canal === c).length,
  }));
  const maxCanal = Math.max(...porCanal.map((c) => c.valor), 1);

  const etapas = [
    { label: "Leads", key: null, valor: total },
    { label: "Em conversa", key: "em_conversa", valor: leads.filter((l) => l.etapa === "em_conversa").length },
    { label: "Qualificado", key: "qualificado", valor: leads.filter((l) => l.etapa === "qualificado").length },
    { label: "Agendado", key: "agendado", valor: leads.filter((l) => l.etapa === "agendado").length },
    { label: "Venda", key: "venda_fechada", valor: vendas },
  ];

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Topbar */}
      <div style={{
        padding: "13px 18px", borderBottom: "1px solid var(--border)",
        background: "var(--s1)", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.2, color: "var(--text)" }}>
            Painel de rastreamento
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
            {total} leads cadastrados
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 11,
            color: "var(--sub)", padding: "4px 9px", borderRadius: 20,
            border: "1px solid var(--border)",
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sub)", display: "inline-block" }} />
            Ao vivo
          </div>
          <select
            value={canalFiltro}
            onChange={(e) => setCanalFiltro(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 7, fontSize: 11,
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
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 14 }}>
          {[
            { label: "Total de leads", value: total },
            { label: "Em conversa", value: abertas },
            { label: "Vendas fechadas", value: vendas },
            { label: "Taxa de conversão", value: `${txConversao}%` },
          ].map((m) => (
            <div key={m.label} style={card}>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 5 }}>{m.label}</div>
              <div style={{ fontSize: 19, fontWeight: 500, color: "var(--text)", fontFamily: "monospace", letterSpacing: -1 }}>
                {loading ? "..." : m.value}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>dados reais</div>
            </div>
          ))}
        </div>

        {/* Channels + Funnel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Leads por canal</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {porCanal.map((c) => (
                <div key={c.canal} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: "var(--s3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <i className={`ti ${c.icon}`} style={{ fontSize: 12, color: "var(--sub)" }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 11.5, color: "var(--sub)" }}>{c.canal}</div>
                  <div style={{ flex: 2, height: 3, background: "var(--s3)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${(c.valor / maxCanal) * 100}%`, height: "100%", background: "var(--s4)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", minWidth: 20, textAlign: "right" }}>{c.valor}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Funil de conversão</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {etapas.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", width: 70, flexShrink: 0 }}>{f.label}</div>
                  <div style={{ flex: 1, height: 19, background: "var(--s3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: total > 0 ? `${(f.valor / total) * 100}%` : "0%",
                      height: "100%", background: "var(--s4)", borderRadius: 4,
                      display: "flex", alignItems: "center", padding: "0 7px",
                      fontSize: 10, fontFamily: "monospace", color: "var(--sub)",
                    }}>{f.valor}</div>
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)", minWidth: 30, textAlign: "right" }}>
                    {total > 0 ? `${Math.round((f.valor / total) * 100)}%` : "0%"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads table */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Leads recentes</span>
            <select
              value={etapaFiltro}
              onChange={(e) => setEtapaFiltro(e.target.value)}
              style={{ padding: "4px 8px", borderRadius: 5, fontSize: 11, border: "1px solid var(--border2)", background: "var(--s2)", color: "var(--sub)" }}
            >
              <option>Todas as etapas</option>
              <option value="em_conversa">Em conversa</option>
              <option value="agendado">Agendado</option>
              <option value="venda_fechada">Venda fechada</option>
              <option value="nao_qualificado">Não qualificado</option>
            </select>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Lead", "Canal", "Campanha", "Etapa", "Recebido", ""].map((h) => (
                  <th key={h} style={{ padding: "7px 14px", fontSize: 10, color: "var(--muted)", textAlign: "left", fontWeight: 400, borderBottom: "1px solid var(--border)", letterSpacing: "0.3px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>Carregando...</td></tr>
              ) : leadsFiltrados.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 12 }}>Nenhum lead encontrado</td></tr>
              ) : (
                leadsFiltrados.map((l) => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "8px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "var(--s4)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8.5, fontWeight: 500, color: "var(--sub)", flexShrink: 0 }}>
                          {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 11.5, color: "var(--text)" }}>{l.nome}</div>
                          <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{l.contato}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 6px", borderRadius: 3, fontSize: 10.5, background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)" }}>
                        <i className={`ti ${canalIcon[l.canal] || "ti-circle"}`} style={{ fontSize: 10 }} /> {l.canal}
                      </span>
                    </td>
                    <td style={{ padding: "8px 14px", fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{l.campanha}</td>
                    <td style={{ padding: "8px 14px", fontSize: 11, color: "var(--sub)" }}>{l.etapa?.replace(/_/g, " ")}</td>
                    <td style={{ padding: "8px 14px", fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{tempoRelativo(l.created_at)}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <button style={{ padding: "3px 7px", borderRadius: 4, fontSize: 10.5, border: "1px solid var(--border)", background: "transparent", color: "var(--muted)", cursor: "pointer" }}>
                        Jornada
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
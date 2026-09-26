"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = {
  id: string;
  canal: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  etapa: string;
  created_at: string;
  fbclid: string | null;
  gclid: string | null;
};

const canalIcon: Record<string, string> = {
  WhatsApp: "ti-brand-whatsapp",
  Instagram: "ti-brand-instagram",
  Google: "ti-brand-google",
  "Meta Ads": "ti-brand-meta",
};

const etapaLabel: Record<string, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  qualificado: "Qualificado",
  agendado: "Agendado",
  negociando: "Negociando",
  venda_fechada: "Venda fechada",
  nao_qualificado: "Não qualificado",
};

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: 18,
};

type Periodo = "7d" | "30d" | "90d";

function formatarDia(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export default function RelatoriosPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<Periodo>("30d");

  useEffect(() => {
    if (!user) return;
    const dias = periodo === "7d" ? 7 : periodo === "30d" ? 30 : 90;
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);

    supabase
      .from("leads")
      .select("id, canal, utm_source, utm_medium, utm_campaign, utm_content, etapa, created_at, fbclid, gclid")
      .eq("tenant_id", user.id)
      .gte("created_at", desde.toISOString())
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setLeads(data);
        setLoading(false);
      });
  }, [user, periodo]);

  // --- Métricas gerais ---
  const total = leads.length;
  const vendas = leads.filter((l) => l.etapa === "venda_fechada").length;
  const agendados = leads.filter((l) => l.etapa === "agendado").length;
  const txConversao = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const comFbclid = leads.filter((l) => l.fbclid).length;
  const comGclid = leads.filter((l) => l.gclid).length;

  // --- Leads por dia ---
  const leadsPorDia: Record<string, number> = {};
  leads.forEach((l) => {
    const dia = l.created_at.slice(0, 10);
    leadsPorDia[dia] = (leadsPorDia[dia] || 0) + 1;
  });
  const diasOrdenados = Object.keys(leadsPorDia).sort();
  const maxDia = Math.max(...Object.values(leadsPorDia), 1);

  // --- Por canal ---
  const porCanal: Record<string, number> = {};
  leads.forEach((l) => { porCanal[l.canal] = (porCanal[l.canal] || 0) + 1; });
  const canaisOrdenados = Object.entries(porCanal).sort((a, b) => b[1] - a[1]);
  const maxCanal = Math.max(...Object.values(porCanal), 1);

  // --- Por campanha ---
  type CampanhaStats = { total: number; vendas: number; agendados: number };
  const porCampanha: Record<string, CampanhaStats> = {};
  leads.forEach((l) => {
    const camp = l.utm_campaign || l.canal;
    if (!porCampanha[camp]) porCampanha[camp] = { total: 0, vendas: 0, agendados: 0 };
    porCampanha[camp].total++;
    if (l.etapa === "venda_fechada") porCampanha[camp].vendas++;
    if (l.etapa === "agendado") porCampanha[camp].agendados++;
  });
  const campanhasOrdenadas = Object.entries(porCampanha).sort((a, b) => b[1].total - a[1].total);
  const maxCamp = Math.max(...campanhasOrdenadas.map((c) => c[1].total), 1);

  // --- Por UTM Source ---
  const porSource: Record<string, number> = {};
  leads.forEach((l) => {
    const src = l.utm_source || "direto";
    porSource[src] = (porSource[src] || 0) + 1;
  });
  const sourcesOrdenados = Object.entries(porSource).sort((a, b) => b[1] - a[1]);

  // --- Por etapa ---
  const porEtapa: Record<string, number> = {};
  leads.forEach((l) => { porEtapa[l.etapa] = (porEtapa[l.etapa] || 0) + 1; });

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>

        {/* Topbar */}
        <div style={{
          padding: "14px 22px", borderBottom: "1px solid var(--border)",
          background: "var(--s1)", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: -0.2 }}>Relatórios</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
              {total} leads no período
            </div>
          </div>
          {/* Seletor de período */}
          <div style={{ display: "flex", gap: 4, background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 8, padding: 3 }}>
            {(["7d", "30d", "90d"] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => { setLoading(true); setPeriodo(p); }}
                style={{
                  padding: "5px 14px", borderRadius: 5, fontSize: 12, border: "none",
                  cursor: "pointer", fontWeight: 500,
                  background: periodo === p ? "var(--s4)" : "transparent",
                  color: periodo === p ? "var(--text)" : "var(--muted)",
                }}
              >
                {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13 }}>
            Carregando...
          </div>
        ) : (
          <div style={{ flex: 1, padding: "18px 22px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Métricas topo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                { label: "Total de leads", value: total, icon: "ti-users" },
                { label: "Agendados", value: agendados, icon: "ti-calendar" },
                { label: "Vendas fechadas", value: vendas, icon: "ti-check" },
                { label: "Taxa de conversão", value: `${txConversao}%`, icon: "ti-trending-up" },
                { label: "Com rastreio Meta", value: comFbclid, icon: "ti-brand-meta" },
              ].map((m) => (
                <div key={m.label} style={card}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <i className={`ti ${m.icon}`} style={{ fontSize: 13, color: "var(--muted)" }} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{m.label}</span>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 500, color: "var(--text)", fontFamily: "monospace", letterSpacing: -1 }}>
                    {m.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Gráfico de leads por dia */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 16 }}>Leads por dia</div>
              {diasOrdenados.length === 0 ? (
                <div style={{ color: "var(--muted)", fontSize: 12 }}>Nenhum dado no período</div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 100 }}>
                  {diasOrdenados.map((dia) => (
                    <div key={dia} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <div style={{ fontSize: 10, color: "var(--muted)", fontFamily: "monospace" }}>
                        {leadsPorDia[dia]}
                      </div>
                      <div style={{
                        width: "100%", borderRadius: 3,
                        height: `${Math.max((leadsPorDia[dia] / maxDia) * 80, 4)}px`,
                        background: "var(--s4)", border: "1px solid var(--border2)",
                      }} />
                      <div style={{ fontSize: 9, color: "var(--muted)", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                        {formatarDia(dia)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Canal + Origem */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* Por canal */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>Leads por canal</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {canaisOrdenados.map(([canal, qtd]) => (
                    <div key={canal} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: "var(--s3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <i className={`ti ${canalIcon[canal] || "ti-circle"}`} style={{ fontSize: 12, color: "var(--sub)" }} />
                      </div>
                      <div style={{ fontSize: 13, color: "var(--sub)", width: 90, flexShrink: 0 }}>{canal}</div>
                      <div style={{ flex: 1, height: 6, background: "var(--s3)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(qtd / maxCanal) * 100}%`, height: "100%", background: "var(--s4)", borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--muted)", minWidth: 24, textAlign: "right" }}>{qtd}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", minWidth: 36, textAlign: "right" }}>
                        {total > 0 ? `${Math.round((qtd / total) * 100)}%` : "0%"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Por origem UTM */}
              <div style={card}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>Leads por origem</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sourcesOrdenados.map(([src, qtd]) => (
                    <div key={src} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 13, color: "var(--sub)", width: 90, flexShrink: 0, fontFamily: "monospace" }}>{src}</div>
                      <div style={{ flex: 1, height: 6, background: "var(--s3)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${(qtd / total) * 100}%`, height: "100%", background: "var(--s4)", borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--muted)", minWidth: 24, textAlign: "right" }}>{qtd}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", minWidth: 36, textAlign: "right" }}>
                        {total > 0 ? `${Math.round((qtd / total) * 100)}%` : "0%"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Campanhas */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>Performance por campanha</div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                  <thead>
                    <tr>
                      {["Campanha", "Leads", "Agendados", "Vendas", "Conversão", ""].map((h) => (
                        <th key={h} style={{ padding: "8px 12px", fontSize: 11, color: "var(--muted)", textAlign: "left", fontWeight: 400, borderBottom: "1px solid var(--border)", letterSpacing: "0.3px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {campanhasOrdenadas.map(([camp, stats]) => (
                      <tr key={camp}
                        style={{ borderBottom: "1px solid var(--border)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text)", fontFamily: "monospace" }}>{camp}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--text)", fontFamily: "monospace" }}>{stats.total}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>{stats.agendados}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "var(--muted)", fontFamily: "monospace" }}>{stats.vendas}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, fontFamily: "monospace", color: stats.vendas > 0 ? "var(--text)" : "var(--muted)" }}>
                          {stats.total > 0 ? `${((stats.vendas / stats.total) * 100).toFixed(1)}%` : "0%"}
                        </td>
                        <td style={{ padding: "10px 12px" }}>
                          <div style={{ width: 80, height: 4, background: "var(--s3)", borderRadius: 2, overflow: "hidden" }}>
                            <div style={{ width: `${(stats.total / maxCamp) * 100}%`, height: "100%", background: "var(--s4)", borderRadius: 2 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                    {campanhasOrdenadas.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Nenhuma campanha no período</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Funil por etapa */}
            <div style={card}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 14 }}>Distribuição por etapa</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {Object.entries(etapaLabel).map(([value, label]) => {
                  const qtd = porEtapa[value] || 0;
                  return (
                    <div key={value} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)", width: 110, flexShrink: 0 }}>{label}</div>
                      <div style={{ flex: 1, height: 20, background: "var(--s3)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          width: total > 0 ? `${(qtd / total) * 100}%` : "0%",
                          height: "100%", background: "var(--s4)", borderRadius: 4,
                          display: "flex", alignItems: "center", paddingLeft: 8,
                          fontSize: 11, fontFamily: "monospace", color: "var(--sub)",
                        }}>
                          {qtd > 0 ? qtd : ""}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", minWidth: 36, textAlign: "right" }}>
                        {total > 0 ? `${Math.round((qtd / total) * 100)}%` : "0%"}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

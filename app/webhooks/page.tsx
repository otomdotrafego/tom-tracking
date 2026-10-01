"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; nome: string; etapa: string; created_at: string; canal: string; };

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return m;
}

const ETAPA_LABEL: Record<string, string> = {
  novo: "Novo", em_conversa: "Em conversa", qualificado: "Qualificado",
  agendado: "Agendado", negociando: "Negociando", venda_fechada: "Venda fechada", nao_qualificado: "Não qualificado",
};

export default function WebhooksPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEtapas, setWebhookEtapas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, nome, etapa, created_at, canal").eq("tenant_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("perfis").select("webhook_url, webhook_etapas").eq("id", user.id).single(),
    ]).then(([l, p]) => {
      if (l.data) setLeads(l.data);
      if (p.data) { setWebhookUrl((p.data as any).webhook_url || ""); setWebhookEtapas((p.data as any).webhook_etapas || []); }
      setLoading(false);
    });
  }, [user]);

  const ativo = !!webhookUrl && webhookEtapas.length > 0;
  const leadsElegiveis = leads.filter(l => webhookEtapas.includes(l.etapa));

  function formatData(iso: string) {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-webhook" style={{ fontSize: 20, color: "#b8a832" }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Webhooks</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Notificações enviadas para sistemas externos</p>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Status e payload */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...card, border: `1px solid ${ativo ? "#2a5a38" : "var(--border)"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={secTitle}>Status</div>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: ativo ? "#4caf70" : "var(--muted)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: ativo ? "#4caf70" : "var(--muted)", display: "inline-block" }} />
                    {ativo ? "Ativo" : "Não configurado"}
                  </span>
                </div>
                {ativo ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 4 }}>URL destino:</div>
                      <div style={{ fontSize: 12, color: "var(--text)", fontFamily: "monospace", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 5, padding: "7px 10px", wordBreak: "break-all" }}>{webhookUrl}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 6 }}>Dispara nas etapas:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {webhookEtapas.map(e => (
                          <span key={e} style={{ fontSize: 11, background: "#0d1e14", border: "1px solid #2a5a38", color: "#4caf70", borderRadius: 4, padding: "3px 8px" }}>{ETAPA_LABEL[e] || e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                    Configure a URL em <strong style={{ color: "var(--text)" }}>Integrações → Webhook</strong>.
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={secTitle}>Payload enviado</div>
                <pre style={{ fontSize: 11, color: "#4caf70", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", margin: 0, fontFamily: "monospace", lineHeight: 1.7, overflow: "auto" }}>{`{
  "evento": "etapa_alterada",
  "etapa_anterior": "novo",
  "etapa_nova": "em_conversa",
  "lead": {
    "id": "uuid",
    "nome": "Nome do Lead",
    "contato": "5511999999999",
    "canal": "WhatsApp",
    "campanha": "campanha"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "tom-tracking"
}`}</pre>
              </div>
            </div>

            {/* Log */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={secTitle}>Leads elegíveis para webhook</div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{leadsElegiveis.length} registros</span>
              </div>
              {!ativo ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13, padding: "40px 0", textAlign: "center" }}>
                  Configure o webhook para ver os eventos
                </div>
              ) : leadsElegiveis.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: 13, padding: "40px 0" }}>
                  Nenhum lead nas etapas selecionadas
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, overflow: "auto" }}>
                  {leadsElegiveis.map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                      <i className="ti ti-send" style={{ fontSize: 13, color: "#4caf70", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.nome}</div>
                        <div style={{ fontSize: 11, color: "var(--sub)" }}>{ETAPA_LABEL[l.etapa]} · {l.canal}</div>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)", flexShrink: 0 }}>{formatData(l.created_at)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

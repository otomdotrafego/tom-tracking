"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const ETAPAS = [
  { value: "em_conversa", label: "Em conversa" },
  { value: "qualificado", label: "Qualificado" },
  { value: "agendado", label: "Agendado" },
  { value: "negociando", label: "Negociando" },
  { value: "venda_fechada", label: "Venda fechada" },
  { value: "nao_qualificado", label: "Não qualificado" },
];

function StatusDot({ ativo }: { ativo: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: ativo ? "#4caf70" : "var(--muted)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: ativo ? "#4caf70" : "var(--muted)", display: "inline-block" }} />
      {ativo ? "Ativo" : "Inativo"}
    </span>
  );
}

export default function IntegracoesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [testando, setTestando] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<"webhook" | "whatsapp" | "tomleads">("webhook");

  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEtapas, setWebhookEtapas] = useState<string[]>([]);
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("perfis").select("webhook_url, webhook_etapas, whatsapp_api_token, whatsapp_phone_id").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          setWebhookUrl((data as any).webhook_url || "");
          setWebhookEtapas((data as any).webhook_etapas || []);
          setWaToken((data as any).whatsapp_api_token || "");
          setWaPhoneId((data as any).whatsapp_phone_id || "");
        }
        setLoading(false);
      });
  }, [user]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleEtapa(etapa: string) {
    setWebhookEtapas(prev => prev.includes(etapa) ? prev.filter(e => e !== etapa) : [...prev, etapa]);
  }

  async function salvar() {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase.from("perfis").upsert({
      id: user.id,
      webhook_url: webhookUrl.trim() || null,
      webhook_etapas: webhookEtapas,
      whatsapp_api_token: waToken.trim() || null,
      whatsapp_phone_id: waPhoneId.trim() || null,
    });
    setSalvando(false);
    if (error) mostrarToast("Erro ao salvar: " + error.message, "erro");
    else mostrarToast("Integrações salvas");
  }

  async function testarWebhook() {
    if (!webhookUrl) return;
    setTestando(true);
    try {
      await fetch("/api/webhook-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: webhookUrl }) });
      mostrarToast("Webhook de teste enviado");
    } catch { mostrarToast("Erro ao enviar teste", "erro"); }
    setTestando(false);
  }

  const abas: { key: "webhook" | "whatsapp" | "tomleads"; label: string; icon: string; ativo: boolean; breve?: boolean }[] = [
    { key: "webhook", label: "Webhook · CRM", icon: "ti-arrows-exchange", ativo: !!webhookUrl && webhookEtapas.length > 0 },
    { key: "whatsapp", label: "WhatsApp API", icon: "ti-brand-whatsapp", ativo: !!waToken && !!waPhoneId },
    { key: "tomleads", label: "Tom Leads", icon: "ti-layout-kanban", ativo: false, breve: true },
  ];

  const inputStyle: React.CSSProperties = {
    background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none",
    width: "100%", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, color: "var(--sub)", textTransform: "uppercase",
    letterSpacing: "0.06em", fontWeight: 600,
  };
  const campoStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, color: "var(--muted)" }}>Carregando...</span>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", borderBottom: "1px solid var(--border)", background: "var(--s1)" }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Integrações</h1>
          <div style={{ display: "flex", gap: 2 }}>
            {abas.map(a => (
              <button key={a.key} onClick={() => setAbaAtiva(a.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  padding: "8px 16px", fontSize: 13, fontFamily: "inherit",
                  background: "transparent", border: "none", cursor: "pointer",
                  color: abaAtiva === a.key ? "var(--text)" : "var(--sub)",
                  borderBottom: abaAtiva === a.key ? "2px solid #4a9eca" : "2px solid transparent",
                  fontWeight: abaAtiva === a.key ? 600 : 400,
                  opacity: a.breve ? 0.5 : 1,
                }}>
                <i className={`ti ${a.icon}`} style={{ fontSize: 14 }} />
                {a.label}
                {a.breve && <span style={{ fontSize: 10, background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 5px", color: "var(--muted)" }}>Em breve</span>}
                {!a.breve && <StatusDot ativo={a.ativo} />}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo em duas colunas */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>

          {/* ABA WEBHOOK */}
          {abaAtiva === "webhook" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1100 }}>

              {/* Coluna esquerda — config */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Configuração</div>

                  <div style={campoStyle}>
                    <label style={labelStyle}>URL do Webhook</label>
                    <input style={inputStyle} value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/..." />
                  </div>

                  <div style={campoStyle}>
                    <label style={labelStyle}>Disparar nas etapas</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {ETAPAS.map(e => {
                        const sel = webhookEtapas.includes(e.value);
                        return (
                          <span key={e.value} onClick={() => toggleEtapa(e.value)} style={{
                            padding: "5px 10px", borderRadius: 5, fontSize: 12, cursor: "pointer",
                            border: `1px solid ${sel ? "#2a5a38" : "var(--border)"}`,
                            background: sel ? "#0d1e14" : "var(--s2)",
                            color: sel ? "#4caf70" : "var(--sub)",
                            userSelect: "none",
                          }}>
                            {sel && "✓ "}{e.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button onClick={testarWebhook} disabled={!webhookUrl || testando} style={{
                      background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6,
                      padding: "8px 14px", fontSize: 12, color: "var(--sub)",
                      cursor: webhookUrl ? "pointer" : "not-allowed", fontFamily: "inherit",
                    }}>
                      {testando ? "Enviando..." : "Enviar teste"}
                    </button>
                    <button onClick={salvar} disabled={salvando} style={{
                      background: "#4a9eca", border: "none", borderRadius: 6,
                      padding: "8px 18px", fontSize: 12, color: "#fff", fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>

                {/* Compatibilidade */}
                <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>Compatível com</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {["Zapier", "Make", "HubSpot", "Pipedrive", "RD Station", "ActiveCampaign", "N8N", "Qualquer CRM"].map(n => (
                      <span key={n} style={{ fontSize: 12, background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 10px", color: "var(--sub)" }}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Coluna direita — payload */}
              <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Payload enviado</div>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
                  Quando um lead mudar para uma das etapas selecionadas, o Tom Tracking envia automaticamente esse JSON para a URL configurada.
                </p>
                <pre style={{
                  fontSize: 12, color: "#4caf70", background: "var(--s2)",
                  border: "1px solid var(--border)", borderRadius: 6,
                  padding: "14px 16px", margin: 0, fontFamily: "monospace",
                  lineHeight: 1.7, overflow: "auto", flex: 1,
                }}>{`{
  "evento": "etapa_alterada",
  "etapa_anterior": "novo",
  "etapa_nova": "em_conversa",
  "lead": {
    "id": "uuid-do-lead",
    "nome": "Nome do Lead",
    "contato": "5511999999999",
    "canal": "WhatsApp",
    "campanha": "campanha-verao"
  },
  "timestamp": "2024-01-01T00:00:00Z",
  "source": "tom-tracking"
}`}</pre>
              </div>
            </div>
          )}

          {/* ABA WHATSAPP */}
          {abaAtiva === "whatsapp" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 1100 }}>

              <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Credenciais</div>

                <div style={campoStyle}>
                  <label style={labelStyle}>Token de acesso permanente</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={inputStyle} type={mostrarToken ? "text" : "password"} value={waToken} onChange={e => setWaToken(e.target.value)} placeholder="EAAxxxxx..." />
                    <button onClick={() => setMostrarToken(!mostrarToken)} style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", cursor: "pointer", color: "var(--sub)", flexShrink: 0 }}>
                      <i className={`ti ${mostrarToken ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15 }} />
                    </button>
                  </div>
                </div>

                <div style={campoStyle}>
                  <label style={labelStyle}>Phone Number ID</label>
                  <input style={inputStyle} value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)} placeholder="Ex: 123456789012345" />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Meta for Developers → seu app → WhatsApp → API Setup</span>
                </div>

                <button onClick={salvar} disabled={salvando} style={{ background: "#4a9eca", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 13, color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", width: "fit-content" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Como funciona</div>
                {[
                  { icon: "ti-message", title: "Lead responde no WhatsApp", desc: "O Meta envia um evento para o webhook do Tom Tracking" },
                  { icon: "ti-arrows-exchange", title: "Etapa atualizada automaticamente", desc: "O lead é movido para Em conversa sem intervenção manual" },
                  { icon: "ti-brand-meta", title: "CAPI disparado", desc: "O evento Lead é enviado ao Meta com os dados do contato" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <i className={`ti ${item.icon}`} style={{ fontSize: 18, color: "#4a9eca", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: "var(--sub)" }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA TOM LEADS */}
          {abaAtiva === "tomleads" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <i className="ti ti-layout-kanban" style={{ fontSize: 40, color: "var(--muted)" }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Tom Leads · Em breve</div>
                <div style={{ fontSize: 13, color: "var(--sub)", maxWidth: 380, lineHeight: 1.6 }}>
                  Integração nativa com o CRM Tom Leads. Um clique conecta os dois sistemas — leads, etapas e conversões sincronizados em tempo real.
                </div>
                <button disabled style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 20px", fontSize: 13, color: "var(--muted)", cursor: "not-allowed", fontFamily: "inherit" }}>
                  Conectar Tom Leads
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.tipo === "ok" ? "#0d1e14" : "#1e0d0d",
          border: `1px solid ${toast.tipo === "ok" ? "#2a5a38" : "#5a2a2a"}`,
          color: toast.tipo === "ok" ? "#4caf70" : "#c46060",
          borderRadius: 8, padding: "10px 16px", fontSize: 13,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 9999,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

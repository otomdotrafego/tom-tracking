"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Integracao = {
  webhook_url: string | null;
  webhook_etapas: string[];
  whatsapp_api_token: string | null;
  whatsapp_phone_id: string | null;
};

const ETAPAS = [
  { value: "em_conversa", label: "Em conversa" },
  { value: "qualificado", label: "Qualificado" },
  { value: "agendado", label: "Agendado" },
  { value: "negociando", label: "Negociando" },
  { value: "venda_fechada", label: "Venda fechada" },
  { value: "nao_qualificado", label: "Não qualificado" },
];

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--sub)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  paddingBottom: 14,
  borderBottom: "1px solid var(--border)",
  marginBottom: 2,
};

const campo: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "var(--sub)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};

const badge = (ativo: boolean): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  padding: "4px 10px",
  borderRadius: 5,
  fontSize: 11,
  fontWeight: 600,
  cursor: "pointer",
  border: `1px solid ${ativo ? "#2a5a38" : "var(--border)"}`,
  background: ativo ? "#0d1e14" : "var(--s2)",
  color: ativo ? "#4caf70" : "var(--sub)",
  userSelect: "none",
  transition: "all 0.15s",
});

function StatusBadge({ ativo, label }: { ativo: boolean; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: ativo ? "#0d1e14" : "var(--s3)",
      border: `1px solid ${ativo ? "#2a5a38" : "var(--border)"}`,
      color: ativo ? "#4caf70" : "var(--muted)",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: ativo ? "#4caf70" : "var(--muted)" }} />
      {label}
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

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEtapas, setWebhookEtapas] = useState<string[]>([]);

  // WhatsApp Business API
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("perfis")
      .select("webhook_url, webhook_etapas, whatsapp_api_token, whatsapp_phone_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const d = data as Integracao;
          setWebhookUrl(d.webhook_url || "");
          setWebhookEtapas(d.webhook_etapas || []);
          setWaToken(d.whatsapp_api_token || "");
          setWaPhoneId(d.whatsapp_phone_id || "");
        }
        setLoading(false);
      });
  }, [user]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  function toggleEtapa(etapa: string) {
    setWebhookEtapas(prev =>
      prev.includes(etapa) ? prev.filter(e => e !== etapa) : [...prev, etapa]
    );
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
    else mostrarToast("Integrações salvas com sucesso");
  }

  async function testarWebhook() {
    if (!webhookUrl) return;
    setTestando(true);
    try {
      await fetch("/api/webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      mostrarToast("Webhook de teste enviado — verifique no destino");
    } catch {
      mostrarToast("Erro ao enviar teste", "erro");
    }
    setTestando(false);
  }

  const webhookAtivo = !!webhookUrl && webhookEtapas.length > 0;
  const waAtivo = !!waToken && !!waPhoneId;

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "28px 28px 60px", maxWidth: 720, margin: "0 auto", width: "100%" }}>

        {/* Cabeçalho */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Integrações
          </h1>
          <p style={{ fontSize: 13, color: "var(--sub)" }}>
            Conecte o Tom Tracking com seu CRM ou ferramentas externas
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Webhook personalizado */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <span style={{ ...sectionTitle, paddingBottom: 0, borderBottom: "none", marginBottom: 0 }}>
                Webhook · CRM externo
              </span>
              <StatusBadge ativo={webhookAtivo} label={webhookAtivo ? "Ativo" : "Inativo"} />
            </div>

            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
              Quando um lead mudar de etapa no Tom Tracking, uma notificação é enviada automaticamente para a URL abaixo.
              Compatible com HubSpot, Pipedrive, RD Station, Make, Zapier e qualquer CRM que aceite webhooks.
            </p>

            <div style={campo}>
              <label style={labelStyle}>URL do Webhook</label>
              <input
                style={inputStyle}
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://hooks.zapier.com/hooks/catch/..."
              />
            </div>

            <div style={campo}>
              <label style={labelStyle}>Disparar nas etapas</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {ETAPAS.map(e => (
                  <span
                    key={e.value}
                    style={badge(webhookEtapas.includes(e.value))}
                    onClick={() => toggleEtapa(e.value)}
                  >
                    {webhookEtapas.includes(e.value) && "✓ "}
                    {e.label}
                  </span>
                ))}
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Selecione em quais mudanças de etapa o webhook deve ser disparado
              </span>
            </div>

            {webhookUrl && (
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={testarWebhook}
                  disabled={testando}
                  style={{
                    background: "var(--s3)", border: "1px solid var(--border)",
                    borderRadius: 6, padding: "8px 14px", fontSize: 12,
                    color: "var(--sub)", cursor: testando ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {testando ? "Enviando..." : "Enviar teste"}
                </button>
                <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>
                  Envia um payload de exemplo para verificar a conexão
                </span>
              </div>
            )}

            <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px" }}>
              <p style={{ fontSize: 11, color: "var(--sub)", marginBottom: 8, fontWeight: 600 }}>Payload enviado:</p>
              <pre style={{ fontSize: 11, color: "var(--muted)", margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>{`{
  "evento": "etapa_alterada",
  "etapa_anterior": "novo",
  "etapa_nova": "em_conversa",
  "lead": {
    "id": "uuid-do-lead",
    "nome": "Nome do Lead",
    "contato": "5511999999999",
    "canal": "WhatsApp",
    "campanha": "nome-da-campanha"
  },
  "timestamp": "2024-01-01T00:00:00Z"
}`}</pre>
            </div>
          </div>

          {/* WhatsApp Business API */}
          <div style={card}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <span style={{ ...sectionTitle, paddingBottom: 0, borderBottom: "none", marginBottom: 0 }}>
                WhatsApp Business API
              </span>
              <StatusBadge ativo={waAtivo} label={waAtivo ? "Conectado" : "Não configurado"} />
            </div>

            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
              Com a API oficial do WhatsApp conectada, o Tom Tracking detecta automaticamente quando um lead responde
              e move a etapa para <strong style={{ color: "var(--text)" }}>Em conversa</strong> sem intervenção manual.
            </p>

            <div style={campo}>
              <label style={labelStyle}>Token de acesso permanente</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={inputStyle}
                  type={mostrarToken ? "text" : "password"}
                  value={waToken}
                  onChange={e => setWaToken(e.target.value)}
                  placeholder="EAAxxxxx..."
                />
                <button
                  onClick={() => setMostrarToken(!mostrarToken)}
                  style={{
                    background: "var(--s3)", border: "1px solid var(--border)",
                    borderRadius: 6, padding: "9px 12px", cursor: "pointer",
                    color: "var(--sub)", flexShrink: 0,
                  }}
                >
                  <i className={`ti ${mostrarToken ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15 }} />
                </button>
              </div>
            </div>

            <div style={campo}>
              <label style={labelStyle}>Phone Number ID</label>
              <input
                style={inputStyle}
                value={waPhoneId}
                onChange={e => setWaPhoneId(e.target.value)}
                placeholder="Ex: 123456789012345"
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Encontrado em Meta for Developers → seu app → WhatsApp → API Setup
              </span>
            </div>
          </div>

          {/* Tom Leads — em breve */}
          <div style={{ ...card, opacity: 0.6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 14, borderBottom: "1px solid var(--border)" }}>
              <span style={{ ...sectionTitle, paddingBottom: 0, borderBottom: "none", marginBottom: 0 }}>
                Tom Leads · CRM nativo
              </span>
              <span style={{
                background: "var(--s3)", border: "1px solid var(--border)",
                borderRadius: 4, padding: "3px 8px", fontSize: 11,
                color: "var(--sub)", fontWeight: 600,
              }}>
                Em breve
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
              Integração nativa com o Tom Leads CRM. Quando disponível, um clique conecta os dois sistemas —
              leads, etapas e conversões sincronizados em tempo real sem configuração manual.
            </p>
            <button disabled style={{
              background: "var(--s2)", border: "1px solid var(--border)",
              borderRadius: 6, padding: "9px 16px", fontSize: 13,
              color: "var(--muted)", cursor: "not-allowed", fontFamily: "inherit",
              width: "fit-content",
            }}>
              Conectar Tom Leads
            </button>
          </div>

          {/* Salvar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={salvar}
              disabled={salvando}
              style={{
                background: salvando ? "var(--s3)" : "#4a9eca",
                color: salvando ? "var(--sub)" : "#fff",
                border: "none", borderRadius: 7,
                padding: "10px 24px", fontSize: 13, fontWeight: 600,
                cursor: salvando ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {salvando ? "Salvando..." : "Salvar integrações"}
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
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

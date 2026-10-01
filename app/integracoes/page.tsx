"use client";
import { useEffect, useState, useRef } from "react";
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

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return m;
}

function StatusDot({ ativo, label }: { ativo: boolean; label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: ativo ? "#4caf70" : "var(--muted)" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: ativo ? "#4caf70" : "var(--muted)", display: "inline-block" }} />
      {label || (ativo ? "Ativo" : "Inativo")}
    </span>
  );
}

type Aba = "webhook" | "whatsapp" | "evolution" | "tomleads";

export default function IntegracoesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [testando, setTestando] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [aba, setAba] = useState<Aba>("webhook");

  // Webhook
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEtapas, setWebhookEtapas] = useState<string[]>([]);

  // WhatsApp Business API
  const [waToken, setWaToken] = useState("");
  const [waPhoneId, setWaPhoneId] = useState("");

  // Evolution API
  const [evolutionUrl, setEvolutionUrl] = useState("");
  const [evolutionKey, setEvolutionKey] = useState("");
  const [evolutionInstance, setEvolutionInstance] = useState("");
  const [evolutionStatus, setEvolutionStatus] = useState<"não_configurado" | "conectado" | "desconectado" | "conectando" | "erro" | "verificando">("não_configurado");
  const [qrcode, setQrcode] = useState<string | null>(null);
  const [carregandoQr, setCarregandoQr] = useState(false);
  const qrInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("perfis")
      .select("webhook_url, webhook_etapas, whatsapp_api_token, whatsapp_phone_id, evolution_url, evolution_api_key, evolution_instance")
      .eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setWebhookUrl(d.webhook_url || "");
          setWebhookEtapas(d.webhook_etapas || []);
          setWaToken(d.whatsapp_api_token || "");
          setWaPhoneId(d.whatsapp_phone_id || "");
          setEvolutionUrl(d.evolution_url || "");
          setEvolutionKey(d.evolution_api_key || "");
          setEvolutionInstance(d.evolution_instance || "");
          if (d.evolution_url && d.evolution_api_key && d.evolution_instance) {
            verificarStatus();
          }
        }
        setLoading(false);
      });
  }, [user]);

  // Limpa intervalo ao sair da aba
  useEffect(() => {
    if (aba !== "evolution") {
      if (qrInterval.current) clearInterval(qrInterval.current);
      setQrcode(null);
    }
  }, [aba]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  async function verificarStatus() {
    if (!user) return;
    setEvolutionStatus("verificando");
    const res = await fetch(`/api/evolution/status?tenant_id=${user.id}`);
    const data = await res.json();
    setEvolutionStatus(data.status || "erro");
  }

  async function buscarQrCode() {
    if (!user) return;
    setCarregandoQr(true);
    setQrcode(null);
    const res = await fetch(`/api/evolution/qrcode?tenant_id=${user.id}`);
    const data = await res.json();
    if (data.qrcode) {
      setQrcode(data.qrcode);
      // Atualiza QR a cada 30s (ele expira)
      if (qrInterval.current) clearInterval(qrInterval.current);
      qrInterval.current = setInterval(async () => {
        const r = await fetch(`/api/evolution/qrcode?tenant_id=${user.id}`);
        const d = await r.json();
        if (d.qrcode) setQrcode(d.qrcode);
        // Verifica se conectou
        const s = await fetch(`/api/evolution/status?tenant_id=${user.id}`);
        const sd = await s.json();
        if (sd.status === "conectado") {
          setEvolutionStatus("conectado");
          setQrcode(null);
          if (qrInterval.current) clearInterval(qrInterval.current);
          mostrarToast("WhatsApp conectado com sucesso!");
          // Configura webhook automaticamente
          await fetch("/api/evolution/qrcode", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tenant_id: user.id }) });
        }
      }, 30000);
    } else {
      mostrarToast("Erro ao gerar QR Code — verifique as configurações", "erro");
    }
    setCarregandoQr(false);
  }

  async function salvarEvolution() {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase.from("perfis").upsert({
      id: user.id,
      evolution_url: evolutionUrl.trim() || null,
      evolution_api_key: evolutionKey.trim() || null,
      evolution_instance: evolutionInstance.trim() || null,
    });
    setSalvando(false);
    if (error) { mostrarToast("Erro: " + error.message, "erro"); return; }
    mostrarToast("Configurações salvas");
    if (evolutionUrl && evolutionKey && evolutionInstance) verificarStatus();
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
    if (error) mostrarToast("Erro: " + error.message, "erro");
    else mostrarToast("Salvo com sucesso");
  }

  async function testarWebhook() {
    if (!webhookUrl) return;
    setTestando(true);
    try {
      await fetch("/api/webhook-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: webhookUrl }) });
      mostrarToast("Webhook de teste enviado");
    } catch { mostrarToast("Erro ao enviar", "erro"); }
    setTestando(false);
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none",
    width: "100%", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 };
  const campoStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" };

  const abas: { key: Aba; label: string; icon: string; ativo: boolean; breve?: boolean }[] = [
    { key: "webhook", label: "Webhook · CRM", icon: "ti-arrows-exchange", ativo: !!webhookUrl && webhookEtapas.length > 0 },
    { key: "whatsapp", label: "WhatsApp API", icon: "ti-brand-whatsapp", ativo: !!waToken && !!waPhoneId },
    { key: "evolution", label: "Evolution API", icon: "ti-robot", ativo: evolutionStatus === "conectado" },
    { key: "tomleads", label: "Tom Leads", icon: "ti-layout-kanban", ativo: false, breve: true },
  ];

  const statusEvolutionCor: Record<string, string> = {
    conectado: "#4caf70", desconectado: "#c46060", conectando: "#f4b400",
    verificando: "#4a9eca", erro: "#c46060", não_configurado: "var(--muted)",
  };
  const statusEvolutionLabel: Record<string, string> = {
    conectado: "Conectado", desconectado: "Desconectado", conectando: "Conectando...",
    verificando: "Verificando...", erro: "Erro de conexão", não_configurado: "Não configurado",
  };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header com abas */}
        <div style={{ padding: isMobile ? "14px 16px 0" : "18px 24px 0", borderBottom: "1px solid var(--border)", background: "var(--s1)" }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Integrações</h1>
          <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
            {abas.map(a => (
              <button key={a.key} onClick={() => !a.breve && setAba(a.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
                  fontSize: 12, fontFamily: "inherit", background: "transparent", border: "none",
                  cursor: a.breve ? "default" : "pointer", whiteSpace: "nowrap",
                  color: aba === a.key ? "var(--text)" : "var(--sub)",
                  borderBottom: aba === a.key ? "2px solid #4a9eca" : "2px solid transparent",
                  fontWeight: aba === a.key ? 600 : 400, opacity: a.breve ? 0.5 : 1,
                }}>
                <i className={`ti ${a.icon}`} style={{ fontSize: 14 }} />
                {a.label}
                {a.breve
                  ? <span style={{ fontSize: 10, background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 3, padding: "1px 5px", color: "var(--muted)" }}>Em breve</span>
                  : <StatusDot ativo={a.ativo} />
                }
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px" }}>

          {/* WEBHOOK */}
          {aba === "webhook" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Configuração</div>
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
                        <span key={e.value} onClick={() => setWebhookEtapas(prev => sel ? prev.filter(x => x !== e.value) : [...prev, e.value])}
                          style={{ padding: "5px 10px", borderRadius: 5, fontSize: 12, cursor: "pointer", userSelect: "none", border: `1px solid ${sel ? "#2a5a38" : "var(--border)"}`, background: sel ? "#0d1e14" : "var(--s2)", color: sel ? "#4caf70" : "var(--sub)" }}>
                          {sel && "✓ "}{e.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={testarWebhook} disabled={!webhookUrl || testando}
                    style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 14px", fontSize: 12, color: "var(--sub)", cursor: webhookUrl ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                    {testando ? "Enviando..." : "Enviar teste"}
                  </button>
                  <button onClick={salvar} disabled={salvando}
                    style={{ background: "#4a9eca", border: "none", borderRadius: 6, padding: "8px 18px", fontSize: 12, color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {salvando ? "Salvando..." : "Salvar"}
                  </button>
                </div>
                <div style={{ ...card, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", marginBottom: 8 }}>Compatível com:</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {["Zapier", "Make", "n8n", "HubSpot", "Pipedrive", "RD Station"].map(n => (
                      <span key={n} style={{ fontSize: 11, background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 4, padding: "3px 8px", color: "var(--sub)" }}>{n}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={secTitle}>Payload enviado</div>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>JSON enviado automaticamente quando um lead muda de etapa.</p>
                <pre style={{ fontSize: 12, color: "#4caf70", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 16px", margin: 0, fontFamily: "monospace", lineHeight: 1.7, flex: 1, overflow: "auto" }}>{`{
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

          {/* WHATSAPP BUSINESS API */}
          {aba === "whatsapp" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Credenciais</div>
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
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={secTitle}>Como funciona</div>
                {[
                  { icon: "ti-message", title: "Lead responde no WhatsApp", desc: "O Meta envia evento para o webhook do Tom Tracking" },
                  { icon: "ti-arrows-exchange", title: "Etapa atualizada automaticamente", desc: "Lead movido para Em conversa sem intervenção manual" },
                  { icon: "ti-brand-meta", title: "CAPI disparado", desc: "Evento Lead enviado ao Meta com dados do contato" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: "#4a9eca", flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 3 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: "var(--sub)" }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EVOLUTION API */}
          {aba === "evolution" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              {/* Esquerda — config */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={secTitle}>Configuração</div>
                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: statusEvolutionCor[evolutionStatus] }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: statusEvolutionCor[evolutionStatus], display: "inline-block" }} />
                      {statusEvolutionLabel[evolutionStatus]}
                    </span>
                  </div>
                  <div style={campoStyle}>
                    <label style={labelStyle}>URL da Evolution API</label>
                    <input style={inputStyle} value={evolutionUrl} onChange={e => setEvolutionUrl(e.target.value)} placeholder="https://evolution.suacloudfy.com" />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>URL da sua instância na Cloudfy</span>
                  </div>
                  <div style={campoStyle}>
                    <label style={labelStyle}>API Key</label>
                    <input style={inputStyle} type="password" value={evolutionKey} onChange={e => setEvolutionKey(e.target.value)} placeholder="sua-api-key-aqui" />
                  </div>
                  <div style={campoStyle}>
                    <label style={labelStyle}>Nome da instância</label>
                    <input style={inputStyle} value={evolutionInstance} onChange={e => setEvolutionInstance(e.target.value)} placeholder="tom-tracking-cliente" />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Nome único para identificar esta conexão</span>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={salvarEvolution} disabled={salvando}
                      style={{ background: "#4a9eca", border: "none", borderRadius: 6, padding: "9px 18px", fontSize: 12, color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      {salvando ? "Salvando..." : "Salvar"}
                    </button>
                    {evolutionUrl && evolutionKey && evolutionInstance && (
                      <button onClick={verificarStatus}
                        style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 14px", fontSize: 12, color: "var(--sub)", cursor: "pointer", fontFamily: "inherit" }}>
                        Verificar conexão
                      </button>
                    )}
                  </div>
                </div>

                {/* O que rastreia */}
                <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={secTitle}>O que rastreia automaticamente</div>
                  {[
                    { icon: "ti-ad", ok: true, title: "Click-to-WhatsApp Meta Ads", desc: "Campanha, conjunto e anúncio de origem capturados" },
                    { icon: "ti-brand-instagram", ok: true, title: "Instagram Feed e Direct", desc: "Anúncios com botão nativo de WhatsApp" },
                    { icon: "ti-message", ok: true, title: "WhatsApp orgânico", desc: "Qualquer mensagem recebida no número conectado" },
                    { icon: "ti-user-plus", ok: true, title: "Lead criado automaticamente", desc: "Nome e número capturados sem intervenção manual" },
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                      <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: "#4caf70", flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</div>
                        <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#4caf70", flexShrink: 0, alignSelf: "center" }}>✓ Auto</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direita — QR Code */}
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Conectar WhatsApp</div>

                {evolutionStatus === "conectado" ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "30px 0" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#0d1e14", border: "2px solid #2a5a38", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <i className="ti ti-check" style={{ fontSize: 28, color: "#4caf70" }} />
                    </div>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#4caf70", marginBottom: 6 }}>WhatsApp Conectado!</div>
                      <div style={{ fontSize: 12, color: "var(--sub)" }}>Leads de Click-to-WhatsApp serão capturados automaticamente</div>
                    </div>
                    <button onClick={verificarStatus}
                      style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 16px", fontSize: 12, color: "var(--sub)", cursor: "pointer", fontFamily: "inherit" }}>
                      Verificar status
                    </button>
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>
                      Após salvar as configurações da Evolution API, clique em <strong style={{ color: "var(--text)" }}>Gerar QR Code</strong> e escaneie com o WhatsApp do cliente para conectar.
                    </p>

                    {!evolutionUrl || !evolutionKey || !evolutionInstance ? (
                      <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 8, padding: "30px 20px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                        Preencha e salve as configurações ao lado primeiro
                      </div>
                    ) : qrcode ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <img src={qrcode} alt="QR Code WhatsApp" style={{ width: 220, height: 220, borderRadius: 8, border: "2px solid var(--border)" }} />
                        <div style={{ fontSize: 12, color: "var(--sub)", textAlign: "center" }}>
                          Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
                        </div>
                        <div style={{ fontSize: 11, color: "#f4b400" }}>QR Code expira em 30 segundos — atualizado automaticamente</div>
                        <button onClick={() => { setQrcode(null); if (qrInterval.current) clearInterval(qrInterval.current); }}
                          style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 14px", fontSize: 12, color: "var(--sub)", cursor: "pointer", fontFamily: "inherit" }}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
                        <div style={{ width: 120, height: 120, background: "var(--s2)", border: "2px dashed var(--border)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <i className="ti ti-qrcode" style={{ fontSize: 48, color: "var(--muted)" }} />
                        </div>
                        <button onClick={buscarQrCode} disabled={carregandoQr}
                          style={{ background: "#25d366", border: "none", borderRadius: 7, padding: "10px 24px", fontSize: 13, color: "#fff", fontWeight: 600, cursor: carregandoQr ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8 }}>
                          <i className="ti ti-brand-whatsapp" style={{ fontSize: 16 }} />
                          {carregandoQr ? "Gerando..." : "Gerar QR Code"}
                        </button>
                      </div>
                    )}
                  </>
                )}

                {/* Webhook URL para configurar na Evolution */}
                <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", marginTop: "auto" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", marginBottom: 6 }}>Webhook configurado automaticamente:</div>
                  <code style={{ fontSize: 11, color: "#4a9eca", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app"}/api/evolution/webhook
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* TOM LEADS */}
          {aba === "tomleads" && (
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
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.tipo === "ok" ? "#0d1e14" : "#1e0d0d", border: `1px solid ${toast.tipo === "ok" ? "#2a5a38" : "#5a2a2a"}`, color: toast.tipo === "ok" ? "#4caf70" : "#c46060", borderRadius: 8, padding: "10px 16px", fontSize: 13, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", zIndex: 9999 }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

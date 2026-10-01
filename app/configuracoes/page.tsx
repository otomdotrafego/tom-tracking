"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

function useIsMobile() {
  const [m, setM] = useState(false);
  useEffect(() => { const c = () => setM(window.innerWidth < 768); c(); window.addEventListener("resize", c); return () => window.removeEventListener("resize", c); }, []);
  return m;
}

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1800); }}
      style={{ background: ok ? "#0d1e14" : "var(--s3)", border: `1px solid ${ok ? "#2a5a38" : "var(--border)"}`, borderRadius: 5, padding: "6px 12px", fontSize: 11, color: ok ? "#4caf70" : "var(--sub)", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
      {ok ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

type Aba = "perfil" | "meta" | "whatsapp";

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [aba, setAba] = useState<Aba>("perfil");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState("trial");
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("perfis").select("*").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) {
          const d = data as any;
          setNome(d.nome || "");
          setEmail(d.email || user.email || "");
          setPlano(d.plano || "trial");
          setPixelId(d.meta_pixel_id || "");
          setAccessToken(d.meta_access_token || "");
          setVerifyToken(d.meta_verify_token || "tomtracking2024");
          setWhatsapp(d.whatsapp_numero || "");
        }
        setLoading(false);
      });
  }, [user]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  async function salvar() {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase.from("perfis").upsert({
      id: user.id,
      email: user.email,
      nome: nome.trim(),
      meta_pixel_id: pixelId.trim() || null,
      meta_access_token: accessToken.trim() || null,
      meta_verify_token: verifyToken.trim() || null,
      whatsapp_numero: whatsapp.trim() || null,
    });
    setSalvando(false);
    if (error) mostrarToast("Erro: " + error.message, "erro");
    else mostrarToast("Configurações salvas");
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const linkRastreavel = whatsapp ? `${origin}/r?wa=${whatsapp}&tid=${user?.id || ""}&utm_source=facebook&utm_medium=cpc&utm_campaign=` : "";

  const inputStyle: React.CSSProperties = {
    background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6,
    padding: "9px 12px", fontSize: 13, color: "var(--text)", outline: "none",
    width: "100%", fontFamily: "inherit",
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 };
  const campoStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" };

  const abas: { key: Aba; label: string; icon: string }[] = [
    { key: "perfil", label: "Perfil", icon: "ti-user" },
    { key: "meta", label: "Meta Ads · CAPI", icon: "ti-brand-meta" },
    { key: "whatsapp", label: "WhatsApp", icon: "ti-brand-whatsapp" },
  ];

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header com abas */}
        <div style={{ padding: isMobile ? "14px 16px 0" : "18px 24px 0", borderBottom: "1px solid var(--border)", background: "var(--s1)" }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>Configurações</h1>
          <div style={{ display: "flex", gap: 2 }}>
            {abas.map(a => (
              <button key={a.key} onClick={() => setAba(a.key)}
                style={{
                  display: "flex", alignItems: "center", gap: 7, padding: "8px 14px",
                  fontSize: 12, fontFamily: "inherit", background: "transparent", border: "none",
                  cursor: "pointer", whiteSpace: "nowrap",
                  color: aba === a.key ? "var(--text)" : "var(--sub)",
                  borderBottom: aba === a.key ? "2px solid #4a9eca" : "2px solid transparent",
                  fontWeight: aba === a.key ? 600 : 400,
                }}>
                <i className={`ti ${a.icon}`} style={{ fontSize: 14 }} />
                {a.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px" }}>

          {/* PERFIL */}
          {aba === "perfil" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Dados da conta</div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Nome</label>
                  <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome ou da empresa" />
                </div>
                <div style={campoStyle}>
                  <label style={labelStyle}>E-mail</label>
                  <input style={{ ...inputStyle, color: "var(--muted)", cursor: "not-allowed" }} value={email} readOnly />
                </div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Plano</label>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 5, padding: "6px 12px", fontSize: 12, color: "var(--sub)", width: "fit-content" }}>
                    <i className="ti ti-star" style={{ fontSize: 13, color: "#b8a832" }} />
                    {plano}
                  </div>
                </div>
                <button onClick={salvar} disabled={salvando}
                  style={{ background: salvando ? "var(--s3)" : "#4a9eca", color: salvando ? "var(--sub)" : "#fff", border: "none", borderRadius: 7, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: salvando ? "not-allowed" : "pointer", fontFamily: "inherit", width: "fit-content" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={secTitle}>Informações da conta</div>
                {[
                  { icon: "ti-user", label: "Usuário", value: nome || "—" },
                  { icon: "ti-mail", label: "E-mail", value: email || "—" },
                  { icon: "ti-star", label: "Plano", value: plano },
                  { icon: "ti-id-badge", label: "ID da conta", value: user?.id?.slice(0, 8) + "..." || "—" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)", alignItems: "center" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: "var(--sub)", flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500 }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* META ADS */}
          {aba === "meta" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Credenciais Meta Ads</div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Pixel ID</label>
                  <input style={inputStyle} value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="Ex: 1386783446463518" />
                </div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Access Token</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={inputStyle} type={mostrarToken ? "text" : "password"} value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="EAAxxxxxx..." />
                    <button onClick={() => setMostrarToken(!mostrarToken)}
                      style={{ background: "var(--s3)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px", cursor: "pointer", color: "var(--sub)", flexShrink: 0 }}>
                      <i className={`ti ${mostrarToken ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15 }} />
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Token de sistema do Meta Business Suite com permissão de Pixel</span>
                </div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Verify Token (Webhook)</label>
                  <input style={inputStyle} value={verifyToken} onChange={e => setVerifyToken(e.target.value)} placeholder="tomtracking2024" />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Token para validação do webhook no painel do Meta</span>
                </div>
                <button onClick={salvar} disabled={salvando}
                  style={{ background: salvando ? "var(--s3)" : "#4a9eca", color: salvando ? "var(--sub)" : "#fff", border: "none", borderRadius: 7, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: salvando ? "not-allowed" : "pointer", fontFamily: "inherit", width: "fit-content" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={secTitle}>Eventos CAPI configurados</div>
                {[
                  { evento: "Lead", etapa: "Em conversa", desc: "Lead confirmou contato", cor: "#4a9eca" },
                  { evento: "Schedule", etapa: "Agendado", desc: "Agendamento realizado", cor: "#f4b400" },
                  { evento: "Purchase", etapa: "Venda fechada", desc: "Conversão confirmada", cor: "#4caf70" },
                ].map(s => (
                  <div key={s.evento} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <div style={{ minWidth: 60, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: s.cor }}>{s.evento}</div>
                    </div>
                    <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Dispara em: {s.etapa}</div>
                      <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11, color: "var(--muted)", padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)", lineHeight: 1.6, marginTop: 4 }}>
                  Os eventos são enviados server-side via API de Conversões — mais precisos que o Pixel padrão e resistentes a bloqueadores.
                </div>
              </div>
            </div>
          )}

          {/* WHATSAPP */}
          {aba === "whatsapp" && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, maxWidth: 1100 }}>
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={secTitle}>Número do WhatsApp</div>
                <div style={campoStyle}>
                  <label style={labelStyle}>Número (com DDI)</label>
                  <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="5511999999999" maxLength={15} />
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Apenas números com DDI. Ex: 5511999887766</span>
                </div>
                {whatsapp && (
                  <div style={campoStyle}>
                    <label style={labelStyle}>Link rastreável gerado</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                      <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{linkRastreavel}</span>
                      <CopyBtn text={linkRastreavel} />
                    </div>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>Use este link nos seus anúncios do Google, Stories e site</span>
                  </div>
                )}
                <button onClick={salvar} disabled={salvando}
                  style={{ background: salvando ? "var(--s3)" : "#4a9eca", color: salvando ? "var(--sub)" : "#fff", border: "none", borderRadius: 7, padding: "10px 24px", fontSize: 13, fontWeight: 600, cursor: salvando ? "not-allowed" : "pointer", fontFamily: "inherit", width: "fit-content" }}>
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={secTitle}>Onde usar o link rastreável</div>
                {[
                  { icon: "ti-brand-google", cor: "#4285f4", ok: true, title: "Google Ads", desc: "Cole na URL final do anúncio com {gclid} para rastreamento completo" },
                  { icon: "ti-camera", cor: "#e1306c", ok: true, title: "Instagram Stories", desc: "Botão de ação nos Stories e Reels patrocinados" },
                  { icon: "ti-world", cor: "#4a9eca", ok: true, title: "Site / Landing page", desc: "Botão de WhatsApp com rastreamento de origem" },
                  { icon: "ti-link", cor: "#e1306c", ok: true, title: "Link na bio do Instagram", desc: "Rastreia cliques orgânicos do perfil" },
                  { icon: "ti-brand-meta", cor: "#888", ok: false, title: "Meta Feed (Click-to-WhatsApp)", desc: "Não suporta link — use Evolution API em Integrações" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: `1px solid ${s.ok ? "var(--border)" : "#5a2a2a"}` }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 15, color: s.cor, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: s.ok ? "#4caf70" : "#c46060", flexShrink: 0, alignSelf: "center" }}>{s.ok ? "✓ OK" : "⚠ API"}</span>
                  </div>
                ))}
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

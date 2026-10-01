"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

const PASSOS = [
  { id: 1, icon: "ti-rocket", titulo: "Bem-vindo ao Tom Tracking", sub: "Vamos configurar tudo em 3 passos rápidos" },
  { id: 2, icon: "ti-brand-meta", titulo: "Conecte o Meta Ads", sub: "Pixel ID e Access Token para rastrear conversões" },
  { id: 3, icon: "ti-brand-whatsapp", titulo: "Configure o WhatsApp", sub: "Número para gerar seu link rastreável" },
  { id: 4, icon: "ti-check", titulo: "Tudo pronto!", sub: "Seu painel está configurado e pronto para usar" },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [passo, setPasso] = useState(1);
  const [salvando, setSalvando] = useState(false);

  // Passo 2 — Meta
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [mostrarToken, setMostrarToken] = useState(false);

  // Passo 3 — WhatsApp
  const [whatsapp, setWhatsapp] = useState("");
  const [link, setLink] = useState("");

  useEffect(() => {
    if (whatsapp && user) {
      const origin = window.location.origin;
      setLink(`${origin}/r?wa=${whatsapp}&tid=${user.id}&utm_source=facebook&utm_medium=cpc&utm_campaign=`);
    } else {
      setLink("");
    }
  }, [whatsapp, user]);

  async function salvarMeta() {
    if (!user) return;
    setSalvando(true);
    await supabase.from("perfis").upsert({
      id: user.id,
      meta_pixel_id: pixelId.trim() || null,
      meta_access_token: accessToken.trim() || null,
    });
    setSalvando(false);
    setPasso(3);
  }

  async function salvarWhatsApp() {
    if (!user) return;
    setSalvando(true);
    await supabase.from("perfis").upsert({
      id: user.id,
      whatsapp_numero: whatsapp.trim() || null,
    });
    setSalvando(false);
    setPasso(4);
  }

  function pularPasso() {
    if (passo < 3) setPasso(passo + 1);
    else setPasso(4);
  }

  const inputStyle: React.CSSProperties = {
    background: "#1a1a2e", border: "1px solid #2a2a4a", borderRadius: 8,
    padding: "11px 14px", fontSize: 14, color: "#fff", outline: "none",
    width: "100%", fontFamily: "inherit",
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", letterSpacing: "-0.5px" }}>
            <span style={{ color: "#4a9eca" }}>Tom</span> Tracking
          </div>
        </div>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
          {[2, 3, 4].map(p => (
            <div key={p} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: passo >= p ? "#4a9eca" : "var(--s3)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "var(--s1)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "32px 28px",
        }}>

          {/* PASSO 1 — Boas-vindas */}
          {passo === 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--s2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-rocket" style={{ fontSize: 32, color: "#4a9eca" }} />
              </div>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Bem-vindo ao Tom Tracking!</h1>
                <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.6 }}>
                  Vamos configurar tudo em menos de 2 minutos para você começar a rastrear suas conversões.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
                {[
                  { icon: "ti-brand-meta", text: "Conectar Pixel do Meta para disparar eventos CAPI" },
                  { icon: "ti-brand-whatsapp", text: "Gerar link rastreável para seus anúncios" },
                  { icon: "ti-chart-bar", text: "Painel com métricas em tempo real" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--border)", textAlign: "left" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 18, color: "#4a9eca", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--sub)" }}>{s.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => setPasso(2)} style={{
                width: "100%", background: "#4a9eca", border: "none", borderRadius: 8,
                padding: "13px", fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: "inherit", marginTop: 8,
              }}>
                Começar configuração →
              </button>
              <button onClick={() => router.push("/")} style={{ background: "none", border: "none", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>
                Pular e configurar depois
              </button>
            </div>
          )}

          {/* PASSO 2 — Meta */}
          {passo === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--s2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-brand-meta" style={{ fontSize: 22, color: "#1877f2" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>Meta Ads · CAPI</h2>
                  <p style={{ fontSize: 12, color: "var(--sub)" }}>Passo 1 de 2 — opcional, pode configurar depois</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Pixel ID</label>
                  <input style={inputStyle} value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="Ex: 1386783446463518" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Access Token</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input style={inputStyle} type={mostrarToken ? "text" : "password"} value={accessToken} onChange={e => setAccessToken(e.target.value)} placeholder="EAAxxxxx..." />
                    <button onClick={() => setMostrarToken(!mostrarToken)} style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 8, padding: "11px 13px", cursor: "pointer", color: "var(--sub)", flexShrink: 0 }}>
                      <i className={`ti ${mostrarToken ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15 }} />
                    </button>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}>Encontrado em Meta Business Suite → Usuários do sistema → Gerar token</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <button onClick={salvarMeta} disabled={salvando} style={{
                  background: "#4a9eca", border: "none", borderRadius: 8, padding: "13px",
                  fontSize: 14, fontWeight: 700, color: "#fff", cursor: salvando ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}>
                  {salvando ? "Salvando..." : "Salvar e continuar →"}
                </button>
                <button onClick={pularPasso} style={{ background: "none", border: "none", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>
                  Pular este passo
                </button>
              </div>
            </div>
          )}

          {/* PASSO 3 — WhatsApp */}
          {passo === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--s2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <i className="ti ti-brand-whatsapp" style={{ fontSize: 22, color: "#25d366" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text)" }}>WhatsApp</h2>
                  <p style={{ fontSize: 12, color: "var(--sub)" }}>Passo 2 de 2 — gera seu link rastreável</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Número (com DDI)</label>
                <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="5516999999999" maxLength={15} />
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Só números. DDI + DDD + número. Ex: 5516999887766</span>
              </div>

              {link && (
                <div style={{ background: "#0d1e14", border: "1px solid #2a5a38", borderRadius: 8, padding: "14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#4caf70", marginBottom: 8 }}>✓ Link rastreável gerado:</div>
                  <div style={{ fontSize: 11, color: "#4caf70", fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.5 }}>{link}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>Cole este link no botão dos seus anúncios</div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
                <button onClick={salvarWhatsApp} disabled={salvando} style={{
                  background: "#25d366", border: "none", borderRadius: 8, padding: "13px",
                  fontSize: 14, fontWeight: 700, color: "#fff", cursor: salvando ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}>
                  {salvando ? "Salvando..." : "Salvar e finalizar →"}
                </button>
                <button onClick={pularPasso} style={{ background: "none", border: "none", fontSize: 13, color: "var(--muted)", cursor: "pointer", fontFamily: "inherit" }}>
                  Pular este passo
                </button>
              </div>
            </div>
          )}

          {/* PASSO 4 — Concluído */}
          {passo === 4 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#0d1e14", border: "2px solid #2a5a38", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="ti ti-check" style={{ fontSize: 32, color: "#4caf70" }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "#4caf70", marginBottom: 8 }}>Tudo configurado!</h2>
                <p style={{ fontSize: 14, color: "var(--sub)", lineHeight: 1.6 }}>
                  Seu Tom Tracking está pronto. Acesse o painel para acompanhar seus leads e conversões em tempo real.
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", marginTop: 8 }}>
                {[
                  { icon: "ti-ad", text: "Cole o link rastreável nos seus anúncios" },
                  { icon: "ti-users", text: "Leads chegam automaticamente no painel" },
                  { icon: "ti-arrows-exchange", text: "Mova as etapas para disparar eventos no Meta" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "var(--s2)", borderRadius: 8, border: "1px solid var(--border)", textAlign: "left" }}>
                    <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: "#4caf70", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--sub)" }}>{s.text}</span>
                  </div>
                ))}
              </div>
              <button onClick={() => router.push("/")} style={{
                width: "100%", background: "#4a9eca", border: "none", borderRadius: 8,
                padding: "13px", fontSize: 14, fontWeight: 700, color: "#fff",
                cursor: "pointer", fontFamily: "inherit", marginTop: 8,
              }}>
                Ir para o painel →
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", marginTop: 20 }}>
          Você pode alterar qualquer configuração depois em <strong>Configurações</strong>
        </p>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; etapa: string; utm_campaign: string | null; };

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

export default function InstagramPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, etapa, utm_campaign").eq("tenant_id", user.id).eq("utm_source", "instagram"),
      supabase.from("perfis").select("whatsapp_numero").eq("id", user.id).single(),
    ]).then(([l, p]) => {
      if (l.data) setLeads(l.data);
      if (p.data) setNumero((p.data as any).whatsapp_numero || "");
      setLoading(false);
    });
  }, [user]);

  const total = leads.length;
  const vendas = leads.filter(l => l.etapa === "venda_fechada").length;
  const taxa = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const linkStory = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=instagram&utm_medium=story&utm_campaign=` : "";
  const linkBio = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=instagram&utm_medium=bio&utm_campaign=organico` : "";

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-brand-instagram" style={{ fontSize: 20, color: "#e1306c" }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Instagram</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Leads com utm_source=instagram</p>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(3,1fr)", gap: 12 }}>
            {[
              { label: "Total de leads", value: total, cor: "var(--text)" },
              { label: "Vendas fechadas", value: vendas, cor: "#4caf70" },
              { label: "Taxa de conversão", value: `${taxa}%`, cor: "#4a9eca" },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Links */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={secTitle}>Links rastreáveis</div>

              {numero ? (<>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Stories / Reels</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{linkStory}</span>
                    <CopyBtn text={linkStory} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Use no botão de ação dos Stories e Reels patrocinados</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Link na bio</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{linkBio}</span>
                    <CopyBtn text={linkBio} />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>Cole na bio do perfil para rastrear tráfego orgânico</div>
                </div>

                <div style={{ background: "#1e0d0d", border: "1px solid #5a2a2a", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#c46060", marginBottom: 6 }}>⚠ Limitação no Instagram Feed e Direct</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                    Anúncios com botão nativo de WhatsApp no Feed e Direct não permitem link customizado. Para rastrear esses leads, ative a <strong style={{ color: "var(--text)" }}>WhatsApp Business API</strong> em Integrações — ela captura o anúncio de origem automaticamente.
                  </p>
                </div>
              </>) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Configure seu número em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong>.</div>
              )}
            </div>

            {/* O que funciona */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={secTitle}>O que rastreia no Instagram</div>
              {[
                { icon: "ti-camera", cor: "#e1306c", ok: true, title: "Stories patrocinados", desc: "Link rastreável no botão de ação — funciona perfeitamente" },
                { icon: "ti-video", cor: "#e1306c", ok: true, title: "Reels patrocinados", desc: "Link rastreável no botão de ação" },
                { icon: "ti-link", cor: "#e1306c", ok: true, title: "Link na bio", desc: "Rastreia cliques orgânicos do perfil" },
                { icon: "ti-photo", cor: "#888", ok: false, title: "Feed com botão WhatsApp", desc: "Não suporta link customizado — usar WhatsApp API" },
                { icon: "ti-message", cor: "#888", ok: false, title: "Direct com botão WhatsApp", desc: "Não suporta link customizado — usar WhatsApp API" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: `1px solid ${s.ok ? "var(--border)" : "#5a2a2a"}` }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.cor, flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: s.ok ? "#4caf70" : "#c46060", flexShrink: 0, alignSelf: "center" }}>{s.ok ? "✓ OK" : "⚠ API"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

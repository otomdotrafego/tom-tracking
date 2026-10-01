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

export default function WhatsAppPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, etapa, utm_campaign").eq("tenant_id", user.id).eq("canal", "WhatsApp"),
      supabase.from("perfis").select("whatsapp_numero").eq("id", user.id).single(),
    ]).then(([l, p]) => {
      if (l.data) setLeads(l.data);
      if (p.data) setNumero((p.data as any).whatsapp_numero || "");
      setLoading(false);
    });
  }, [user]);

  const total = leads.length;
  const vendas = leads.filter(l => l.etapa === "venda_fechada").length;
  const emConversa = leads.filter(l => l.etapa === "em_conversa").length;
  const taxa = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const link = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=facebook&utm_medium=cpc&utm_campaign=` : "";

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-brand-whatsapp" style={{ fontSize: 20, color: "#25d366" }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>WhatsApp</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Leads captados via link rastreável</p>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total de leads", value: total, cor: "var(--text)" },
              { label: "Em conversa", value: emConversa, cor: "#f4b400" },
              { label: "Vendas fechadas", value: vendas, cor: "#4caf70" },
              { label: "Taxa de conversão", value: `${taxa}%`, cor: "#4a9eca" },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Conteúdo 2 colunas */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Link rastreável */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={secTitle}>Link rastreável</div>
              {link ? (<>
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                  <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link}</span>
                  <CopyBtn text={link} />
                </div>
                <div style={{ background: "#1a1a0a", border: "1px solid #3a3a10", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#b8a832", marginBottom: 6 }}>⚡ Onde usar este link</div>
                  {[["Google Ads", "URL final do anúncio — funciona perfeitamente"], ["Meta Stories", "Swipe up ou botão de ação"], ["Site / Landing page", "Botão de WhatsApp com rastreamento"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: "#b8a832", minWidth: 130, fontWeight: 600 }}>{k}</span>
                      <span style={{ color: "var(--muted)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#1e0d0d", border: "1px solid #5a2a2a", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#c46060", marginBottom: 6 }}>⚠ Limitação no Meta Ads</div>
                  <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                    Campanhas Click-to-WhatsApp no Meta não permitem link customizado — o botão é nativo. Para rastrear esses leads, ative a <strong style={{ color: "var(--text)" }}>WhatsApp Business API</strong> em Integrações.
                  </p>
                </div>
              </>) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Configure seu número em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong>.</div>
              )}
            </div>

            {/* Como funciona */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={secTitle}>Como funciona</div>
              {[
                { icon: "ti-ad", cor: "#25d366", title: "Link no anúncio", desc: "Google Ads, Stories do Meta ou site — cole o link rastreável" },
                { icon: "ti-click", cor: "#25d366", title: "Lead clica", desc: "Redirecionado para o WhatsApp automaticamente" },
                { icon: "ti-database", cor: "#25d366", title: "Lead registrado", desc: "Canal, campanha e UTMs salvos no Tom Tracking" },
                { icon: "ti-brand-meta", cor: "#25d366", title: "CAPI disparado", desc: "Evento Lead enviado ao Meta ao mover para Em conversa" },
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: s.cor, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

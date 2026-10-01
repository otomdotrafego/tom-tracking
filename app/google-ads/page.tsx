"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; etapa: string; gclid: string | null; utm_campaign: string | null; };

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

export default function GoogleAdsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [numero, setNumero] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, etapa, gclid, utm_campaign").eq("tenant_id", user.id).eq("utm_source", "google"),
      supabase.from("perfis").select("whatsapp_numero").eq("id", user.id).single(),
    ]).then(([l, p]) => {
      if (l.data) setLeads(l.data);
      if (p.data) setNumero((p.data as any).whatsapp_numero || "");
      setLoading(false);
    });
  }, [user]);

  const total = leads.length;
  const comGclid = leads.filter(l => l.gclid).length;
  const vendas = leads.filter(l => l.etapa === "venda_fechada").length;
  const taxa = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const link = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&gclid={gclid}` : "";

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-brand-google" style={{ fontSize: 20, color: "#4285f4" }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Google Ads</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Leads com utm_source=google</p>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Total de leads", value: total, cor: "var(--text)" },
              { label: "Com GCLID", value: comGclid, cor: "#4285f4" },
              { label: "Vendas fechadas", value: vendas, cor: "#4caf70" },
              { label: "Taxa de conversão", value: `${taxa}%`, cor: "#f4b400" },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={secTitle}>Link para Google Ads</div>
              {link ? (<>
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                  <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link}</span>
                  <CopyBtn text={link} />
                </div>
                <div style={{ background: "#0d1a2e", border: "1px solid #1a3a5c", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#4a9eca", marginBottom: 6 }}>⚡ ValueTrack automático</div>
                  <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6, margin: 0 }}>
                    Os parâmetros <code style={{ color: "#4a9eca" }}>{`{gclid}`}</code> e <code style={{ color: "#4a9eca" }}>{`{campaignname}`}</code> são preenchidos automaticamente pelo Google. Cole no campo <strong style={{ color: "var(--text)" }}>URL final</strong> do anúncio.
                  </p>
                </div>
                <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", marginBottom: 8 }}>Onde colar no Google Ads:</div>
                  {[["URL final do anúncio", "Campo individual de cada anúncio"], ["Modelo de rastreamento", "Configurações da campanha"], ["Sufixo de URL final", "Nível de conta — aplica em todos"]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", gap: 8, fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: "#4285f4", minWidth: 170, fontWeight: 600 }}>{k}</span>
                      <span style={{ color: "var(--muted)" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </>) : (
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Configure em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong>.</div>
              )}
            </div>

            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={secTitle}>O que é rastreado</div>
              {[
                { icon: "ti-click", cor: "#4285f4", title: "GCLID capturado", desc: "ID de clique do Google para atribuição precisa de conversões" },
                { icon: "ti-tag", cor: "#4285f4", title: "Campanha identificada", desc: "Nome da campanha preenchido via ValueTrack {campaignname}" },
                { icon: "ti-chart-line", cor: "#4285f4", title: "Conversões offline", desc: "Futuramente: importar vendas fechadas de volta para o Google Ads" },
                { icon: "ti-device-mobile", cor: "#4285f4", title: "Todos os dispositivos", desc: "Funciona em mobile, desktop e tablet" },
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

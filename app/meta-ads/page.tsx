"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; etapa: string; fbclid: string | null; evento_meta: string[] | null; };
type Perfil = { meta_pixel_id: string | null; meta_access_token: string | null; whatsapp_numero: string | null; };

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

export default function MetaAdsPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, etapa, fbclid, evento_meta").eq("tenant_id", user.id).eq("utm_source", "facebook"),
      supabase.from("perfis").select("meta_pixel_id, meta_access_token, whatsapp_numero").eq("id", user.id).single(),
    ]).then(([l, p]) => {
      if (l.data) setLeads(l.data);
      if (p.data) setPerfil(p.data as Perfil);
      setLoading(false);
    });
  }, [user]);

  const total = leads.length;
  const comFbclid = leads.filter(l => l.fbclid).length;
  const vendas = leads.filter(l => l.etapa === "venda_fechada").length;
  const taxa = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const totalEventos = leads.reduce((acc, l) => acc + (l.evento_meta?.length || 0), 0);
  const pixelAtivo = !!perfil?.meta_pixel_id && !!perfil?.meta_access_token;
  const numero = perfil?.whatsapp_numero || "";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const link = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=facebook&utm_medium=cpc&utm_campaign=` : "";

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };
  const secTitle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)", display: "flex", alignItems: "center", gap: 10 }}>
          <i className="ti ti-brand-meta" style={{ fontSize: 20, color: "#1877f2" }} />
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>Meta Ads</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Facebook, Instagram e Audience Network</p>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
            {[
              { label: "Leads Meta", value: total, cor: "var(--text)" },
              { label: "Com FBCLID", value: comFbclid, cor: "#1877f2" },
              { label: "Vendas fechadas", value: vendas, cor: "#4caf70" },
              { label: "Eventos CAPI", value: totalEventos, cor: "#f4b400" },
            ].map(s => (
              <div key={s.label} style={card}>
                <div style={{ fontSize: 11, color: "var(--sub)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: s.cor }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            {/* Esquerda */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Status Pixel */}
              <div style={{ ...card, border: `1px solid ${pixelAtivo ? "#2a5a38" : "var(--border)"}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={secTitle}>Pixel · CAPI</div>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: pixelAtivo ? "#4caf70" : "var(--muted)" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pixelAtivo ? "#4caf70" : "var(--muted)", display: "inline-block" }} />
                    {pixelAtivo ? "Configurado" : "Não configurado"}
                  </span>
                </div>
                {pixelAtivo ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--sub)" }}>Pixel ID: <code style={{ color: "var(--text)", fontFamily: "monospace" }}>{perfil?.meta_pixel_id}</code></div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Eventos disparados ao mover etapas do lead</div>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Configure em <strong style={{ color: "var(--text)" }}>Configurações → Meta Ads</strong>.</div>
                )}
              </div>

              {/* Link */}
              <div style={{ ...card, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={secTitle}>Link rastreável</div>
                {link ? (<>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                    <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link}</span>
                    <CopyBtn text={link} />
                  </div>
                  <div style={{ background: "#1e0d0d", border: "1px solid #5a2a2a", borderRadius: 6, padding: "12px 14px" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#c46060", marginBottom: 6 }}>⚠ Click-to-WhatsApp</div>
                    <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>
                      Anúncios com botão nativo de WhatsApp no Meta não permitem link customizado. Ative a <strong style={{ color: "var(--text)" }}>WhatsApp Business API</strong> em Integrações para rastrear esses leads automaticamente via webhook.
                    </p>
                  </div>
                </>) : (
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Configure em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong>.</div>
                )}
              </div>
            </div>

            {/* Direita — Eventos CAPI */}
            <div style={{ ...card, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={secTitle}>Eventos CAPI disparados</div>
              {[
                { evento: "Lead", etapa: "Em conversa", desc: "Lead confirmou contato", cor: "#4a9eca" },
                { evento: "Schedule", etapa: "Agendado", desc: "Agendamento confirmado", cor: "#f4b400" },
                { evento: "Purchase", etapa: "Venda fechada", desc: "Conversão confirmada", cor: "#4caf70" },
              ].map(s => {
                const count = leads.filter(l => l.evento_meta?.includes(s.evento)).length;
                return (
                  <div key={s.evento} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                    <div style={{ minWidth: 52, textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: s.cor }}>{count}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{s.evento}</div>
                    </div>
                    <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Etapa: {s.etapa}</div>
                      <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, padding: "10px 12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)", lineHeight: 1.6 }}>
                Eventos enviados via API de Conversões (CAPI) server-side — mais precisos que o Pixel padrão e resistentes a bloqueadores de anúncio.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

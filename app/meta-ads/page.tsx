"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; etapa: string; utm_campaign: string | null; fbclid: string | null; evento_meta: string[] | null; };
type Perfil = { meta_pixel_id: string | null; meta_access_token: string | null; whatsapp_numero: string | null; };

function Stat({ label, value, cor }: { label: string; value: string | number; cor?: string }) {
  return (
    <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: cor || "var(--text)" }}>{value}</div>
    </div>
  );
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("leads").select("id, etapa, utm_campaign, fbclid, evento_meta").eq("tenant_id", user.id).eq("utm_source", "facebook"),
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

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "28px 28px 60px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <i className="ti ti-brand-meta" style={{ fontSize: 22, color: "#1877f2" }} />
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Meta Ads</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Facebook, Instagram e Audience Network</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          <Stat label="Total de leads" value={total} />
          <Stat label="Com FBCLID" value={comFbclid} cor="#1877f2" />
          <Stat label="Vendas fechadas" value={vendas} cor="#4caf70" />
          <Stat label="Eventos CAPI" value={totalEventos} cor="#f4b400" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Status CAPI + Link */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Status do Pixel */}
            <div style={{ background: "var(--s1)", border: `1px solid ${pixelAtivo ? "#2a5a38" : "var(--border)"}`, borderRadius: 8, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Pixel · CAPI</div>
                <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: pixelAtivo ? "#4caf70" : "var(--muted)" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: pixelAtivo ? "#4caf70" : "var(--muted)", display: "inline-block" }} />
                  {pixelAtivo ? "Configurado" : "Não configurado"}
                </span>
              </div>
              {pixelAtivo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "var(--sub)" }}>Pixel ID: <code style={{ color: "var(--text)", fontFamily: "monospace" }}>{perfil?.meta_pixel_id}</code></div>
                  <div style={{ fontSize: 12, color: "var(--sub)" }}>Token: <code style={{ color: "#4caf70", fontFamily: "monospace" }}>●●●●●●●●</code></div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Eventos disparados automaticamente ao mover etapas</div>
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Configure em <strong style={{ color: "var(--text)" }}>Configurações → Meta Ads</strong> para ativar o CAPI.</div>
              )}
            </div>

            {/* Link */}
            <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Link rastreável</div>
              {link ? (<>
                <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                  <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link}</span>
                  <CopyBtn text={link} />
                </div>
                <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>Cole no campo "URL do site" do seu anúncio. O FBCLID é capturado automaticamente pelo Meta.</p>
              </>) : (
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Configure o número em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong>.</div>
              )}
            </div>
          </div>

          {/* Eventos CAPI */}
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Eventos CAPI disparados</div>
            {[
              { evento: "Lead", etapa: "Em conversa", desc: "Lead confirmou contato" },
              { evento: "Schedule", etapa: "Agendado", desc: "Lead agendou atendimento" },
              { evento: "Purchase", etapa: "Venda fechada", desc: "Conversão confirmada" },
            ].map(s => {
              const count = leads.filter(l => l.evento_meta?.includes(s.evento)).length;
              return (
                <div key={s.evento} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                  <div style={{ minWidth: 70, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "#1877f2" }}>{count}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{s.evento}</div>
                  </div>
                  <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 12 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>Etapa: {s.etapa}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                  </div>
                </div>
              );
            })}
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4, padding: "10px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
              Os eventos são enviados via API de Conversões (CAPI) server-side, com maior precisão que o Pixel padrão.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

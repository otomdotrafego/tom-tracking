"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Lead = { id: string; etapa: string; utm_campaign: string | null; };

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

export default function WhatsAppPage() {
  const { user } = useAuth();
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
  const taxa = total > 0 ? ((vendas / total) * 100).toFixed(1) : "0";
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app";
  const link = numero ? `${origin}/r?wa=${numero}&tid=${user?.id || ""}&utm_source=facebook&utm_medium=cpc&utm_campaign=` : "";

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "28px 28px 60px", maxWidth: 960, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <i className="ti ti-brand-whatsapp" style={{ fontSize: 22, color: "#25d366" }} />
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>WhatsApp</h1>
            <p style={{ fontSize: 12, color: "var(--sub)" }}>Leads captados via link rastreável</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
          <Stat label="Total de leads" value={total} />
          <Stat label="Vendas fechadas" value={vendas} cor="#4caf70" />
          <Stat label="Taxa de conversão" value={`${taxa}%`} cor="#4a9eca" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Link rastreável */}
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Link rastreável</div>
            {link ? (<>
              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "9px 12px" }}>
                <span style={{ fontSize: 11, color: "var(--sub)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{link}</span>
                <CopyBtn text={link} />
              </div>
              <p style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>Use este link nos seus anúncios. Ele captura UTMs, redireciona para o WhatsApp e registra o lead automaticamente.</p>
              <div style={{ background: "var(--s2)", border: "1px solid var(--border)", borderRadius: 6, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--sub)", marginBottom: 4 }}>Parâmetros UTM sugeridos:</div>
                {[["utm_source", "facebook / google / instagram"], ["utm_medium", "cpc / organic / story"], ["utm_campaign", "nome-da-campanha"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 8, fontSize: 12 }}>
                    <code style={{ color: "#4a9eca", fontFamily: "monospace", minWidth: 130 }}>{k}</code>
                    <span style={{ color: "var(--muted)" }}>{v}</span>
                  </div>
                ))}
              </div>
            </>) : (
              <div style={{ fontSize: 13, color: "var(--muted)", padding: "8px 0" }}>Configure seu número em <strong style={{ color: "var(--text)" }}>Configurações → WhatsApp</strong> para gerar o link.</div>
            )}
          </div>

          {/* Como funciona */}
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: "18px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.07em" }}>Como funciona</div>
            {[
              { icon: "ti-ad", title: "Anúncio com link rastreável", desc: "Cole o link nos seus anúncios no Meta ou Google" },
              { icon: "ti-click", title: "Lead clica no anúncio", desc: "Redirecionado automaticamente para o WhatsApp" },
              { icon: "ti-database", title: "Lead registrado", desc: "Canal, campanha e UTMs salvos no Tom Tracking" },
              { icon: "ti-brand-meta", title: "CAPI disparado", desc: "Evento Lead enviado ao Meta quando mover a etapa" },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px", background: "var(--s2)", borderRadius: 6, border: "1px solid var(--border)" }}>
                <i className={`ti ${s.icon}`} style={{ fontSize: 16, color: "#25d366", flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 11, color: "var(--sub)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

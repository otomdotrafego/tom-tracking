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

const PLANOS = [
  {
    id: "trial",
    nome: "Trial",
    preco: "Grátis",
    periodo: "7 dias",
    cor: "#888",
    descricao: "Para testar a plataforma",
    recursos: [
      { ok: true, texto: "Até 50 leads" },
      { ok: true, texto: "1 número de WhatsApp" },
      { ok: true, texto: "Link rastreável" },
      { ok: true, texto: "Dashboard e relatórios" },
      { ok: false, texto: "Meta CAPI" },
      { ok: false, texto: "Evolution API (Click-to-WhatsApp)" },
      { ok: false, texto: "Integrações CRM" },
      { ok: false, texto: "Suporte prioritário" },
    ],
  },
  {
    id: "rastreamento",
    nome: "Rastreamento",
    preco: "R$ 97",
    periodo: "/mês",
    cor: "#4a9eca",
    destaque: false,
    descricao: "Para gestores de tráfego",
    recursos: [
      { ok: true, texto: "Leads ilimitados" },
      { ok: true, texto: "1 número de WhatsApp" },
      { ok: true, texto: "Link rastreável" },
      { ok: true, texto: "Dashboard e relatórios" },
      { ok: true, texto: "Meta CAPI (Lead, Schedule, Purchase)" },
      { ok: false, texto: "Evolution API (Click-to-WhatsApp)" },
      { ok: false, texto: "Integrações CRM" },
      { ok: false, texto: "Suporte prioritário" },
    ],
  },
  {
    id: "completo",
    nome: "Completo",
    preco: "R$ 197",
    periodo: "/mês",
    cor: "#4caf70",
    destaque: true,
    descricao: "Rastreamento + CRM Tom Leads",
    recursos: [
      { ok: true, texto: "Leads ilimitados" },
      { ok: true, texto: "Múltiplos números de WhatsApp" },
      { ok: true, texto: "Link rastreável" },
      { ok: true, texto: "Dashboard e relatórios" },
      { ok: true, texto: "Meta CAPI (Lead, Schedule, Purchase)" },
      { ok: true, texto: "Evolution API (Click-to-WhatsApp)" },
      { ok: true, texto: "Integrações CRM + Tom Leads nativo" },
      { ok: true, texto: "Suporte prioritário" },
    ],
  },
];

export default function PlanosPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [planoAtual, setPlanoAtual] = useState("trial");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("perfis").select("plano").eq("id", user.id).single()
      .then(({ data }) => {
        if (data) setPlanoAtual((data as any).plano || "trial");
        setLoading(false);
      });
  }, [user]);

  const card: React.CSSProperties = { background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, padding: isMobile ? "14px 16px" : "18px 22px" };

  if (loading) return <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}><Sidebar /><div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "var(--muted)", fontSize: 13 }}>Carregando...</span></div></div>;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: isMobile ? "14px 16px" : "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--s1)" }}>
          <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>Planos</h1>
          <p style={{ fontSize: 12, color: "var(--sub)" }}>
            Plano atual: <strong style={{ color: "var(--text)" }}>{PLANOS.find(p => p.id === planoAtual)?.nome || planoAtual}</strong>
          </p>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 16px" : "24px" }}>

          {/* Cards de planos */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, maxWidth: 1000, marginBottom: 32 }}>
            {PLANOS.map(plano => {
              const ativo = planoAtual === plano.id;
              return (
                <div key={plano.id} style={{
                  background: "var(--s1)",
                  border: `2px solid ${ativo ? plano.cor : plano.destaque ? plano.cor + "44" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "24px 20px",
                  display: "flex", flexDirection: "column", gap: 16,
                  position: "relative",
                  boxShadow: plano.destaque ? `0 0 24px ${plano.cor}22` : "none",
                }}>
                  {plano.destaque && (
                    <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: plano.cor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
                      ⭐ Mais popular
                    </div>
                  )}
                  {ativo && (
                    <div style={{ position: "absolute", top: -12, right: 16, background: plano.cor, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                      Plano atual
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: plano.cor, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{plano.nome}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)" }}>{plano.descricao}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 800, color: "var(--text)" }}>{plano.preco}</span>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{plano.periodo}</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    {plano.recursos.map((r, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: r.ok ? "var(--text)" : "var(--muted)" }}>
                        <i className={`ti ${r.ok ? "ti-check" : "ti-x"}`} style={{ fontSize: 13, color: r.ok ? plano.cor : "var(--muted)", flexShrink: 0 }} />
                        {r.texto}
                      </div>
                    ))}
                  </div>

                  <button
                    disabled={ativo}
                    onClick={() => window.open("https://wa.me/5516997009020?text=Quero+fazer+upgrade+para+o+plano+" + plano.nome, "_blank")}
                    style={{
                      background: ativo ? "var(--s3)" : plano.cor,
                      border: "none", borderRadius: 7, padding: "11px",
                      fontSize: 13, fontWeight: 700,
                      color: ativo ? "var(--muted)" : "#fff",
                      cursor: ativo ? "not-allowed" : "pointer",
                      fontFamily: "inherit", marginTop: "auto",
                    }}>
                    {ativo ? "Plano atual" : `Assinar ${plano.nome}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: 1000 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Dúvidas frequentes</div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              {[
                { p: "Posso cancelar a qualquer momento?", r: "Sim, sem multa ou fidelidade. O plano fica ativo até o fim do período pago." },
                { p: "O que é o plano Trial?", r: "7 dias grátis para testar a plataforma com até 50 leads. Nenhum cartão necessário." },
                { p: "O que é a Evolution API?", r: "Integração com WhatsApp via QR code para rastrear leads de campanhas Click-to-WhatsApp do Meta automaticamente." },
                { p: "Posso usar meu próprio Pixel do Meta?", r: "Sim! Cada cliente usa seu próprio Pixel ID e Access Token. Seus dados ficam isolados." },
              ].map((faq, i) => (
                <div key={i} style={{ ...card, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{faq.p}</div>
                  <div style={{ fontSize: 12, color: "var(--sub)", lineHeight: 1.6 }}>{faq.r}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

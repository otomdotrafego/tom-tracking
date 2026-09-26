"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getBadgeEtapa, getBadgeCanal } from "@/lib/cores";
import { useAuth } from "@/components/AuthProvider";

type Lead = {
  id: string;
  created_at: string;
  nome: string;
  contato: string | null;
  canal: string;
  campanha: string | null;
  conjunto: string | null;
  anuncio: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  fbclid: string | null;
  gclid: string | null;
  etapa: string;
  dispositivo: string | null;
  cidade: string | null;
  evento_meta: string[] | null;
  evento_google: string[] | null;
  fbclid_capturado_em: string | null;
};

const canalIcon: Record<string, string> = {
  WhatsApp: "ti-brand-whatsapp",
  Instagram: "ti-brand-instagram",
  Google: "ti-brand-google",
  "Meta Ads": "ti-brand-meta",
};

const etapaParaEvento: Record<string, string | null> = {
  novo: "Lead",
  em_conversa: "Lead",
  qualificado: null,
  agendado: "Schedule",
  negociando: null,
  venda_fechada: "Purchase",
  nao_qualificado: null,
};

const etapas = [
  { value: "novo", label: "Novo" },
  { value: "em_conversa", label: "Em conversa" },
  { value: "qualificado", label: "Qualificado" },
  { value: "agendado", label: "Agendado" },
  { value: "negociando", label: "Negociando" },
  { value: "venda_fechada", label: "Venda fechada" },
  { value: "nao_qualificado", label: "Não qualificado" },
];

function tempoRelativo(data: string) {
  const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function formatarTelefone(contato: string | null) {
  if (!contato) return "—";
  const num = contato.replace(/\D/g, "");
  if (num.length === 13)
    return `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`;
  return contato;
}

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 7,
  padding: 14,
};

const POR_PAGINA = 20;

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [pagina, setPagina] = useState(1);
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);
  const router = useRouter();
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const buscarLeads = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .eq("tenant_id", user.id)
      .order("created_at", { ascending: false })
      .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

    if (busca.trim())
      query = query.or(`nome.ilike.%${busca}%,contato.ilike.%${busca}%,campanha.ilike.%${busca}%`);
    if (filtroEtapa) query = query.eq("etapa", filtroEtapa);
    if (filtroCanal) query = query.eq("canal", filtroCanal);

    const { data, count, error } = await query;
    if (!error && data) {
      setLeads(data as Lead[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [user, busca, filtroEtapa, filtroCanal, pagina]);

  useEffect(() => { setPagina(1); }, [busca, filtroEtapa, filtroCanal]);
  useEffect(() => { buscarLeads(); }, [buscarLeads]);

  function mostrarToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function mudarEtapa(leadId: string, novaEtapa: string) {
    setAtualizando(leadId);
    await supabase.from("leads").update({ etapa: novaEtapa }).eq("id", leadId);

    const evento = etapaParaEvento[novaEtapa];
    if (evento) {
      try {
        await fetch("/api/capi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, evento }),
        });
        mostrarToast(`✓ Evento ${evento} enviado ao Meta`);
      } catch {
        mostrarToast("Erro ao enviar evento ao Meta");
      }
    }

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l)));
    if (leadAberto?.id === leadId) setLeadAberto((prev) => prev ? { ...prev, etapa: novaEtapa } : prev);
    setAtualizando(null);
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <main style={{ display: "flex", flexDirection: "column" }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 999,
          background: "var(--s3)", border: "1px solid var(--border2)",
          color: "var(--text)", padding: "10px 16px", borderRadius: 8,
          fontSize: 15, fontFamily: "monospace",
        }}>
          {toast}
        </div>
      )}

      {/* Topbar */}
      <div style={{
        padding: "13px 18px", borderBottom: "1px solid var(--border)",
        background: "var(--s1)", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.2, color: "var(--text)" }}>
            Leads
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 1 }}>
            {total} lead{total !== 1 ? "s" : ""} no total
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Busca */}
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Buscar nome, telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
                borderRadius: 7, fontSize: 13, border: "1px solid var(--border2)",
                background: "var(--s2)", color: "var(--text)", width: 200,
                outline: "none",
              }}
            />
          </div>

          {/* Etapa */}
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 7, fontSize: 13,
              border: "1px solid var(--border2)", background: "var(--s2)",
              color: "var(--sub)", cursor: "pointer",
            }}
          >
            <option value="">Todas as etapas</option>
            {etapas.map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>

          {/* Canal */}
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 7, fontSize: 13,
              border: "1px solid var(--border2)", background: "var(--s2)",
              color: "var(--sub)", cursor: "pointer",
            }}
          >
            <option value="">Todos os canais</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Google">Google</option>
            <option value="Meta Ads">Meta Ads</option>
          </select>

          {/* Limpar */}
          {(busca || filtroEtapa || filtroCanal) && (
            <button
              onClick={() => { setBusca(""); setFiltroEtapa(""); setFiltroCanal(""); }}
              style={{
                padding: "5px 10px", borderRadius: 7, fontSize: 13,
                border: "1px solid var(--border2)", background: "transparent",
                color: "var(--muted)", cursor: "pointer",
              }}
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ flex: 1, padding: "16px 18px" }}>
        <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Nome", "Canal", "Campanha", "Origem", "Etapa", "Recebido", ""].map((h) => (
                  <th key={h} style={{
                    padding: "9px 16px", fontSize: 15, color: "var(--muted)",
                    textAlign: "left", fontWeight: 400,
                    borderBottom: "1px solid var(--border)", letterSpacing: "0.3px",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                    Carregando...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
                    Nenhum lead encontrado
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr
                    key={l.id}
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", borderLeft: `3px solid ${getBadgeEtapa(l.etapa).borda}` }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Nome */}
                    <td style={{ padding: "10px 16px" }} >
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "var(--s4)", border: "1px solid var(--border2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 500, color: "var(--sub)", flexShrink: 0,
                        }}>
                          {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, color: "var(--text)" }}>{l.nome}</div>
                          <div style={{ fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }}>
                            {formatarTelefone(l.contato)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Canal */}
                    <td style={{ padding: "10px 16px" }}>
                      {(() => { const c = getBadgeCanal(l.canal); return (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 4, fontSize: 12, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          <i className={`ti ${canalIcon[l.canal] || "ti-circle"}`} style={{ fontSize: 11 }} />
                          {l.canal}
                        </span>
                      ); })()}
                    </td>

                    {/* Campanha */}
                    <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }} >
                      {l.campanha || "—"}
                    </td>

                    {/* Origem */}
                    <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }} >
                      {l.utm_source || "—"}{l.utm_medium ? ` / ${l.utm_medium}` : ""}
                    </td>

                    {/* Etapa */}
                    <td style={{ padding: "10px 16px" }}>
                      <select
                        value={l.etapa}
                        disabled={atualizando === l.id}
                        onChange={(e) => mudarEtapa(l.id, e.target.value)}
                        style={{
                          padding: "5px 9px", borderRadius: 4, fontSize: 13,
                          border: "1px solid var(--border)", background: "var(--s2)",
                          color: "var(--text)", cursor: "pointer",
                          opacity: atualizando === l.id ? 0.5 : 1,
                        }}
                      >
                        {etapas.map((e) => (
                          <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* Recebido */}
                    <td style={{ padding: "10px 16px", fontSize: 13, fontFamily: "monospace", color: "var(--muted)" }} >
                      {tempoRelativo(l.created_at)}
                    </td>

                    {/* Seta */}
                    <td style={{ padding: "10px 16px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/jornadas/${l.id}`); }}
                        title="Ver jornada"
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}
                      >
                        <i className="ti ti-route" style={{ fontSize: 14 }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>
              {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{
                  padding: "6px 12px", borderRadius: 5, fontSize: 13,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--sub)", cursor: pagina === 1 ? "not-allowed" : "pointer",
                  opacity: pagina === 1 ? 0.4 : 1,
                }}
              >← Anterior</button>
              <span style={{ fontSize: 13, color: "var(--muted)", padding: "4px 8px" }}>
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                style={{
                  padding: "6px 12px", borderRadius: 5, fontSize: 13,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--sub)", cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
                  opacity: pagina === totalPaginas ? 0.4 : 1,
                }}
              >Próxima →</button>
            </div>
          </div>
        )}
      </div>

    </main>
  );
}

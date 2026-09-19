"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [pagina, setPagina] = useState(1);
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const buscarLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
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
  }, [busca, filtroEtapa, filtroCanal, pagina]);

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
          fontSize: 16, fontFamily: "monospace",
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
          <div style={{ fontSize: 16, fontWeight: 500, letterSpacing: -0.2, color: "var(--text)" }}>
            Leads
          </div>
          <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 1 }}>
            {total} lead{total !== 1 ? "s" : ""} no total
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {/* Busca */}
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Buscar nome, telefone..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                paddingLeft: 26, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
                borderRadius: 7, fontSize: 14, border: "1px solid var(--border2)",
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
              padding: "5px 10px", borderRadius: 7, fontSize: 14,
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
              padding: "5px 10px", borderRadius: 7, fontSize: 14,
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
                padding: "5px 10px", borderRadius: 7, fontSize: 14,
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
                    padding: "9px 16px", fontSize: 16, color: "var(--muted)",
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
                    style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {/* Nome */}
                    <td style={{ padding: "10px 16px" }} onClick={() => setLeadAberto(l)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: "var(--s4)", border: "1px solid var(--border2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 500, color: "var(--sub)", flexShrink: 0,
                        }}>
                          {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div style={{ fontSize: 16, color: "var(--text)" }}>{l.nome}</div>
                          <div style={{ fontSize: 14, fontFamily: "monospace", color: "var(--muted)" }}>
                            {formatarTelefone(l.contato)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Canal */}
                    <td style={{ padding: "10px 16px" }} onClick={() => setLeadAberto(l)}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "2px 6px", borderRadius: 3, fontSize: 14,
                        background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)",
                      }}>
                        <i className={`ti ${canalIcon[l.canal] || "ti-circle"}`} style={{ fontSize: 10 }} />
                        {l.canal}
                      </span>
                    </td>

                    {/* Campanha */}
                    <td style={{ padding: "10px 16px", fontSize: 14, fontFamily: "monospace", color: "var(--muted)" }} onClick={() => setLeadAberto(l)}>
                      {l.campanha || "—"}
                    </td>

                    {/* Origem */}
                    <td style={{ padding: "10px 16px", fontSize: 14, fontFamily: "monospace", color: "var(--muted)" }} onClick={() => setLeadAberto(l)}>
                      {l.utm_source || "—"}{l.utm_medium ? ` / ${l.utm_medium}` : ""}
                    </td>

                    {/* Etapa */}
                    <td style={{ padding: "10px 16px" }}>
                      <select
                        value={l.etapa}
                        disabled={atualizando === l.id}
                        onChange={(e) => mudarEtapa(l.id, e.target.value)}
                        style={{
                          padding: "5px 9px", borderRadius: 4, fontSize: 14,
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
                    <td style={{ padding: "10px 16px", fontSize: 14, fontFamily: "monospace", color: "var(--muted)" }} onClick={() => setLeadAberto(l)}>
                      {tempoRelativo(l.created_at)}
                    </td>

                    {/* Seta */}
                    <td style={{ padding: "10px 16px" }} onClick={() => setLeadAberto(l)}>
                      <i className="ti ti-chevron-right" style={{ fontSize: 16, color: "var(--muted)" }} />
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
            <span style={{ fontSize: 14, color: "var(--muted)" }}>
              {(pagina - 1) * POR_PAGINA + 1}–{Math.min(pagina * POR_PAGINA, total)} de {total}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                style={{
                  padding: "6px 12px", borderRadius: 5, fontSize: 14,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--sub)", cursor: pagina === 1 ? "not-allowed" : "pointer",
                  opacity: pagina === 1 ? 0.4 : 1,
                }}
              >← Anterior</button>
              <span style={{ fontSize: 14, color: "var(--muted)", padding: "4px 8px" }}>
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                style={{
                  padding: "6px 12px", borderRadius: 5, fontSize: 14,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--sub)", cursor: pagina === totalPaginas ? "not-allowed" : "pointer",
                  opacity: pagina === totalPaginas ? 0.4 : 1,
                }}
              >Próxima →</button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {leadAberto && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex" }}>
          {/* Overlay */}
          <div
            style={{ flex: 1, background: "rgba(0,0,0,0.4)" }}
            onClick={() => setLeadAberto(null)}
          />
          {/* Painel */}
          <div style={{
            width: 360, background: "var(--s1)", borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column", overflowY: "auto",
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 16px", borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              position: "sticky", top: 0, background: "var(--s1)", zIndex: 10,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "var(--s4)", border: "1px solid var(--border2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 500, color: "var(--sub)",
                }}>
                  {leadAberto.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{leadAberto.nome}</span>
              </div>
              <button
                onClick={() => setLeadAberto(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16 }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Etapa */}
              <div>
                <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>ETAPA</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {etapas.map((e) => (
                    <button
                      key={e.value}
                      onClick={() => mudarEtapa(leadAberto.id, e.value)}
                      disabled={atualizando === leadAberto.id}
                      style={{
                        padding: "6px 12px", borderRadius: 5, fontSize: 14,
                        border: leadAberto.etapa === e.value ? "1px solid var(--sub)" : "1px solid var(--border)",
                        background: leadAberto.etapa === e.value ? "var(--s4)" : "var(--s2)",
                        color: leadAberto.etapa === e.value ? "var(--text)" : "var(--muted)",
                        cursor: "pointer", opacity: atualizando === leadAberto.id ? 0.5 : 1,
                      }}
                    >{e.label}</button>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div style={card}>
                <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>CONTATO</div>
                {[
                  { label: "Telefone", value: formatarTelefone(leadAberto.contato) },
                  { label: "Canal", value: leadAberto.canal },
                  { label: "Cidade", value: leadAberto.cidade },
                  { label: "Dispositivo", value: leadAberto.dispositivo },
                ].filter((i) => i.value).map((i) => (
                  <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{i.label}</span>
                    <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "monospace" }}>{i.value}</span>
                  </div>
                ))}
              </div>

              {/* Rastreamento */}
              <div style={card}>
                <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>RASTREAMENTO</div>
                {[
                  { label: "Campanha", value: leadAberto.campanha },
                  { label: "Conjunto", value: leadAberto.conjunto },
                  { label: "Anúncio", value: leadAberto.anuncio },
                  { label: "UTM Source", value: leadAberto.utm_source },
                  { label: "UTM Medium", value: leadAberto.utm_medium },
                  { label: "UTM Campaign", value: leadAberto.utm_campaign },
                  { label: "UTM Content", value: leadAberto.utm_content },
                  { label: "FBCLID", value: leadAberto.fbclid ? "✓ Capturado" : null },
                  { label: "GCLID", value: leadAberto.gclid ? "✓ Capturado" : null },
                ].filter((i) => i.value).map((i) => (
                  <div key={i.label} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 14, color: "var(--muted)" }}>{i.label}</span>
                    <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "monospace", maxWidth: 180, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.value}</span>
                  </div>
                ))}
              </div>

              {/* Eventos Meta */}
              {leadAberto.evento_meta && leadAberto.evento_meta.length > 0 && (
                <div style={card}>
                  <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>EVENTOS META CAPI</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {leadAberto.evento_meta.map((ev, i) => (
                      <span key={i} style={{
                        padding: "2px 7px", borderRadius: 3, fontSize: 14,
                        background: "var(--s3)", color: "var(--sub)",
                        border: "1px solid var(--border)", fontFamily: "monospace",
                      }}>→ {ev}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data */}
              <div style={card}>
                <div style={{ fontSize: 16, color: "var(--muted)", marginBottom: 8, letterSpacing: "0.5px" }}>DATAS</div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                  <span style={{ fontSize: 14, color: "var(--muted)" }}>Entrada</span>
                  <span style={{ fontSize: 14, color: "var(--text)", fontFamily: "monospace" }}>
                    {new Date(leadAberto.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* WhatsApp */}
              {leadAberto.contato && (
                <a
                  href={`https://wa.me/${leadAberto.contato.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    padding: "10px", borderRadius: 7, fontSize: 16, fontWeight: 500,
                    background: "var(--s3)", color: "var(--text)", border: "1px solid var(--border2)",
                    textDecoration: "none", cursor: "pointer",
                  }}
                >
                  <i className="ti ti-brand-whatsapp" style={{ fontSize: 14 }} />
                  Abrir WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

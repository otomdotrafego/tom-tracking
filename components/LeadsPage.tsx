"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

const ETAPAS = [
  { valor: "novo", label: "Novo", cor: "bg-blue-100 text-blue-800" },
  { valor: "contato", label: "Contato", cor: "bg-yellow-100 text-yellow-800" },
  { valor: "agendado", label: "Agendado", cor: "bg-purple-100 text-purple-800" },
  { valor: "fechado", label: "Fechado", cor: "bg-green-100 text-green-800" },
  { valor: "perdido", label: "Perdido", cor: "bg-red-100 text-red-800" },
];

function badgeEtapa(etapa: string) {
  const e = ETAPAS.find((x) => x.valor === etapa) ?? {
    label: etapa,
    cor: "bg-gray-100 text-gray-700",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${e.cor}`}>
      {e.label}
    </span>
  );
}

function badgeCanal(canal: string) {
  const cores: Record<string, string> = {
    WhatsApp: "bg-green-100 text-green-800",
    Instagram: "bg-pink-100 text-pink-800",
    Facebook: "bg-blue-100 text-blue-800",
    Google: "bg-orange-100 text-orange-800",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
        cores[canal] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {canal}
    </span>
  );
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTelefone(contato: string | null) {
  if (!contato) return "—";
  const num = contato.replace(/\D/g, "");
  if (num.length === 13) {
    return `+${num.slice(0, 2)} (${num.slice(2, 4)}) ${num.slice(4, 9)}-${num.slice(9)}`;
  }
  return contato;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("");
  const [filtroCanal, setFiltroCanal] = useState("");
  const [filtroUTMSource, setFiltroUTMSource] = useState("");
  const [pagina, setPagina] = useState(1);
  const POR_PAGINA = 20;

  // Lead expandido (detalhes)
  const [leadAberto, setLeadAberto] = useState<Lead | null>(null);

  // Etapa inline
  const [atualizandoEtapa, setAtualizandoEtapa] = useState<string | null>(null);

  const buscarLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("leads")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA - 1);

    if (busca.trim()) {
      query = query.or(
        `nome.ilike.%${busca}%,contato.ilike.%${busca}%,campanha.ilike.%${busca}%`
      );
    }
    if (filtroEtapa) query = query.eq("etapa", filtroEtapa);
    if (filtroCanal) query = query.eq("canal", filtroCanal);
    if (filtroUTMSource) query = query.eq("utm_source", filtroUTMSource);

    const { data, count, error } = await query;
    if (!error && data) {
      setLeads(data as Lead[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [busca, filtroEtapa, filtroCanal, filtroUTMSource, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [busca, filtroEtapa, filtroCanal, filtroUTMSource]);

  useEffect(() => {
    buscarLeads();
  }, [buscarLeads]);

  async function mudarEtapa(leadId: string, novaEtapa: string) {
    setAtualizandoEtapa(leadId);
    const { error } = await supabase
      .from("leads")
      .update({ etapa: novaEtapa })
      .eq("id", leadId);
    if (!error) {
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, etapa: novaEtapa } : l))
      );
      if (leadAberto?.id === leadId) {
        setLeadAberto((prev) => prev ? { ...prev, etapa: novaEtapa } : prev);
      }
    }
    setAtualizandoEtapa(null);
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA);

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} lead{total !== 1 ? "s" : ""} no total
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-4 flex flex-wrap gap-3">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar por nome, telefone, campanha..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Etapa */}
          <select
            value={filtroEtapa}
            onChange={(e) => setFiltroEtapa(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas as etapas</option>
            {ETAPAS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.label}
              </option>
            ))}
          </select>

          {/* Canal */}
          <select
            value={filtroCanal}
            onChange={(e) => setFiltroCanal(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos os canais</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
            <option value="Google">Google</option>
          </select>

          {/* UTM Source */}
          <select
            value={filtroUTMSource}
            onChange={(e) => setFiltroUTMSource(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas as origens</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
            <option value="organic">Orgânico</option>
          </select>

          {/* Limpar filtros */}
          {(busca || filtroEtapa || filtroCanal || filtroUTMSource) && (
            <button
              onClick={() => {
                setBusca("");
                setFiltroEtapa("");
                setFiltroCanal("");
                setFiltroUTMSource("");
              }}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Carregando leads...
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 100-8 4 4 0 000 8z" />
            </svg>
            <p className="font-medium">Nenhum lead encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Contato</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Canal</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Campanha</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Origem</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Etapa</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setLeadAberto(lead)}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {lead.nome}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatarTelefone(lead.contato)}
                    </td>
                    <td className="px-4 py-3">{badgeCanal(lead.canal)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                      {lead.campanha || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {lead.utm_source || "—"}
                      {lead.utm_medium ? ` / ${lead.utm_medium}` : ""}
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.etapa}
                        disabled={atualizandoEtapa === lead.id}
                        onChange={(e) => mudarEtapa(lead.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {ETAPAS.map((e) => (
                          <option key={e.valor} value={e.valor}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatarData(lead.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLeadAberto(lead);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver detalhes"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Mostrando {(pagina - 1) * POR_PAGINA + 1}–
              {Math.min(pagina * POR_PAGINA, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">
                {pagina} / {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer de detalhes do lead */}
      {leadAberto && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/30"
            onClick={() => setLeadAberto(null)}
          />
          {/* Painel */}
          <div className="w-full max-w-md bg-white shadow-2xl overflow-y-auto flex flex-col">
            {/* Header do drawer */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900 text-lg">{leadAberto.nome}</h2>
              <button
                onClick={() => setLeadAberto(null)}
                className="text-gray-400 hover:text-gray-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-4 flex-1 space-y-6">
              {/* Etapa */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Etapa do Lead
                </p>
                <div className="flex gap-2 flex-wrap">
                  {ETAPAS.map((e) => (
                    <button
                      key={e.valor}
                      onClick={() => mudarEtapa(leadAberto.id, e.valor)}
                      disabled={atualizandoEtapa === leadAberto.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all disabled:opacity-50 ${
                        leadAberto.etapa === e.valor
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Contato
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-600">Telefone</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatarTelefone(leadAberto.contato)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-600">Canal</span>
                    {badgeCanal(leadAberto.canal)}
                  </div>
                  {leadAberto.cidade && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">Cidade</span>
                      <span className="text-sm font-medium text-gray-900">{leadAberto.cidade}</span>
                    </div>
                  )}
                  {leadAberto.dispositivo && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">Dispositivo</span>
                      <span className="text-sm font-medium text-gray-900">{leadAberto.dispositivo}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rastreamento */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Rastreamento
                </p>
                <div className="space-y-2">
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
                  ]
                    .filter((item) => item.value)
                    .map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="text-sm font-medium text-gray-900 max-w-[200px] truncate text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Eventos Meta */}
              {leadAberto.evento_meta && leadAberto.evento_meta.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Eventos Meta CAPI
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {leadAberto.evento_meta.map((ev, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Datas
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <span className="text-sm text-gray-600">Entrada</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatarData(leadAberto.created_at)}
                    </span>
                  </div>
                  {leadAberto.fbclid_capturado_em && (
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-sm text-gray-600">FBCLID capturado</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatarData(leadAberto.fbclid_capturado_em)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ação WhatsApp */}
              {leadAberto.contato && (
                <a
                  href={`https://wa.me/${leadAberto.contato.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Abrir WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

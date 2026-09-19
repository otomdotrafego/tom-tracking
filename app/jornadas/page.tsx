"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

type Lead = {
  id: string;
  nome: string;
  contato: string | null;
  canal: string;
  campanha: string | null;
  etapa: string;
  created_at: string;
};

const canalIcon: Record<string, string> = {
  WhatsApp: "ti-brand-whatsapp",
  Instagram: "ti-brand-instagram",
  Google: "ti-brand-google",
  "Meta Ads": "ti-brand-meta",
};

const etapaLabel: Record<string, string> = {
  novo: "Novo",
  em_conversa: "Em conversa",
  qualificado: "Qualificado",
  agendado: "Agendado",
  negociando: "Negociando",
  venda_fechada: "Venda fechada",
  nao_qualificado: "Não qualificado",
};

function tempoRelativo(data: string) {
  const diff = Math.floor((Date.now() - new Date(data).getTime()) / 60000);
  if (diff < 60) return `${diff} min`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

export default function JornadasPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setLeads(data);
        setLoading(false);
      });
  }, []);

  const filtrados = leads.filter(
    (l) =>
      l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (l.contato || "").includes(busca)
  );

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{
          padding: "14px 22px", borderBottom: "1px solid var(--border)",
          background: "var(--s1)", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", letterSpacing: -0.2 }}>Jornadas</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{leads.length} leads</div>
          </div>
          <div style={{ position: "relative" }}>
            <i className="ti ti-search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Buscar lead..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                paddingLeft: 32, paddingRight: 12, paddingTop: 7, paddingBottom: 7,
                borderRadius: 7, fontSize: 13, border: "1px solid var(--border2)",
                background: "var(--s2)", color: "var(--text)", width: 220, outline: "none",
              }}
            />
          </div>
        </div>

        {/* Lista */}
        <div style={{ padding: "18px 22px" }}>
          <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Carregando...</div>
            ) : filtrados.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>Nenhum lead encontrado</div>
            ) : filtrados.map((l, i) => (
              <div
                key={l.id}
                onClick={() => router.push(`/jornadas/${l.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 18px",
                  borderBottom: i < filtrados.length - 1 ? "1px solid var(--border)" : "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "var(--s4)", border: "1px solid var(--border2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, color: "var(--sub)", flexShrink: 0,
                }}>
                  {l.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 500 }}>{l.nome}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)", fontFamily: "monospace", marginTop: 1 }}>
                    {l.contato || "—"}
                  </div>
                </div>

                {/* Canal */}
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 8px", borderRadius: 4, fontSize: 12,
                  background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)",
                }}>
                  <i className={`ti ${canalIcon[l.canal] || "ti-circle"}`} style={{ fontSize: 12 }} />
                  {l.canal}
                </span>

                {/* Etapa */}
                <span style={{ fontSize: 12, color: "var(--muted)", minWidth: 100 }}>
                  {etapaLabel[l.etapa] || l.etapa}
                </span>

                {/* Tempo */}
                <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--muted)", minWidth: 30, textAlign: "right" }}>
                  {tempoRelativo(l.created_at)}
                </span>

                <i className="ti ti-chevron-right" style={{ fontSize: 14, color: "var(--muted)" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

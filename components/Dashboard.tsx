"use client";

const metrics = [
  { label: "Total de leads", value: "1.284", tag: "+18%", sub: "vs período anterior" },
  { label: "Conversas abertas", value: "342", tag: "+9%", sub: "vs período anterior" },
  { label: "Vendas fechadas", value: "87", tag: "+24%", sub: "vs período anterior" },
  { label: "Taxa de conversão", value: "6,8%", tag: "−2%", sub: "vs período anterior" },
];

const channels = [
  { icon: "ti-brand-whatsapp", label: "WhatsApp", pct: 72, value: 524 },
  { icon: "ti-brand-meta", label: "Meta Ads", pct: 55, value: 398 },
  { icon: "ti-brand-google", label: "Google Ads", pct: 34, value: 247 },
  { icon: "ti-brand-instagram", label: "Instagram Direct", pct: 16, value: 115 },
];

const funnel = [
  { label: "Clique", pct: 100, value: "1.284" },
  { label: "Conversa", pct: 78, value: "1.001" },
  { label: "Qualificado", pct: 42, value: "539" },
  { label: "Agendado", pct: 20, value: "257" },
  { label: "Fechado", pct: 7, value: "87" },
];

const leads = [
  { initials: "MF", name: "Marcos Ferreira", contact: "(11) 99821-4432", channel: "ti-brand-whatsapp", channelLabel: "WhatsApp", campaign: "black-friday-sp", status: "Agendado", time: "12 min" },
  { initials: "AS", name: "Ana Silva", contact: "@anasilva__", channel: "ti-brand-instagram", channelLabel: "Instagram", campaign: "reels-promocao", status: "Em conversa", time: "31 min" },
  { initials: "RC", name: "Ricardo Costa", contact: "rcosta@gmail.com", channel: "ti-brand-google", channelLabel: "Google", campaign: "search-bh-2024", status: "Venda fechada", time: "1h" },
  { initials: "PO", name: "Paula Oliveira", contact: "(21) 98734-5521", channel: "ti-brand-meta", channelLabel: "Meta Ads", campaign: "lead-form-rj", status: "Não qualificado", time: "2h" },
  { initials: "JS", name: "João Santos", contact: "(51) 99654-1198", channel: "ti-brand-whatsapp", channelLabel: "WhatsApp", campaign: "black-friday-sp", status: "Agendado", time: "3h" },
];

const card: React.CSSProperties = {
  background: "var(--s1)", border: "1px solid var(--border)",
  borderRadius: 7, padding: 14,
};

export default function Dashboard() {
  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* Topbar */}
      <div style={{
        padding: "13px 18px", borderBottom: "1px solid var(--border)",
        background: "var(--s1)", display: "flex", alignItems: "center",
        justifyContent: "space-between", flexShrink: 0
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, letterSpacing: -0.2, color: "var(--text)" }}>
            Painel de rastreamento
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
            Todas as origens · últimos 30 dias
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 5, fontSize: 11,
            color: "var(--sub)", padding: "4px 9px", borderRadius: 20,
            border: "1px solid var(--border)"
          }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--sub)", display: "inline-block" }} />
            Ao vivo
          </div>
          <select style={{
            padding: "5px 10px", borderRadius: 7, fontSize: 11,
            border: "1px solid var(--border2)", background: "var(--s2)",
            color: "var(--sub)", cursor: "pointer"
          }}>
            <option>Hoje</option>
            <option>Últimos 7 dias</option>
            <option selected>Últimos 30 dias</option>
            <option>Últimos 3 meses</option>
          </select>
          <select style={{
            padding: "5px 10px", borderRadius: 7, fontSize: 11,
            border: "1px solid var(--border2)", background: "var(--s2)",
            color: "var(--sub)", cursor: "pointer"
          }}>
            <option>Todas as origens</option>
            <option>WhatsApp</option>
            <option>Meta Ads</option>
            <option>Google Ads</option>
            <option>Instagram Direct</option>
          </select>
          <button style={{
            display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
            borderRadius: 7, fontSize: 11, border: "1px solid var(--border2)",
            background: "var(--s2)", color: "var(--sub)", cursor: "pointer"
          }}>
            <i className="ti ti-download" style={{ fontSize: 12 }} /> Exportar
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

        {/* Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 9, marginBottom: 14 }}>
          {metrics.map((m) => (
            <div key={m.label} style={card}>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginBottom: 5 }}>{m.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ fontSize: 19, fontWeight: 500, color: "var(--text)", fontFamily: "monospace", letterSpacing: -1 }}>{m.value}</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 5px", borderRadius: 3, background: "var(--s3)", color: "var(--sub)" }}>{m.tag}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 3 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Channels + Funnel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 14 }}>
          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Leads por canal</span>
              <span style={{ fontSize: 10.5, color: "var(--muted)" }}>últimos 30 dias</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {channels.map((c) => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, background: "var(--s3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <i className={`ti ${c.icon}`} style={{ fontSize: 12, color: "var(--sub)" }} />
                  </div>
                  <div style={{ flex: 1, fontSize: 11.5, color: "var(--sub)" }}>{c.label}</div>
                  <div style={{ flex: 2, height: 3, background: "var(--s3)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${c.pct}%`, height: "100%", background: "var(--s4)", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "var(--muted)", minWidth: 30, textAlign: "right" }}>{c.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Funil de conversão</span>
              <span style={{ fontSize: 10.5, color: "var(--muted)" }}>geral</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {funnel.map((f) => (
                <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)", width: 70, flexShrink: 0 }}>{f.label}</div>
                  <div style={{ flex: 1, height: 19, background: "var(--s3)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${f.pct}%`, height: "100%", background: "var(--s4)",
                      borderRadius: 4, display: "flex", alignItems: "center",
                      padding: "0 7px", fontSize: 10, fontFamily: "monospace", color: "var(--sub)"
                    }}>{f.value}</div>
                  </div>
                  <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)", minWidth: 30, textAlign: "right" }}>{f.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leads table */}
        <div style={{ background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 7, overflow: "hidden" }}>
          <div style={{
            padding: "10px 14px", borderBottom: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)" }}>Leads recentes</span>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 5, background: "var(--s2)",
                border: "1px solid var(--border)", borderRadius: 5, padding: "4px 8px",
                fontSize: 11, color: "var(--muted)"
              }}>
                <i className="ti ti-search" style={{ fontSize: 11 }} /> Buscar...
              </div>
              <select style={{
                padding: "4px 8px", borderRadius: 5, fontSize: 11,
                border: "1px solid var(--border2)", background: "var(--s2)", color: "var(--sub)"
              }}>
                <option>Todas as etapas</option>
                <option>Em conversa</option>
                <option>Agendado</option>
                <option>Venda fechada</option>
                <option>Não qualificado</option>
              </select>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Lead","Canal","Campanha","Etapa","Recebido",""].map((h) => (
                  <th key={h} style={{
                    padding: "7px 14px", fontSize: 10, color: "var(--muted)",
                    textAlign: "left", fontWeight: 400, borderBottom: "1px solid var(--border)",
                    letterSpacing: "0.3px"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.name} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%", background: "var(--s4)",
                        border: "1px solid var(--border2)", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 8.5, fontWeight: 500, color: "var(--sub)"
                      }}>{l.initials}</div>
                      <div>
                        <div style={{ fontSize: 11.5, color: "var(--text)" }}>{l.name}</div>
                        <div style={{ fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{l.contact}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      padding: "2px 6px", borderRadius: 3, fontSize: 10.5,
                      background: "var(--s3)", color: "var(--sub)", border: "1px solid var(--border)"
                    }}>
                      <i className={`ti ${l.channel}`} style={{ fontSize: 10 }} /> {l.channelLabel}
                    </span>
                  </td>
                  <td style={{ padding: "8px 14px", fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{l.campaign}</td>
                  <td style={{ padding: "8px 14px", fontSize: 11, color: "var(--sub)" }}>{l.status}</td>
                  <td style={{ padding: "8px 14px", fontSize: 10.5, fontFamily: "monospace", color: "var(--muted)" }}>{l.time}</td>
                  <td style={{ padding: "8px 14px" }}>
                    <button style={{
                      padding: "3px 7px", borderRadius: 4, fontSize: 10.5,
                      border: "1px solid var(--border)", background: "transparent",
                      color: "var(--muted)", cursor: "pointer"
                    }}>Jornada</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
}
"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type Perfil = {
  id: string;
  nome: string;
  email: string;
  plano: string;
  meta_pixel_id: string | null;
  meta_access_token: string | null;
  meta_verify_token: string | null;
  whatsapp_numero: string | null;
};

const campo: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label: React.CSSProperties = {
  fontSize: 11,
  color: "var(--sub)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontWeight: 600,
};

const input: React.CSSProperties = {
  background: "var(--s2)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "9px 12px",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  width: "100%",
  fontFamily: "inherit",
};

const card: React.CSSProperties = {
  background: "var(--s1)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "20px 22px",
  display: "flex",
  flexDirection: "column",
  gap: 18,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "var(--sub)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  paddingBottom: 14,
  borderBottom: "1px solid var(--border)",
  marginBottom: 2,
};

function CopyButton({ text }: { text: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 1800);
      }}
      style={{
        background: copiado ? "var(--s4)" : "var(--s3)",
        border: "1px solid var(--border)",
        borderRadius: 5,
        padding: "5px 10px",
        fontSize: 11,
        color: copiado ? "#4caf70" : "var(--sub)",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
    >
      {copiado ? "✓ Copiado" : "Copiar"}
    </button>
  );
}

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState<{ msg: string; tipo: "ok" | "erro" } | null>(null);
  const [mostrarToken, setMostrarToken] = useState(false);

  // Campos editáveis
  const [nome, setNome] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [verifyToken, setVerifyToken] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("perfis")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          const p = data as Perfil;
          setPerfil(p);
          setNome(p.nome || "");
          setPixelId(p.meta_pixel_id || "");
          setAccessToken(p.meta_access_token || "");
          setVerifyToken(p.meta_verify_token || "tomtracking2024");
          setWhatsapp(p.whatsapp_numero || "");
        }
        setLoading(false);
      });
  }, [user]);

  function mostrarToast(msg: string, tipo: "ok" | "erro" = "ok") {
    setToast({ msg, tipo });
    setTimeout(() => setToast(null), 3500);
  }

  async function salvar() {
    if (!user) return;
    setSalvando(true);
    const { error } = await supabase.from("perfis").upsert({
      id: user.id,
      email: user.email,
      nome: nome.trim(),
      meta_pixel_id: pixelId.trim() || null,
      meta_access_token: accessToken.trim() || null,
      meta_verify_token: verifyToken.trim() || null,
      whatsapp_numero: whatsapp.trim() || null,
    });
    setSalvando(false);
    if (error) {
      mostrarToast("Erro ao salvar: " + error.message, "erro");
    } else {
      mostrarToast("Configurações salvas");
    }
  }

  const linkRastreavel = whatsapp
    ? `${typeof window !== "undefined" ? window.location.origin : "https://tom-tracking.vercel.app"}/r?wa=${whatsapp.replace(/\D/g, "")}&tid=${user?.id || ""}&utm_source=facebook&utm_medium=cpc&utm_campaign=`
    : "";

  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />

      <main style={{ flex: 1, padding: "28px 28px 60px", maxWidth: 720, margin: "0 auto", width: "100%" }}>
        {/* Cabeçalho */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
            Configurações
          </h1>
          <p style={{ fontSize: 13, color: "var(--sub)" }}>
            Dados da sua conta e integrações
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Perfil */}
          <div style={card}>
            <div style={sectionTitle}>Perfil</div>
            <div style={campo}>
              <label style={label}>Nome</label>
              <input
                style={input}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome ou da empresa"
              />
            </div>
            <div style={campo}>
              <label style={label}>E-mail</label>
              <input
                style={{ ...input, color: "var(--muted)", cursor: "not-allowed" }}
                value={perfil?.email || user?.email || ""}
                readOnly
              />
            </div>
            <div style={campo}>
              <label style={label}>Plano</label>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "var(--s3)", border: "1px solid var(--border)",
                borderRadius: 5, padding: "6px 12px", fontSize: 12,
                color: "var(--sub)", width: "fit-content",
              }}>
                <i className="ti ti-star" style={{ fontSize: 13, color: "#b8a832" }} />
                {perfil?.plano || "Gratuito"}
              </div>
            </div>
          </div>

          {/* Meta Ads */}
          <div style={card}>
            <div style={sectionTitle}>Meta Ads · CAPI</div>

            <div style={campo}>
              <label style={label}>Pixel ID</label>
              <input
                style={input}
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="Ex: 1386783446463518"
              />
            </div>

            <div style={campo}>
              <label style={label}>Access Token</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  style={input}
                  type={mostrarToken ? "text" : "password"}
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="EAAxxxxxx..."
                />
                <button
                  onClick={() => setMostrarToken(!mostrarToken)}
                  style={{
                    background: "var(--s3)", border: "1px solid var(--border)",
                    borderRadius: 6, padding: "9px 12px", cursor: "pointer",
                    color: "var(--sub)", flexShrink: 0,
                  }}
                >
                  <i className={`ti ${mostrarToken ? "ti-eye-off" : "ti-eye"}`} style={{ fontSize: 15 }} />
                </button>
              </div>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Token de sistema do Meta Business Suite com permissão de Pixel
              </span>
            </div>

            <div style={campo}>
              <label style={label}>Verify Token (Webhook)</label>
              <input
                style={input}
                value={verifyToken}
                onChange={(e) => setVerifyToken(e.target.value)}
                placeholder="tomtracking2024"
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Token para validação do webhook no painel do Meta
              </span>
            </div>
          </div>

          {/* WhatsApp */}
          <div style={card}>
            <div style={sectionTitle}>WhatsApp</div>
            <div style={campo}>
              <label style={label}>Número (com DDI)</label>
              <input
                style={input}
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                placeholder="5511999999999"
                maxLength={15}
              />
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                Apenas números. Ex: 5511999887766
              </span>
            </div>

            {whatsapp && (
              <div style={campo}>
                <label style={label}>Link rastreável</label>
                <div style={{
                  display: "flex", gap: 8, alignItems: "center",
                  background: "var(--s2)", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "9px 12px",
                }}>
                  <span style={{
                    fontSize: 12, color: "var(--sub)", flex: 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    fontFamily: "monospace",
                  }}>
                    {linkRastreavel}
                  </span>
                  <CopyButton text={linkRastreavel} />
                </div>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>
                  Use este link nos seus anúncios. Salve primeiro para gerar com seu ID.
                </span>
              </div>
            )}
          </div>

          {/* Botão salvar */}
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={salvar}
              disabled={salvando}
              style={{
                background: salvando ? "var(--s3)" : "#4a9eca",
                color: salvando ? "var(--sub)" : "#fff",
                border: "none",
                borderRadius: 7,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                cursor: salvando ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "background 0.15s",
              }}
            >
              {salvando ? "Salvando..." : "Salvar configurações"}
            </button>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24,
          background: toast.tipo === "ok" ? "#0d1e14" : "#1e0d0d",
          border: `1px solid ${toast.tipo === "ok" ? "#2a5a38" : "#5a2a2a"}`,
          color: toast.tipo === "ok" ? "#4caf70" : "#c46060",
          borderRadius: 8, padding: "10px 16px", fontSize: 13,
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          zIndex: 9999,
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

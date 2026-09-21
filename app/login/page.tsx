"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Modo = "login" | "cadastro" | "recuperar";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const router = useRouter();

  async function handleSubmit() {
    setErro("");
    setSucesso("");
    setLoading(true);

    if (modo === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) {
        setErro("Email ou senha incorretos.");
      } else {
        router.push("/");
      }
    }

    if (modo === "cadastro") {
      if (!nome.trim()) { setErro("Digite seu nome."); setLoading(false); return; }
      if (senha.length < 6) { setErro("A senha precisa ter pelo menos 6 caracteres."); setLoading(false); return; }

      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { data: { full_name: nome } },
      });

      if (error) {
        if (error.message.includes("already registered") || error.message.includes("already been registered")) {
          setErro("Este email já está cadastrado. Faça login ou recupere sua senha.");
        } else {
          setErro(`Erro: ${error.message}`);
        }
      } else if (data.user) {
        // Usuário criado — faz login automático
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (loginError) {
          setSucesso("✓ Conta criada! Faça login para continuar.");
          setModo("login");
          setSenha("");
        } else {
          router.push("/");
        }
      }
    }

    if (modo === "recuperar") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/nova-senha`,
      });
      if (error) {
        setErro("Erro ao enviar email. Verifique o endereço.");
      } else {
        setSucesso("✓ Email de recuperação enviado! Verifique sua caixa de entrada.");
      }
    }

    setLoading(false);
  }

  async function loginComGoogle() {
    setErro("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) setErro("Erro ao conectar com Google.");
    setLoading(false);
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: 20,
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "var(--s1)", border: "1px solid var(--border)",
        borderRadius: 12, padding: 32,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div style={{
            width: 32, height: 32, background: "var(--s4)",
            border: "1px solid var(--border2)", borderRadius: 7,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="16" height="16" viewBox="0 0 12 12" style={{ stroke: "var(--sub)", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const }}>
              <circle cx="6" cy="6" r="2" />
              <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}>
            Tom <span style={{ color: "var(--muted)", fontWeight: 400 }}>Tracking</span>
          </span>
        </div>

        {/* Título */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>
            {modo === "login" && "Entrar na sua conta"}
            {modo === "cadastro" && "Criar sua conta"}
            {modo === "recuperar" && "Recuperar senha"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {modo === "login" && "Acesse seu painel de rastreamento"}
            {modo === "cadastro" && "Comece a rastrear suas conversões"}
            {modo === "recuperar" && "Enviaremos um link para seu email"}
          </div>
        </div>

        {/* Botão Google */}
        {modo !== "recuperar" && (
          <>
            <button
              onClick={loginComGoogle}
              disabled={loading}
              style={{
                width: "100%", padding: "10px", borderRadius: 8, fontSize: 14,
                border: "1px solid var(--border2)", background: "var(--s2)",
                color: "var(--text)", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.6 : 1, marginBottom: 16,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com Google
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>ou</span>
              <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
            </div>
          </>
        )}

        {/* Formulário */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {modo === "cadastro" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>Nome</label>
              <input
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--text)", outline: "none",
                }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>Email</label>
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={{
                width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                border: "1px solid var(--border2)", background: "var(--s2)",
                color: "var(--text)", outline: "none",
              }}
            />
          </div>

          {modo !== "recuperar" && (
            <div>
              <label style={{ fontSize: 12, color: "var(--muted)", display: "block", marginBottom: 5 }}>Senha</label>
              <input
                type="password"
                placeholder={modo === "cadastro" ? "Mínimo 6 caracteres" : "Sua senha"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 7, fontSize: 13,
                  border: "1px solid var(--border2)", background: "var(--s2)",
                  color: "var(--text)", outline: "none",
                }}
              />
            </div>
          )}

          {/* Erro */}
          {erro && (
            <div style={{ fontSize: 12, color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(248,113,113,0.2)" }}>
              {erro}
            </div>
          )}

          {/* Sucesso */}
          {sucesso && (
            <div style={{ fontSize: 12, color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(74,222,128,0.2)" }}>
              {sucesso}
            </div>
          )}

          {/* Botão principal */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "10px", borderRadius: 8, fontSize: 14,
              fontWeight: 500, border: "none", cursor: loading ? "not-allowed" : "pointer",
              background: "var(--s4)", color: "var(--text)",
              opacity: loading ? 0.6 : 1, marginTop: 4,
            }}
          >
            {loading ? "Aguarde..." : modo === "login" ? "Entrar" : modo === "cadastro" ? "Criar conta" : "Enviar email"}
          </button>
        </div>

        {/* Links */}
        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          {modo === "login" && (
            <>
              <button onClick={() => { setModo("recuperar"); setErro(""); setSucesso(""); }}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
                Esqueci minha senha
              </button>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Não tem conta?{" "}
                <button onClick={() => { setModo("cadastro"); setErro(""); setSucesso(""); }}
                  style={{ background: "none", border: "none", fontSize: 12, color: "var(--sub)", cursor: "pointer", fontWeight: 500 }}>
                  Criar agora
                </button>
              </div>
            </>
          )}
          {modo === "cadastro" && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Já tem conta?{" "}
              <button onClick={() => { setModo("login"); setErro(""); setSucesso(""); }}
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--sub)", cursor: "pointer", fontWeight: 500 }}>
                Entrar
              </button>
            </div>
          )}
          {modo === "recuperar" && (
            <button onClick={() => { setModo("login"); setErro(""); setSucesso(""); }}
              style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", cursor: "pointer" }}>
              ← Voltar para o login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

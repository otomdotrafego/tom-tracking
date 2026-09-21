import Sidebar from "@/components/Sidebar";

export default function PrivacidadePage() {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "var(--bg)" }}>
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px" }}>
          
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <div style={{ width: 28, height: 28, background: "var(--s4)", border: "1px solid var(--border2)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 12 12" style={{ stroke: "var(--sub)", fill: "none", strokeWidth: 2, strokeLinecap: "round" as const }}>
                  <circle cx="6" cy="6" r="2" />
                  <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" />
                </svg>
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text)" }}>
                Tom <span style={{ color: "var(--muted)", fontWeight: 400 }}>Tracking</span>
              </span>
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
              Política de Privacidade
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Última atualização: {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {/* Conteúdo */}
          {[
            {
              titulo: "1. Informações que coletamos",
              texto: `O Tom Tracking coleta informações necessárias para o funcionamento da plataforma de rastreamento de conversões. Isso inclui: dados de acesso como email e nome fornecidos no cadastro; dados de leads como nome, telefone, canal de origem e informações de rastreamento (UTM, FBCLID, GCLID); dados de navegação como dispositivo, cidade e origem do acesso.`,
            },
            {
              titulo: "2. Como usamos suas informações",
              texto: `As informações coletadas são utilizadas exclusivamente para: fornecer e melhorar os serviços da plataforma; exibir relatórios e métricas de conversão para o titular da conta; enviar eventos de conversão para plataformas de anúncios como Meta Ads e Google Ads, conforme configurado pelo usuário; autenticar e manter a segurança da conta.`,
            },
            {
              titulo: "3. Compartilhamento de dados",
              texto: `Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros, exceto: com plataformas de anúncios (Meta, Google) conforme explicitamente configurado pelo usuário para fins de rastreamento de conversões; com provedores de infraestrutura (Supabase, Vercel) necessários para o funcionamento da plataforma; quando exigido por lei ou ordem judicial.`,
            },
            {
              titulo: "4. Segurança dos dados",
              texto: `Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Os dados são armazenados em servidores seguros com criptografia em trânsito e em repouso. O acesso é protegido por autenticação e cada cliente visualiza apenas seus próprios dados.`,
            },
            {
              titulo: "5. Retenção de dados",
              texto: `Mantemos seus dados enquanto sua conta estiver ativa. Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco. Após a exclusão da conta, os dados são removidos em até 30 dias, exceto quando a retenção for exigida por lei.`,
            },
            {
              titulo: "6. Seus direitos",
              texto: `Você tem direito a: acessar, corrigir ou excluir suas informações pessoais; exportar seus dados; revogar o consentimento a qualquer momento; solicitar informações sobre como seus dados são processados. Para exercer esses direitos, entre em contato pelo email abaixo.`,
            },
            {
              titulo: "7. Cookies e rastreamento",
              texto: `A plataforma utiliza cookies de sessão necessários para autenticação e funcionamento básico. Não utilizamos cookies de rastreamento de terceiros para fins publicitários próprios.`,
            },
            {
              titulo: "8. Alterações nesta política",
              texto: `Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por email ou através da plataforma. O uso continuado após as alterações constitui aceitação da nova política.`,
            },
            {
              titulo: "9. Contato",
              texto: `Para dúvidas sobre esta política ou sobre o tratamento dos seus dados, entre em contato: Email: premfigueiredo@gmail.com | Plataforma: tom-tracking.vercel.app`,
            },
          ].map((secao) => (
            <div key={secao.titulo} style={{ marginBottom: 28 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
                {secao.titulo}
              </h2>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7 }}>
                {secao.texto}
              </p>
            </div>
          ))}

          <div style={{ marginTop: 40, padding: "16px", background: "var(--s1)", border: "1px solid var(--border)", borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              © {new Date().getFullYear()} Tom Tracking · Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

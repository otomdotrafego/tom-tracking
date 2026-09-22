// Cores semânticas por etapa
export const etapaCores: Record<string, { bg: string; text: string; border: string; borda: string }> = {
  novo:            { bg: "#0d1e2e", text: "#4a9eca", border: "#1a3a52", borda: "#4a9eca" },
  em_conversa:     { bg: "#1a1a0d", text: "#b8a832", border: "#2e2a0d", borda: "#b8a832" },
  qualificado:     { bg: "#0d1a1d", text: "#3aaa8a", border: "#0d2e28", borda: "#3aaa8a" },
  agendado:        { bg: "#0d1a1d", text: "#3aaa8a", border: "#0d2e28", borda: "#3aaa8a" },
  negociando:      { bg: "#1a1a0d", text: "#b8a832", border: "#2e2a0d", borda: "#b8a832" },
  venda_fechada:   { bg: "#0d1e14", text: "#4caf70", border: "#0d2e1a", borda: "#4caf70" },
  nao_qualificado: { bg: "#1e0d0d", text: "#c46060", border: "#2e1414", borda: "#c46060" },
};

export const canalCores: Record<string, { bg: string; text: string; border: string }> = {
  WhatsApp:   { bg: "#0d1e10", text: "#4CAF50", border: "#1a3a1c" },
  Instagram:  { bg: "#1e0d1a", text: "#c47ab8", border: "#2e1428" },
  Google:     { bg: "#0d1420", text: "#5b8dd9", border: "#0d1e38" },
  "Meta Ads": { bg: "#0d1220", text: "#4a7fd4", border: "#0d1a38" },
};

export function getBadgeEtapa(etapa: string) {
  return etapaCores[etapa] ?? { bg: "#1A1B1D", text: "#888888", border: "#222426", borda: "#222426" };
}

export function getBadgeCanal(canal: string) {
  return canalCores[canal] ?? { bg: "#1A1B1D", text: "#888888", border: "#222426" };
}

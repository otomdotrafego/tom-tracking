import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: "URL obrigatória" }, { status: 400 });

    const payload = {
      evento: "etapa_alterada",
      etapa_anterior: "novo",
      etapa_nova: "em_conversa",
      lead: {
        id: "teste-00000000",
        nome: "Lead de Teste",
        contato: "5511999999999",
        canal: "WhatsApp",
        campanha: "campanha-teste",
      },
      timestamp: new Date().toISOString(),
      source: "tom-tracking-test",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log(`[WEBHOOK-TEST] URL: ${url} | Status: ${response.status}`);
    return NextResponse.json({ ok: true, status: response.status });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

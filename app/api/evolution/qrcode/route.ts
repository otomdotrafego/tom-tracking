import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenant_id");

    if (!tenantId) {
      return NextResponse.json({ error: "tenant_id obrigatório" }, { status: 400 });
    }

    const { data: perfil } = await supabase
      .from("perfis")
      .select("evolution_url, evolution_api_key, evolution_instance")
      .eq("id", tenantId)
      .single();

    if (!perfil?.evolution_url || !perfil?.evolution_api_key || !perfil?.evolution_instance) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 400 });
    }

    const { evolution_url, evolution_api_key, evolution_instance } = perfil;

    // Primeiro tenta conectar/criar a instância se não existir
    await fetch(`${evolution_url}/instance/create`, {
      method: "POST",
      headers: { "apikey": evolution_api_key, "Content-Type": "application/json" },
      body: JSON.stringify({
        instanceName: evolution_instance,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    }).catch(() => null); // ignora erro se já existir

    // Busca o QR code
    const response = await fetch(
      `${evolution_url}/instance/connect/${evolution_instance}`,
      {
        headers: {
          "apikey": evolution_api_key,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao buscar QR code", codigo: response.status }, { status: 500 });
    }

    const data = await response.json();

    return NextResponse.json({
      qrcode: data?.base64 || data?.qrcode?.base64 || null,
      pairingCode: data?.pairingCode || null,
      status: data?.status || null,
    });

  } catch (error) {
    console.error("[EVOLUTION QRCODE]", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// Configura o webhook da Evolution para apontar para o Tom Tracking
export async function POST(request: NextRequest) {
  try {
    const { tenant_id } = await request.json();

    const { data: perfil } = await supabase
      .from("perfis")
      .select("evolution_url, evolution_api_key, evolution_instance")
      .eq("id", tenant_id)
      .single();

    if (!perfil?.evolution_url || !perfil?.evolution_api_key || !perfil?.evolution_instance) {
      return NextResponse.json({ error: "Evolution API não configurada" }, { status: 400 });
    }

    const { evolution_url, evolution_api_key, evolution_instance } = perfil;
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://tom-tracking.vercel.app"}/api/evolution/webhook`;

    // Configura o webhook na instância Evolution
    const response = await fetch(
      `${evolution_url}/webhook/set/${evolution_instance}`,
      {
        method: "POST",
        headers: { "apikey": evolution_api_key, "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events: ["MESSAGES_UPSERT"],
          },
        }),
      }
    );

    const data = await response.json();
    console.log(`[EVOLUTION] Webhook configurado para ${evolution_instance} → ${webhookUrl}`);

    return NextResponse.json({ ok: true, data });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

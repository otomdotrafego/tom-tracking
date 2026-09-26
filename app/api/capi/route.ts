import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Fallback para as credenciais globais de env (antes do multi-tenant)
const PIXEL_ID_GLOBAL = process.env.META_PIXEL_ID!;
const ACCESS_TOKEN_GLOBAL = process.env.META_ACCESS_TOKEN!;
// TEST_EVENT_CODE removido — em produção não usar

type EventName = "Lead" | "Schedule" | "Purchase" | "QualifiedLead";

function hash(value: string): string {
  return createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

function formatarTelefone(phone: string): string {
  const soNumeros = phone.replace(/\D/g, "");
  if (soNumeros.startsWith("55") && soNumeros.length >= 12) return soNumeros;
  if (soNumeros.length === 11 || soNumeros.length === 10) return `55${soNumeros}`;
  return soNumeros;
}

async function enviarEventoMeta(
  eventName: EventName,
  leadId: string,
  userData: {
    phone?: string;
    email?: string;
    nome?: string;
    fbclid?: string;
    ip?: string;
    userAgent?: string;
  },
  pixelId: string,
  accessToken: string
) {
  const phoneFormatted = userData.phone
    ? formatarTelefone(userData.phone)
    : null;

  const userDataPayload: Record<string, unknown> = {
    client_ip_address: userData.ip || "177.100.0.1",
    client_user_agent: userData.userAgent || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  };

  if (phoneFormatted) {
    userDataPayload.ph = [hash(phoneFormatted)];
  }

  if (userData.email) {
    userDataPayload.em = [hash(userData.email)];
  }

  if (userData.nome) {
    const primeiroNome = userData.nome.split(" ")[0];
    userDataPayload.fn = [hash(primeiroNome)];
  }

  if (userData.fbclid) {
    userDataPayload.fbc = `fb.1.${Date.now()}.${userData.fbclid}`;
  }

  const eventPayload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "other",
        event_source_url: "https://tom-tracking.vercel.app",
        event_id: `${leadId}_${eventName}_${Date.now()}`,
        user_data: userDataPayload,
        custom_data: {
          lead_id: leadId,
          currency: "BRL",
          value: 0,
        },
      },
  ];
  };

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    }
  );

  const json = await response.json();
  console.log(`[CAPI] Evento: ${eventName} | Pixel: ${pixelId} | Status: ${response.status} | Resposta:`, JSON.stringify(json));
  return json;
}

export async function POST(request: NextRequest) {
  try {
    const { leadId, evento } = await request.json();

    if (!leadId || !evento) {
      return NextResponse.json(
        { error: "leadId e evento são obrigatórios" },
        { status: 400 }
      );
    }

    const { data: lead, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (error || !lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "177.100.0.1";
    const userAgent = request.headers.get("user-agent") || "Mozilla/5.0";

    // Busca credenciais do tenant (pixel e token próprios do cliente)
    let pixelId = PIXEL_ID_GLOBAL;
    let accessToken = ACCESS_TOKEN_GLOBAL;
    if (lead.tenant_id) {
      const { data: perfil } = await supabase
        .from("perfis")
        .select("meta_pixel_id, meta_access_token")
        .eq("id", lead.tenant_id)
        .single();
      if (perfil?.meta_pixel_id) pixelId = perfil.meta_pixel_id;
      if (perfil?.meta_access_token) accessToken = perfil.meta_access_token;
    }

    const resultado = await enviarEventoMeta(evento, leadId, {
      phone: lead.contato,
      email: lead.email || undefined,
      nome: lead.nome,
      fbclid: lead.fbclid,
      ip,
      userAgent,
    }, pixelId, accessToken);

    await supabase
      .from("leads")
      .update({
        evento_meta: [...(lead.evento_meta || []), evento],
      })
      .eq("id", leadId);

    return NextResponse.json({ success: true, resultado });
  } catch (error) {
    console.error("CAPI error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
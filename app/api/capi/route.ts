import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PIXEL_ID = process.env.META_PIXEL_ID!;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN!;

type EventName = "Lead" | "Schedule" | "Purchase" | "QualifiedLead";

async function enviarEventoMeta(
  eventName: EventName,
  leadId: string,
  userData: {
    phone?: string;
    email?: string;
    fbclid?: string;
  }
) {
  const eventData = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "other",
        test_event_code: "TEST49535",
        user_data: {
          ph: userData.phone ? [userData.phone] : undefined,
          em: userData.email ? [userData.email] : undefined,
          fbc: userData.fbclid
            ? `fb.1.${Date.now()}.${userData.fbclid}`
            : undefined,
        },
        custom_data: {
          lead_id: leadId,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    }
  );

  return response.json();
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

    // Busca dados do lead no banco
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

    // Envia evento pro Meta CAPI
    const resultado = await enviarEventoMeta(evento, leadId, {
      phone: lead.contato,
      fbclid: lead.fbclid,
    });

    // Atualiza o lead com o evento enviado
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
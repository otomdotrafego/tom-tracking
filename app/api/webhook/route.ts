import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const VERIFY_TOKEN = "tomtracking2024";

// Verificação do webhook pelo Meta
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// Recebe eventos do Meta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Lead de formulário do Meta
    if (body.object === "page") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            const leadData = change.value;

            await supabase.from("leads").insert({
              nome: "Lead Formulário Meta",
              contato: "",
              canal: "Meta Ads",
              campanha: leadData.campaign_name || "",
              utm_source: "facebook",
              utm_medium: "cpc",
              utm_campaign: leadData.campaign_name || "",
              etapa: "novo",
            });
          }
        }
      }
    }

    // Evento Click to WhatsApp
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "messages") {
            const message = change.value?.messages?.[0];
            const contact = change.value?.contacts?.[0];

            if (message && contact) {
              await supabase.from("leads").insert({
                nome: contact.profile?.name || "Lead WhatsApp",
                contato: message.from,
                canal: "WhatsApp",
                utm_source: "facebook",
                utm_medium: "cpc",
                etapa: "novo",
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
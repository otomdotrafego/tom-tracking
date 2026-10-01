import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Extrai número limpo do JID do WhatsApp (ex: "5511999999999@s.whatsapp.net" → "5511999999999")
function extrairNumero(jid: string): string {
  return jid.replace(/@.*/, "").replace(/[^0-9]/g, "");
}

// Formata número para exibição (ex: "5511999999999" → "+55 (11) 99999-9999")
function formatarNumero(numero: string): string {
  if (numero.length === 13) {
    return `+${numero.slice(0, 2)} (${numero.slice(2, 4)}) ${numero.slice(4, 9)}-${numero.slice(9)}`;
  }
  return `+${numero}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Evolution API envia diferentes tipos de eventos
    const { event, instance, data } = body;

    // Só processa mensagens recebidas (não enviadas)
    if (event !== "messages.upsert") {
      return NextResponse.json({ ok: true, ignorado: event });
    }

    // Ignora mensagens enviadas pelo próprio número
    if (data?.key?.fromMe) {
      return NextResponse.json({ ok: true, ignorado: "fromMe" });
    }

    const remoteJid = data?.key?.remoteJid || "";

    // Ignora grupos
    if (remoteJid.includes("@g.us")) {
      return NextResponse.json({ ok: true, ignorado: "grupo" });
    }

    const numero = extrairNumero(remoteJid);
    const nomeContato = data?.pushName || "Lead WhatsApp";

    // =============================================
    // DETECÇÃO DE ANÚNCIO (Click-to-WhatsApp Meta)
    // O Meta injeta dados do anúncio no contextInfo
    // =============================================
    const contextInfo = data?.message?.extendedTextMessage?.contextInfo
      || data?.message?.imageMessage?.contextInfo
      || data?.message?.videoMessage?.contextInfo
      || data?.contextInfo
      || {};

    const adReply = contextInfo?.externalAdReply || null;

    const dadosAnuncio = adReply ? {
      campanha: adReply.title || adReply.body || "Click-to-WhatsApp",
      utm_source: "facebook",
      utm_medium: "cpc",
      utm_campaign: adReply.title || "",
      utm_content: adReply.sourceId || "",
      canal: "WhatsApp",
    } : {
      campanha: "",
      utm_source: "whatsapp",
      utm_medium: "organic",
      utm_campaign: "",
      utm_content: "",
      canal: "WhatsApp",
    };

    // =============================================
    // BUSCA O TENANT pela instância da Evolution
    // =============================================
    const { data: perfil, error: perfilError } = await supabase
      .from("perfis")
      .select("id, nome")
      .eq("evolution_instance", instance)
      .single();

    if (perfilError || !perfil) {
      console.error(`[EVOLUTION] Instância "${instance}" não encontrada em nenhum tenant`);
      return NextResponse.json({ ok: false, erro: "Instância não vinculada" }, { status: 200 });
    }

    const tenantId = perfil.id;

    // =============================================
    // VERIFICA SE LEAD JÁ EXISTE (evita duplicar)
    // =============================================
    const { data: leadExistente } = await supabase
      .from("leads")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("contato", numero)
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // últimas 24h
      .single();

    if (leadExistente) {
      console.log(`[EVOLUTION] Lead já existe para ${numero} nas últimas 24h`);
      return NextResponse.json({ ok: true, ignorado: "lead_duplicado" });
    }

    // =============================================
    // CRIA O LEAD
    // =============================================
    const { data: novoLead, error: leadError } = await supabase
      .from("leads")
      .insert({
        tenant_id: tenantId,
        nome: nomeContato,
        contato: numero,
        contato_formatado: formatarNumero(numero),
        canal: dadosAnuncio.canal,
        campanha: dadosAnuncio.campanha,
        utm_source: dadosAnuncio.utm_source,
        utm_medium: dadosAnuncio.utm_medium,
        utm_campaign: dadosAnuncio.utm_campaign,
        utm_content: dadosAnuncio.utm_content,
        etapa: "novo",
        origem: adReply ? "click_to_whatsapp" : "whatsapp_organico",
      })
      .select()
      .single();

    if (leadError) {
      console.error("[EVOLUTION] Erro ao criar lead:", leadError);
      return NextResponse.json({ ok: false, erro: leadError.message }, { status: 200 });
    }

    // Registra evento de entrada na timeline
    await supabase.from("lead_eventos").insert({
      lead_id: novoLead.id,
      tipo: "entrada",
      descricao: adReply
        ? `Lead capturado via anúncio "${dadosAnuncio.campanha}" no Meta`
        : "Lead capturado via WhatsApp orgânico",
    });

    console.log(`[EVOLUTION] Lead criado: ${nomeContato} (${numero}) | Tenant: ${tenantId} | Anúncio: ${dadosAnuncio.campanha || "orgânico"}`);

    return NextResponse.json({ ok: true, lead_id: novoLead.id });

  } catch (error) {
    console.error("[EVOLUTION] Erro no webhook:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

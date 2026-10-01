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

    // Busca credenciais da Evolution do tenant
    const { data: perfil } = await supabase
      .from("perfis")
      .select("evolution_url, evolution_api_key, evolution_instance")
      .eq("id", tenantId)
      .single();

    if (!perfil?.evolution_url || !perfil?.evolution_api_key || !perfil?.evolution_instance) {
      return NextResponse.json({ status: "não_configurado" });
    }

    const { evolution_url, evolution_api_key, evolution_instance } = perfil;

    // Consulta status da instância na Evolution API
    const response = await fetch(
      `${evolution_url}/instance/connectionState/${evolution_instance}`,
      {
        headers: {
          "apikey": evolution_api_key,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ status: "erro", codigo: response.status });
    }

    const data = await response.json();

    // Evolution retorna: open, close, connecting
    const statusMap: Record<string, string> = {
      open: "conectado",
      close: "desconectado",
      connecting: "conectando",
    };

    return NextResponse.json({
      status: statusMap[data?.instance?.state] || data?.instance?.state || "desconhecido",
      instancia: evolution_instance,
      raw: data,
    });

  } catch (error) {
    console.error("[EVOLUTION STATUS]", error);
    return NextResponse.json({ status: "erro", mensagem: String(error) });
  }
}

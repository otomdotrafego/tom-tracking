"use client";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function Redirect() {
  useEffect(() => {
    async function capturarERedireciondar() {
      const params = new URLSearchParams(window.location.search);

      const fbclid = params.get("fbclid") || "";
      const utm_source = params.get("utm_source") || "facebook";
      const utm_medium = params.get("utm_medium") || "cpc";
      const utm_campaign = params.get("utm_campaign") || "";
      const utm_content = params.get("utm_content") || "";
      const utm_term = params.get("utm_term") || "";
      const whatsapp = params.get("wa") || "";
      const mensagem = params.get("msg") || "Olá, vim pelo anúncio!";

      if (!whatsapp) {
        console.error("Número de WhatsApp não informado");
        return;
      }

      // Salva o lead no banco
      await supabase.from("leads").insert({
        nome: "Lead WhatsApp",
        contato: whatsapp,
        canal: "WhatsApp",
        campanha: utm_campaign,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        fbclid,
        etapa: "novo",
      });

      // Redireciona pro WhatsApp
      const numero = whatsapp.replace(/\D/g, "");
      const msgEncoded = encodeURIComponent(mensagem);
      window.location.href = `https://wa.me/${numero}?text=${msgEncoded}`;
    }

    capturarERedireciondar();
  }, []);

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#080909",
      flexDirection: "column",
      gap: 12,
    }}>
      <div style={{
        width: 32,
        height: 32,
        border: "2px solid #333",
        borderTop: "2px solid #888",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <p style={{ color: "#555", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
        Redirecionando...
      </p>
    </div>
  );
}
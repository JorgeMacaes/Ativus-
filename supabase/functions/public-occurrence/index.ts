import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return reply({ error: "Método não permitido." }, 405);
  try {
    const body = await req.json();
    const token = String(body?.token || "").trim();
    const description = String(body?.description || "").trim();
    const category = String(body?.category || "Outro").trim().slice(0, 80);
    const urgency = ["urgente", "normal", "nao_sei"].includes(body?.urgency) ? body.urgency : "nao_sei";
    const locationText = String(body?.location || "").trim().slice(0, 300) || null;
    const reporterName = String(body?.reporter_name || "").trim().slice(0, 120) || null;
    const reporterContact = String(body?.contact || "").trim().slice(0, 160) || null;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)) return reply({ error: "Código QR inválido." }, 400);
    if (description.length < 8 || description.length > 4000) return reply({ error: "Descreva o problema (entre 8 e 4000 caracteres)." }, 400);

    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return reply({ error: "Serviço temporariamente indisponível." }, 503);
    const admin = createClient(url, key, { auth: { persistSession: false } });

    let enterpriseId: string | null = null;
    let assetId: string | null = null;
    let componentId: string | null = null;
    let sourceName = "";
    const { data: projectToken } = await admin.from("empreendimentos").select("id,nome,ativo").eq("qr_token", token).maybeSingle();
    if (projectToken) {
      if (!projectToken.ativo) return reply({ error: "Este código já não está ativo." }, 410);
      enterpriseId = projectToken.id;
      sourceName = projectToken.nome;
    } else {
      const { data: asset } = await admin.from("ativos").select("id,empreendimento_id,nome").eq("qr_token", token).maybeSingle();
      if (asset) {
        assetId = asset.id; enterpriseId = asset.empreendimento_id; sourceName = asset.nome;
      } else {
        const { data: component } = await admin.from("componentes").select("id,empreendimento_id,ativo_id,componente_pai_id,nome").eq("qr_token", token).maybeSingle();
        if (!component) return reply({ error: "Código QR não reconhecido." }, 404);
        componentId = component.id; enterpriseId = component.empreendimento_id; assetId = component.ativo_id; sourceName = component.nome;
        let parentId = component.componente_pai_id;
        for (let depth = 0; !assetId && parentId && depth < 20; depth++) {
          const { data: parent } = await admin.from("componentes").select("ativo_id,componente_pai_id").eq("id", parentId).maybeSingle();
          if (!parent) break;
          assetId = parent.ativo_id; parentId = parent.componente_pai_id;
        }
      }
    }
    if (!enterpriseId) return reply({ error: "Não foi possível identificar o empreendimento." }, 422);
    const { data: project } = await admin.from("empreendimentos").select("id,nome,ativo").eq("id", enterpriseId).maybeSingle();
    if (!project?.ativo) return reply({ error: "O empreendimento não está ativo." }, 410);

    const { data: occurrence, error } = await admin.from("ocorrencias").insert({
      empreendimento_id: enterpriseId, ativo_id: assetId, componente_id: componentId,
      codigo: "OCR-" + crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase(),
      categoria_comunicada: category, descricao_observada: description, localizacao_texto: locationText || sourceName,
      urgencia_comunicada: urgency, canal_origem: "qr_code", estado: "por_analisar",
      reportado_nome: reporterName, reportado_contacto: reporterContact,
    }).select("codigo").single();
    if (error) { console.error("Occurrence insert failed", error.message); return reply({ error: "Não foi possível registar a ocorrência. Tente novamente." }, 500); }
    return reply({ ok: true, code: occurrence.codigo, enterprise: project.nome });
  } catch (error) {
    console.error("Public occurrence error", error);
    return reply({ error: "Não foi possível processar a comunicação." }, 500);
  }
});
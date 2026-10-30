import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
function reply(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") return reply({ error: "Método não permitido." }, 405);
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return reply({ error: "Sessão não autenticada." }, 401);
  const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return reply({ error: "Configuração interna incompleta." }, 500);
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await db.auth.getUser(authHeader.slice(7));
  if (authError || !authData.user) return reply({ error: "Sessão inválida ou expirada." }, 401);
  const user = authData.user;

  if (req.method === "GET") {
    const { data: link, error } = await db.from("fornecedor_utilizadores").select("fornecedor_id,principal").eq("utilizador_id", user.id).eq("ativo", true).maybeSingle();
    if (error) return reply({ error: "Não foi possível consultar o registo." }, 500);
    if (!link) return reply({ isSupplier: false, supplier: null });
    const [supplierRes, licenseRes, zoneRes, specialtyRes] = await Promise.all([
      db.from("fornecedores").select("id,codigo,nome_empresa,nif,email,telefone,estado_registo,criado_em").eq("id", link.fornecedor_id).single(),
      db.from("licencas_fornecedor").select("estado,inicio_em,validade_ate,planos_licenca(nome,codigo)").eq("fornecedor_id", link.fornecedor_id).order("criada_em", { ascending: false }).limit(1),
      db.from("fornecedor_zonas").select("pais,distrito,concelho").eq("fornecedor_id", link.fornecedor_id),
      db.from("fornecedor_especialidades").select("especialidades_fornecedor(nome)").eq("fornecedor_id", link.fornecedor_id),
    ]);
    if (supplierRes.error) return reply({ error: "Não foi possível carregar o fornecedor." }, 500);
    return reply({ isSupplier: true, supplier: { ...supplierRes.data, license: licenseRes.data?.[0] ?? null, zones: zoneRes.data ?? [], specialties: specialtyRes.data ?? [] } });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: "Pedido inválido." }, 400); }
  const name = String(body.name ?? "").trim();
  const nif = String(body.nif ?? "").replace(/[^0-9A-Za-z]/g, "");
  const email = String(body.email ?? user.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim();
  const planCode = String(body.planCode ?? "BASICA").trim().toUpperCase();
  const specialties = Array.isArray(body.specialties) ? body.specialties.map((v) => String(v).trim()).filter((v) => v.length > 1 && v.length <= 80).slice(0, 30) : [];
  const zones = Array.isArray(body.zones) ? body.zones.map((v) => String(v).trim()).filter((v) => v.length > 1 && v.length <= 100).slice(0, 30) : [];
  if (name.length < 2 || name.length > 180 || nif.length < 5 || nif.length > 20 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply({ error: "Indique a empresa, um NIF válido e um email válido." }, 400);
  if (!["BASICA", "PROFISSIONAL", "PREMIUM"].includes(planCode)) return reply({ error: "Plano inválido." }, 400);
  const { data: existing, error: existingError } = await db.from("fornecedor_utilizadores").select("fornecedor_id").eq("utilizador_id", user.id).maybeSingle();
  if (existingError) return reply({ error: "Não foi possível validar o utilizador." }, 500);
  if (existing) return reply({ error: "Esta conta já está associada a um fornecedor." }, 409);
  const { data: duplicate } = await db.from("fornecedores").select("id").eq("nif", nif).maybeSingle();
  if (duplicate) return reply({ error: "Já existe um fornecedor com este NIF. Contacte a administração." }, 409);
  const { data: plan, error: planError } = await db.from("planos_licenca").select("id").eq("codigo", planCode).eq("ativo", true).single();
  if (planError || !plan) return reply({ error: "O plano selecionado não está disponível." }, 400);

  const { data: supplier, error: supplierError } = await db.from("fornecedores").insert({
    codigo: `FOR-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, nome_empresa: name, nif, email, telefone: phone || null, estado_registo: "pendente",
  }).select("id,codigo,nome_empresa,nif,email,estado_registo").single();
  if (supplierError) return reply({ error: "Não foi possível criar o registo. Confirme os dados e tente novamente." }, 400);
  const { error: linkError } = await db.from("fornecedor_utilizadores").insert({ fornecedor_id: supplier.id, utilizador_id: user.id, principal: true, ativo: true });
  if (linkError) { await db.from("fornecedores").delete().eq("id", supplier.id); return reply({ error: "Não foi possível associar a conta ao fornecedor." }, 500); }
  const { error: licenseError } = await db.from("licencas_fornecedor").insert({ fornecedor_id: supplier.id, plano_id: plan.id, estado: "pendente" });
  if (licenseError) return reply({ error: "O registo foi criado, mas a licença não foi criada. Contacte a administração." }, 500);

  if (specialties.length) {
    await db.from("especialidades_fornecedor").upsert(specialties.map((nome) => ({ nome, ativa: true })), { onConflict: "nome", ignoreDuplicates: true });
    const { data: rows } = await db.from("especialidades_fornecedor").select("id,nome").in("nome", specialties);
    if (rows?.length) await db.from("fornecedor_especialidades").upsert(rows.map((row) => ({ fornecedor_id: supplier.id, especialidade_id: row.id })), { onConflict: "fornecedor_id,especialidade_id", ignoreDuplicates: true });
  }
  if (zones.length) await db.from("fornecedor_zonas").insert(zones.map((concelho) => ({ fornecedor_id: supplier.id, pais: "Portugal", concelho })));
  return reply({ success: true, supplier, message: "Registo submetido. Aguarde a validação da Seven M Ativus." }, 201);
});
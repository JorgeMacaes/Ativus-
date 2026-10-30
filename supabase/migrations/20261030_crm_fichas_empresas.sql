-- CRM: extensao da ficha empresarial e controlo de acesso por espaço.
alter table public.entidades
 add column if not exists morada text,
 add column if not exists codigo_postal text,
 add column if not exists localidade text,
 add column if not exists distrito text,
 add column if not exists concelho text,
 add column if not exists pais text not null default 'Portugal',
 add column if not exists website text,
 add column if not exists email_geral text,
 add column if not exists telefone_geral text,
 add column if not exists natureza_juridica text,
 add column if not exists cae text,
 add column if not exists situacao_registo text,
 add column if not exists origem_dados text not null default 'manual',
 add column if not exists dados_verificados_em timestamptz,
 add column if not exists notas text;

create unique index if not exists entidades_nif_unico_idx
 on public.entidades (regexp_replace(nif, '\s', '', 'g'))
 where nif is not null and btrim(nif) <> '';

drop policy if exists entidades_crm_select on public.entidades;
create policy entidades_crm_select on public.entidades for select to authenticated
 using (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidades.id and private.crm_tem_acesso(ce.id,null))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidades.id and private.crm_tem_acesso(cr.crm_espaco_id,null)));

drop policy if exists entidades_crm_insert on public.entidades;
create policy entidades_crm_insert on public.entidades for insert to authenticated
 with check (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_utilizadores cu where cu.utilizador_id=auth.uid() and cu.ativo and cu.perfil in ('administrador','gestor')));

drop policy if exists entidades_crm_update on public.entidades;
create policy entidades_crm_update on public.entidades for update to authenticated
 using (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidades.id and private.crm_tem_acesso(ce.id,array['administrador','gestor']))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidades.id and private.crm_tem_acesso(cr.crm_espaco_id,array['administrador','gestor'])))
 with check (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidades.id and private.crm_tem_acesso(ce.id,array['administrador','gestor']))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidades.id and private.crm_tem_acesso(cr.crm_espaco_id,array['administrador','gestor'])));

drop policy if exists entidade_papeis_crm_select on public.entidade_papeis;
create policy entidade_papeis_crm_select on public.entidade_papeis for select to authenticated
 using (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidade_papeis.entidade_id and private.crm_tem_acesso(ce.id,null))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidade_papeis.entidade_id and private.crm_tem_acesso(cr.crm_espaco_id,null)));

drop policy if exists entidade_papeis_crm_insert on public.entidade_papeis;
create policy entidade_papeis_crm_insert on public.entidade_papeis for insert to authenticated
 with check (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_utilizadores cu where cu.utilizador_id=auth.uid() and cu.ativo and cu.perfil in ('administrador','gestor')));

drop policy if exists entidade_papeis_crm_update on public.entidade_papeis;
create policy entidade_papeis_crm_update on public.entidade_papeis for update to authenticated
 using (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidade_papeis.entidade_id and private.crm_tem_acesso(ce.id,array['administrador','gestor']))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidade_papeis.entidade_id and private.crm_tem_acesso(cr.crm_espaco_id,array['administrador','gestor'])))
 with check (private.utilizador_e_admin_plataforma()
  or exists(select 1 from public.crm_espacos ce where ce.entidade_id=entidade_papeis.entidade_id and private.crm_tem_acesso(ce.id,array['administrador','gestor']))
  or exists(select 1 from public.crm_relacionamentos cr where cr.entidade_fornecedor_id=entidade_papeis.entidade_id and private.crm_tem_acesso(cr.crm_espaco_id,array['administrador','gestor'])));

create table if not exists public.crm_empresas (
 id uuid primary key default gen_random_uuid(),
 crm_espaco_id uuid not null references public.crm_espacos(id) on delete cascade,
 entidade_id uuid not null references public.entidades(id) on delete restrict,
 papel text not null check (papel in ('cliente','fornecedor')),
 estado text not null default 'ativo' check (estado in ('ativo','inativo','prospect')),
 criado_por uuid references auth.users(id),
 criado_em timestamptz not null default now(),
 unique(crm_espaco_id,entidade_id,papel)
);
create index if not exists crm_empresas_espaco_idx on public.crm_empresas(crm_espaco_id);
create index if not exists crm_empresas_entidade_idx on public.crm_empresas(entidade_id);
alter table public.crm_empresas enable row level security;
create policy crm_empresas_select on public.crm_empresas for select to authenticated
 using (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,null));
create policy crm_empresas_insert on public.crm_empresas for insert to authenticated
 with check (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,array['administrador','gestor']));
create policy crm_empresas_update on public.crm_empresas for update to authenticated
 using (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,array['administrador','gestor']))
 with check (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,array['administrador','gestor']));
create policy crm_empresas_delete on public.crm_empresas for delete to authenticated
 using (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,array['administrador']));

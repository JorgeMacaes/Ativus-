-- Seven M Ativus — fornecedores, licenciamento e pagamentos
-- Migration 20261030. Preparada para revisão antes de aplicar no projeto Supabase.
-- Não altera nem elimina tabelas existentes.
--
-- Modelo: os fornecedores pertencem à rede global Seven M Ativus, não a uma
-- entidade/cliente específica. Um fornecedor pode receber consultas de vários clientes.

create extension if not exists pgcrypto;

create table if not exists public.administradores_plataforma (
  utilizador_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create or replace function public.utilizador_e_admin_plataforma()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.administradores_plataforma a
    where a.utilizador_id = auth.uid()
  );
$$;

revoke all on function public.utilizador_e_admin_plataforma() from public;
grant execute on function public.utilizador_e_admin_plataforma() to authenticated;

create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome_empresa text not null,
  nif text not null unique,
  email text not null,
  telefone text,
  morada text,
  codigo_postal text,
  localidade text,
  pais text not null default 'Portugal',
  website text,
  estado_registo text not null default 'pendente'
    check (estado_registo in ('pendente','validado','rejeitado','suspenso')),
  observacoes_admin text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.fornecedor_utilizadores (
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  utilizador_id uuid not null references auth.users(id) on delete cascade,
  principal boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  primary key (fornecedor_id, utilizador_id),
  unique (utilizador_id)
);

create table if not exists public.planos_licenca (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  descricao text,
  preco_anual numeric(12,2) not null default 0 check (preco_anual >= 0),
  ativo boolean not null default true,
  ordem smallint not null default 0,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

insert into public.planos_licenca (codigo,nome,descricao,preco_anual,ordem)
values
 ('BASICA','Básica','Presença na rede e receção de consultas',0,1),
 ('PROFISSIONAL','Profissional','Gestão de propostas e histórico',0,2),
 ('PREMIUM','Premium','Funcionalidades avançadas e indicadores',0,3)
on conflict (codigo) do nothing;

create table if not exists public.licencas_fornecedor (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete restrict,
  plano_id uuid not null references public.planos_licenca(id) on delete restrict,
  estado text not null default 'pendente'
    check (estado in ('pendente','ativa','expirada','suspensa','cancelada')),
  inicio_em date,
  validade_ate date,
  renovacao_automatica boolean not null default false,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  constraint licenca_datas_validas check (
    validade_ate is null or inicio_em is null or validade_ate >= inicio_em
  )
);
create index if not exists licencas_fornecedor_estado_idx
  on public.licencas_fornecedor(fornecedor_id,estado,validade_ate desc);

create table if not exists public.pagamentos_licenca (
  id uuid primary key default gen_random_uuid(),
  licenca_id uuid not null references public.licencas_fornecedor(id) on delete restrict,
  valor numeric(12,2) not null check (valor >= 0),
  metodo text not null default 'multibanco'
    check (metodo in ('multibanco','transferencia','cartao','outro')),
  estado text not null default 'pendente'
    check (estado in ('pendente','pago','falhado','expirado','reembolsado','cancelado')),
  entidade_pagamento text,
  referencia text,
  identificador_transacao text,
  criado_em timestamptz not null default now(),
  pago_em timestamptz,
  expira_em timestamptz,
  dados_prestador jsonb not null default '{}'::jsonb
);
create index if not exists pagamentos_licenca_estado_idx
  on public.pagamentos_licenca(estado,criado_em desc);
create unique index if not exists pagamentos_licenca_referencia_unica
  on public.pagamentos_licenca(referencia)
  where referencia is not null;

create table if not exists public.especialidades_fornecedor (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  ativa boolean not null default true
);

create table if not exists public.fornecedor_especialidades (
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  especialidade_id uuid not null references public.especialidades_fornecedor(id) on delete restrict,
  primary key (fornecedor_id,especialidade_id)
);

create table if not exists public.fornecedor_zonas (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references public.fornecedores(id) on delete cascade,
  pais text not null default 'Portugal',
  distrito text,
  concelho text,
  criado_em timestamptz not null default now()
);

-- Ativação automática da expiração por consulta: uma licença fora da validade
-- não é considerada ativa, mesmo que o estado ainda não tenha sido atualizado.
create or replace function public.fornecedor_tem_licenca_ativa(fornecedor_alvo uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.licencas_fornecedor l
    join public.fornecedores f on f.id = l.fornecedor_id
    where l.fornecedor_id = fornecedor_alvo
      and l.estado = 'ativa'
      and f.estado_registo = 'validado'
      and (l.validade_ate is null or l.validade_ate >= current_date)
  );
$$;

revoke all on function public.fornecedor_tem_licenca_ativa(uuid) from public;
grant execute on function public.fornecedor_tem_licenca_ativa(uuid) to authenticated;

alter table public.administradores_plataforma enable row level security;
alter table public.fornecedores enable row level security;
alter table public.fornecedor_utilizadores enable row level security;
alter table public.planos_licenca enable row level security;
alter table public.licencas_fornecedor enable row level security;
alter table public.pagamentos_licenca enable row level security;
alter table public.especialidades_fornecedor enable row level security;
alter table public.fornecedor_especialidades enable row level security;
alter table public.fornecedor_zonas enable row level security;

drop policy if exists admin_plataforma_consultar_proprio on public.administradores_plataforma;
create policy admin_plataforma_consultar_proprio
on public.administradores_plataforma for select to authenticated
using (utilizador_id = auth.uid());

drop policy if exists fornecedores_consultar_proprios_ou_admin on public.fornecedores;
create policy fornecedores_consultar_proprios_ou_admin
on public.fornecedores for select to authenticated
using (
  public.utilizador_e_admin_plataforma()
  or exists (
    select 1 from public.fornecedor_utilizadores fu
    where fu.fornecedor_id = id
      and fu.utilizador_id = auth.uid()
      and fu.ativo = true
  )
);

drop policy if exists fornecedores_admin_gerir on public.fornecedores;
create policy fornecedores_admin_gerir
on public.fornecedores for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists fornecedor_utilizadores_proprios_ou_admin on public.fornecedor_utilizadores;
create policy fornecedor_utilizadores_proprios_ou_admin
on public.fornecedor_utilizadores for select to authenticated
using (
  utilizador_id = auth.uid()
  or public.utilizador_e_admin_plataforma()
);

drop policy if exists fornecedor_utilizadores_admin_gerir on public.fornecedor_utilizadores;
create policy fornecedor_utilizadores_admin_gerir
on public.fornecedor_utilizadores for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists planos_licenca_consultar_ativos on public.planos_licenca;
create policy planos_licenca_consultar_ativos
on public.planos_licenca for select to authenticated
using (ativo = true or public.utilizador_e_admin_plataforma());

drop policy if exists planos_licenca_admin_gerir on public.planos_licenca;
create policy planos_licenca_admin_gerir
on public.planos_licenca for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists licencas_fornecedor_consultar_proprias on public.licencas_fornecedor;
create policy licencas_fornecedor_consultar_proprias
on public.licencas_fornecedor for select to authenticated
using (
  public.utilizador_e_admin_plataforma()
  or exists (
    select 1 from public.fornecedor_utilizadores fu
    where fu.fornecedor_id = fornecedor_id
      and fu.utilizador_id = auth.uid()
      and fu.ativo = true
  )
);

drop policy if exists licencas_fornecedor_admin_gerir on public.licencas_fornecedor;
create policy licencas_fornecedor_admin_gerir
on public.licencas_fornecedor for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists pagamentos_licenca_consultar_proprios on public.pagamentos_licenca;
create policy pagamentos_licenca_consultar_proprios
on public.pagamentos_licenca for select to authenticated
using (
  public.utilizador_e_admin_plataforma()
  or exists (
    select 1
    from public.licencas_fornecedor l
    join public.fornecedor_utilizadores fu on fu.fornecedor_id = l.fornecedor_id
    where l.id = licenca_id
      and fu.utilizador_id = auth.uid()
      and fu.ativo = true
  )
);

drop policy if exists pagamentos_licenca_admin_gerir on public.pagamentos_licenca;
create policy pagamentos_licenca_admin_gerir
on public.pagamentos_licenca for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists especialidades_consultar_ativas on public.especialidades_fornecedor;
create policy especialidades_consultar_ativas
on public.especialidades_fornecedor for select to authenticated
using (ativa = true or public.utilizador_e_admin_plataforma());

drop policy if exists especialidades_admin_gerir on public.especialidades_fornecedor;
create policy especialidades_admin_gerir
on public.especialidades_fornecedor for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists fornecedor_especialidades_consultar_proprias on public.fornecedor_especialidades;
create policy fornecedor_especialidades_consultar_proprias
on public.fornecedor_especialidades for select to authenticated
using (
  public.utilizador_e_admin_plataforma()
  or exists (
    select 1 from public.fornecedor_utilizadores fu
    where fu.fornecedor_id = fornecedor_id
      and fu.utilizador_id = auth.uid()
      and fu.ativo = true
  )
);

drop policy if exists fornecedor_especialidades_admin_gerir on public.fornecedor_especialidades;
create policy fornecedor_especialidades_admin_gerir
on public.fornecedor_especialidades for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

drop policy if exists fornecedor_zonas_consultar_proprias on public.fornecedor_zonas;
create policy fornecedor_zonas_consultar_proprias
on public.fornecedor_zonas for select to authenticated
using (
  public.utilizador_e_admin_plataforma()
  or exists (
    select 1 from public.fornecedor_utilizadores fu
    where fu.fornecedor_id = fornecedor_id
      and fu.utilizador_id = auth.uid()
      and fu.ativo = true
  )
);

drop policy if exists fornecedor_zonas_admin_gerir on public.fornecedor_zonas;
create policy fornecedor_zonas_admin_gerir
on public.fornecedor_zonas for all to authenticated
using (public.utilizador_e_admin_plataforma())
with check (public.utilizador_e_admin_plataforma());

-- Nota de implementação:
-- 1) Atribuir o primeiro administrador da plataforma através de processo confiável
--    no SQL Editor, usando o UUID do utilizador autenticado; nunca pelo cliente web.
-- 2) Criar fornecedor e associar o utilizador através de função/Edge Function confiável.
-- 3) A referência Multibanco e a confirmação do pagamento devem ser geradas/validadas
--    no servidor pelo prestador de pagamentos; nunca aceitar "pago" do browser.
-- 4) O acesso às consultas de trabalho deve verificar fornecedor_tem_licenca_ativa().

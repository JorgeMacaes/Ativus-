-- Seven M Ativus | CRM híbrido | Fundação multi-tenant
-- Preserva tabelas e registos existentes. Não cria espaços para entidades antigas
-- duplicadas, cuja correspondência deve ser validada antes de qualquer migração.

create table if not exists public.entidade_papeis (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  papel text not null check (papel in ('cliente','fornecedor')),
  origem text not null default 'manual' check (origem in ('manual','rede_global','sistema')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (entidade_id, papel)
);

alter table public.fornecedores add column if not exists entidade_id uuid;

insert into public.entidades (nome, nif, ativa)
select f.nome_empresa, f.nif, true
from public.fornecedores f
where f.entidade_id is null
  and not exists (select 1 from public.entidades e where e.nif = f.nif);

update public.fornecedores f
set entidade_id = e.id
from public.entidades e
where f.entidade_id is null and e.nif = f.nif;

alter table public.fornecedores
  add constraint fornecedores_entidade_id_fkey
  foreign key (entidade_id) references public.entidades(id) on delete restrict;

create unique index if not exists fornecedores_entidade_id_uidx
  on public.fornecedores(entidade_id) where entidade_id is not null;

insert into public.entidade_papeis (entidade_id, papel, origem)
select f.entidade_id, 'fornecedor', 'rede_global'
from public.fornecedores f where f.entidade_id is not null
on conflict (entidade_id, papel) do update set ativo = true;

create table if not exists public.crm_espacos (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null unique references public.entidades(id) on delete restrict,
  nome text not null,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (id, entidade_id)
);

create table if not exists public.crm_utilizadores (
  id uuid primary key default gen_random_uuid(),
  crm_espaco_id uuid not null references public.crm_espacos(id) on delete cascade,
  utilizador_id uuid not null references auth.users(id) on delete cascade,
  perfil text not null default 'consulta'
    check (perfil in ('administrador','gestor','tecnico','consulta')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  unique (crm_espaco_id, utilizador_id)
);

create table if not exists public.crm_contactos (
  id uuid primary key default gen_random_uuid(),
  crm_espaco_id uuid not null references public.crm_espacos(id) on delete cascade,
  entidade_id uuid references public.entidades(id) on delete set null,
  nome text not null,
  cargo text,
  email text,
  telefone text,
  notas text,
  ativo boolean not null default true,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.crm_relacionamentos (
  id uuid primary key default gen_random_uuid(),
  crm_espaco_id uuid not null,
  entidade_cliente_id uuid not null,
  entidade_fornecedor_id uuid not null references public.entidades(id) on delete restrict,
  origem text not null default 'rede_global'
    check (origem in ('rede_global','privado')),
  estado text not null default 'ativo'
    check (estado in ('ativo','suspenso','terminado')),
  notas text,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint crm_rel_espaco_cliente_fk
    foreign key (crm_espaco_id, entidade_cliente_id)
    references public.crm_espacos(id, entidade_id) on delete cascade,
  constraint crm_rel_fornecedor_cliente_unique
    unique (crm_espaco_id, entidade_fornecedor_id)
);

create or replace function private.crm_tem_acesso(
  p_crm_espaco_id uuid,
  p_perfis text[] default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth
as $$
  select exists (
    select 1 from public.crm_utilizadores cu
    where cu.crm_espaco_id = p_crm_espaco_id
      and cu.utilizador_id = (select auth.uid())
      and cu.ativo = true
      and (p_perfis is null or cu.perfil = any(p_perfis))
  );
$$;

revoke all on function private.crm_tem_acesso(uuid, text[]) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.crm_tem_acesso(uuid, text[]) to authenticated;

alter table public.entidade_papeis enable row level security;
alter table public.crm_espacos enable row level security;
alter table public.crm_utilizadores enable row level security;
alter table public.crm_contactos enable row level security;
alter table public.crm_relacionamentos enable row level security;

create policy entidade_papeis_admin_select on public.entidade_papeis
for select to authenticated using (private.utilizador_e_admin_plataforma());

create policy crm_espacos_select on public.crm_espacos
for select to authenticated using (
  private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(id, null)
);
create policy crm_espacos_admin_manage on public.crm_espacos
for all to authenticated
using (private.utilizador_e_admin_plataforma())
with check (private.utilizador_e_admin_plataforma());

create policy crm_utilizadores_select on public.crm_utilizadores
for select to authenticated using (
  private.utilizador_e_admin_plataforma()
  or utilizador_id = (select auth.uid())
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);
create policy crm_utilizadores_admin_manage on public.crm_utilizadores
for all to authenticated
using (private.utilizador_e_admin_plataforma())
with check (private.utilizador_e_admin_plataforma());

create policy crm_contactos_select on public.crm_contactos
for select to authenticated using (
  private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id, null)
);
create policy crm_contactos_insert on public.crm_contactos
for insert to authenticated with check (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);
create policy crm_contactos_update on public.crm_contactos
for update to authenticated
using (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
)
with check (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);
create policy crm_contactos_delete on public.crm_contactos
for delete to authenticated using (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);

create policy crm_relacionamentos_select on public.crm_relacionamentos
for select to authenticated using (
  private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id, null)
);
create policy crm_relacionamentos_insert on public.crm_relacionamentos
for insert to authenticated with check (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);
create policy crm_relacionamentos_update on public.crm_relacionamentos
for update to authenticated
using (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
)
with check (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);
create policy crm_relacionamentos_delete on public.crm_relacionamentos
for delete to authenticated using (
  private.utilizador_e_admin_plataforma()
  or private.crm_tem_acesso(crm_espaco_id, array['administrador','gestor'])
);

comment on table public.entidade_papeis is
'Papéis funcionais da identidade empresarial global: cliente e/ou fornecedor.';
comment on table public.crm_espacos is
'Espaço CRM privado de uma entidade cliente. Cada entidade tem no máximo um espaço.';
comment on table public.crm_utilizadores is
'Utilizadores e perfis autorizados em cada espaço CRM.';
comment on table public.crm_contactos is
'Contactos geridos dentro do espaço CRM de cada cliente.';
comment on table public.crm_relacionamentos is
'Relações privadas entre um espaço CRM cliente e fornecedores da rede ou privados.';
comment on column public.fornecedores.entidade_id is
'Identidade empresarial global associada ao registo de fornecedor.';

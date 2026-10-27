-- Seven M Ativus — primeira migração para inventário e perfis
-- Aplicar apenas no projeto Supabase correto, depois de rever este ficheiro.
-- Não elimina nem altera as tabelas existentes.

create table if not exists public.ativos (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete restrict,
  empreendimento_id uuid not null,
  codigo text not null,
  nome text not null,
  tipo text not null,
  morada text,
  estado text not null default 'ativo',
  classe_ec smallint check (classe_ec between 0 and 5),
  atributos jsonb not null default '{}'::jsonb,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint ativos_entidade_codigo_unico unique (entidade_id, codigo),
  constraint ativos_entidade_id_unico unique (entidade_id, id),
  constraint ativos_empreendimento_da_entidade_fk
    foreign key (entidade_id, empreendimento_id)
    references public.empreendimentos(entidade_id, id)
    on delete restrict
);

create index if not exists ativos_entidade_idx
  on public.ativos(entidade_id);
create index if not exists ativos_empreendimento_idx
  on public.ativos(entidade_id, empreendimento_id);

create table if not exists public.atribuicoes_ativos (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  ativo_id uuid not null,
  utilizador_id uuid not null references auth.users(id) on delete cascade,
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint atribuicoes_ativo_entidade_fk
    foreign key (entidade_id, ativo_id)
    references public.ativos(entidade_id, id) on delete cascade,
  constraint atribuicao_ativo_utilizador_unica
    unique (ativo_id, utilizador_id)
);

create index if not exists atribuicoes_utilizador_idx
  on public.atribuicoes_ativos(utilizador_id, ativo_id);

-- SECURITY DEFINER evita recursão das políticas ao consultar membros_entidade.
create or replace function public.utilizador_tem_perfil(
  entidade_alvo uuid,
  perfis_permitidos text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membros_entidade m
    where m.entidade_id = entidade_alvo
      and m.utilizador_id = auth.uid()
      and m.ativo = true
      and m.perfil = any(perfis_permitidos)
  );
$$;

create or replace function public.utilizador_tem_acesso_ativo(
  ativo_alvo uuid,
  entidade_alvo uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    public.utilizador_tem_perfil(
      entidade_alvo,
      array['administrador','gestor']::text[]
    )
    or exists (
      select 1
      from public.atribuicoes_ativos aa
      join public.membros_entidade m
        on m.entidade_id = aa.entidade_id
       and m.utilizador_id = aa.utilizador_id
       and m.ativo = true
      where aa.ativo_id = ativo_alvo
        and aa.entidade_id = entidade_alvo
        and aa.utilizador_id = auth.uid()
    );
$$;

revoke all on function public.utilizador_tem_perfil(uuid, text[]) from public;
revoke all on function public.utilizador_tem_acesso_ativo(uuid, uuid) from public;
grant execute on function public.utilizador_tem_perfil(uuid, text[]) to authenticated;
grant execute on function public.utilizador_tem_acesso_ativo(uuid, uuid) to authenticated;

alter table public.ativos enable row level security;
alter table public.atribuicoes_ativos enable row level security;

drop policy if exists ativos_consultar_autorizados on public.ativos;
create policy ativos_consultar_autorizados
on public.ativos for select to authenticated
using (public.utilizador_tem_acesso_ativo(id, entidade_id));

drop policy if exists ativos_criar_gestor on public.ativos;
create policy ativos_criar_gestor
on public.ativos for insert to authenticated
with check (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
  and criado_por = auth.uid()
);

drop policy if exists ativos_atualizar_gestor on public.ativos;
create policy ativos_atualizar_gestor
on public.ativos for update to authenticated
using (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
)
with check (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
);

drop policy if exists ativos_eliminar_administrador on public.ativos;
create policy ativos_eliminar_administrador
on public.ativos for delete to authenticated
using (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador']::text[]
  )
);

drop policy if exists atribuicoes_consultar_gestores_ou_proprias on public.atribuicoes_ativos;
create policy atribuicoes_consultar_gestores_ou_proprias
on public.atribuicoes_ativos for select to authenticated
using (
  utilizador_id = auth.uid()
  or public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
);

drop policy if exists atribuicoes_gerir_administrador_gestor on public.atribuicoes_ativos;
create policy atribuicoes_gerir_administrador_gestor
on public.atribuicoes_ativos for all to authenticated
using (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
)
with check (
  public.utilizador_tem_perfil(
    entidade_id,
    array['administrador','gestor']::text[]
  )
);

-- Nota: os utilizadores técnicos e de consulta só veem ativos atribuídos.
-- A aplicação ainda precisa de autenticação e CRUD Supabase antes de usar estes dados.

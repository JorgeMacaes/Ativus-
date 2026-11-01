-- ATIVUS — ativos autónomos e componentes ligados diretamente ao ativo
-- Preserva os registos e as associações existentes.
-- Os registos antigos recebem a entidade gestora do empreendimento atual;
-- o empreendimento_id original não é alterado.

alter table public.ativos
  add column if not exists entidade_id uuid;

update public.ativos a
set entidade_id = e.entidade_id
from public.empreendimentos e
where a.empreendimento_id = e.id
  and a.entidade_id is null;

do $$
begin
  if exists (select 1 from public.ativos where entidade_id is null) then
    raise exception 'Existem ativos sem empreendimento/entidade identificável. A migração foi interrompida para preservar esses registos.';
  end if;
end $$;

alter table public.ativos
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null,
  add column if not exists localizacao_detalhada text;

alter table public.ativos
  add constraint ativos_entidade_id_fkey
  foreign key (entidade_id) references public.entidades(id) on delete restrict;

create unique index if not exists ativos_entidade_id_id_unico
  on public.ativos(entidade_id,id);

create unique index if not exists ativos_entidade_codigo_unico
  on public.ativos(entidade_id,codigo);

create index if not exists ativos_entidade_sem_empreendimento_idx
  on public.ativos(entidade_id,criado_em desc)
  where empreendimento_id is null;

-- Componentes e subcomponentes mantêm a hierarquia existente e passam a
-- pertencer diretamente à entidade gestora e ao ativo, sem exigir empreendimento.
alter table public.componentes
  add column if not exists entidade_id uuid;

update public.componentes c
set entidade_id = coalesce(a.entidade_id,e.entidade_id)
from public.empreendimentos e
left join public.ativos a on a.empreendimento_id=e.id
where c.empreendimento_id=e.id
  and c.entidade_id is null
  and (a.id is null or c.ativo_id=a.id);

update public.componentes c
set entidade_id=a.entidade_id
from public.ativos a
where c.ativo_id=a.id and c.entidade_id is null;

do $$
begin
  if exists (select 1 from public.componentes where entidade_id is null) then
    raise exception 'Existem componentes sem entidade gestora identificável. A migração foi interrompida para preservar esses registos.';
  end if;
end $$;

alter table public.componentes
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.componentes
  add constraint componentes_entidade_id_fkey
  foreign key (entidade_id) references public.entidades(id) on delete restrict;

create unique index if not exists componentes_entidade_id_id_unico
  on public.componentes(entidade_id,id);

-- Garantir que um componente não pode apontar para um ativo de outra entidade.
alter table public.componentes
  add constraint componentes_ativo_mesma_entidade_fk
  foreign key (entidade_id,ativo_id)
  references public.ativos(entidade_id,id)
  on delete cascade;

-- As políticas antigas dependiam sempre de empreendimento_id.
drop policy if exists ativus_ativos_select on public.ativos;
drop policy if exists ativus_ativos_insert on public.ativos;
drop policy if exists ativus_ativos_update on public.ativos;
drop policy if exists ativus_ativos_delete on public.ativos;

create policy ativus_ativos_select
on public.ativos for select to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor','tecnico','consulta']::text[]));

create policy ativus_ativos_insert
on public.ativos for insert to authenticated
with check (
  public.utilizador_tem_perfil(entidade_id,array['administrador','gestor']::text[])
  and (criado_por is null or criado_por=auth.uid())
);

create policy ativus_ativos_update
on public.ativos for update to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor']::text[]))
with check (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor']::text[]));

create policy ativus_ativos_delete
on public.ativos for delete to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador']::text[]));

drop policy if exists ativus_componentes_select on public.componentes;
drop policy if exists ativus_componentes_insert on public.componentes;
drop policy if exists ativus_componentes_update on public.componentes;
drop policy if exists ativus_componentes_delete on public.componentes;

create policy ativus_componentes_select
on public.componentes for select to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor','tecnico','consulta']::text[]));

create policy ativus_componentes_insert
on public.componentes for insert to authenticated
with check (
  public.utilizador_tem_perfil(entidade_id,array['administrador','gestor','tecnico']::text[])
  and (criado_por is null or criado_por=auth.uid())
);

create policy ativus_componentes_update
on public.componentes for update to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor','tecnico']::text[]))
with check (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor','tecnico']::text[]));

create policy ativus_componentes_delete
on public.componentes for delete to authenticated
using (public.utilizador_tem_perfil(entidade_id,array['administrador','gestor']::text[]));

comment on column public.ativos.empreendimento_id is
  'Associação opcional a um empreendimento/agrupamento. A entidade gestora é sempre obrigatória.';
comment on column public.ativos.localizacao_detalhada is
  'Localização interna detalhada do ativo, independente da morada/localização geral.';

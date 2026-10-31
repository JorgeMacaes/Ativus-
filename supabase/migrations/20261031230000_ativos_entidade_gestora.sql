-- Ativus: ativos diretamente associados à entidade gestora.
-- Migração aditiva: preserva empreendimentos e todos os relacionamentos existentes.
begin;

alter table public.ativos
  add column if not exists entidade_id uuid;

update public.ativos a
set entidade_id = e.entidade_id
from public.empreendimentos e
where e.id = a.empreendimento_id
  and a.entidade_id is null;

do $$
begin
  if exists (select 1 from public.ativos where entidade_id is null) then
    raise exception 'Migração interrompida: existem ativos sem entidade gestora identificável.';
  end if;
end $$;

alter table public.ativos
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.ativos
  add constraint ativos_entidade_id_fkey
  foreign key (entidade_id) references public.entidades(id) on delete restrict;

create index if not exists ativos_entidade_id_idx on public.ativos(entidade_id);

-- Componentes mantêm a ligação ao empreendimento quando já existe,
-- mas passam a poder pertencer a um ativo autónomo.
alter table public.componentes
  add column if not exists entidade_id uuid;

update public.componentes c
set entidade_id = e.entidade_id
from public.empreendimentos e
where e.id = c.empreendimento_id
  and c.entidade_id is null;

-- Componentes sem empreendimento, mas ligados a um ativo, herdam a entidade do ativo.
update public.componentes c
set entidade_id = a.entidade_id
from public.ativos a
where a.id = c.ativo_id
  and c.entidade_id is null;

do $$
begin
  if exists (select 1 from public.componentes where entidade_id is null) then
    raise exception 'Migração interrompida: existem componentes sem entidade gestora identificável.';
  end if;
end $$;

alter table public.componentes
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.componentes
  add constraint componentes_entidade_id_fkey
  foreign key (entidade_id) references public.entidades(id) on delete restrict;

create index if not exists componentes_entidade_id_idx on public.componentes(entidade_id);

-- Acesso à entidade respeita membros ativos e administradores da plataforma.
drop policy if exists ativus_ativos_select on public.ativos;
drop policy if exists ativus_ativos_insert on public.ativos;
drop policy if exists ativus_ativos_update on public.ativos;
drop policy if exists ativus_ativos_delete on public.ativos;

create policy ativus_ativos_select on public.ativos
for select to authenticated
using (public.user_can_access_entidade(entidade_id));

create policy ativus_ativos_insert on public.ativos
for insert to authenticated
with check (public.user_can_access_entidade(entidade_id));

create policy ativus_ativos_update on public.ativos
for update to authenticated
using (public.user_can_access_entidade(entidade_id))
with check (public.user_can_access_entidade(entidade_id));

create policy ativus_ativos_delete on public.ativos
for delete to authenticated
using (public.user_can_access_entidade(entidade_id));

drop policy if exists ativus_componentes_select on public.componentes;
drop policy if exists ativus_componentes_insert on public.componentes;
drop policy if exists ativus_componentes_update on public.componentes;
drop policy if exists ativus_componentes_delete on public.componentes;

create policy ativus_componentes_select on public.componentes
for select to authenticated
using (public.user_can_access_entidade(entidade_id));

create policy ativus_componentes_insert on public.componentes
for insert to authenticated
with check (
  public.user_can_access_entidade(entidade_id)
  and exists (
    select 1 from public.ativos a
    where a.id = componentes.ativo_id
      and a.entidade_id = componentes.entidade_id
  )
);

create policy ativus_componentes_update on public.componentes
for update to authenticated
using (public.user_can_access_entidade(entidade_id))
with check (public.user_can_access_entidade(entidade_id));

create policy ativus_componentes_delete on public.componentes
for delete to authenticated
using (public.user_can_access_entidade(entidade_id));

commit;

-- ATIVUS — inspeções, patologias e trabalhos ligados diretamente ao ativo
-- Mantém os empreendimentos históricos e permite registos novos sem empreendimento.
-- Os registos antigos não são reassociados a ativos por inferência.

alter table public.inspecoes
  add column if not exists entidade_id uuid,
  add column if not exists ativo_id uuid;

update public.inspecoes i
set entidade_id=e.entidade_id
from public.empreendimentos e
where i.empreendimento_id=e.id and i.entidade_id is null;

alter table public.patologias add column if not exists entidade_id uuid;
update public.patologias p
set entidade_id=e.entidade_id
from public.empreendimentos e
where p.empreendimento_id=e.id and p.entidade_id is null;

alter table public.trabalhos add column if not exists entidade_id uuid;
update public.trabalhos t
set entidade_id=e.entidade_id
from public.empreendimentos e
where t.empreendimento_id=e.id and t.entidade_id is null;

do $fn$
begin
  if exists(select 1 from public.inspecoes where entidade_id is null)
     or exists(select 1 from public.patologias where entidade_id is null)
     or exists(select 1 from public.trabalhos where entidade_id is null) then
    raise exception 'Há registos sem entidade gestora identificável. Migração interrompida sem alterar associações.';
  end if;
end;
$fn$;

alter table public.inspecoes
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.patologias
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.trabalhos
  alter column entidade_id set not null,
  alter column empreendimento_id drop not null;

alter table public.inspecoes
  add constraint inspecoes_entidade_id_fkey foreign key(entidade_id)
  references public.entidades(id) on delete restrict,
  add constraint inspecoes_ativo_mesma_entidade_fk foreign key(entidade_id,ativo_id)
  references public.ativos(entidade_id,id) on delete restrict;

alter table public.patologias
  add constraint patologias_entidade_id_fkey foreign key(entidade_id)
  references public.entidades(id) on delete restrict,
  add constraint patologias_ativo_mesma_entidade_fk foreign key(entidade_id,ativo_id)
  references public.ativos(entidade_id,id) on delete restrict;

alter table public.trabalhos
  add constraint trabalhos_entidade_id_fkey foreign key(entidade_id)
  references public.entidades(id) on delete restrict,
  add constraint trabalhos_ativo_mesma_entidade_fk foreign key(entidade_id,ativo_id)
  references public.ativos(entidade_id,id) on delete restrict;

alter table public.inspecoes
  add constraint inspecoes_ativo_ou_empreendimento_check
  check (ativo_id is not null or empreendimento_id is not null);
alter table public.patologias
  add constraint patologias_ativo_ou_empreendimento_check
  check (ativo_id is not null or empreendimento_id is not null);
alter table public.trabalhos
  add constraint trabalhos_ativo_ou_empreendimento_check
  check (ativo_id is not null or empreendimento_id is not null);

create unique index if not exists inspecoes_entidade_codigo_unico on public.inspecoes(entidade_id,codigo);
create unique index if not exists patologias_entidade_codigo_unico on public.patologias(entidade_id,codigo);
create unique index if not exists trabalhos_entidade_codigo_unico on public.trabalhos(entidade_id,codigo);

create index if not exists inspecoes_entidade_ativo_data_idx on public.inspecoes(entidade_id,ativo_id,data_inspecao desc);
create index if not exists patologias_entidade_ativo_idx on public.patologias(entidade_id,ativo_id);
create index if not exists trabalhos_entidade_ativo_idx on public.trabalhos(entidade_id,ativo_id);

drop policy if exists ativus_inspecoes_select on public.inspecoes;
drop policy if exists ativus_inspecoes_insert on public.inspecoes;
drop policy if exists ativus_inspecoes_update on public.inspecoes;
drop policy if exists ativus_inspecoes_delete on public.inspecoes;
create policy ativus_inspecoes_select on public.inspecoes for select to authenticated
using(public.user_can_access_entity(entidade_id));
create policy ativus_inspecoes_insert on public.inspecoes for insert to authenticated
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_inspecoes_update on public.inspecoes for update to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]))
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_inspecoes_delete on public.inspecoes for delete to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor']::text[]));

drop policy if exists ativus_patologias_select on public.patologias;
drop policy if exists ativus_patologias_insert on public.patologias;
drop policy if exists ativus_patologias_update on public.patologias;
drop policy if exists ativus_patologias_delete on public.patologias;
create policy ativus_patologias_select on public.patologias for select to authenticated
using(public.user_can_access_entity(entidade_id));
create policy ativus_patologias_insert on public.patologias for insert to authenticated
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_patologias_update on public.patologias for update to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]))
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_patologias_delete on public.patologias for delete to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor']::text[]));

drop policy if exists ativus_trabalhos_select on public.trabalhos;
drop policy if exists ativus_trabalhos_insert on public.trabalhos;
drop policy if exists ativus_trabalhos_update on public.trabalhos;
drop policy if exists ativus_trabalhos_delete on public.trabalhos;
create policy ativus_trabalhos_select on public.trabalhos for select to authenticated
using(public.user_can_access_entity(entidade_id));
create policy ativus_trabalhos_insert on public.trabalhos for insert to authenticated
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_trabalhos_update on public.trabalhos for update to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]))
with check(public.user_has_entity_role(entidade_id,array['administrador','gestor','tecnico']::text[]));
create policy ativus_trabalhos_delete on public.trabalhos for delete to authenticated
using(public.user_has_entity_role(entidade_id,array['administrador','gestor']::text[]));

comment on column public.inspecoes.ativo_id is 'Ativo diretamente inspecionado; obrigatório para novas inspeções autónomas.';
comment on column public.inspecoes.empreendimento_id is 'Agrupamento opcional, preservado nos registos históricos.';
comment on column public.patologias.empreendimento_id is 'Agrupamento opcional; a patologia pode estar ligada diretamente ao ativo/componente.';
comment on column public.trabalhos.empreendimento_id is 'Agrupamento opcional; o trabalho pode estar ligado diretamente ao ativo/componente.';

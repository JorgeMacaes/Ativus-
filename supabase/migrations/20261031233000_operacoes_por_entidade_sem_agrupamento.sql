-- Permitir operações técnicas sem agrupamento obrigatório.
-- Entidade gestora passa a ser a chave de autorização; empreendimento mantém-se opcional.
begin;

do $$
declare t text;
begin
  foreach t in array array[
    'inspecoes','patologias','trabalhos','ocorrencias',
    'documentos_tecnicos','ai_levantamentos','dispositivos_monitorizacao'
  ] loop
    execute format('alter table public.%I add column if not exists entidade_id uuid',t);
    execute format(
      'update public.%I x set entidade_id=e.entidade_id from public.empreendimentos e where e.id=x.empreendimento_id and x.entidade_id is null',
      t
    );
    execute format(
      'update public.%I x set entidade_id=a.entidade_id from public.ativos a where a.id=x.ativo_id and x.entidade_id is null',
      t
    );
    if exists (execute format('select 1 from public.%I where entidade_id is null limit 1',t)) then
      raise exception 'Migração interrompida: a tabela % ainda tem registos sem entidade gestora.',t;
    end if;
    execute format('alter table public.%I alter column empreendimento_id drop not null',t);
    execute format('alter table public.%I alter column entidade_id set not null',t);
    execute format('alter table public.%I add constraint %I foreign key (entidade_id) references public.entidades(id) on delete restrict',t,t||'_entidade_id_fkey');
    execute format('create index if not exists %I on public.%I(entidade_id)',t||'_entidade_id_idx',t);
  end loop;
end $$;

-- Códigos autónomos únicos dentro de cada entidade gestora.
create unique index if not exists ativos_entidade_codigo_uidx
  on public.ativos(entidade_id,codigo);
create unique index if not exists componentes_entidade_codigo_uidx
  on public.componentes(entidade_id,codigo);

-- Substitui políticas dependentes de empreendimento por autorização da entidade.
do $$
declare t text; p record; base text;
begin
  foreach t in array array[
    'inspecoes','patologias','trabalhos','ocorrencias',
    'documentos_tecnicos','ai_levantamentos','dispositivos_monitorizacao'
  ] loop
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I',p.policyname,t);
    end loop;
    execute format('create policy %I on public.%I for select to authenticated using (public.user_can_access_entidade(entidade_id))',t||'_entity_select',t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.user_can_access_entidade(entidade_id))',t||'_entity_insert',t);
    execute format('create policy %I on public.%I for update to authenticated using (public.user_can_access_entidade(entidade_id)) with check (public.user_can_access_entidade(entidade_id))',t||'_entity_update',t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.user_can_access_entidade(entidade_id))',t||'_entity_delete',t);
  end loop;
end $$;

commit;

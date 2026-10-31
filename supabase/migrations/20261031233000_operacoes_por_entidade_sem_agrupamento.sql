-- Permitir operações técnicas sem agrupamento obrigatório.
-- Entidade gestora passa a ser a chave de autorização; empreendimento mantém-se opcional.
begin;

do $$
declare t text; has_null boolean;
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
    if t in ('documentos_tecnicos','dispositivos_monitorizacao','patologias','trabalhos','ocorrencias') then
      execute format(
        'update public.%I x set entidade_id=c.entidade_id from public.componentes c where c.id=x.componente_id and x.entidade_id is null',
        t
      );
    end if;
    execute format('select exists(select 1 from public.%I where entidade_id is null)',t) into has_null;
    if has_null then
      raise exception 'Migração interrompida: a tabela % ainda tem registos sem entidade gestora.',t;
    end if;
    execute format('alter table public.%I alter column empreendimento_id drop not null',t);
    execute format('alter table public.%I alter column entidade_id set not null',t);
    execute format('alter table public.%I add constraint %I foreign key (entidade_id) references public.entidades(id) on delete restrict',t,t||'_entidade_id_fkey');
    execute format('create index if not exists %I on public.%I(entidade_id)',t||'_entidade_id_idx',t);
  end loop;
end $$;

-- A unicidade dos códigos será validada separadamente para evitar colisões nos dados históricos.
-- Substitui políticas dependentes de empreendimento por autorização da entidade.
do $$
declare t text; p record; has_null boolean;
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


-- Atualiza as rotinas de conversão para preencher entidade_id e permitir ativos autónomos.
create or replace function public.ativus_converter_ocorrencia_em_patologia(
  p_ocorrencia_id uuid, p_tipo text, p_caracterizacao text default null,
  p_material text default null, p_causa text default null, p_efeito text default null,
  p_gravidade smallint default null, p_prioridade text default null, p_observacoes text default null
) returns uuid
language plpgsql
set search_path to ''
as $function$
declare v_ocorrencia public.ocorrencias%rowtype; v_patologia_id uuid; v_codigo text;
begin
  if auth.uid() is null then raise exception 'É necessário iniciar sessão para validar uma patologia.'; end if;
  if nullif(btrim(p_tipo),'') is null then raise exception 'Indica o tipo técnico da patologia.'; end if;
  if p_gravidade is not null and (p_gravidade<0 or p_gravidade>5) then raise exception 'A gravidade deve estar entre 0 e 5.'; end if;
  select * into v_ocorrencia from public.ocorrencias where id=p_ocorrencia_id for update;
  if not found then raise exception 'Ocorrência não encontrada ou sem permissões de acesso.'; end if;
  if not public.user_can_access_entidade(v_ocorrencia.entidade_id) then raise exception 'Sem acesso à entidade gestora.'; end if;
  if v_ocorrencia.estado='convertida' and v_ocorrencia.patologia_id is not null then return v_ocorrencia.patologia_id; end if;
  if v_ocorrencia.estado in ('duplicada','sem_anomalia','encerrada') then raise exception 'Esta ocorrência está encerrada e não pode ser convertida.'; end if;
  if v_ocorrencia.classificacao_tecnica is distinct from 'Patologia de construção civil' then raise exception 'A triagem técnica deve classificar a ocorrência como patologia de construção civil antes da conversão.'; end if;
  if v_ocorrencia.analisado_por is distinct from auth.uid() then raise exception 'Guarda primeiro a triagem técnica com a tua sessão autenticada.'; end if;
  if v_ocorrencia.patologia_id is not null then return v_ocorrencia.patologia_id; end if;
  v_codigo := 'PAT-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  insert into public.patologias(entidade_id,empreendimento_id,ativo_id,componente_id,codigo,tipo,caracterizacao,material,causa,consequencia,gravidade,prioridade,estado,observacoes,identificada_em,criado_por,ocorrencia_id,origem_registo,validada_por,validada_em)
  values(v_ocorrencia.entidade_id,v_ocorrencia.empreendimento_id,v_ocorrencia.ativo_id,v_ocorrencia.componente_id,v_codigo,btrim(p_tipo),nullif(btrim(p_caracterizacao),''),nullif(btrim(p_material),''),nullif(btrim(p_causa),''),nullif(btrim(p_efeito),''),p_gravidade,nullif(btrim(p_prioridade),''),'identificada',concat_ws(E'\\n',nullif(btrim(p_observacoes),''),'Origem: ocorrência '||v_ocorrencia.codigo||'. '||coalesce(v_ocorrencia.descricao_observada,'')),current_date,auth.uid(),v_ocorrencia.id,'ocorrencia_convertida',auth.uid(),now())
  returning id into v_patologia_id;
  update public.ocorrencias set estado='convertida',patologia_id=v_patologia_id,atualizado_em=now() where id=v_ocorrencia.id;
  return v_patologia_id;
end;
$function$;

create or replace function public.ativus_criar_patologia_de_inspecao(
  p_registo_id uuid, p_tipo text, p_caracterizacao text default null,
  p_material text default null, p_causa text default null, p_consequencia text default null,
  p_gravidade smallint default null, p_prioridade text default null, p_observacoes text default null
) returns uuid
language plpgsql security definer set search_path to 'public'
as $function$
declare r public.inspecao_registos%rowtype; i public.inspecoes%rowtype; v_id uuid; v_codigo text;
begin
 if auth.uid() is null then raise exception 'É necessário iniciar sessão.'; end if;
 if nullif(btrim(p_tipo),'') is null then raise exception 'Indica o tipo de patologia.'; end if;
 if p_gravidade is not null and (p_gravidade<0 or p_gravidade>5) then raise exception 'A gravidade deve estar entre 0 e 5.'; end if;
 select * into r from public.inspecao_registos where id=p_registo_id;
 if not found then raise exception 'Registo de inspeção não encontrado.'; end if;
 select * into i from public.inspecoes where id=r.inspecao_id;
 if not found or not public.user_can_access_entidade(i.entidade_id) then raise exception 'Sem acesso à inspeção.'; end if;
 if not r.requer_atencao then raise exception 'O registo não está marcado para requerer atenção.'; end if;
 v_codigo := 'PAT-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
 insert into public.patologias(entidade_id,empreendimento_id,inspecao_id,ativo_id,componente_id,codigo,tipo,caracterizacao,material,causa,consequencia,gravidade,prioridade,estado,observacoes,identificada_em,criado_por,origem_registo,validada_por,validada_em)
 values(i.entidade_id,i.empreendimento_id,i.id,r.ativo_id,r.componente_id,v_codigo,btrim(p_tipo),nullif(btrim(p_caracterizacao),''),nullif(btrim(p_material),''),nullif(btrim(p_causa),''),nullif(btrim(p_consequencia),''),p_gravidade,nullif(btrim(p_prioridade),''),'identificada',nullif(btrim(p_observacoes),''),current_date,auth.uid(),'inspecao',auth.uid(),now())
 returning id into v_id;
 return v_id;
end;
$function$;


commit;

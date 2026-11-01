-- ATIVUS — permissões e criação de patologias em inspeções de ativos autónomos

drop policy if exists ativus_inspecao_itens_select on public.inspecao_itens;
drop policy if exists ativus_inspecao_itens_insert on public.inspecao_itens;
drop policy if exists ativus_inspecao_itens_update on public.inspecao_itens;
drop policy if exists ativus_inspecao_itens_delete on public.inspecao_itens;

create policy ativus_inspecao_itens_select on public.inspecao_itens for select to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_itens.inspecao_id and public.user_can_access_entity(i.entidade_id)));
create policy ativus_inspecao_itens_insert on public.inspecao_itens for insert to authenticated
with check(exists(select 1 from public.inspecoes i where i.id=inspecao_itens.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])));
create policy ativus_inspecao_itens_update on public.inspecao_itens for update to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_itens.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])))
with check(exists(select 1 from public.inspecoes i where i.id=inspecao_itens.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])));
create policy ativus_inspecao_itens_delete on public.inspecao_itens for delete to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_itens.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor']::text[])));

drop policy if exists ativus_inspecao_registos_select on public.inspecao_registos;
drop policy if exists ativus_inspecao_registos_insert on public.inspecao_registos;
drop policy if exists ativus_inspecao_registos_update on public.inspecao_registos;
drop policy if exists ativus_inspecao_registos_delete on public.inspecao_registos;

create policy ativus_inspecao_registos_select on public.inspecao_registos for select to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_registos.inspecao_id and public.user_can_access_entity(i.entidade_id)));
create policy ativus_inspecao_registos_insert on public.inspecao_registos for insert to authenticated
with check(exists(select 1 from public.inspecoes i where i.id=inspecao_registos.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])));
create policy ativus_inspecao_registos_update on public.inspecao_registos for update to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_registos.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])))
with check(exists(select 1 from public.inspecoes i where i.id=inspecao_registos.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor','tecnico']::text[])));
create policy ativus_inspecao_registos_delete on public.inspecao_registos for delete to authenticated
using(exists(select 1 from public.inspecoes i where i.id=inspecao_registos.inspecao_id and public.user_has_entity_role(i.entidade_id,array['administrador','gestor']::text[])));

create or replace function public.ativus_criar_patologia_de_inspecao(
 p_registo_id uuid,
 p_tipo text,
 p_caracterizacao text default null,
 p_material text default null,
 p_causa text default null,
 p_consequencia text default null,
 p_gravidade smallint default null,
 p_prioridade text default null,
 p_observacoes text default null
)
returns uuid
language plpgsql
security definer
set search_path=public
as $fn$
declare
 r public.inspecao_registos%rowtype;
 i public.inspecoes%rowtype;
 v_id uuid;
 v_codigo text;
begin
 if auth.uid() is null then raise exception 'É necessário iniciar sessão.'; end if;
 if nullif(btrim(p_tipo),'') is null then raise exception 'Indica o tipo de patologia.'; end if;
 if p_gravidade is not null and (p_gravidade<0 or p_gravidade>5) then raise exception 'A gravidade deve estar entre 0 e 5.'; end if;
 select * into r from public.inspecao_registos where id=p_registo_id;
 if not found then raise exception 'Registo de inspeção não encontrado.'; end if;
 select * into i from public.inspecoes where id=r.inspecao_id;
 if not found or not public.user_can_access_entity(i.entidade_id) then raise exception 'Sem acesso à inspeção.'; end if;
 if not r.requer_atencao then raise exception 'O registo não está marcado para requerer atenção.'; end if;
 v_codigo := 'PAT-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
 insert into public.patologias(entidade_id,empreendimento_id,inspecao_id,ativo_id,componente_id,codigo,tipo,caracterizacao,material,causa,consequencia,gravidade,prioridade,estado,observacoes,identificada_em,criado_por,origem_registo,validada_por,validada_em)
 values(i.entidade_id,i.empreendimento_id,i.id,r.ativo_id,r.componente_id,v_codigo,btrim(p_tipo),nullif(btrim(p_caracterizacao),''),nullif(btrim(p_material),''),nullif(btrim(p_causa),''),nullif(btrim(p_consequencia),''),p_gravidade,nullif(btrim(p_prioridade),''),'identificada',nullif(btrim(p_observacoes),''),current_date,auth.uid(),'inspecao',auth.uid(),now())
 returning id into v_id;
 return v_id;
end;
$fn$;

revoke all on function public.ativus_criar_patologia_de_inspecao(uuid,text,text,text,text,text,smallint,text,text) from public,anon;
grant execute on function public.ativus_criar_patologia_de_inspecao(uuid,text,text,text,text,text,smallint,text,text) to authenticated;

-- Integração CRM + Help Desk
alter table public.ativus_tickets
  add column if not exists crm_espaco_id uuid references public.crm_espacos(id) on delete set null,
  add column if not exists crm_empresa_id uuid references public.crm_empresas(id) on delete set null,
  add column if not exists crm_contacto_id uuid references public.crm_contactos(id) on delete set null,
  add column if not exists origem text not null default 'helpdesk';
alter table public.ativus_tickets drop constraint if exists ativus_tickets_origem_check;
alter table public.ativus_tickets add constraint ativus_tickets_origem_check check (origem in ('helpdesk','crm','email','telefone','portal'));
create index if not exists ativus_tickets_crm_empresa_idx on public.ativus_tickets(crm_empresa_id,criado_em desc);
create index if not exists ativus_tickets_crm_contacto_idx on public.ativus_tickets(crm_contacto_id,criado_em desc);

create table if not exists public.crm_atividades (
 id uuid primary key default gen_random_uuid(),
 crm_espaco_id uuid not null references public.crm_espacos(id) on delete cascade,
 entidade_id uuid references public.entidades(id) on delete set null,
 crm_empresa_id uuid references public.crm_empresas(id) on delete set null,
 crm_contacto_id uuid references public.crm_contactos(id) on delete set null,
 ticket_id uuid references public.ativus_tickets(id) on delete set null,
 tipo text not null check (tipo in ('ticket_criado','ticket_atualizado','ticket_resolvido','nota','chamada','email','reuniao')),
 titulo text not null, descricao text, criado_por uuid references auth.users(id) on delete set null,
 criado_em timestamptz not null default now()
);
create index if not exists crm_atividades_empresa_data_idx on public.crm_atividades(crm_empresa_id,criado_em desc);
create index if not exists crm_atividades_ticket_idx on public.crm_atividades(ticket_id);
alter table public.crm_atividades enable row level security;
drop policy if exists crm_atividades_select on public.crm_atividades;
create policy crm_atividades_select on public.crm_atividades for select to authenticated using (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,null));
drop policy if exists crm_atividades_insert on public.crm_atividades;
create policy crm_atividades_insert on public.crm_atividades for insert to authenticated with check (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(crm_espaco_id,array['administrador','gestor']));

create or replace function private.validar_ligacao_ticket_crm()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare v_entidade uuid;
begin
 if new.crm_empresa_id is null and new.crm_contacto_id is null and new.crm_espaco_id is null then return new; end if;
 if new.crm_espaco_id is null then raise exception 'É obrigatório indicar o espaço CRM.'; end if;
 if not (private.utilizador_e_admin_plataforma() or private.crm_tem_acesso(new.crm_espaco_id,array['administrador','gestor'])) then raise exception 'Sem permissões para associar este pedido ao CRM.'; end if;
 if new.crm_empresa_id is not null then
  select entidade_id into v_entidade from public.crm_empresas where id=new.crm_empresa_id and crm_espaco_id=new.crm_espaco_id and estado='ativo';
  if v_entidade is null or v_entidade<>new.entidade_id then raise exception 'A empresa CRM não corresponde à entidade do pedido.'; end if;
 end if;
 if new.crm_contacto_id is not null and not exists(select 1 from public.crm_contactos where id=new.crm_contacto_id and crm_espaco_id=new.crm_espaco_id and ativo=true and (entidade_id is null or entidade_id=new.entidade_id)) then
  raise exception 'O contacto não pertence à entidade/espaço CRM selecionado.';
 end if;
 return new;
end; $$;
drop trigger if exists trg_validar_ligacao_ticket_crm on public.ativus_tickets;
create trigger trg_validar_ligacao_ticket_crm before insert or update of crm_espaco_id,crm_empresa_id,crm_contacto_id,entidade_id on public.ativus_tickets for each row execute function private.validar_ligacao_ticket_crm();

create or replace function private.registar_ticket_no_crm()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,auth as $$
declare v_empresa uuid;
begin
 if new.crm_espaco_id is null then return new; end if;
 select id into v_empresa from public.crm_empresas where id=new.crm_empresa_id and crm_espaco_id=new.crm_espaco_id;
 if tg_op='INSERT' then
  insert into public.crm_atividades(crm_espaco_id,entidade_id,crm_empresa_id,crm_contacto_id,ticket_id,tipo,titulo,descricao,criado_por)
  values(new.crm_espaco_id,new.entidade_id,v_empresa,new.crm_contacto_id,new.id,'ticket_criado','Pedido de assistência: '||new.assunto,'Pedido criado no Help Desk. Categoria: '||new.categoria||'. Prioridade: '||new.prioridade||'.',new.criado_por);
 elsif old.estado is distinct from new.estado then
  insert into public.crm_atividades(crm_espaco_id,entidade_id,crm_empresa_id,crm_contacto_id,ticket_id,tipo,titulo,descricao,criado_por)
  values(new.crm_espaco_id,new.entidade_id,v_empresa,new.crm_contacto_id,new.id,case when new.estado in ('resolvido','encerrado') then 'ticket_resolvido' else 'ticket_atualizado' end,'Atualização do pedido: '||new.assunto,'Estado alterado de '||old.estado||' para '||new.estado||'.',auth.uid());
 end if;
 return new;
end; $$;
drop trigger if exists trg_registar_ticket_no_crm on public.ativus_tickets;
create trigger trg_registar_ticket_no_crm after insert or update of estado on public.ativus_tickets for each row execute function private.registar_ticket_no_crm();

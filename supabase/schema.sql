-- Seven M Ativus — base de dados multi-entidade (Supabase/PostgreSQL)
-- Aplicar primeiro num projeto de teste. Rever políticas antes de dados reais.
create extension if not exists pgcrypto;

create type public.member_role as enum ('owner','admin','manager','inspector','technician','viewer');
create type public.asset_status as enum ('preparation','validation','available','inactive');
create type public.inspection_type as enum ('routine','principal','special');
create type public.record_status as enum ('open','triage','confirmed','planned','in_progress','verification','closed','cancelled');

create table public.entities (
 id uuid primary key default gen_random_uuid(),
 name text not null,
 code text unique,
 sector text not null default 'other',
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default '',
 email text,
 active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table public.entity_members (
 entity_id uuid not null references public.entities(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role public.member_role not null default 'viewer',
 active boolean not null default true,
 created_at timestamptz not null default now(),
 primary key (entity_id,user_id)
);
create index entity_members_user_active_idx on public.entity_members(user_id,active,entity_id);

create table public.assets (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 code text not null,
 name text not null,
 asset_type text not null,
 sector text not null default 'other',
 location_text text,
 latitude double precision,
 longitude double precision,
 status public.asset_status not null default 'preparation',
 condition_class smallint check (condition_class between 0 and 5),
 maintenance_state text,
 parent_asset_id uuid references public.assets(id) on delete set null,
 attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(entity_id,code),
 unique(entity_id,id)
);
create index assets_entity_status_idx on public.assets(entity_id,status);
create index assets_entity_parent_idx on public.assets(entity_id,parent_asset_id);
create index assets_attributes_gin_idx on public.assets using gin(attributes);

create table public.asset_components (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 asset_id uuid not null,
 parent_component_id uuid references public.asset_components(id) on delete set null,
 code text not null,
 name text not null,
 component_type text not null,
 attributes jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(entity_id,asset_id) references public.assets(entity_id,id) on delete cascade,
 unique(entity_id,asset_id,code),
 unique(entity_id,id)
);
create index components_asset_idx on public.asset_components(entity_id,asset_id);

create table public.inspections (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 asset_id uuid not null,
 inspection_type public.inspection_type not null,
 status text not null default 'scheduled' check(status in ('scheduled','in_progress','paused','completed','cancelled')),
 scheduled_at timestamptz,
 started_at timestamptz,
 completed_at timestamptz,
 inspector_id uuid references auth.users(id) on delete set null,
 condition_class smallint check(condition_class between 0 and 5),
 maintenance_state text,
 gps_latitude double precision,
 gps_longitude double precision,
 weather jsonb,
 checklist_results jsonb not null default '[]'::jsonb,
 notes text,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(entity_id,asset_id) references public.assets(entity_id,id) on delete restrict,
 unique(entity_id,id)
);
create index inspections_asset_date_idx on public.inspections(entity_id,asset_id,scheduled_at desc);

create table public.pathologies (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 asset_id uuid not null,
 component_id uuid,
 inspection_id uuid,
 code text not null,
 title text not null,
 pathology_type text not null,
 severity smallint check(severity between 0 and 5),
 status public.record_status not null default 'open',
 cause text,
 consequence text,
 recommended_work text,
 quantity numeric(14,3) check(quantity is null or quantity >= 0),
 unit text,
 estimated_cost numeric(14,2) check(estimated_cost is null or estimated_cost >= 0),
 actual_cost numeric(14,2) check(actual_cost is null or actual_cost >= 0),
 ai_suggestion jsonb,
 human_confirmed boolean not null default false,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(entity_id,asset_id) references public.assets(entity_id,id) on delete restrict,
 foreign key(entity_id,component_id) references public.asset_components(entity_id,id) on delete set null,
 foreign key(entity_id,inspection_id) references public.inspections(entity_id,id) on delete set null,
 unique(entity_id,code),
 unique(entity_id,id)
);
create index pathologies_entity_status_idx on public.pathologies(entity_id,status,severity);

create table public.work_orders (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 asset_id uuid not null,
 pathology_id uuid,
 code text not null,
 title text not null,
 description text,
 status public.record_status not null default 'planned',
 priority text not null default 'normal',
 due_at timestamptz,
 assigned_user_id uuid references auth.users(id) on delete set null,
 provider_name text,
 estimated_cost numeric(14,2) check(estimated_cost is null or estimated_cost >= 0),
 approved_cost numeric(14,2) check(approved_cost is null or approved_cost >= 0),
 actual_cost numeric(14,2) check(actual_cost is null or actual_cost >= 0),
 actual_materials jsonb not null default '[]'::jsonb,
 execution_notes text,
 verified_by uuid references auth.users(id) on delete set null,
 verified_at timestamptz,
 closed_at timestamptz,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 foreign key(entity_id,asset_id) references public.assets(entity_id,id) on delete restrict,
 foreign key(entity_id,pathology_id) references public.pathologies(entity_id,id) on delete set null,
 unique(entity_id,code),
 unique(entity_id,id)
);
create index work_orders_entity_status_due_idx on public.work_orders(entity_id,status,due_at);

create table public.media_documents (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete restrict,
 asset_id uuid,
 component_id uuid,
 inspection_id uuid,
 pathology_id uuid,
 work_order_id uuid,
 storage_path text not null,
 file_name text not null,
 mime_type text,
 media_kind text not null default 'document',
 captured_at timestamptz,
 latitude double precision,
 longitude double precision,
 metadata jsonb not null default '{}'::jsonb,
 uploaded_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 foreign key(entity_id,asset_id) references public.assets(entity_id,id) on delete cascade,
 foreign key(entity_id,component_id) references public.asset_components(entity_id,id) on delete cascade,
 foreign key(entity_id,inspection_id) references public.inspections(entity_id,id) on delete cascade,
 foreign key(entity_id,pathology_id) references public.pathologies(entity_id,id) on delete cascade,
 foreign key(entity_id,work_order_id) references public.work_orders(entity_id,id) on delete cascade
);
create index media_entity_asset_idx on public.media_documents(entity_id,asset_id);

create table public.configurations (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete cascade,
 config_type text not null,
 config_key text not null,
 version integer not null default 1 check(version > 0),
 payload jsonb not null default '{}'::jsonb,
 published boolean not null default false,
 published_at timestamptz,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(entity_id,config_type,config_key,version)
);
create index configurations_published_idx on public.configurations(entity_id,config_type,published);

create table public.alert_rules (
 id uuid primary key default gen_random_uuid(),
 entity_id uuid not null references public.entities(id) on delete cascade,
 code text not null,
 name text not null,
 severity text not null,
 enabled boolean not null default true,
 rule_version integer not null default 1,
 trigger_definition jsonb not null default '{}'::jsonb,
 response_definition jsonb not null default '{}'::jsonb,
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(entity_id,code)
);

create table public.audit_logs (
 id bigint generated always as identity primary key,
 entity_id uuid references public.entities(id) on delete set null,
 actor_id uuid references auth.users(id) on delete set null,
 action text not null,
 table_name text not null,
 record_id uuid,
 before_data jsonb,
 after_data jsonb,
 created_at timestamptz not null default now()
);
create index audit_entity_date_idx on public.audit_logs(entity_id,created_at desc);

-- Security helpers: only active memberships grant visibility.
create or replace function public.has_entity_access(target_entity uuid)
returns boolean language sql stable security definer set search_path = public
as $$
 select exists (
  select 1 from public.entity_members m
  join public.profiles p on p.user_id=m.user_id and p.active=true
  where m.entity_id=target_entity and m.user_id=auth.uid() and m.active=true
 );
$$;

create or replace function public.has_entity_role(target_entity uuid, allowed_roles public.member_role[])
returns boolean language sql stable security definer set search_path = public
as $$
 select exists (
  select 1 from public.entity_members m
  join public.profiles p on p.user_id=m.user_id and p.active=true
  where m.entity_id=target_entity and m.user_id=auth.uid() and m.active=true
    and m.role = any(allowed_roles)
 );
$$;

alter table public.entities enable row level security;
alter table public.profiles enable row level security;
alter table public.entity_members enable row level security;
alter table public.assets enable row level security;
alter table public.asset_components enable row level security;
alter table public.inspections enable row level security;
alter table public.pathologies enable row level security;
alter table public.work_orders enable row level security;
alter table public.media_documents enable row level security;
alter table public.configurations enable row level security;
alter table public.alert_rules enable row level security;
alter table public.audit_logs enable row level security;

create policy "members read their entities" on public.entities for select to authenticated
using (public.has_entity_access(id));
create policy "owners admins update entities" on public.entities for update to authenticated
using (public.has_entity_role(id,array['owner','admin']::public.member_role[]))
with check (public.has_entity_role(id,array['owner','admin']::public.member_role[]));

create policy "users read own profile" on public.profiles for select to authenticated
using (user_id=auth.uid());
create policy "users update own profile" on public.profiles for update to authenticated
using (user_id=auth.uid()) with check (user_id=auth.uid());

create policy "members read memberships in their entities" on public.entity_members for select to authenticated
using (public.has_entity_access(entity_id));
create policy "admins manage memberships" on public.entity_members for all to authenticated
using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]))
with check (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "entity members read assets" on public.assets for select to authenticated
using (public.has_entity_access(entity_id));
create policy "asset managers write assets" on public.assets for insert to authenticated
with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[]));
create policy "asset managers update assets" on public.assets for update to authenticated
using (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[]))
with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[]));
create policy "admins delete assets" on public.assets for delete to authenticated
using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read components" on public.asset_components for select to authenticated using (public.has_entity_access(entity_id));
create policy "authorized staff insert components" on public.asset_components for insert to authenticated with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "authorized staff update components" on public.asset_components for update to authenticated using (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "admins delete components" on public.asset_components for delete to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read inspections" on public.inspections for select to authenticated using (public.has_entity_access(entity_id));
create policy "inspectors create inspections" on public.inspections for insert to authenticated with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[]));
create policy "inspectors update inspections" on public.inspections for update to authenticated using (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector']::public.member_role[]));
create policy "admins delete inspections" on public.inspections for delete to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read pathologies" on public.pathologies for select to authenticated using (public.has_entity_access(entity_id));
create policy "staff create pathologies" on public.pathologies for insert to authenticated with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "staff update pathologies" on public.pathologies for update to authenticated using (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "admins delete pathologies" on public.pathologies for delete to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read work orders" on public.work_orders for select to authenticated using (public.has_entity_access(entity_id));
create policy "staff create work orders" on public.work_orders for insert to authenticated with check (public.has_entity_role(entity_id,array['owner','admin','manager','technician']::public.member_role[]));
create policy "staff update work orders" on public.work_orders for update to authenticated using (public.has_entity_role(entity_id,array['owner','admin','manager','technician']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin','manager','technician']::public.member_role[]));
create policy "admins delete work orders" on public.work_orders for delete to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read documents" on public.media_documents for select to authenticated using (public.has_entity_access(entity_id));
create policy "staff upload documents" on public.media_documents for insert to authenticated with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "staff update documents" on public.media_documents for update to authenticated using (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin','manager','inspector','technician']::public.member_role[]));
create policy "admins delete documents" on public.media_documents for delete to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

create policy "members read configurations" on public.configurations for select to authenticated using (public.has_entity_access(entity_id));
create policy "admins manage configurations" on public.configurations for all to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));
create policy "members read alert rules" on public.alert_rules for select to authenticated using (public.has_entity_access(entity_id));
create policy "admins manage alert rules" on public.alert_rules for all to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[])) with check (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));
create policy "admins read audit logs" on public.audit_logs for select to authenticated using (public.has_entity_role(entity_id,array['owner','admin']::public.member_role[]));

-- Important deployment notes:
-- 1) Create profile rows for users with a trusted auth.users trigger or server-side process.
-- 2) Create the first entity and owner membership through a trusted administrative process.
-- 3) Never expose the service-role key in web/mobile clients.
-- 4) Storage buckets need their own policies scoped to entity paths.
-- 5) Test cross-entity read/write denial before production.

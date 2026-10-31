-- Seven M Ativus Help Desk: tickets e mensagens
create table if not exists public.ativus_tickets (
  id uuid primary key default gen_random_uuid(),
  entidade_id uuid not null references public.entidades(id) on delete cascade,
  criado_por uuid not null references auth.users(id) on delete restrict,
  assunto text not null check (char_length(trim(assunto)) between 5 and 180),
  descricao text not null check (char_length(trim(descricao)) between 10 and 10000),
  categoria text not null default 'utilizacao' check (categoria in ('utilizacao','erro_tecnico','acesso','dados','sugestao','outro')),
  prioridade text not null default 'normal' check (prioridade in ('baixa','normal','alta','urgente')),
  estado text not null default 'novo' check (estado in ('novo','em_analise','atribuido','aguarda_utilizador','resolvido','encerrado')),
  atribuido_a uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists ativus_tickets_entidade_criado_idx on public.ativus_tickets(entidade_id, criado_em desc);
create index if not exists ativus_tickets_estado_idx on public.ativus_tickets(estado, prioridade);
create table if not exists public.ativus_ticket_mensagens (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.ativus_tickets(id) on delete cascade,
  autor_id uuid not null references auth.users(id) on delete restrict,
  mensagem text not null check (char_length(trim(mensagem)) between 1 and 10000),
  interna boolean not null default false,
  criado_em timestamptz not null default now()
);
create index if not exists ativus_ticket_mensagens_ticket_idx on public.ativus_ticket_mensagens(ticket_id, criado_em);
alter table public.ativus_tickets enable row level security;
alter table public.ativus_ticket_mensagens enable row level security;
drop policy if exists "Membros consultam tickets da entidade" on public.ativus_tickets;
create policy "Membros consultam tickets da entidade" on public.ativus_tickets for select to authenticated using (
 exists (select 1 from public.membros_entidade m where m.entidade_id=ativus_tickets.entidade_id and m.utilizador_id=auth.uid() and m.ativo=true)
 or exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid())
);
drop policy if exists "Membros abrem tickets da entidade" on public.ativus_tickets;
create policy "Membros abrem tickets da entidade" on public.ativus_tickets for insert to authenticated with check (
 criado_por=auth.uid() and exists (select 1 from public.membros_entidade m where m.entidade_id=ativus_tickets.entidade_id and m.utilizador_id=auth.uid() and m.ativo=true)
);
drop policy if exists "Administradores plataforma gerem tickets" on public.ativus_tickets;
create policy "Administradores plataforma gerem tickets" on public.ativus_tickets for update to authenticated using (
 exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid())
) with check (
 exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid())
);
drop policy if exists "Membros consultam mensagens visiveis" on public.ativus_ticket_mensagens;
create policy "Membros consultam mensagens visiveis" on public.ativus_ticket_mensagens for select to authenticated using (
 (interna=false and exists (select 1 from public.ativus_tickets t join public.membros_entidade m on m.entidade_id=t.entidade_id where t.id=ativus_ticket_mensagens.ticket_id and m.utilizador_id=auth.uid() and m.ativo=true))
 or exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid())
);
drop policy if exists "Membros e suporte respondem tickets" on public.ativus_ticket_mensagens;
create policy "Membros e suporte respondem tickets" on public.ativus_ticket_mensagens for insert to authenticated with check (
 autor_id=auth.uid()
 and (exists (select 1 from public.ativus_tickets t join public.membros_entidade m on m.entidade_id=t.entidade_id where t.id=ativus_ticket_mensagens.ticket_id and m.utilizador_id=auth.uid() and m.ativo=true)
 or exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid()))
 and (interna=false or exists (select 1 from public.administradores_plataforma a where a.utilizador_id=auth.uid()))
);

-- ATIVUS — ativos autónomos com associação opcional a empreendimento
-- Compatível com a migração 20261027_inventario_perfis.sql.
-- Não elimina, converte nem reassocia registos existentes.

alter table public.ativos
  alter column empreendimento_id drop not null;

alter table public.ativos
  add column if not exists localizacao_detalhada text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

alter table public.ativos
  add constraint ativos_coordenadas_validas
  check (
    (latitude is null and longitude is null)
    or
    (latitude between -90 and 90 and longitude between -180 and 180)
  );

create index if not exists ativos_entidade_sem_empreendimento_idx
  on public.ativos(entidade_id, criado_em desc)
  where empreendimento_id is null;

comment on column public.ativos.empreendimento_id is
  'Associação opcional a um empreendimento/agrupamento. A entidade gestora é sempre obrigatória.';

comment on column public.ativos.localizacao_detalhada is
  'Localização interna detalhada do ativo, independente da morada geral.';

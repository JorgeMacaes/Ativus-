-- Provisiona o primeiro espaço CRM da Seven M Ativus.
-- Entidade identificada através da associação administrativa existente em membros_entidade.
insert into public.entidade_papeis (entidade_id, papel, origem, ativo)
select e.id, 'cliente', 'sistema', true
from public.entidades e
where e.id = 'e5164cc7-a983-4d9a-8196-56f8d923b7c8'
on conflict (entidade_id, papel) do update set ativo = true;

insert into public.crm_espacos (entidade_id, nome, ativo)
select e.id, 'CRM Seven M Ativus', true
from public.entidades e
where e.id = 'e5164cc7-a983-4d9a-8196-56f8d923b7c8'
on conflict (entidade_id) do nothing;

insert into public.crm_utilizadores (crm_espaco_id, utilizador_id, perfil, ativo)
select c.id, m.utilizador_id, 'administrador', true
from public.crm_espacos c
join public.membros_entidade m
  on m.entidade_id = c.entidade_id and m.ativo = true
where c.entidade_id = 'e5164cc7-a983-4d9a-8196-56f8d923b7c8'
on conflict (crm_espaco_id, utilizador_id) do update
set perfil = 'administrador', ativo = true;

# ATIVUS — Preparação da migração para o modelo único de Ativos

**Estado:** preparação técnica; não aplicar em produção.  
**Objetivo:** substituir gradualmente o conceito operacional de Empreendimento como cadastro do imóvel/instalação por um Ativo principal único, mantendo `entidades` como organização/cliente multi-tenant.

## Regras obrigatórias

1. `entidades` representa a organização/cliente e não será removida.
2. Cada imóvel, edifício, ponte, instalação ou equipamento principal tem um único registo canónico de Ativo.
3. Componentes e subcomponentes pertencem hierarquicamente ao Ativo principal.
4. Inspeções, ocorrências, patologias, trabalhos, manutenção, documentos, monitorização e IA mantêm histórico e referências.
5. Nenhuma tabela antiga é eliminada durante a transição.
6. Nenhum registo, UUID, QR token, ficheiro ou caminho de Storage é descartado.
7. Produção só muda após backup verificável, ensaio em staging, validação e aprovação explícita.

## Diagnóstico confirmado (31-10-2026)

| Tabela | Registos |
|---|---:|
| empreendimentos | 2 |
| ativos | 2 |
| componentes | 0 |
| inspecoes | 0 |
| ocorrencias | 1 |
| patologias | 0 |
| trabalhos | 0 |

### Mapeamento funcional confirmado

- **Pestana Carvoeiro Golf – AL** é um único Ativo principal.
- **Zona de alojamento – Gramacho** e **Zona de alojamento – Vale da Pinta** passam a componentes desse Ativo.
- **Casa Rua de Casal do Monte 54** passa a Ativo principal.
- A ocorrência existente `OCR-39723455` (mau cheiro na zona da sanita, Quarto 118) continua associada ao elemento Gramacho, agora componente do Pestana.

IDs observados no levantamento (referências para validação, não instruções de execução):

- Pestana: empreendimento `d6e050c1-9f52-4f83-885f-96953f2e0ed1`.
- Casa: empreendimento `fe387c7a-3966-49a5-9f25-d40c30fbc739`.
- Gramacho: ativo atual `bde6872b-2d22-4b7e-8527-78418de76880`.
- Vale da Pinta: ativo atual `a99f7ba7-e824-4326-ac60-7f63bac4bb38`.
- Ocorrência: `8743751f-bcec-4c31-9b59-87ac49c88dbd`.

## Dependências que têm de migrar em conjunto

### Frontend
- `src/AtivusProjects.jsx`: atualmente lista/cria linhas em `empreendimentos`; evoluir para cadastro único de Ativos.
- `src/Inspections.jsx`: exige `empreendimento_id` e depois `ativo_id`.
- `src/Occurrences.jsx`, `src/PathologiesLive.jsx`, `src/Monitoring.jsx`, `src/TechnicalDocuments.jsx`: rever filtros, seletores, criação e apresentação de relações.
- `src/AtivusAI.jsx`: rever contexto e referências ao inventário.

### Base de dados, segurança e integrações
A estrutura atual tem FKs, políticas RLS e funções SQL dependentes de `empreendimento_id`. Abranger pelo menos:

- `ativos`, `componentes`, `inspecoes`, `inspecao_itens`, `inspecao_registos`;
- `ocorrencias`, `patologias`, `trabalhos`, `trabalho_historico`;
- `documentos_tecnicos`, `dispositivos_monitorizacao`, `leituras_monitorizacao`;
- `planos_manutencao`, `plano_manutencao_elementos`, `manutencao_agendamentos`, `orcamentos_manutencao`, `indicadores_manutencao`, `regras_inspecao_periodica`;
- tabelas e funções de IA que autorizam através de `user_can_access_empreendimento`;
- triggers de inspeção, auditoria, histórico e agregação de orçamentos;
- Storage dos buckets `ativus-ai-documentos` e `ativus-documentos-tecnicos`;
- Edge Function `public-occurrence`, que procura QR em empreendimentos, ativos e componentes.

A tabela `entidades` e as relações de membros/perfis mantêm-se. Não substituir RLS por permissões genéricas para utilizadores autenticados.

## Estratégia expandir → migrar → contrair

### Fase A — Preparação
- Registar dependências e critérios de aceitação.
- Não executar DDL/DML na base de dados de produção.
- Não alterar os módulos publicados.

### Fase B — Modelo de transição aditivo
- Definir o identificador canónico do Ativo principal e a relação com a organização cliente.
- Manter temporariamente os identificadores antigos necessários à compatibilidade.
- Preparar relações explícitas para componentes/subcomponentes.
- Preparar RLS e funções compatíveis com o modelo novo, sem retirar as antigas.
- Garantir que QR antigos continuam a resolver para o mesmo elemento.

Não fazer simples renomeação de colunas nem eliminar `empreendimentos`. O desenho das FKs e políticas deve ser validado contra o schema real completo antes de criar a migration SQL.

### Fase C — Conversão e validação em staging
- Criar o Ativo principal Pestana.
- Converter Gramacho e Vale da Pinta em componentes com tabela de correspondência de IDs.
- Criar o Ativo principal da Casa.
- Migrar as relações da ocorrência e confirmar que aponta para Gramacho.
- Migrar restantes relações, QR, Storage, IA, histórico e auditoria.
- Testar leitura, criação, edição, RLS por entidade, QR público, upload/download e rollback.

### Fase D — Ativação gradual
- Publicar frontend compatível com o modelo de transição.
- Ativar escrita no modelo novo só depois dos testes.
- Comparar contagens, relações e identificadores antes/depois.
- Monitorizar erros e manter reversão disponível.

### Fase E — Contração futura
Só numa versão posterior, após período estável e confirmação de que não há consumidores antigos, retirar colunas, políticas, funções e tabelas operacionais antigas. `entidades` nunca faz parte dessa remoção.

## Verificações SQL somente de leitura

Executar no ambiente de ensaio e antes/depois da migração. Estas consultas não escrevem dados.

```sql
-- Contagens-base
select 'empreendimentos' as tabela, count(*) as total from public.empreendimentos
union all select 'ativos', count(*) from public.ativos
union all select 'componentes', count(*) from public.componentes
union all select 'inspecoes', count(*) from public.inspecoes
union all select 'ocorrencias', count(*) from public.ocorrencias
union all select 'patologias', count(*) from public.patologias
union all select 'trabalhos', count(*) from public.trabalhos;

-- Ocorrência que tem de permanecer ligada ao elemento Gramacho
select id, codigo, empreendimento_id, ativo_id, componente_id,
       categoria_comunicada, descricao_observada, localizacao_texto
from public.ocorrencias
where id = '8743751f-bcec-4c31-9b59-87ac49c88dbd';

-- FKs operacionais dependentes do modelo atual
select tc.table_name, kcu.column_name, ccu.table_name as tabela_referenciada,
       ccu.column_name as coluna_referenciada, rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
 and tc.constraint_schema = kcu.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
 and ccu.constraint_schema = tc.constraint_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
 and rc.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.constraint_schema = 'public'
  and (ccu.table_name in ('empreendimentos','ativos','componentes')
       or kcu.column_name in ('empreendimento_id','ativo_id','componente_id'))
order by tc.table_name, kcu.column_name;
```

## Critérios obrigatórios de aceitação

- Identidade e contagem preservadas para todos os registos que não foram intencionalmente convertidos.
- Zero referências órfãs em FKs e relações lógicas.
- Ocorrência `OCR-39723455` continua ligada ao componente Gramacho.
- Gramacho e Vale da Pinta aparecem sob o mesmo Ativo principal Pestana.
- Casa aparece como Ativo principal sem duplicação.
- Utilizadores de uma entidade não consultam dados de outra.
- QR antigo e novo resolvem para o elemento correto.
- Documentos continuam acessíveis; caminhos Storage só mudam com cópia e verificação.
- Inspeções, trabalhos, relatórios e automatismos funcionam.
- Rollback testado e executável.

## Estado desta entrega

Esta documentação é preparação técnica versionada. **Não altera o Supabase, não migra dados e não publica uma nova versão.** A implementação seguinte começa pelo desenho do modelo aditivo e pela validação integral das dependências em staging.

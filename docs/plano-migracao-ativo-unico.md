# Plano de migração — modelo único de Ativos ATIVUS

Estado: plano técnico preliminar, apenas para revisão. **Não executar em produção.**
Branch: feature/migracao-ativo-unico-preparacao

## 1. Alvo confirmado

O conceito Empreendimento desaparece da aplicação e do modelo de dados final. A única entidade operacional será Ativo, com hierarquia autorreferenciada:

- Ativo principal: ativo sem pai (`ativo_pai_id IS NULL`).
- Componente: ativo cujo pai é um ativo principal.
- Subcomponente: ativo cujo pai é um componente ou outro subcomponente.

Uma única tabela `ativos` conterá os três níveis. `entidades` permanece como organização/cliente e será a fronteira multi-tenant.

## 2. Situação da base de dados observada (31-10-2026)

Contagens:
- entidades: 4
- empreendimentos: 2
- ativos: 2
- componentes: 0
- ocorrencias: 1
- inspecoes: 0
- inspecao_itens: 0
- inspecao_registos: 0
- patologias: 0
- trabalhos: 0

Não foram detetadas colisões de UUID entre empreendimentos, ativos e componentes. Também não foram detetadas colisões de QR token ou de código entre as três tabelas na amostra atual. Isto permite planear a preservação dos UUID e QR token existentes, sujeito a validação transacional imediatamente antes da migração.

Registos existentes:
- Ativo principal candidato: Casa Rua de Casal do monte 54, UUID fe387c7a-3966-49a5-9f25-d40c30fbc739, código EMP-73017458, QR 830285fe-b650-4348-889a-efc17d2be012.
- Ativo principal candidato: Pestana Carvoeiro Golf – AL, UUID d6e050c1-9f52-4f83-885f-96953f2e0ed1, código EMP-PCG-001, QR 3ca678f4-8339-411a-b0ff-5ead50aa3b1e.
- Componente candidato: Zona de alojamento – Gramacho, UUID bde6872b-2d22-4b7e-8527-78418de76880, código ATV-PCG-GRA, QR 3b44f0bf-2612-485d-bb6b-a4078e61e536.
- Componente candidato: Zona de alojamento – Vale da Pinta, UUID a99f7ba7-e824-4326-ac60-7f63bac4bb38, código ATV-PCG-VDP, QR 2561b1be-0cf6-4313-8fa3-c21fb1460a9e.

A ocorrência existente (mau cheiro, Quarto 118) está associada a Gramacho e deverá continuar associada ao mesmo UUID do ativo após a conversão.

## 3. Modelo físico final proposto

A tabela `ativos` deverá passar a ter, no mínimo:
- `id uuid primary key`
- `entidade_id uuid not null references entidades(id)`
- `ativo_pai_id uuid null references ativos(id)`
- `codigo`, `nome`, `tipo`, `descricao`, `estado`
- `morada`, `codigo_postal`, `localidade`, `concelho`, `distrito`, `localizacao`
- `estado_manutencao`, `classe_estado_conservacao`
- `qr_token`, `codigo_interno`
- `caracteristicas_tecnicas`, `dimensoes`, `referencias_documentais`
- `fabricante`, `modelo`, `numero_serie`, `data_instalacao`, `sistema_associado`
- `criado_por`, `criado_em`, `atualizado_em`

A hierarquia precisa de validação para impedir autorreferência e ciclos. A unicidade de códigos deverá ser definida por entidade e, se necessário, por âmbito hierárquico. QR tokens deverão ser globalmente únicos na tabela única.

## 4. Plano de transição com preservação dos IDs

### Fase 1 — expansão aditiva
1. Adicionar a `ativos` as colunas `entidade_id` e `ativo_pai_id`, inicialmente sem remover `empreendimento_id`.
2. Criar uma tabela de correspondência/auditoria com origem, ID antigo, ID canónico, destino, estado, data e contagens verificadas.
3. Criar índices não destrutivos e preparar validações de hierarquia.
4. Manter todas as tabelas e colunas atuais.

### Fase 2 — migração dos registos de topo
1. Copiar cada linha de `empreendimentos` para `ativos`, preservando o UUID e QR token, preenchendo `entidade_id` e deixando `ativo_pai_id` nulo.
2. Mapear os campos: `morada` e dados postais para os campos de localização; `codigo`, `nome`, `tipo`, `descricao`, `estado_manutencao`, `classe_estado_conservacao`, `qr_token`, datas e autor são preservados.
3. Verificar que a linha nova foi criada e todos os campos comparáveis coincidem antes de avançar.

### Fase 3 — conversão dos ativos secundários e componentes
1. Para cada atual linha de `ativos`, manter o UUID e QR token e atribuir `ativo_pai_id` ao ID canónico do ativo principal.
2. Copiar os atuais componentes para a mesma tabela `ativos`, preservando IDs e a hierarquia. Traduzir `ativo_id`/ `componente_pai_id` para `ativo_pai_id`.
3. Como há atualmente zero componentes, a primeira migração apenas tem de converter os dois registos secundários conhecidos, mas o script deve suportar componentes existentes no futuro.
4. Validar que a árvore não contém órfãos nem ciclos.

### Fase 4 — dependências operacionais
As tabelas atuais referenciam empreendimentos, ativos e/ou componentes. A migração deve acrescentar temporariamente a nova coluna `ativo_id` onde necessário e preencher o ID canónico:
- ocorrencias: ativo exato, incluindo Gramacho;
- inspecoes: ativo principal/contexto da inspeção e, se necessário, os itens da inspeção apontam para cada ativo inspecionado;
- inspecao_itens e inspecao_registos: converter os alvos para o ID canónico;
- patologias e trabalhos: manter o alvo exato e as ligações entre registos;
- documentos_tecnicos e dispositivos_monitorizacao: manter o alvo exato;
- ai_levantamentos e tabelas AI associadas: migrar contexto e alvos;
- planos_manutencao, plano_manutencao_elementos, regras_inspecao_periodica, manutencao_agendamentos, orcamentos_manutencao, indicadores_manutencao e trabalho_historico: substituir contexto por entidade/ativo principal conforme a finalidade de cada tabela.

Não converter cegamente todos os antigos `empreendimento_id` no mesmo `ativo_id`: cada tabela tem semântica própria. Por exemplo, um orçamento pode pertencer ao ativo principal, enquanto um trabalho pode incidir num componente.

### Fase 5 — código e segurança
- Atualizar RLS para verificar acesso através de `ativos.entidade_id` e hierarquia.
- Substituir `user_can_access_empreendimento` por uma política/função de acesso ao ativo ou entidade, após revisão de todas as chamadas.
- Atualizar funções SQL, triggers, views, RPCs, Edge Functions e políticas de Storage.
- Atualizar módulos React e formulários; eliminar o menu e a nomenclatura Empreendimento.
- Atualizar o endpoint público de QR para procurar o token na tabela única `ativos`.

### Fase 6 — contração
Só depois de testes completos e período de estabilidade:
- remover FKs e colunas antigas;
- remover `componentes` e `empreendimentos`;
- remover funções e políticas legadas;
- eliminar referências antigas do código e documentação.

## 5. Dependências identificadas

As FKs atuais apontam para:
- `empreendimentos`: ai_levantamentos, ativos, componentes, dispositivos_monitorizacao, documentos_tecnicos, indicadores_manutencao, inspecoes, manutencao_agendamentos, ocorrencias, orcamentos_manutencao, patologias, planos_manutencao, regras_inspecao_periodica, trabalho_historico e trabalhos.
- `ativos`: ai_levantamentos, componentes, dispositivos_monitorizacao, documentos_tecnicos, inspecao_itens, inspecao_registos, ocorrencias, patologias, plano_manutencao_elementos, regras_inspecao_periodica e trabalhos.
- `componentes`: dispositivos_monitorizacao, documentos_tecnicos, inspecao_itens, inspecao_registos, ocorrencias, patologias, plano_manutencao_elementos, regras_inspecao_periodica e trabalhos.

Há FKs com ON DELETE CASCADE e SET NULL, pelo que a contração sem reassociação prévia pode eliminar dados ou desligar históricos. É proibido apagar tabelas de origem antes da reconciliação de todas as referências.

## 6. Verificações obrigatórias antes e depois

- Backup restaurável testado.
- UUID e QR token preservados ou mapeados sem ambiguidades.
- Contagem de registos por tabela antes/depois.
- Zero referências órfãs.
- Zero ciclos na árvore.
- Todos os ativos associados a uma entidade válida.
- Todas as ocorrências e históricos mantêm o mesmo alvo físico.
- RLS testada com utilizadores de duas entidades diferentes e administrador da plataforma.
- Storage, QR público, Edge Functions, relatórios, inspeções e manutenção testados.
- Rollback ensaiado e aprovado.

## 7. Limites

Este plano ainda não é SQL executável. Falta concluir o inventário de todas as tabelas AI e auxiliares, definições completas de funções, triggers, policies, views, Storage, colunas de cada dependência e o código frontend/Edge Function. A execução exige ambiente de teste isolado, backup e aprovação explícita. Nenhuma alteração de produção foi realizada nesta entrega.

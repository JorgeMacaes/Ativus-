# Especificação da fase aditiva — modelo único de Ativos

Data da inspeção: 31-10-2026  
Branch: `feature/migracao-ativo-unico-preparacao`  
Estado: especificação técnica; **não é uma migração executável** e não foi aplicada à base de dados.

## 1. Objetivo desta fase

Preparar a tabela `ativos` para passar a representar:
- ativos principais;
- componentes;
- subcomponentes e níveis hierárquicos adicionais.

A hierarquia será representada por `ativo_pai_id`, com relação à própria tabela `ativos`. A entidade/cliente será identificada por `entidade_id`.

As tabelas antigas `empreendimentos` e `componentes` permanecem intactas durante esta fase e nas fases de compatibilidade.

## 2. Estrutura atual verificada

Na base de dados consultada:
- `ativos.empreendimento_id` é atualmente obrigatório e referencia `empreendimentos.id`.
- `ativos` já contém código, nome, tipo, descrição, localização, estado, manutenção, conservação, QR, características técnicas, dimensões, referências documentais, fabricante, modelo, número de série e datas.
- `componentes` contém `ativo_id` e `componente_pai_id`, além de campos técnicos e QR próprios.
- `empreendimentos` contém `entidade_id`, morada, código postal, localidade, concelho, distrito, estado e QR.
- Existe atualmente um índice único `ativos(empreendimento_id, codigo)`.
- Os índices de QR das três tabelas são únicos individualmente; a unicidade global entre tabelas tem de ser verificada na migração.

## 3. Alterações aditivas propostas

Adicionar à tabela `ativos`, sem remover ou renomear colunas existentes:

| Campo | Tipo proposto | Regra |
|---|---|---|
| `entidade_id` | uuid | FK para `entidades.id`; inicialmente nullable durante backfill |
| `ativo_pai_id` | uuid | FK para `ativos.id`; null significa ativo principal |
| `morada` | text | nullable |
| `codigo_postal` | text | nullable |
| `localidade` | text | nullable |
| `concelho` | text | nullable |
| `distrito` | text | nullable |
| `sistema_associado` | text | nullable |

Índices propostos:
- índice por `entidade_id`;
- índice por `ativo_pai_id`;
- índice único por `qr_token` em `ativos` (já existe e deve ser mantido);
- índice de código por entidade, com regra de unicidade a definir após análise de códigos existentes e do âmbito desejado.

Restrições propostas, apenas após backfill e validação:
- FK `entidade_id -> entidades.id`;
- FK `ativo_pai_id -> ativos.id`;
- impedir que um ativo seja pai de si próprio;
- garantir que pai e filho pertencem à mesma entidade;
- impedir ciclos hierárquicos (validação transacional por trigger/função ou serviço, não apenas CHECK).

## 4. Mapeamento de dados já identificado

Preservar os UUIDs existentes:
- os registos de `empreendimentos` passam a ser os ativos principais com o mesmo UUID;
- os registos atuais de `ativos` (Gramacho e Vale da Pinta) mantêm os seus UUIDs e passam a ter `ativo_pai_id` igual ao UUID do ativo principal Pestana;
- os registos de `componentes`, quando existirem, mantêm os UUIDs e passam para `ativos` com o pai correspondente;
- os QR tokens existentes devem ser preservados, mas antes da cópia deve confirmar-se que não há colisões entre as três tabelas.

Dados que exigem tratamento explícito:
- `empreendimentos.morada` e campos de endereço devem ser copiados para os novos ativos principais;
- `empreendimentos.ativo` deve ser convertido para o estado de ativo, sem perder o valor original no registo de migração;
- os campos de manutenção/conservação, códigos e datas devem ser mapeados individualmente;
- componentes têm campos específicos (categoria, material, sistema associado) que devem ser acomodados antes da cópia;
- os dois ativos existentes usam atualmente `empreendimento_id`; este valor deve ser mantido até que as dependências estejam migradas.

## 5. Estratégia de execução por fases

### Fase A — expansão
1. Criar migração versionada através do fluxo Supabase CLI no ambiente de desenvolvimento.
2. Adicionar as novas colunas e índices não destrutivos.
3. Adicionar FKs inicialmente como `NOT VALID`, quando adequado, e validá-las após backfill.
4. Não alterar ainda os campos antigos, políticas, funções ou aplicações.

### Fase B — cópia e reconciliação
1. Criar tabela de correspondência de migração com origem, ID antigo, ID canónico, estado e data.
2. Inserir ativos principais a partir de `empreendimentos`, preservando UUIDs e QR tokens.
3. Atualizar os ativos Gramacho e Vale da Pinta para filhos do ativo Pestana.
4. Copiar componentes para `ativos`, preservando IDs e relação pai.
5. Comparar contagens, campos, QR tokens, UUIDs e referências.
6. Reassociar a ocorrência existente ao nó Gramacho exato, mantendo o registo e o seu histórico.

### Fase C — compatibilidade
- Adaptar RLS, funções, triggers, views, RPCs, Storage e Edge Functions.
- Adaptar módulos da aplicação para usarem a árvore única.
- Manter colunas e tabelas antigas enquanto a versão compatível estiver em teste.
- Não permitir escrita simultânea divergente entre o modelo antigo e o novo.

### Fase D — contração
Só depois de testes, backup restaurável, reconciliação integral e aprovação explícita:
- remover dependências antigas;
- tornar as novas referências obrigatórias onde aplicável;
- retirar tabelas antigas e campos antigos numa migração separada.

## 6. Testes obrigatórios antes de qualquer execução em produção

- Repetir inventário de dados e colisões imediatamente antes da migração.
- Executar numa cópia isolada da base de dados.
- Testar rollback e restauro de backup.
- Confirmar que cada registo de origem tem exatamente um destino.
- Confirmar que nenhum QR token ou UUID é duplicado.
- Confirmar a ocorrência OCR-39723455 ligada ao nó Gramacho correto e com descrição, localização, estado e notas preservados.
- Testar isolamento entre entidades com RLS.
- Testar criação, edição, leitura e reorganização da árvore sem ciclos.
- Testar inspeções, patologias, trabalhos, documentos, monitorização, IA e ocorrências QR.
- Confirmar que o portal público continua a aceitar QR válidos e rejeita ativos inativos.

## 7. Bloqueios conhecidos

A fase aditiva não pode ser convertida num SQL final enquanto não forem concluídos:
- inventário integral de triggers e funções que escrevem ou leem as tabelas antigas;
- definição final da semântica de `estado` para ativos principais e componentes;
- confirmação da política de unicidade de códigos por entidade e por hierarquia;
- definição da política de acesso a ativos principais e descendentes;
- ambiente de teste isolado e backup restaurável.

## 8. Segurança operacional

Este documento não autoriza execução. Nenhuma alteração foi feita à base de dados. Não foram removidas tabelas, colunas, políticas, funções, ficheiros ou registos. A aplicação publicada não foi alterada.

## 9. Auditoria complementar — cinco frentes fechadas em 31-10-2026

### Frente 1 — funções SQL e RPCs
Foram identificadas funções que precisam de adaptação coordenada, entre outras:
- `user_can_access_empreendimento`;
- `ai_publicar_elemento_proposto`;
- `ativus_converter_ocorrencia_em_patologia`;
- `ativus_criar_patologia_de_inspecao`;
- `ativus_criar_inspecao_periodica`;
- `ativus_converter_agendamento_em_trabalho`;
- `ativus_criar_trabalho_agendado`;
- `ativus_relatorio_manutencao`;
- `ativus_calcular_indicadores`;
- `ativus_inspecoes_a_vencer`;
- `ativus_membros_equipa_empreendimento`;
- `ativus_registar_historico_trabalho`;
- funções de progresso, aprovação e planeamento de trabalhos.

A lista completa e as assinaturas devem ser exportadas novamente antes de escrever a migração definitiva. A função de autorização atual é SECURITY DEFINER e consulta `empreendimentos` e `membros_entidade`; não deve ser simplesmente renomeada nem substituída por uma verificação superficial de `entidade_id`.

### Frente 2 — políticas RLS
As políticas de ativos, componentes e de vários módulos operacionais usam `user_can_access_empreendimento`. As políticas de IA usam frequentemente o empreendimento do respetivo levantamento. A migração tem de preservar o isolamento por entidade e o acesso de administradores de plataforma, sem alargar o acesso a todos os utilizadores autenticados.

### Frente 3 — Storage
Os dois buckets privados identificados são:
- `ativus-ai-documentos`;
- `ativus-documentos-tecnicos`.

As políticas atuais interpretam o primeiro segmento do caminho do ficheiro como UUID de empreendimento. A mudança para ativo único exige uma convenção estável de caminho, por exemplo UUID da entidade ou do ativo principal, e uma função de autorização que resolva o acesso sem depender de uma tabela que será removida. Os caminhos dos ficheiros existentes não devem ser renomeados nem movidos nesta fase.

### Frente 4 — Edge Functions
A função `public-occurrence` está ativa, com JWT desativado por ser um formulário público, e procura QR em três tabelas. A versão nova deverá resolver o QR diretamente em `ativos`, validar o estado do nó e da entidade, e inserir a ocorrência ligada ao nó exato. Esta alteração exige testes de QR de ativo principal, componente e subcomponente, e não deve ser publicada antes da migração compatível.

Também existem Edge Functions de fornecedor, IA/conhecimento e ingestão de sensores; cada uma deve ser revista para verificar se consulta ou grava IDs antigos antes da fase de contração.

### Frente 5 — triggers e histórico
Foram encontrados triggers de inspeções, trabalhos, custos, orçamentos e histórico. Em particular, `ativus_registar_historico_trabalho` grava `empreendimento_id` no histórico. O histórico deve continuar imutável e consultável após a migração; não se deve reconstruir o histórico a partir do estado atual dos ativos.

## 10. Decisões técnicas que ficam bloqueadas até confirmação em ambiente de teste

1. A coluna `ativo_pai_id` permite níveis hierárquicos ilimitados, mas a aplicação deverá impor limite operacional configurável se necessário.
2. O acesso do utilizador é concedido pela entidade a que o ativo pertence; a árvore serve para herdar contexto e não para contornar a autorização da entidade.
3. Um registo de inspeção, ocorrência, patologia ou trabalho deve apontar ao nó exato a que respeita. Quando o processo abranger vários elementos, cada elemento terá registo/snapshot próprio.
4. A associação a um ativo principal para efeitos de relatórios é calculada pela árvore, não copiada cegamente para o nó selecionado.
5. Os caminhos de Storage e os snapshots de IA mantêm compatibilidade histórica; não se convertem UUIDs de pastas ou snapshots sem uma migração específica.

## 11. Limitação desta entrega

Esta auditoria é uma especificação e inventário, não uma migração executável. O ambiente de produção foi consultado apenas em leitura. Não foi criada branch de base de dados, não foi aplicada DDL, não foram alteradas políticas, funções, triggers, Storage ou Edge Functions e não foi publicado código.

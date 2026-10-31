# Inventário de alterações na aplicação — modelo único de Ativos

Branch: feature/migracao-ativo-unico-preparacao
Estado: diagnóstico de código; sem alterações à aplicação publicada.

## 1. Módulo de inventário atual

Ficheiro: src/AtivusProjects.jsx

Observações confirmadas:
- O módulo consulta a tabela empreendimentos para listar e criar registos de topo.
- A ficha do registo consulta ativos filtrando por empreendimento_id.
- Consulta componentes filtrando por empreendimento_id e relaciona-os através de ativo_id/componente_pai_id.
- A interface apresenta “Empreendimentos”, “Novo empreendimento” e “QR Code do empreendimento”.
- O formulário cria registos na tabela empreendimentos.

Alteração alvo:
- Este módulo deve tornar-se o gestor da árvore de Ativos.
- A listagem consulta ativos de topo (ativo_pai_id nulo) filtrados por entidade_id.
- Criar ativo principal ou componente/subcomponente na mesma tabela ativos.
- A ficha apresenta a árvore completa e o QR do nó selecionado.
- Nenhuma operação nova escreve em empreendimentos ou componentes.

## 2. Módulo de inspeções atual

Ficheiro: src/Inspections.jsx

Observações confirmadas:
- O formulário mantém empreendimento_id e ativo_id.
- A lista de inspeções consulta inspecoes.empreendimento_id.
- O inventário é carregado por ativos.empreendimento_id.
- Os componentes são carregados por componentes.empreendimento_id.
- A cobertura da inspeção cria itens para o ativo e para os seus componentes.
- Os registos de inspeção guardam ativo_id e componente_id.

Alteração alvo:
- Seleção de ativo principal como contexto da inspeção.
- A inspeção deve permitir escolher qualquer nó da árvore como alvo, incluindo componente e subcomponente.
- A cobertura pode incluir descendentes conforme o âmbito escolhido.
- A nova referência canónica deve ser ativo_id.
- Manter a fotografia/snapshot da estrutura no momento da inspeção para preservar o histórico, mesmo que a árvore seja reorganizada depois.

## 3. Portal público de ocorrências por QR

Ficheiro: supabase/functions/public-occurrence/index.ts

Observações confirmadas:
- Procura primeiro QR em empreendimentos, depois em ativos e por fim em componentes.
- Resolve o ativo pai através da hierarquia antiga.
- Cria ocorrência com empreendimento_id, ativo_id e componente_id.
- Confirma o estado do empreendimento antes de aceitar a ocorrência.

Alteração alvo:
- Pesquisar o token uma única vez na tabela ativos.
- Determinar a entidade/cliente através do ativo e da sua árvore.
- Criar ocorrência com um único ativo_id apontando ao nó exato do QR.
- Responder com nome do ativo/elemento, sem nomenclatura Empreendimento.
- Manter validação de estado e proteções contra QR inválido/inativo.

## 4. Padrão de adaptação dos restantes módulos

Os seguintes módulos devem ser auditados e atualizados para ler/escrever um único ativo_id e resolver a entidade através da relação do ativo:
- src/Occurrences.jsx
- src/PathologiesLive.jsx
- src/Monitoring.jsx
- src/TechnicalDocuments.jsx
- src/AtivusAI.jsx
- src/main.jsx e navegação/menu
- RPCs e funções SQL chamadas pelos módulos.

A adaptação deve preservar a ligação exata ao nó da árvore. Não substituir sempre pelo ativo principal, pois uma ocorrência ou patologia pode incidir especificamente num componente.

## 5. Ordem recomendada de implementação

1. Criar tipos e funções partilhadas para árvore de ativos e acesso por entidade.
2. Implementar o módulo de Ativos em branch de desenvolvimento, inicialmente sem retirar o módulo antigo.
3. Adaptar inspeções e snapshots.
4. Adaptar ocorrências internas e QR público.
5. Adaptar patologias, trabalhos, documentos, monitorização, planeamento e IA.
6. Atualizar navegação e remover o rótulo Empreendimentos.
7. Só depois ligar o frontend ao esquema final, após migração ensaiada.

## 6. Critérios de teste da aplicação

- Criar um ativo principal para uma entidade.
- Criar componente e subcomponente com o mesmo formulário/estrutura.
- Reordenar ou alterar pai sem ciclos nem perda de histórico.
- Consultar árvore com dois clientes e comprovar isolamento.
- Criar inspeção ao ativo principal e a um componente.
- Criar ocorrência por QR do ativo principal e por QR de componente.
- Confirmar que ocorrência, patologia e trabalho ficam ligados ao nó exato.
- Carregar e consultar documentos técnicos e monitorização.
- Confirmar que não existe qualquer texto/menu/formulário com “Empreendimento”.
- Confirmar que a app não executa leituras ou escritas nas tabelas antigas após a fase final.

## 7. Limite

Este inventário descreve o código observado e o destino de cada módulo. Não foram alterados ficheiros de produção nem realizadas alterações de esquema. A implementação deve aguardar o esquema canónico, as políticas RLS e o ambiente de teste.

## 8. Auditoria complementar — módulos operacionais (31-10-2026)

Ficheiros consultados na branch:
- `src/Occurrences.jsx`
- `src/PathologiesLive.jsx`
- `src/Monitoring.jsx`
- `src/TechnicalDocuments.jsx`
- `src/AtivusAI.jsx`
- `src/main.jsx`
- `supabase/functions/public-occurrence/index.ts`

Dependências confirmadas:
- Ocorrências: formulário e listagem dependem de `empreendimento_id`; carregam separadamente `empreendimentos`, `ativos` e `componentes`.
- Patologias: apresenta Empreendimento, Ativo e Componente em campos separados; a criação de trabalho envia os três identificadores.
- Monitorização: o dispositivo guarda `empreendimento_id`, `ativo_id` e `componente_id`; os seletores são carregados a partir das três tabelas antigas.
- Documentação técnica: o formulário e o caminho de armazenamento usam `empreendimento_id`; valida separadamente ativo, componente, inspeção, patologia e trabalho.
- Navegação em `main.jsx`: ainda contém menu Empreendimentos, vistas de empreendimento e um fluxo de demonstração local separado do backend.
- Portal QR: procura o token em três tabelas diferentes e compõe os identificadores antigos antes de criar a ocorrência.
- A auditoria de `AtivusAI.jsx` também encontrou referências ao contexto antigo; requer adaptação conjunta com as políticas e funções SQL de IA.

## 9. Verificação de utilização atual das referências antigas na base de dados

Consulta somente de leitura ao esquema de produção, em 31-10-2026:
- `ativos.empreendimento_id`: 2 valores preenchidos.
- `ocorrencias.empreendimento_id`: 1 valor preenchido.
- `ocorrencias.ativo_id`: 1 valor preenchido.
- `empreendimento_id` nas restantes tabelas operacionais consultadas: 0 valores preenchidos.
- `ativo_id` e `componente_id` nas restantes tabelas operacionais consultadas: 0 valores preenchidos.

Esta fotografia não substitui nova contagem imediatamente antes da migração. As chaves estrangeiras, políticas e funções continuam a depender do modelo antigo mesmo quando as tabelas têm zero registos.

## 10. Dependências de segurança e lógica de negócio

A consulta ao catálogo PostgreSQL confirmou políticas RLS que chamam `user_can_access_empreendimento(...)`, incluindo políticas de trabalhos e de dados auxiliares de IA. Foram também encontradas funções SQL que recebem `p_empreendimento_id`, consultam `empreendimentos` ou escrevem `empreendimento_id` em agendamentos, trabalhos, indicadores e histórico.

Consequência: a migração não pode limitar-se a adicionar `ativo_pai_id` e copiar linhas. É necessário redesenhar e testar a autorização por `entidade_id` e/ou pela árvore do ativo, e adaptar RPCs, triggers, views, políticas RLS, Storage e Edge Functions antes de retirar as tabelas antigas.

Nenhuma política, função, tabela, registo ou ficheiro foi alterado nesta auditoria.

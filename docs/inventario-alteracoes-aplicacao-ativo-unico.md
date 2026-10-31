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

# Arquitetura alvo — ATIVUS com modelo único de Ativos

Estado: decisão funcional atualizada; desenho técnico em validação. **Não aplicar em produção.**
Ramo: feature/migracao-ativo-unico-preparacao

## 1. Decisão principal

A entidade/conceito **Empreendimento deverá desaparecer da ATIVUS**: da interface, dos formulários, da navegação, da linguagem funcional e, no final da migração, também do modelo de dados.

A aplicação terá um único conceito operacional: **Ativo**.

Cada ativo poderá:
- ser um ativo principal, sem ativo pai;
- ser um componente de outro ativo;
- ser um subcomponente, ligado a outro componente.

A hierarquia será representada numa única tabela de ativos, através de uma relação do ativo consigo próprio (por exemplo, `ativo_pai_id`). Não haverá tabelas operacionais separadas para “empreendimentos”, “ativos secundários” e “componentes”.

A tabela `entidades` mantém-se: representa a empresa/cliente titular dos ativos (multiempresa), não um empreendimento nem um ativo.

## 2. Exemplos funcionais confirmados

- Pestana Carvoeiro Golf – AL = Ativo principal.
  - Zona de alojamento – Gramacho = componente.
  - Zona de alojamento – Vale da Pinta = componente.
- Casa Rua de Casal do Monte 54 = Ativo principal autónomo.

Na aplicação, o utilizador verá uma única árvore e uma única linguagem: Ativos, Componentes e Subcomponentes. “Empreendimento” deixa de ser apresentado.

## 3. Modelo de dados alvo (proposta)

Uma única tabela `ativos` deverá concentrar os dados atualmente repartidos entre `empreendimentos`, `ativos` e `componentes`.

Campos e relações essenciais:
- `id`: identificador único do ativo.
- `entidade_id`: empresa/cliente proprietária.
- `ativo_pai_id`: referência opcional a outro registo de `ativos`; nulo significa ativo principal.
- `codigo`, `nome`, `tipo`, `descricao`, `estado`.
- localização: morada, código postal, localidade, concelho, distrito e localização detalhada.
- conservação/manutenção: estado de manutenção e classe de conservação.
- identificação: QR token, código interno.
- dados técnicos: características, dimensões, fabricante, modelo, número de série, sistema associado e referências documentais.
- datas e autoria.

A estrutura final deve suportar vários níveis de hierarquia e impedir ciclos (um ativo não pode ser pai de si próprio nem de um descendente).

Os registos de inspeção, ocorrências, patologias, trabalhos, documentos, monitorização e planeamento devem apontar para um único `ativo_id`, que identifica exatamente o ativo ou componente a que dizem respeito. O contexto da entidade/cliente será validado através do ativo e das suas relações, com políticas RLS adequadas.

## 4. Estratégia de migração — sem perda de dados

A mudança é estrutural e não deve ser feita por substituição direta ou eliminação imediata de tabelas.

1. Criar uma tabela/mapa de correspondência entre os IDs atuais de empreendimentos, ativos e componentes e o ID canónico de cada ativo na nova tabela.
2. Verificar colisões de UUID entre as três tabelas. Preservar os UUID existentes sempre que não colidam; nos casos de colisão, atribuir novo UUID e guardar correspondência auditável.
3. Migrar os atuais registos de `empreendimentos` como ativos principais.
4. Migrar os atuais registos de `ativos` e `componentes` como nós subordinados, respeitando a hierarquia aprovada.
5. Copiar todos os atributos relevantes, incluindo códigos QR, dados técnicos, documentos referenciados, datas e autoria.
6. Converter referências nas tabelas operacionais para o novo `ativo_id`, mantendo temporariamente as colunas antigas para compatibilidade e auditoria.
7. Adaptar funções SQL, triggers, políticas RLS, políticas de Storage, Edge Functions, relatórios e código da aplicação.
8. Validar contagens, chaves estrangeiras, QR, permissões por cliente e histórico antes de desativar estruturas antigas.
9. Só após testes e período de estabilidade, remover as tabelas/colunas antigas e as referências ao conceito Empreendimento.

**Não executar qualquer migração destrutiva antes de backup verificável, ensaio em ambiente isolado e plano de reversão.**

## 5. Dependências técnicas já identificadas

A estrutura atual usa `empreendimento_id` em diversas tabelas, políticas RLS, funções e operações. Existem referências a `ativos` em:
- componentes;
- ai_levantamentos;
- dispositivos_monitorizacao;
- documentos_tecnicos;
- inspecao_itens e inspecao_registos;
- ocorrencias;
- patologias;
- plano_manutencao_elementos;
- regras_inspecao_periodica;
- trabalhos.

Também há referências diretas a `empreendimentos` em inspeções, orçamentos, planos, agendamentos, indicadores, histórico e outras tabelas. A migração terá de inventariar e adaptar todas as FKs, índices, restrições, políticas, funções e triggers. Não basta renomear uma coluna.

## 6. Preservação de dados conhecida

- Pestana Carvoeiro Golf – AL será migrado como ativo principal.
- Gramacho e Vale da Pinta serão migrados como componentes do Pestana.
- Casa Rua de Casal do Monte 54 será migrada como ativo principal.
- A ocorrência existente de mau cheiro no Quarto 118 deverá continuar ligada a Gramacho, sem alteração do código, descrição, localização, estado ou histórico.

Os UUIDs e QR tokens devem ser preservados sempre que tecnicamente possível. Qualquer exceção terá de constar no mapa de correspondência e ser validada.

## 7. Alterações necessárias na aplicação

- Remover “Empreendimentos” do menu, dos títulos, dos formulários e dos seletores.
- Criar e gerir ativos principais diretamente no módulo Ativos.
- Criar componentes/subcomponentes dentro de um ativo, na mesma árvore.
- Usar um seletor de ativos comum em inspeções, ocorrências, patologias, trabalhos, documentos, monitorização e manutenção.
- Permitir inspeções ao ativo principal ou a qualquer nó da árvore.
- Garantir que QR codes identificam o nó exato e que o portal público cria ocorrências no ativo correto.
- Mostrar sempre a empresa/cliente como contexto, sem confundir essa entidade com um ativo.

## 8. Fases e segurança

### Fase A — desenho e inventário
- Confirmar o esquema completo, dependências e colisões de identificadores.
- Definir mapa de migração e regras de hierarquia.
- Sem alterações na base de dados de produção.

### Fase B — expansão compatível
- Acrescentar a estrutura canónica e mecanismos de correspondência.
- Preparar migração e compatibilidade de leitura/escrita.
- Atualizar a aplicação em branch de desenvolvimento.
- Ensaiar com cópia isolada da base de dados.

### Fase C — migração controlada
- Backup verificável.
- Migração transacional/idempotente.
- Reassociação e validação de todas as referências.
- Testes funcionais, RLS, Storage, QR e Edge Functions.

### Fase D — remoção do legado
- Remover tabelas e colunas de empreendimentos/componentes apenas quando não houver dependências ativas.
- Remover referências e nomenclatura antiga do código.
- Esta fase exige aprovação explícita e plano de reversão.

## 9. Critérios de aceitação

- Existe apenas um conceito de registo operacional: Ativo.
- Cada ativo principal existe uma única vez.
- Componentes e subcomponentes são ativos na mesma tabela, ligados hierarquicamente.
- Não existem referências órfãs nem mistura de dados entre clientes.
- Inspeções, ocorrências, patologias, trabalhos, documentos e manutenção continuam íntegros.
- QR codes e permissões continuam a funcionar.
- Nenhuma tabela antiga é removida antes da validação integral e aprovação.

## 10. Estado desta entrega

Este documento regista a arquitetura alvo revista. Não altera a base de dados de produção nem a aplicação publicada. O próximo trabalho é fechar o inventário de dependências e desenhar a migração aditiva, com verificações e rollback, antes de escrever ou executar SQL de alteração.

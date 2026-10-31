# Arquitetura proposta — modelo único de Ativos

Estado: proposta técnica em revisão. **Não aplicar em produção.**
Ramo: feature/migracao-ativo-unico-preparacao

## 1. Decisão funcional

A aplicação apresenta uma única árvore de ativos por cliente:
- **Ativo principal**: registo de topo, por exemplo edifício, empreendimento, ponte, instalação ou equipamento autónomo.
- **Componente**: elemento pertencente a um ativo principal ou a outro componente.
- **Subcomponente**: componente filho, sem limite funcional de profundidade definido nesta fase.

Não pode existir um registo de topo e um segundo registo de ativo para representar a mesma realidade física.

Exemplos aprovados:
- Pestana Carvoeiro Golf – AL = ativo principal.
- Zona de alojamento – Gramacho e Zona de alojamento – Vale da Pinta = componentes do Pestana.
- Casa Rua de Casal do Monte 54 = ativo principal autónomo.

## 2. Estratégia de transição recomendada

A opção menos arriscada é **não substituir já a tabela de topo**. A tabela empreendimentos já contém os campos necessários para representar o ativo principal e é referenciada por grande parte do domínio, regras RLS, funções, relatórios e armazenamento.

Durante a transição:
- empreendimentos passa a ser a representação técnica do **ativo principal** (o rótulo apresentado na aplicação será “Ativo principal”).
- componentes passa a conter todos os elementos subordinados, incluindo os atuais registos da tabela ativos.
- ativos fica temporariamente como tabela legada de compatibilidade, sem ser usada para criar novos registos.
- entidades mantém-se como organização/cliente multiempresa; não é um ativo e não deve ser removida.

Esta solução elimina a duplicação na experiência da aplicação sem obrigar a reescrever numa só fase as referências a empreendimento_id, as políticas RLS e as funções existentes.

## 3. Migração de dados proposta (ainda não executada)

A migração dos atuais ativos secundários para componentes deverá:
1. Criar um mapa de migração imutável com o UUID antigo, UUID novo (preferencialmente o mesmo UUID), ativo principal de destino e estado da migração.
2. Validar colisões de UUID, códigos únicos, entidade/cliente, empreendimento de destino e integridade de todos os registos dependentes.
3. Copiar cada linha de ativos para componentes, preservando o UUID, código, nome, tipo, descrição, localização, estado de manutenção, classe de conservação, QR token, características técnicas, dimensões, referências documentais, fabricante, modelo, datas e autor.
4. Associar o novo componente ao empreendimento_id principal correto. Para componentes filhos, manter componente_pai_id; para componentes de primeiro nível, deixar o pai nulo.
5. Ajustar a regra de integridade de componentes: um componente de primeiro nível pode estar ligado diretamente ao ativo principal através de empreendimento_id, sem precisar de um ativo_id legado.
6. Reassociar, com verificação linha a linha, as referências dos registos dependentes que atualmente apontam para ativos. Quando existir campo componente_id, preencher esse campo com o UUID do componente e limpar o campo legado ativo_id apenas depois de confirmar a FK e a correspondência.
7. Preservar explicitamente ocorrências, inspeções, itens/registos de inspeção, patologias, trabalhos, documentos, dispositivos de monitorização, regras de inspeção e elementos de planos de manutenção.
8. Executar verificações de contagem, órfãos, referências, QR tokens, RLS e funcionamento da aplicação antes de qualquer desativação da tabela antiga.

**Importante:** não assumir que todos os dependentes têm a mesma estrutura. Há dependências com comportamentos CASCADE, SET NULL e RESTRICT; a migração tem de repontar os registos antes de qualquer remoção ou alteração de FK.

## 4. Dependências já confirmadas na base de dados

Foram encontradas referências diretas à tabela ativos em:
- componentes.ativo_id
- ai_levantamentos.ativo_id
- dispositivos_monitorizacao.ativo_id
- documentos_tecnicos.ativo_id
- inspecao_itens.ativo_id
- inspecao_registos.ativo_id
- ocorrencias.ativo_id
- patologias.ativo_id
- plano_manutencao_elementos.ativo_id
- regras_inspecao_periodica.ativo_id
- trabalhos.ativo_id

Várias destas tabelas já possuem também componente_id, mas isso não elimina a necessidade de validar os casos em que o campo está ausente ou tem regras próprias. A tabela inspecoes está associada ao ativo principal através de empreendimento_id; os elementos inspecionados são registados nas tabelas de itens/registos.

As tabelas operacionais mantêm empreendimento_id como contexto do cliente/ativo principal. As políticas RLS existentes dependem amplamente desse campo. Mantê-lo nesta fase reduz o risco de quebrar o isolamento entre clientes.

## 5. Caso de dados conhecido

- Pestana Carvoeiro Golf – AL: ativo principal existente.
- Gramacho: atual ativo secundário, deverá tornar-se componente do Pestana, preservando o UUID e o histórico.
- Vale da Pinta: atual ativo secundário, deverá tornar-se componente do Pestana, preservando o UUID e o histórico.
- Casa Rua de Casal do Monte 54: ativo principal existente; não deve ser criado outro registo em ativos.

A ocorrência existente de mau cheiro no Quarto 118 está atualmente associada ao registo de Gramacho. A migração deverá mantê-la ligada ao mesmo elemento físico, passando a referência de ativo legado para componente, sem alterar descrição, localização, estado ou código.

## 6. Alterações necessárias na aplicação

- Apresentar uma única lista de ativos principais, sem criar um ativo secundário duplicado para cada empreendimento.
- Mostrar a árvore de componentes e subcomponentes dentro do ativo principal.
- Usar o mesmo seletor/estrutura de ativo em inspeções, ocorrências, patologias, trabalhos, documentos, monitorização e planeamento.
- Permitir inspeções ao ativo principal e a qualquer componente/subcomponente.
- Garantir que QR codes do ativo principal e dos componentes resolvem para o elemento certo.
- Atualizar o portal público de ocorrências para resolver primeiro o QR do ativo principal e depois o QR de componente, sem gerar referências duplicadas.
- Manter empreendimento_id internamente como contexto do ativo principal durante a fase de compatibilidade; a interface não deve expor a antiga duplicação de conceitos.

## 7. Fases e condições de segurança

### Fase A — preparação (atual)
- Diagnóstico de esquema, FKs, políticas e dados.
- Definição funcional e mapa de correspondências.
- Nenhuma alteração de produção.

### Fase B — expansão compatível
- Criar mapa de migração e acrescentar/ajustar estruturas sem remover colunas ou tabelas.
- Preparar funções e políticas para a nova árvore.
- Atualizar a aplicação para ler o novo modelo, mantendo compatibilidade temporária.
- Testar em ambiente isolado com cópia de dados.

### Fase C — migração controlada
- Fazer backup verificável.
- Migrar em transação ou lotes idempotentes com registo de progresso.
- Reassociar dependências e validar contagens, FKs e RLS.
- Testar os fluxos completos e o QR público.

### Fase D — contração (decisão futura)
- Só depois de período de estabilidade, remover referências e tabela legada ativos.
- A contração exige revisão separada de todas as funções SQL, triggers, Edge Functions, políticas de Storage, relatórios e versões da aplicação.

## 8. Critérios de aceitação

- Um único registo para cada ativo principal.
- Componentes e subcomponentes apresentados numa árvore hierárquica.
- Nenhuma perda de UUID, QR token, documento, inspeção, ocorrência, patologia ou trabalho.
- Nenhuma referência órfã ou cruzamento entre clientes.
- RLS continua a limitar cada utilizador aos ativos da sua organização.
- Fluxos de criação, edição, consulta, inspeção, ocorrência pública e manutenção passam os testes.
- A tabela legada só é removida após aprovação explícita e validação de rollback.

## 9. Limites desta entrega

Este documento é arquitetura e plano de migração. Não contém uma migração SQL pronta a aplicar e não executa alterações na base de dados. Antes de escrever DDL/DML final, falta fechar o inventário completo de colunas, índices, políticas, funções, triggers, Edge Functions, buckets e dependências da aplicação, e ensaiar a migração numa cópia isolada.

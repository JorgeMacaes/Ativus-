# Auditoria inicial do MVP Seven M Ativus

**Data:** 2026-10-14  
**Âmbito:** leitura estática do código disponível no ramo principal. Esta auditoria não substitui execução/testes funcionais em dispositivo.

## 1. Resultado executivo

O código atual é um protótipo de interface React/Vite empacotado com Capacitor. Já contém ecrãs básicos de dashboard, ativos, inspeções, patologias, agenda, monitorização, documentação e parametrização. Contudo, a implementação ainda não corresponde à arquitetura transversal e ao fluxo de inventário em grande escala agora definido.

**Conclusão:** não gerar ainda um APK de produção. Primeiro, rever o modelo de dados e construir o módulo de inventário e a arquitetura de persistência/sincronização.

## 2. Constatações observáveis no código

- src/main.jsx usa localStorage para carregar e guardar ativos, inspeções, patologias, materiais e relações técnicas.
- Existem dados de demonstração fixos (seedAssets, seedInspections, seedPathologies, seedMaterials, seedRelations).
- O estado de sincronização apresentado no cabeçalho é texto fixo “Dados locais”; não comprova sincronização com servidor.
- A criação de ativo usa window.prompt para o nome e define valores predefinidos, incluindo tipo e localização. Isto não é um formulário de cadastro extensível e validado.
- O ativo de demonstração tem apenas contadores de componentes; não existe no fluxo lido um CRUD completo de componentes e subcomponentes com a hierarquia requerida.
- A ficha de ativo apresenta campos básicos e não implementa a ficha configurável de componente/subcomponente definida nesta especificação.
- A inspeção de demonstração cria um registo simples, com tipo “Rotina”, data local e texto genérico para o inspetor; não há fluxo completo de início, pausa, conclusão e recolha de dados contextuais.
- Os módulos de monitorização e documentação são apresentados como módulos de base/placeholder no código consultado.
- A parametrização existente mostra materiais, relações técnicas, regras de exemplo e sugestões de IA ilustrativas. Não comprova integração com um serviço de IA nem execução real de análise de imagens/documentos.
- package.json contém React, Vite, Capacitor e lucide-react; no ficheiro consultado não aparecem dependências de API/backend, base de dados central, OCR ou integração de IA.
- A configuração Capacitor define o identificador Android com.sevenm.ativus.mobile.

## 3. Lacunas prioritárias

### P0 — Modelo de dados e inventário
1. Formalizar as entidades: entidade gestora, ativo, componente, subcomponente, localização, materiais, características dinâmicas e estado ativo/inativo.
2. Definir identificadores únicos, relações e regras de integridade.
3. Implementar formulários de criação/edição, pesquisa, filtros, edição em massa e históricos.
4. Implementar importação Excel/CSV com mapeamento de colunas, pré-visualização, validação, relatório de erros e deteção de duplicados.
5. Definir publicação/versionamento do inventário e estados: em preparação, em validação, disponível para inspeção.

### P0 — Persistência e sincronização
1. Definir backend/API e base de dados central.
2. Definir autenticação, perfis, permissões e âmbito de acesso.
3. Implementar persistência local para operação offline e sincronização incremental.
4. Definir resolução de conflitos e auditoria sem perda silenciosa de dados.
5. Só apresentar estados de sincronização confirmados pelo servidor quando essa integração existir.

### P1 — Parametrização por tipologia
1. Criar tipologias configuráveis para hotéis, edifícios habitacionais/de serviços, ativos rodoviários e ferroviários.
2. Permitir campos e hierarquias próprios por tipologia sem alterar o código.
3. Implementar localização por edifício/piso/zona e referenciação linear rodoviária/ferroviária.
4. Tornar marca, modelo, cor e outras características opcionais/condicionais.

### P1 — IA para criação do inventário
1. Definir serviço de IA e política de tratamento/armazenamento dos ficheiros.
2. Implementar fluxo de envio e análise de fotografias, projetos, plantas, PDFs e digitalizações.
3. Separar dados extraídos, inferidos e confirmados.
4. Apresentar propostas para revisão humana antes de gravar/publicar.
5. Guardar fonte, confiança, decisão do utilizador e auditoria das alterações.

### P2 — Inspeções e módulos ligados
1. Ligar as inspeções aos elementos reais do inventário.
2. Implementar inspeções de Rotina, Principal e Especial com campos e regras parametrizados.
3. Associar patologias, trabalhos, custos e documentos aos elementos certos.
4. Implementar agenda e histórico de intervenções.
5. Implementar compressão de imagens e fila de envio offline.

## 4. Sequência recomendada

1. Aprovar o modelo de dados e as tipologias iniciais.
2. Escolher/implementar backend, API, autenticação e persistência central.
3. Construir o inventário e a importação em massa.
4. Implementar parametrização e localização específica por tipologia.
5. Implementar publicação de versões e sincronização offline.
6. Adicionar IA assistiva para criar e atualizar o inventário.
7. Integrar inspeções, patologias, intervenções e custos.
8. Testar com conjuntos de dados representativos e dispositivo Android real.
9. Gerar novo APK apenas após os critérios de aceitação passarem.

## 5. Critérios de aceitação para a primeira fase de inventário

- Criar uma entidade gestora e vários ativos de tipologias diferentes.
- Criar múltiplos componentes por ativo e múltiplos subcomponentes por componente.
- Configurar características opcionais/condicionais.
- Registar localização adequada à tipologia, incluindo quilometragem inicial/final para ativos lineares.
- Importar um conjunto grande de registos com pré-visualização, erros e prevenção de duplicados.
- Manter identificadores estáveis, histórico e auditoria.
- Publicar uma versão validada e sincronizá-la para a app.
- Trabalhar offline e sincronizar sem duplicar nem perder alterações.
- Testar sugestões de IA com revisão humana antes da publicação.

## 6. Limitações desta auditoria

A auditoria baseia-se nos ficheiros src/main.jsx, package.json e capacitor.config.ts lidos no ramo principal. Não foi executada uma auditoria de todo o repositório, não foi testado o APK num dispositivo e não foi verificada a existência de serviços externos não referenciados nesses ficheiros. As constatações devem ser confirmadas durante a análise técnica completa.

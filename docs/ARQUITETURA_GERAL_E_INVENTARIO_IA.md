# Seven M Ativus — Arquitetura funcional transversal e inventário assistido por IA

**Estado:** especificação de arquitetura para orientar o redesenho. Não constitui confirmação de implementação no código.

## 1. Objetivo

A Seven M Ativus é um sistema integrado composto por:
- **Plataforma web de gestão:** parametrização, criação e validação do inventário, planeamento, análise, custos, documentação, relatórios e administração.
- **Aplicação móvel:** consulta do inventário sincronizado, recolha de dados no terreno, inspeções, fotografias, ocorrências e registo de trabalhos, com capacidade offline.

O sistema destina-se a múltiplas tipologias, incluindo hotéis, edifícios habitacionais, edifícios de serviços, infraestruturas rodoviárias e infraestruturas ferroviárias. A solução não deve limitar-se a edifícios residenciais nem fixar no código listas fechadas de componentes.

## 2. Princípio prioritário

O inventário é a base operacional do sistema. O fluxo de referência é:

**Parametrização → criação/importação do inventário → validação → publicação/sincronização → inspeções → patologias → trabalhos/intervenções → custos, verificação e histórico.**

A aplicação móvel deve consumir o inventário preparado na plataforma e permitir atualizações controladas no terreno. O sistema deve preservar os registos históricos e evitar duplicação de dados.

## 3. Hierarquia dos dados

A hierarquia principal é:

**Entidade gestora do ativo → Ativo → Componente → Subcomponente**

- Uma entidade gestora pode gerir vários ativos.
- Um ativo pode conter vários componentes.
- Um componente pode conter vários subcomponentes.
- Componentes e subcomponentes têm identificadores próprios, características, localização e histórico.
- A hierarquia é configurável para cada tipologia, permitindo diferentes estruturas e níveis de detalhe sem alterar o código.
- Desativar um elemento não elimina o seu histórico nem os registos associados.

## 4. Módulos no contexto de cada ativo

1. Inventário
2. Inspeções
3. Patologias
4. Trabalhos / Intervenções
5. Agenda
6. Custos
7. Documentação
8. Outros (incluindo, quando configurado, monitorização e ocorrências)

Todos os módulos devem referenciar os mesmos registos de ativos e elementos, sem criar cópias independentes desnecessárias.

## 5. Caracterização de componentes e subcomponentes

Componentes e subcomponentes partilham uma estrutura de caracterização parametrizável:

- Nome
- Fotografia(s)
- Tipo: estrutural / não estrutural, quando aplicável
- Material ou materiais
- Unidade e quantidade
- Marca, quando aplicável
- Modelo, quando aplicável
- Outras características configuráveis (por exemplo, cor, dimensões, acabamento, referência técnica)
- Localização
- Histórico de patologias
- Histórico de trabalhos/intervenções
- Estado: ativo / inativo
- Responsabilidade: entidade gestora do ativo / terceiros
- Classificação: principal / secundário
- Estado de conservação, obtido através da Inspeção Principal
- Estado de manutenção, obtido através da Inspeção de Rotina

Os campos de marca, modelo, cor e outras características específicas são opcionais ou condicionais. A plataforma de gestão define quais os campos aplicáveis a cada tipologia ou tipo de elemento. Deve ser possível acrescentar características sem alteração do código.

O catálogo de unidades deve ser parametrizável (por exemplo, m², m³, m, unidade, kg). A unidade deve ser coerente com a quantidade e com a estimativa de trabalhos/custos.

## 6. Localização adaptada à tipologia

A localização deve ser configurável por tipo de ativo e elemento. Pode combinar campos estruturados com descrição livre, sem obrigar a que todos os campos sejam preenchidos.

### Edifícios, hotéis e serviços
Campos possíveis: edifício, piso, zona/compartimento, fachada/orientação, referência em planta, coordenadas GPS e descrição complementar. Planta e GPS são opcionais quando não existem ou não são adequados.

### Infraestruturas rodoviárias
Campos possíveis: via/estrada, identificação da infraestrutura, troço, sublanço, sentido, faixa/via, lado/posição, quilómetro inicial e final, coordenadas e referência complementar.

### Infraestruturas ferroviárias
Campos possíveis: linha, troço, via, ramal, estação/apeadeiro, sentido, quilometragem ferroviária inicial e final, lado/posição, coordenadas e referência complementar.

A localização linear deve suportar elementos pontuais e intervalos lineares. Deve preservar a referência oficial usada pelo gestor e suportar descontinuidades, equações de quilometragem, ramais e sistemas de referenciação próprios. Não se deve assumir que a quilometragem corresponde diretamente à distância geográfica.

## 7. Criação e carregamento de inventários

A plataforma deve suportar inventários extensos e operações em massa:
- Importação de Excel e CSV, com mapeamento das colunas e validação antes de gravar.
- Importação de dados existentes de outros sistemas, quando o formato for conhecido.
- Criação a partir de modelos e estruturas repetíveis.
- Duplicação controlada de estruturas, gerando identificadores únicos.
- Edição em massa e atualização de registos.
- Pré-visualização das alterações antes da confirmação.
- Relatório de erros, avisos, registos importados e registos rejeitados.
- Deteção de duplicados e de relações inválidas entre ativo, componente e subcomponente.
- Identificadores únicos e possibilidade de códigos QR.
- Preservação da origem, data, autor e histórico de alteração.
- Versionamento do inventário e possibilidade de consultar diferenças entre versões.

### Estados do inventário
- **Em preparação:** em criação ou importação.
- **Em validação:** a verificar.
- **Disponível para inspeção:** validado e publicado para os utilizadores autorizados.

Os critérios de completude devem depender da tipologia e do tipo de elemento. Não se deve exigir uma marca para um elemento em que a marca não seja aplicável.

## 8. Inteligência Artificial ao longo do ciclo de inventário

A IA deve apoiar a criação e atualização do inventário a partir de:
- Fotografias.
- Projetos, plantas, cortes, alçados e desenhos técnicos.
- PDFs, documentos digitalizados e OCR.
- Tabelas, fichas técnicas e relatórios.
- Ficheiros Excel/CSV e inventários anteriores.

Funções pretendidas:
- Sugerir a identificação de componentes e subcomponentes.
- Extrair nomes, referências, dimensões e características visíveis/documentadas.
- Propor relações hierárquicas e localização.
- Identificar elementos repetidos, duplicados ou possivelmente em falta.
- Comparar fontes novas com o inventário existente.
- Propor atualizações sem apagar ou substituir automaticamente o histórico.
- Explicitar a origem e o nível de confiança das sugestões.

### Controlo da IA
Cada dado deve distinguir, sempre que possível:
1. Extraído diretamente de uma fonte;
2. Inferido ou sugerido pela IA;
3. Confirmado por um utilizador autorizado.

A IA não deve apresentar uma inferência como facto confirmado. As sugestões devem ser revistas, corrigidas, aceites ou rejeitadas antes da publicação do inventário. Deve ficar registado quem aprovou as alterações e com base em que fonte.

## 9. Inspeções

As inspeções são realizadas sobre os elementos existentes no inventário:
- **Inspeção de Rotina:** determina o estado de manutenção.
- **Inspeção Principal:** determina o estado de conservação e o estado de manutenção, conforme a configuração aprovada.
- **Inspeção Especial:** realizada após acontecimento relevante, anomalia, reparação ou substituição, com o motivo registado.

A inspeção deve indicar o âmbito abrangido e distinguir elementos inspecionados, sem anomalia, com patologia, inacessíveis ou não aplicáveis. Os resultados devem ser associados ao elemento correto e manter histórico cronológico. A avaliação não deve ser inventada ou preenchida automaticamente pela IA.

## 10. Sincronização e funcionamento móvel

- Sincronizar os ativos e os elementos autorizados para cada utilizador/equipa.
- Permitir consulta e recolha offline dos dados necessários.
- Manter fila de sincronização para alterações e fotografias.
- Mostrar estados de sincronização e erros recuperáveis.
- Resolver conflitos sem perda silenciosa de dados, com regras explícitas e histórico.
- Aplicar permissões por utilizador, perfil e âmbito de ativos.
- Configurar compressão/qualidade de imagem, mantendo qualidade suficiente para evidência técnica.
- Permitir atualização do inventário e sincronização de novas versões controladas.

## 11. Plataforma de parametrização

A plataforma deverá permitir configurar, sem alterar o código:
- Tipologias e hierarquias de ativos.
- Componentes, subcomponentes e modelos repetíveis.
- Campos, tipos de campo e condições de apresentação.
- Catálogos de materiais, unidades, marcas e modelos, quando relevantes.
- Campos e regras de localização por tipologia.
- Estados, classificações e responsabilidades.
- Inspeções, formulários e regras de validação.
- Patologias, causas, efeitos, trabalhos e relações entre catálogos.
- Regras de importação, sincronização e validação.
- Parâmetros de assistência por IA e respetivos controlos de aprovação.
- Utilizadores, perfis, permissões, auditoria e versões.

Tipos de campo possíveis: texto, texto longo, número, número com unidade, percentagem, data, hora, booleano, seleção única/múltipla, dimensão, quantidade, fotografia, documento, localização/GPS, entidade, utilizador e valor calculado.

## 12. Patologias, trabalhos e histórico

- As patologias são associadas ao elemento e à localização concreta.
- Uma patologia pode ter várias causas, efeitos e trabalhos associados.
- Um trabalho pode responder a várias patologias.
- Os registos devem manter estados, datas, responsáveis, fotografias e documentos.
- O histórico deve sobreviver à desativação ou substituição do elemento.
- Os custos estimados, orçamentados, aprovados e reais devem estar diferenciados.

## 13. Ordem de implementação proposta

1. Rever a arquitetura e a estrutura de dados atual.
2. Definir o núcleo transversal e a parametrização por tipologia.
3. Construir o inventário: CRUD, importação em massa, validação, versionamento e auditoria.
4. Construir os campos e a localização adaptados às tipologias.
5. Implementar a assistência por IA à criação/importação, com revisão humana.
6. Implementar sincronização, funcionamento offline e tratamento de conflitos.
7. Integrar inspeções e respetivos fluxos.
8. Integrar patologias, trabalhos, agenda, custos e documentação.
9. Testar o fluxo integrado com dados representativos.
10. Só então gerar e validar um novo APK.

## 14. Critérios mínimos de aceitação do inventário

- Importar um ficheiro com muitos registos sem bloquear a interface.
- Mostrar pré-visualização e erros antes de confirmar a importação.
- Preservar relações e identificadores únicos.
- Permitir corrigir e voltar a importar dados sem criar duplicados involuntários.
- Configurar tipologias e campos sem alteração de código.
- Manter os campos comerciais opcionais/condicionais.
- Representar localização por edifício ou por referência linear rodoviária/ferroviária.
- Rever sugestões da IA antes de publicar o inventário.
- Sincronizar dados e fotografias para a aplicação móvel, incluindo utilização offline.
- Preservar o histórico quando os elementos são alterados ou desativados.

## 15. Limites desta especificação

Este documento regista os requisitos funcionais e a arquitetura proposta. A implementação exige uma auditoria do código atual, da estrutura de dados, da autenticação, do armazenamento e da sincronização. Não se deve assumir que OCR, análise de projetos, IA visual, backend ou sincronização multiutilizador já estão implementados.

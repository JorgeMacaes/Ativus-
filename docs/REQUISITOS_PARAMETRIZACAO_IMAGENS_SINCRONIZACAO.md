# Seven M Ativus — Requisitos funcionais para a próxima versão

## 1. Objetivo
A plataforma de gestão/parametrização deve permitir configurar o sistema de ponta a ponta, sem exigir alterações ao código para criar ou modificar parâmetros operacionais. A aplicação móvel consome a mesma configuração e comunica o estado de sincronização de cada registo.

## 2. Parametrização integral
A plataforma deve disponibilizar operações de criar, consultar, editar, duplicar, desativar/arquivar, importar/exportar e versionar, conforme as permissões, para:

- Organizações, utilizadores, perfis, permissões e atribuições por âmbito;
- Empreendimentos, tipos de ativo, ativos, componentes, subcomponentes, hierarquias e campos dinâmicos;
- Materiais e compatibilidade material–patologia;
- Tipos e modelos de inspeção, listas de verificação, respostas, campos obrigatórios e condicionais;
- Patologias, características, causas, efeitos, trabalhos, unidades e relações técnicas muitos-para-muitos;
- Estados e transições de inspeções, patologias, trabalhos e custos;
- Escalas EC, regras de cálculo, risco, prioridades, prazos, alertas e medidas de segurança;
- Planeamento, equipas, responsáveis, recursos, custos de referência e modelos de relatório;
- Documentos, notificações, regras de comportamento e parâmetros de IA.

Cada parâmetro deve ter, quando aplicável: código único, nome, descrição, estado ativo/inativo, validade, relações, permissões, data de criação/alteração e autor. Não eliminar fisicamente parâmetros usados em registos históricos.

## 3. Versionamento e auditoria
- Publicar alterações como uma nova versão de configuração.
- Guardar a versão de configuração usada por cada inspeção, patologia, intervenção e relatório.
- Manter registo de quem alterou o quê, quando e valores anteriores/novos.
- Permitir validar alterações em rascunho antes de publicar.
- A app deve indicar quando existe uma nova versão de configuração disponível e só a aplicar de acordo com a política de sincronização definida.

## 4. Fotografias e compressão na app
- Permitir configurar a qualidade de imagem: original, alta, equilibrada ou reduzida, com valores de compressão ajustáveis pela gestão.
- Gerar uma cópia otimizada para envio, sem substituir o original quando este tiver de ser preservado.
- Redimensionar imagens muito grandes antes de as enviar; manter metadados técnicos úteis e associar a imagem ao empreendimento, inspeção, componente/subcomponente e patologia.
- Mostrar tamanho original e tamanho otimizado, quando disponível.
- Evitar que a compressão impeça a leitura de fissuras, corrosão, destacamentos ou outros detalhes; disponibilizar captura/armazenamento em alta qualidade para evidência técnica.
- Guardar temporariamente as imagens no dispositivo quando estiver offline e enviá-las quando a ligação for restabelecida.

## 5. Estado de sincronização app ↔ plataforma de gestão
O estado deve estar visível na app, na plataforma de gestão e ao nível de cada registo/fotografia. Estados mínimos:

- **Só no dispositivo** — ainda não enviado;
- **Pendente de envio** — aguarda ligação ou fila de sincronização;
- **A sincronizar** — transferência em curso;
- **Sincronizado** — servidor confirmou a receção;
- **Conflito** — existem alterações concorrentes que exigem resolução;
- **Erro de sincronização** — envio/receção falhou; indicar motivo e permitir tentar novamente;
- **Configuração desatualizada** — a app está a usar uma versão anterior à publicada.

O estado “Sincronizado” só pode ser mostrado após confirmação do servidor. Uma gravação em armazenamento local não equivale a sincronização.

## 6. Regras de sincronização e integridade
- Cada registo deve ter identificador global estável, versão, data de alteração e origem (app ou plataforma).
- Sincronização incremental e repetível, com tentativas automáticas e operação manual “Sincronizar agora”.
- Evitar duplicados através de operações idempotentes.
- Não perder dados em falhas de rede, fecho da app ou repetição de envios.
- Definir regras explícitas para conflitos; não substituir silenciosamente dados técnicos.
- A auditoria deve registar criação, edição, envio, receção e resolução de conflitos.
- A plataforma deve mostrar última sincronização bem-sucedida, itens pendentes, erros e versão de configuração em cada dispositivo/utilizador quando disponível.

## 7. Arquitetura necessária
A plataforma e a app devem usar uma API e uma base de dados comuns. A app mantém uma base local para trabalho offline e sincroniza com o servidor. A plataforma de gestão é a fonte de publicação da parametrização; a app consome versões publicadas e envia os registos de campo.

A interface atual baseada em armazenamento local do navegador é apenas um protótipo: não deve apresentar sincronização real nem estado “Sincronizado” sem uma API/backend operacional. Implementar e testar a sincronização real requer serviço de API, autenticação/autorização, persistência central, fila de sincronização e testes de conflito/offline.


## 8. Parametrização de todos os campos do sistema

A plataforma de gestão deve permitir parametrizar **todos os campos funcionais apresentados ou utilizados no sistema**, e não apenas os catálogos atualmente listados. A configuração deve abranger os formulários da aplicação móvel, os formulários da plataforma web, importações, relatórios, regras de validação e dados usados pela IA.

Para cada campo, quando aplicável, um utilizador com permissões deve poder configurar:
- Nome/etiqueta, descrição, código, tipo de campo e formato;
- Se está ativo, visível, editável ou apenas de leitura;
- Obrigatoriedade, valor por defeito, limites, precisão e validações;
- Opções de seleção, possibilidade de adicionar opções e relações com outros campos;
- Regras condicionais de apresentação, preenchimento e obrigatoriedade;
- Aplicabilidade por tipo de ativo, espaço, componente, subcomponente, equipamento, inspeção, patologia, trabalho ou perfil;
- Ordem e agrupamento do campo nos formulários;
- Permissões para consultar, criar ou alterar o campo;
- Inclusão em pesquisa, filtros, exportações e relatórios, quando adequado.

Devem poder ser criados novos campos e desativados campos existentes sem alteração do código nem reinstalação da aplicação móvel. Campos já usados em registos históricos não devem ser eliminados de forma a destruir dados; a desativação deve preservar os valores e a sua interpretação histórica.

A publicação de uma configuração deve atualizar a versão consumida pela app após sincronização. A plataforma deve validar dependências e mostrar o impacto previsto antes de publicar. Campos e regras que afetem dados existentes devem exigir migração controlada ou uma decisão explícita, sem conversões silenciosas.

## 9. Parametrização dos níveis de alerta

Os níveis de alerta devem ser totalmente configuráveis pela plataforma, incluindo:
- Código, nome, descrição e ordem/severidade do nível;
- Cor, ícone e texto apresentados, sem depender exclusivamente da cor;
- Critérios ou condições que ativam o alerta;
- Limiares numéricos, intervalos, unidades e regras de comparação, quando aplicáveis;
- Ativo, sistema, componente, tipo de inspeção e contexto a que se aplica;
- Prazo para resposta, mitigação e resolução, se aplicável;
- Destinatários, canais, frequência, repetição e escalonamento;
- Condições de reconhecimento, resolução, reabertura e encerramento do alerta;
- Ações obrigatórias, avisos de segurança e permissões para alterar a classificação;
- Data de entrada em vigor, versão, autor, justificação e histórico.

A configuração deve suportar alertas de conservação, manutenção, risco, prazos de inspeção, garantias, manutenção preventiva, sensores/monitorização, falhas de sincronização e outras áreas que venham a ser configuradas. A lista de tipos de alerta não deve ficar limitada a um conjunto fixo no código.

A plataforma deve permitir testar regras com exemplos antes da publicação. Alertas críticos e procedimentos de segurança devem ter proteção contra desativação acidental, permissões específicas e auditoria; a IA não pode alterar estas regras por iniciativa própria. A app e a plataforma devem usar a mesma versão publicada das regras e conservar, em cada alerta, a regra/versão que o originou.

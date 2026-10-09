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

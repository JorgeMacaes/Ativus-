# Atualização funcional — inspeção originada de agendamento

## Regra principal
O tipo de inspeção não deve ser escolhido novamente pelo inspetor quando a inspeção já foi agendada na plataforma de gestão. O gestor cria e publica o agendamento, definindo previamente o empreendimento/ativo, tipo de inspeção, âmbito, data/hora prevista, responsável/equipa, checklist aplicável e instruções.

## Fluxo de trabalho
1. O gestor cria o agendamento na plataforma de gestão: Rotina, Principal ou Especial.
2. O sistema atribui o agendamento ao inspetor/equipa e publica-o na agenda.
3. A app sincroniza a agenda e apresenta ao inspetor as inspeções atribuídas, com tipo, empreendimento, data prevista e instruções.
4. O inspetor abre o agendamento e toca em “Iniciar inspeção”. O sistema cria a inspeção a partir do agendamento, herdando automaticamente o tipo, empreendimento/ativo, âmbito, checklist, responsável atribuído e parâmetros em vigor.
5. O sistema regista automaticamente o utilizador autenticado que efetivamente iniciou a inspeção, a data/hora real de início e os dados contextuais disponíveis.
6. Ao concluir, regista data/hora de fim, duração e resultado. O estado do agendamento é atualizado: Agendado → Em curso → Concluído, ou Não realizado/Reagendado quando aplicável.
7. A plataforma de gestão recebe as alterações e mostra o estado atualizado da execução e da sincronização.

## Regras de controlo
- O inspetor não escolhe de novo o tipo; este vem do agendamento.
- A app não deve permitir alterar silenciosamente tipo, empreendimento, âmbito ou checklist herdados. Alterações exigem permissão e ficam auditadas.
- Se o agendamento estiver desatualizado, cancelado ou já iniciado/concluído noutro dispositivo, a app deve avisar e aplicar as regras de conflito definidas.
- Se a app estiver offline, apresenta os agendamentos previamente sincronizados e guarda o início/conclusão localmente, com estado “Pendente de sincronização”. Não afirma que a plataforma recebeu a atualização até haver confirmação do servidor.
- Para inspeções urgentes não agendadas, deve existir uma opção separada “Inspeção não planeada”, sujeita às permissões e com justificação obrigatória. Não é o fluxo normal.
- A meteorologia e GPS continuam a ser dados contextuais automáticos sujeitos a disponibilidade e confirmação; não alteram o tipo de inspeção.

## Campos do agendamento na plataforma de gestão
Obrigatórios conforme regras do negócio: empreendimento/ativo, tipo de inspeção, âmbito (empreendimento inteiro por defeito ou âmbito parcial explícito), data/hora prevista, inspetor/equipa responsável e checklist/configuração a aplicar. O gestor pode adicionar instruções, prioridade e duração estimada.

## Indicadores
Estados do agendamento: Rascunho, Agendado, Atribuído, Em curso, Concluído, Não realizado, Cancelado, Reagendado.
Estado de sincronização independente: Só no dispositivo, Pendente de envio, A sincronizar, Sincronizado, Conflito, Erro.

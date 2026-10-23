# Requisitos — avaliação do ativo, anomalias, prioridade e prazos de reparação

## 1. Princípio do ciclo de avaliação

Quando o inventário de um ativo, os seus espaços/componentes, subcomponentes e equipamentos estiver suficientemente identificado, a Seven M Ativus deve permitir avaliar o estado do ativo e iniciar a gestão das anomalias e intervenções.

Ciclo funcional:
**Inventário validado → inspeção/avaliação → anomalia ou patologia identificada → efeitos e impacto funcional → trabalho necessário → prioridade/urgência → prazo de resposta e resolução → ordem de trabalho → execução → verificação → encerramento e histórico.**

Nem toda a ocorrência é automaticamente uma patologia confirmada. A ocorrência deve poder ser triada e classificada; quando aplicável, confirma-se a anomalia/patologia e definem-se os trabalhos. A relação entre causa, patologia, efeitos, trabalho e resultado deve ficar registada.

## 2. Estados e conceitos que não devem ser confundidos

A plataforma deve manter separados e configuráveis:
- **Estado de conservação (EC):** condição física do elemento, determinada na inspeção principal, de acordo com a escala configurada.
- **Estado de manutenção:** condição/manutenção observada na inspeção de rotina, de acordo com a escala configurada.
- **Gravidade da anomalia:** dimensão técnica do problema e dos seus efeitos.
- **Impacto funcional:** se o elemento/sistema funciona normalmente, funciona condicionado ou está indisponível.
- **Risco para pessoas, segurança, ambiente ou outros ativos:** avaliação configurável, quando aplicável.
- **Prioridade/urgência:** ordem de tratamento que resulta das regras configuradas e do contexto.
- **Prazo de resposta:** tempo máximo para reconhecer, avaliar ou iniciar a atuação.
- **Prazo de resolução:** tempo-alvo ou máximo para concluir a reparação.
- **Prazo de mitigação:** tempo para implementar medidas temporárias de segurança ou reduzir o impacto, quando a solução definitiva não pode ser imediata.

O EC, por si só, não deve determinar automaticamente todos os prazos. Uma anomalia com risco de segurança ou que inutilize uma função essencial pode exigir resposta mais rápida do que outra com o mesmo EC, mas impacto funcional reduzido.

## 3. Proposta inicial de níveis de urgência

Os prazos seguintes são valores-base propostos para parametrização, não regras universais imutáveis. A entidade gestora poderá ajustá-los por tipo de ativo, contrato, sistema, risco, horário de funcionamento e capacidade de serviço.

| Nível | Critério orientador | Prazo-alvo inicial de resolução |
|---|---|---|
| U0 — Emergência / imediata | Perigo iminente, fuga significativa de água ou outro fluido, fuga de gás/fumos quando aplicável, falha elétrica grave, incêndio, risco estrutural ou outra condição que exija atuação imediata | Imediato: acionar procedimento de emergência, controlar/isolar o perigo e iniciar resposta; a reparação definitiva pode exigir plano seguro |
| U1 — Crítica / função indisponível | Sistema ou equipamento essencial indisponível, impedindo utilização segura ou normal de quarto, instalação ou serviço essencial | Até 24 horas |
| U2 — Alta / utilização condicionada | A função ainda é possível, mas está condicionada, degradada ou com risco/impacto relevante | Até 3 dias |
| U3 — Normal / reparação não crítica | Anomalia que não impede a utilização normal e não apresenta risco significativo, mas exige reparação | Até 2 semanas |
| U4 — Baixa / estética ou pequena melhoria | Pequeno arranjo ou defeito predominantemente estético, sem risco relevante nem impacto funcional significativo | Até 1 mês |

Os prazos são editáveis e podem ser encurtados ou prolongados por regras aprovadas. O sistema deve permitir prazos em horas, dias úteis, dias corridos, datas específicas ou janelas de serviço, conforme a parametrização.

### Segurança e emergências
- Um risco imediato exige primeiro medidas de segurança: isolar, cortar alimentação/água quando seguro e autorizado, sinalizar, restringir acesso, evacuar ou chamar serviços de emergência conforme os procedimentos aplicáveis.
- “Imediato” deve significar iniciar sem demora a resposta e as medidas de mitigação; não deve obrigar a executar uma reparação insegura ou tecnicamente inviável sem preparação.
- Os procedimentos, contactos, escalonamento e critérios devem ser parametrizados e aprovados pela entidade gestora.
- O sistema não substitui julgamento técnico, planos de emergência nem requisitos legais/contratuais.

## 4. Impacto funcional e criticidade

A prioridade deve considerar mais do que o nome da patologia ou o EC. A parametrização deve permitir definir:
- função do elemento e importância para o serviço;
- essencialidade do sistema;
- indisponibilidade total, parcial ou utilização condicionada;
- existência de alternativa funcional;
- impacto no utilizador/ocupante e no funcionamento do ativo;
- risco para pessoas, segurança, ambiente e danos secundários;
- extensão, progressão e probabilidade de agravamento;
- horário de funcionamento, ocupação e sazonalidade;
- dependências com outros elementos/sistemas;
- obrigações legais, garantias e contratos de manutenção;
- disponibilidade de peças, acesso, autorizações e condições de execução.

Exemplo: se o sistema de águas de um quarto falhar e o quarto ficar inutilizável, a prioridade deve ser elevada e a resolução tratada, em regra, como crítica (prazo-base até 24 horas), salvo se a avaliação de risco exigir atuação imediata. Uma fuga com risco de danos importantes ou de segurança pode ser U0. Uma pequena anomalia estética sem impacto funcional poderá ser U4.

A classificação proposta deve ser visível ao técnico, acompanhada do motivo/regra que a gerou, e poder ser revista por utilizador autorizado, com registo da justificação.

## 5. Regras configuráveis na plataforma de gestão

A plataforma de gestão deve permitir criar e alterar, sem alterações de código:
- níveis e nomes de urgência/prioridade;
- critérios, escalas e matriz de decisão;
- prazos de resposta, mitigação, início e resolução;
- calendários de serviço, dias úteis/corridos, horários, feriados e pausas;
- regras por tipologia de ativo, sistema, componente/subcomponente, função e criticidade;
- exceções por contrato, garantia, localização ou tipo de cliente;
- alertas antes do vencimento e quando o prazo é ultrapassado;
- escalonamento para responsáveis superiores;
- destinatários, canais e frequência de notificações;
- medidas provisórias e ações obrigatórias por classe de risco;
- permissões para classificar, alterar prioridade, autorizar exceções e encerrar ordens;
- campos obrigatórios e evidências exigidas para cada tipo de intervenção;
- regras de inspeção e escalas de conservação/manutenção, separadas das regras de urgência;
- modelos de trabalho, unidades, critérios de aceitação e procedimentos de verificação.

As regras devem ser versionadas, com autor, data de entrada em vigor, motivo e histórico. Alterações futuras não devem modificar silenciosamente os prazos/regras aplicados a ordens antigas; a plataforma deve conservar a versão utilizada na classificação original.

## 6. Ordem de trabalho e controlo de prazos

Cada ordem de trabalho deve guardar:
- identificador único;
- ativo, espaço, elemento e sistema afetados;
- ocorrência e patologia associadas, quando aplicável;
- gravidade, impacto funcional, risco e prioridade;
- regra e versão da parametrização que justificaram a classificação;
- data/hora de registo, reconhecimento, atribuição, início, mitigação e conclusão;
- prazo de resposta e prazo de resolução, com indicação de dias úteis/corridos;
- responsável interno e prestador/contrato, quando aplicável;
- medidas de segurança e restrições de utilização;
- estimativa, orçamento aprovado e custo real, separados;
- evidências fotográficas e documentação;
- resultado da execução e verificação/aceitação;
- motivo de atraso, suspensão, reclassificação, rejeição, reabertura ou exceção;
- utilizador e data/hora de cada alteração relevante.

Estados sugeridos: Registada, Em triagem, Classificada, A aguardar autorização, Atribuída, Em execução, Mitigação aplicada, Suspensa, Concluída a aguardar verificação, Rejeitada na verificação, Encerrada, Reaberta. A lista final deve ser parametrizável.

O relógio de prazo deve ter regras explícitas para pausas permitidas, espera de acesso/peças e suspensão. Não se deve parar ou prolongar um prazo silenciosamente; qualquer pausa ou exceção exige motivo, responsável e auditoria. Para emergências, a mitigação e a reparação definitiva devem poder ter prazos distintos.

## 7. Interface móvel e interface de gestão

### Aplicação móvel
- Permitir registar uma anomalia com poucos passos, a partir da ficha do elemento, inspeção, fotografia ou ocorrência.
- Preencher automaticamente ativo, localização, elemento, utilizador, data/hora e dados já conhecidos.
- Sugerir classificação, impacto, prioridade, trabalho e prazo a partir das regras e histórico.
- Mostrar claramente o prazo aplicável, a razão da prioridade e as ações imediatas recomendadas.
- Permitir confirmar, corrigir ou rejeitar sugestões; capturar fotografias e funcionar offline.
- Mostrar ordens atribuídas, tarefas vencidas/próximas do prazo e medidas de segurança.
- Exigir validação apropriada para decisões críticas e registar alterações.

### Plataforma de gestão
- Parametrizar escalas, critérios, prazos, calendários, exceções, alertas, perfis e permissões.
- Visualizar ocorrências e ordens por ativo, sistema, criticidade, estado, responsável e prazo.
- Identificar ordens urgentes, vencidas, em risco de incumprimento e sem responsável.
- Alterar a parametrização sem programar, com pré-visualização, versão, aprovação e data de entrada em vigor.
- Consultar auditoria e comparar desempenho por ativo, hotel, sistema, prestador e período.

## 8. IA com controlo humano

A IA pode sugerir gravidade, impacto funcional, prioridade, prazo, medidas provisórias e trabalho a executar com base no inventário, fotografia, descrição, histórico e regras aprovadas. Deve:
- apresentar os fatores usados e a regra aplicável;
- assinalar incerteza e pedir informação em falta quando esta possa alterar a prioridade;
- nunca reduzir automaticamente a prioridade de uma condição de segurança crítica sem validação autorizada;
- permitir que um técnico autorizado corrija a proposta e registar o motivo;
- não inventar diagnósticos, preços ou garantias;
- respeitar os procedimentos de emergência e as regras vigentes da entidade gestora.

A decisão de emergência deve seguir critérios e procedimentos aprovados, e não depender exclusivamente de um modelo de IA.

## 9. Critérios de aceitação

1. Após inventário e inspeção, é possível registar uma anomalia e ligá-la ao elemento exato.
2. A plataforma distingue estado de conservação, estado de manutenção, gravidade, impacto funcional, risco, prioridade e prazos.
3. Uma falha que torne um quarto inutilizável pode ser classificada como crítica e receber o prazo-base configurado de 24 horas; uma situação de perigo imediato pode exigir atuação imediata.
4. Os níveis e prazos iniciais (imediato, 24 horas, 3 dias, 2 semanas e 1 mês) são alteráveis na plataforma de gestão.
5. Alterar regras não exige modificar código nem reinstalar a aplicação móvel.
6. A aplicação móvel e a plataforma de gestão usam a mesma configuração publicada e identificam a respetiva versão.
7. A ordem regista prazos, notificações, alterações, suspensões, exceções, execução e verificação.
8. A IA explica as suas sugestões e exige validação adequada para decisões críticas.
9. A análise de incumprimentos permite apurar tempos de resposta e resolução com definições consistentes.
10. O sistema conserva o histórico das regras e dos valores usados em cada decisão.


## 10. Parametrização completa dos alertas

Os níveis U0–U4 indicados neste documento são apenas uma configuração-base inicial. A plataforma deve permitir à entidade gestora criar, renomear, reordenar, ajustar, ativar ou desativar níveis e definir as condições que os desencadeiam, dentro das permissões e salvaguardas configuradas.

Além da prioridade de trabalhos, a configuração deve suportar outros alertas do sistema: vencimento de inspeções, prazos de resposta/resolução, garantias, manutenção preventiva, risco de segurança, valores de monitorização/sensores e falhas de sincronização. Cada tipo de alerta deve permitir configurar limiares, destinatários, canais, repetição, escalonamento, reconhecimento, resolução e auditoria.

Os níveis e limiares devem ser aplicáveis por tipo de ativo, sistema, componente, contrato e contexto. Cada alerta gerado conserva os valores observados, a regra e a versão usadas, a data/hora e o histórico de alterações. A alteração da configuração não deve reclassificar silenciosamente alertas ou ordens antigas; a reavaliação de registos existentes deve ser uma ação explícita e auditada.

A plataforma deve permitir simular/testar uma regra antes de a publicar. Alertas de risco imediato e ações de segurança devem ter permissões reforçadas e proteção contra desativação acidental. Os prazos apresentados como iniciais neste documento não são imutáveis: a entidade gestora pode ajustá-los através da parametrização, mantendo registo de quem alterou a regra, quando, porquê e a partir de que data produz efeitos.

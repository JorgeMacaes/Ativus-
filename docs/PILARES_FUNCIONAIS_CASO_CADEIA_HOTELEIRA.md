# Seven M Ativus — Pilares funcionais e caso prático de cadeia hoteleira

**Estado:** requisitos funcionais para orientar o redesenho. Este documento não confirma implementação no código.

## 1. Objetivo do produto

A Seven M Ativus é uma plataforma de gestão de ativos e uma aplicação móvel integrada. Deve permitir inventariar todos os elementos de um ativo, monitorizar a sua condição e manutenção, registar ocorrências, gerar ordens de trabalho, planear manutenção futura e analisar custos reais.

O modelo deve ser aplicável a cadeias hoteleiras, edifícios habitacionais e de serviços, infraestruturas rodoviárias e ferroviárias. A solução deve ser parametrizável por tipologia, sem listas fechadas de elementos no código.

## 2. Pilares funcionais

1. **Inventário integral:** ativos, espaços, componentes, subcomponentes e equipamentos, com identificadores únicos e relações claras.
2. **Inspeções, reclamações e ocorrências:** diferentes canais de entrada para identificar problemas.
3. **IA assistiva:** análise de fotografias e vídeos, sugestão de elemento afetado, anomalia/patologia e possíveis trabalhos, sempre sujeita a confirmação humana.
4. **Trabalhos e ordens de trabalho:** transformar necessidades confirmadas em instruções de execução para prestadores.
5. **Manutenção preventiva e preditiva:** programar tarefas por calendário, horas de utilização, ciclos, leituras, recomendações do fabricante e histórico validado.
6. **Custos e comparação:** comparar custos por cadeia, ativo, espaço, equipamento, utilização, trabalho e prestador.
7. **Dados integrados, histórico e documentação:** integrar sistemas existentes, preservar origem e histórico, suportar auditoria e relatórios.

## 3. Caso prático: cadeia de hotéis

Uma entidade gestora administra vários ativos, por exemplo:
- Hotel na Póvoa de Varzim.
- Hotel em Vila do Conde.

Cada hotel contém edifícios, espaços (por exemplo, quartos), sistemas, componentes, subcomponentes e equipamentos. O inventário deve identificar todos os elementos relevantes, sem confundir necessariamente um espaço físico com um componente construtivo.

### Hierarquia e espaços
Modelo de gestão: **Entidade gestora → Ativo → elementos hierárquicos configuráveis**.

Exemplo de navegação:
- Entidade gestora: cadeia hoteleira
- Ativo: Hotel da Póvoa de Varzim
- Espaço/localização: Quarto 204
- Elementos associados ao quarto: cama, luminárias, sanita, lavatório, torneira, equipamento AVAC, etc.

O quarto pode ser representado como componente na árvore se esse for o modelo configurado, mas a arquitetura também deve permitir que seja um espaço/localização ao qual se associam vários componentes e equipamentos. Deve evitar-se duplicar o mesmo quarto ou elemento.

### Dados de cada equipamento
Quando aplicável, registar:
- Código único e QR.
- Nome/tipo, localização e fotografia.
- Marca, modelo, fabricante e número de série.
- Data de aquisição/instalação.
- Custo de aquisição, fornecedor e documentos.
- Data de início e fim da garantia, condições e comprovativos.
- Estado da garantia: em garantia / expirada / por confirmar.
- Entidade responsável pela manutenção e contrato associado.
- Plano e periodicidade de manutenção.
- Horas/ciclos de utilização, quando medidos.
- Histórico de avarias, patologias, trabalhos, peças e custos.
- Estado ativo/inativo, mantendo o histórico após desativação ou substituição.

A aplicabilidade de cada campo deve ser configurável; não se deve obrigar a preencher marca, modelo ou número de série quando não sejam relevantes ou conhecidos.

## 4. Entradas de patologias e ocorrências

Uma ocorrência pode ter origem em:
- Inspeção de rotina, principal ou especial.
- Reclamação de utente/hóspede.
- Registo do pessoal técnico.
- Registo de receção, limpeza ou outro serviço autorizado.
- Prestador de manutenção.
- Sistema externo ou sensor, quando integrado.

Cada registo deve indicar a origem, data/hora, autor, ativo, espaço/localização e elemento associado, se conhecido. Se o elemento não puder ser identificado de imediato, a ocorrência pode ficar por triagem e ser associada depois.

A ocorrência e a patologia não devem ser tratadas como sinónimos obrigatórios: uma ocorrência é um registo de algo reportado; após avaliação, pode confirmar-se uma patologia, uma necessidade operacional, uma falsa ocorrência ou outra categoria configurada.

## 5. IA para reconhecimento de anomalias

A aplicação móvel deve permitir capturar uma fotografia ou vídeo e pedir à IA que:
1. Sugira o ativo, espaço e componente/subcomponente afetado, com base no inventário e na imagem.
2. Descreva a anomalia visível.
3. Sugira a categoria de patologia e possíveis causas/efeitos, indicando incerteza.
4. Sugira trabalhos compatíveis com o elemento, material, histórico e catálogo de trabalhos.
5. Identifique os dados que ainda faltam, por exemplo, dimensão, quantidade, unidade ou acessibilidade.
6. Permita ao utilizador corrigir, aceitar ou rejeitar cada sugestão.

A IA não deve confirmar automaticamente uma causa não visível nem emitir uma decisão técnica definitiva apenas com base numa fotografia. Deve conservar a imagem original, a origem da sugestão, a decisão do utilizador e o histórico.

## 6. Quantidades, unidades e estimativas de custo

Cada trabalho deve ter uma quantidade e uma unidade apropriadas, por exemplo:
- unidade (un.)
- metro (m)
- metro quadrado (m²)
- metro cúbico (m³)
- quilograma (kg)
- hora (h)
- outra unidade parametrizada.

A quantidade deve ser registada pelo operador, extraída de documentação ou proposta pela IA quando houver evidência suficiente, indicando a origem e exigindo confirmação quando necessário.

### Política de custos
- Se existir histórico comparável e suficientemente fiável, a plataforma pode sugerir um custo com base nos dados históricos, quantidades, unidade, data, localização e condições.
- A estimativa deve indicar a fonte, a data dos dados e os pressupostos relevantes.
- Se não existir histórico adequado nem preço introduzido por um utilizador, **não apresentar um custo estimado como se fosse conhecido**. Mostrar “Sem dados suficientes para estimar” e permitir inserir um preço/orçamento.
- Distinguir sempre custo sugerido, estimado, orçamentado, aprovado e custo real.
- Não extrapolar custos sem indicar os pressupostos e limitações.

## 7. Ordem de trabalho / ordem de reparação

Depois de uma patologia ou necessidade de intervenção ser confirmada e o trabalho definido, a plataforma pode gerar uma ordem de trabalho identificada por código único.

A ordem deve conter, conforme aplicável:
- Número e estado da ordem.
- Ativo, espaço/localização e componente/subcomponente.
- Descrição da ocorrência/patologia e evidência fotográfica.
- Trabalho a executar e critérios de aceitação.
- Quantidade, unidade e método de medição.
- Prioridade e gravidade/risco, separados do estado de conservação.
- Data de emissão, prazo e tempo estimado de execução.
- Prazo máximo de resposta/conclusão segundo regras configuradas.
- Prestador/responsável, contacto operacional e contrato aplicável.
- Requisitos de acesso, segurança, isolamento e autorizações.
- Materiais, equipamentos, documentos e instruções necessários.
- Custo estimado/orçamento aprovado, quando disponível.
- Registo de início/fim, trabalhos executados, materiais utilizados, fotografias antes/depois e custo real.
- Verificação, aprovação, rejeição, reabertura e encerramento.

A ordem deve distinguir tempo de trabalho previsto, prazo de resposta e prazo máximo de conclusão. Estes valores devem decorrer de regras contratuais, prioridade, risco e tipo de intervenção, e não de uma única regra genérica de gravidade.

## 8. Manutenção preventiva e preditiva

A plataforma deve permitir criar planos de manutenção baseados em:
- Calendário (por exemplo, mensal ou anual).
- Horas de funcionamento ou ciclos de utilização.
- Quantidade produzida/serviço prestado, quando aplicável.
- Leituras de sensores ou contadores integrados.
- Recomendações documentadas do fabricante.
- Histórico real de falhas e substituições.
- Regras operacionais aprovadas pelo gestor.

### Exemplo ilustrativo: lâmpada com vida nominal de 10 000 horas
Se o fabricante indicar uma vida nominal de 10 000 horas, a plataforma deve registar esse parâmetro e calcular uma previsão de substituição apenas se dispuser de dados de utilização adequados.

- Se existir contador de horas, estimar a aproximação ao limite a partir das horas acumuladas.
- Se não existir contador, pode calcular-se uma data indicativa a partir de um perfil de utilização definido e identificado como estimativa.
- Se não houver dados de utilização suficientes, criar uma regra de acompanhamento ou inspeção, sem afirmar uma data de falha certa.
- O limite nominal não garante que a lâmpada falhará exatamente às 10 000 horas; a regra deve permitir margem, inspeção e ajuste com base no histórico real.

A plataforma deve prever as futuras tarefas, recursos e custos. Custos futuros devem basear-se em preços históricos comparáveis ou valores introduzidos/aprovados; sem esses dados, devem ser assinalados como não estimáveis.

## 9. Análise comparativa de custos

Permitir comparação por:
- Cadeia e hotel.
- Tipologia de ativo.
- Quarto/espaço e equipamento.
- Tipo de ocorrência, patologia e trabalho.
- Prestador e contrato.
- Período de tempo.
- Utilização (por exemplo, ocupação/noites de quarto, quando a fonte estiver integrada).
- Quantidade de equipamento ou área útil, quando pertinente.

Os indicadores devem explicitar o denominador. Exemplos: custo de manutenção por quarto/noite ocupada, custo por equipamento/ano, custo por hora de funcionamento ou custo por intervenção. A comparação só deve ser feita quando os dados e períodos forem comparáveis; devem ser visíveis dados em falta, diferenças de configuração e critérios de cálculo.

A plataforma poderá integrar dados do sistema hoteleiro (PMS), gestão financeira, compras, contratos, contadores e sensores, desde que existam interfaces e autorizações adequadas. Deve identificar a fonte e a data de atualização de cada integração.

## 10. Estados e fluxo recomendado

**Ocorrência registada → Triagem → Patologia/necessidade confirmada → Trabalho definido → Ordem de trabalho emitida → Atribuição ao prestador → Execução → Verificação → Encerramento.**

Uma ocorrência pode ser encerrada sem ordem de trabalho se, após triagem, não exigir reparação. Uma ordem pode ser devolvida, suspensa ou reaberta, com justificação e auditoria.

## 11. Regras transversais

- O inventário é a fonte de referência para a identificação dos elementos.
- Cada elemento tem identificador estável e histórico próprio.
- A aplicação móvel e a plataforma web partilham os mesmos dados e regras.
- A sincronização offline não deve criar duplicados nem perder alterações silenciosamente.
- As alterações críticas e decisões técnicas devem ser auditáveis.
- A IA sugere e acelera o trabalho; utilizadores autorizados confirmam os dados e decisões técnicas.
- A parametrização deve suportar outras tipologias, incluindo edifícios, ativos rodoviários e ferroviários, sem exigir uma aplicação separada.

## 12. Sequência de implementação

1. Modelo de dados comum e hierarquia configurável.
2. Inventário integral, importação em massa, validação e histórico.
3. Ficha de equipamento, garantia, fabricante, manutenção e contratos.
4. Ocorrências e triagem.
5. IA para identificar elementos/anomalias e sugerir trabalhos.
6. Catálogo de trabalhos, quantidades, unidades e política de custos.
7. Ordens de trabalho e ciclo de execução/verificação.
8. Planos de manutenção e previsões.
9. Integração com fontes externas e análise comparativa.
10. Sincronização móvel/offline, testes integrados e só depois novo APK.

## 13. Critérios de aceitação para o caso hoteleiro

- Registar pelo menos dois hotéis sob a mesma entidade gestora.
- Inventariar equipamentos por hotel e por quarto sem duplicação de espaços.
- Consultar marca/modelo, aquisição, garantia e responsável de manutenção.
- Registar ocorrências por hóspedes e equipas técnicas.
- Usar uma imagem para propor o elemento afetado e a anomalia, com confirmação humana.
- Criar uma ordem de trabalho com quantidade, unidade, prazo, responsável e evidências.
- Não inventar custos quando não há dados históricos adequados nem preço fornecido.
- Criar previsão de manutenção por calendário ou horas com indicação dos pressupostos.
- Comparar custos usando denominadores e períodos explicitados.
- Preservar histórico, origem dos dados e auditoria das alterações.

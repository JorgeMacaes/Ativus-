# Seven M Ativus — Modelo de previsão de degradação e custos com cadeias de Markov

## 1. Objetivo

A plataforma deve incluir um módulo de previsão que estime a evolução do estado dos ativos e os gastos futuros de manutenção, reparação e substituição. O modelo deve combinar o inventário, as inspeções, as patologias e ocorrências, os trabalhos realizados, as quantidades, os preços e custos reais, os contratos, as garantias e os planos de manutenção.

O método de referência será uma **cadeia de Markov em tempo discreto**, com estados de condição/degradação e matrizes de probabilidade de transição. O horizonte, o intervalo temporal e os estados devem ser configuráveis por tipologia de ativo, sistema, componente e subcomponente.

As previsões são estimativas para apoiar o planeamento e a orçamentação; não são garantias de despesa futura nem substituem a avaliação de um técnico.

## 2. Unidade de previsão e estados

A previsão deve poder ser calculada para:
- Um componente, subcomponente ou equipamento individual;
- Um sistema funcional;
- Um ativo completo (por exemplo, hotel ou edifício);
- Um conjunto de ativos, entidade gestora ou carteira;
- Categorias de ativos e períodos orçamentais.

A plataforma deve permitir configurar os estados de Markov. Como configuração inicial, pode usar-se uma escala de condição de 0 a 5, quando esta for adequada à tipologia e à metodologia aprovada:
- Estado 0 — sem anomalia relevante;
- Estados 1 a 4 — níveis progressivos de degradação, conforme a escala parametrizada;
- Estado 5 — degradação muito grave, que exige avaliação e atuação prioritária.

A escala EC existente pode ser usada como referência, mas **não deve ser aplicada automaticamente a todos os ativos**. Para equipamentos, sistemas hoteleiros, estradas ou ferrovia, podem ser necessárias escalas próprias. O estado de conservação, o estado de manutenção, a gravidade de uma patologia, o impacto funcional e o risco devem permanecer conceitos distintos; o modelo deve especificar quais utiliza como estados e quais entram como variáveis explicativas ou regras de segurança.

Quando o histórico não permita classificar com confiança um estado, o sistema deve assinalar a incerteza e solicitar validação, em vez de inventar uma classificação.

## 3. Matriz de transição de Markov

Para cada família de componentes ou equipamentos, a plataforma mantém uma matriz de transição **P**, em que a entrada P(i,j) representa a probabilidade de um elemento no estado i passar ao estado j durante um período definido.

Cada linha da matriz deve somar 1. O intervalo pode ser mensal, trimestral ou anual, conforme os dados e o tipo de ativo. O sistema deve impedir a comparação de matrizes com intervalos temporais incompatíveis sem conversão metodologicamente validada.

A previsão do estado futuro é obtida pela distribuição atual de estados multiplicada pela matriz de transição, repetindo o cálculo para cada período do horizonte. O sistema pode calcular distribuições para 1, 3, 5, 10 ou mais anos, desde que o horizonte seja configurável e que as limitações sejam apresentadas.

As probabilidades devem, preferencialmente, ser estimadas a partir de inspeções sucessivas, inventário datado, histórico de patologias, datas e resultados de trabalhos. Se os dados forem insuficientes, pode ser utilizada uma matriz inicial definida por especialistas, mas esta deve ser identificada claramente como hipótese de partida, aprovada, versionada e substituível por uma matriz calibrada com dados reais.

A matriz não deve ser assumida como universal: deve variar quando necessário por tipo de elemento, material, idade, exposição, utilização, contexto ambiental, manutenção, histórico de intervenções ou outros fatores com dados suficientes.

## 4. Efeito das intervenções

O modelo deve distinguir pelo menos:
- Evolução sem intervenção;
- Evolução com manutenção preventiva;
- Evolução após reparação;
- Evolução após substituição;
- Evolução sob diferentes níveis de manutenção ou orçamento.

A reparação ou substituição pode alterar o estado atual e/ou a matriz de transição aplicável. O efeito só deve ser estimado a partir de dados observados suficientes ou de pressupostos técnicos explicitamente configurados. Não assumir que qualquer reparação devolve automaticamente o elemento ao estado novo.

Cada cenário deve registar a política de manutenção, as intervenções consideradas, as suas datas previstas e os pressupostos usados. Se uma intervenção reduzir o risco imediato mas não eliminar a causa, o modelo deve poder representar essa diferença.

## 5. Conversão da previsão em custos

Para cada estado, patologia ou tipo de intervenção, a plataforma deve associar, quando existam dados:
- Trabalhos recomendados e critérios de aplicação;
- Quantidades e unidades, provenientes do inventário, medição ou estimativa validada;
- Preços unitários de referência e respetiva data/fonte;
- Custos de mão de obra, materiais, equipamentos, deslocações e outros itens aplicáveis;
- Custos de inspeção, manutenção preventiva, reparação e substituição;
- Contratos, garantias, franquias e custos potencialmente cobertos;
- Inflação ou atualização de preços, com taxa e fonte configuráveis;
- Custos indiretos, indisponibilidade ou perda operacional, apenas quando exista método e dados definidos.

O custo esperado de cada período deve ser calculado combinando a probabilidade prevista de cada estado ou evento com o custo aplicável nesse estado/evento e com as quantidades estimadas. O sistema deve evitar dupla contagem entre uma patologia, um trabalho associado e uma ordem de trabalho que já inclua esse custo.

Os valores devem ser apresentados separadamente como:
1. Custo histórico real;
2. Custo unitário de referência;
3. Estimativa de custo;
4. Orçamento proposto;
5. Orçamento aprovado;
6. Custo real executado.

Quando não existirem preços, quantidades ou dados de transição suficientes, a plataforma deve indicar **“dados insuficientes para estimar”**, ou apresentar um intervalo devidamente identificado como cenário/hipótese. Nunca deve apresentar um valor fabricado como se fosse um custo previsto fiável.

## 6. Orçamentos e cenários de previsão

O módulo deve permitir comparar, no mínimo:
- Cenário base, segundo a política de manutenção atualmente prevista;
- Cenário de manutenção preventiva reforçada;
- Cenário de orçamento limitado;
- Cenário de reparação faseada por prioridade;
- Cenário de substituição de elementos críticos;
- Cenários personalizados pela entidade gestora.

Para cada cenário, mostrar:
- Despesa prevista por período e acumulada;
- Custos por ativo, edifício, hotel, sistema, componente, tipologia e carteira;
- Distribuição entre manutenção preventiva, reparação corretiva e substituição;
- Elementos que mais contribuem para a despesa prevista;
- Necessidades de financiamento e anos de maior pressão orçamental;
- Estado de condição esperado e número/proporção de elementos em estados críticos;
- Diferença face ao orçamento disponível e riscos de adiar trabalhos;
- Comparação com custos reais e previsões anteriores.

Os relatórios devem permitir exportar tabelas de previsão e pressupostos para Excel e gerar relatórios datados, reproduzíveis e auditáveis.

## 7. Incerteza, qualidade e validação do modelo

A plataforma deve apresentar a incerteza e a qualidade dos dados juntamente com a previsão. Quando suportado pelos dados, deve apresentar intervalos de previsão ou cenários baixo/base/alto, em vez de um único número excessivamente preciso.

O sistema deve:
- Mostrar quantidade e período dos dados utilizados, cobertura de inspeções e lacunas;
- Identificar matrizes definidas por especialistas versus matrizes estimadas por dados;
- Guardar a versão do modelo, matriz, custos unitários, inflação, horizonte e pressupostos de cada previsão;
- Comparar previsões anteriores com estados observados e custos reais;
- Medir erro de previsão e recalibrar as matrizes apenas com controlo de versão;
- Evitar inferir causalidade apenas por associação estatística;
- Assinalar alterações de tipologia, critérios de inspeção ou práticas de registo que possam quebrar a comparabilidade histórica;
- Permitir revisão técnica e aprovação antes de usar previsões como base de orçamento.

A ausência de registos de patologia não deve ser interpretada automaticamente como prova de ausência de degradação. O modelo deve considerar a frequência de inspeção e a qualidade/cobertura do inventário.

## 8. Parametrização e integração

A plataforma de gestão deve permitir configurar sem alterações ao código:
- Estados e respetivas definições;
- Intervalo temporal e horizonte de previsão;
- Famílias de componentes e grupos de transição;
- Matrizes iniciais e respetiva origem;
- Regras de calibração e mínimos de dados, conforme a estratégia técnica aprovada;
- Variáveis explicativas suportadas e critérios de agrupamento;
- Tipos de intervenção e respetivo efeito modelado;
- Catálogos de trabalhos, quantidades, unidades e preços;
- Taxas de atualização de preços, cenários e categorias de custo;
- Indicadores, relatórios, limiares de risco e alertas orçamentais;
- Perfis autorizados a editar, aprovar e publicar modelos.

As configurações e matrizes devem ter versão, autor, data, motivo, período de validade e histórico. A app móvel deve recolher os dados de inventário, inspeção, patologia e trabalho necessários para alimentar o modelo, mas a previsão agregada e a administração do modelo devem estar disponíveis na plataforma de gestão.

## 9. Alertas e decisões

O módulo pode gerar alertas quando:
- A probabilidade estimada de atingir um estado crítico ultrapassa um limiar configurado;
- A despesa prevista excede o orçamento;
- Se prevê concentração elevada de trabalhos num período;
- A manutenção preventiva prevista é insuficiente para o cenário selecionado;
- A qualidade dos dados não suporta uma decisão fiável.

Os limiares e destinatários são configuráveis. Alertas de segurança devem continuar sujeitos às regras de segurança e validação técnica já definidas. A previsão de Markov não deve atrasar uma ação urgente indicada por uma inspeção ou por um risco observado.

## 10. Critérios de aceitação

1. É possível definir e versionar estados e matrizes de transição por família de ativos.
2. O sistema calcula a distribuição prevista de estados para cada período do horizonte configurado.
3. As previsões usam histórico de inspeções, patologias, inventário e intervenções quando disponível, identificando lacunas.
4. O custo previsto liga-se a quantidades, unidades, preços e trabalhos rastreáveis.
5. Custos históricos, estimados, orçamentados, aprovados e reais são apresentados separadamente.
6. É possível comparar cenários de manutenção e substituição ao longo do tempo.
7. O sistema não apresenta previsões monetárias fiáveis quando faltam dados essenciais; assinala a insuficiência ou identifica claramente hipóteses.
8. Cada previsão pode ser reproduzida a partir da versão do modelo, matriz, custos e pressupostos guardados.
9. O desempenho do modelo é comparável com resultados observados e previsões anteriores.
10. A previsão é uma ferramenta de apoio à decisão, com validação técnica, transparência e rastreabilidade.

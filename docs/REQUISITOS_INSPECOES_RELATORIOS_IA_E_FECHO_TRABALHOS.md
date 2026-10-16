# Requisitos — inspeções, relatórios, IA e fecho de trabalhos

## 1. Âmbito e tipos de inspeção

A Seven M Ativus distingue as inspeções de condição do ativo das verificações legais/regulamentares.

### Inspeção principal
- Periodicidade-base proposta: de 4 em 4 anos, configurável por tipo de ativo, risco, histórico e regras da entidade gestora.
- Executada por técnico especializado, com perfil e competência adequados.
- Determina o estado de conservação dos componentes e subcomponentes abrangidos.
- Analisa todas as unidades do âmbito definido, com registo individual por elemento.
- Pode ser antecipada por anomalias graves, ocorrências relevantes, intervenções, alterações significativas ou regras configuradas.

### Inspeção de rotina
- Periodicidade-base proposta: anual, configurável.
- Pode ser executada pelas equipas de manutenção autorizadas.
- Determina o estado de manutenção dos elementos abrangidos.
- Analisa os componentes e subcomponentes definidos no âmbito da inspeção.
- Pode identificar ocorrências e patologias que desencadeiem avaliação técnica adicional, trabalhos ou uma inspeção principal/especial, de acordo com as regras.

As periodicidades de 4 anos e 1 ano são valores-base a parametrizar, não substituindo obrigações específicas, avaliação de risco ou requisitos legais aplicáveis.

## 2. Verificações legais e regulamentares — distinção de âmbito

Verificações como inspeções legais de extintores/sistemas de incêndio, limpeza e manutenção regulamentar de filtros e sistemas de ventilação, verificações de redes de gás ou outras obrigações legais/contratuais devem poder ser registadas no inventário como requisitos, calendários ou eventos de controlo.

No âmbito funcional aqui definido, a Seven M Ativus:
- associa cada requisito legal ou regulamentar ao equipamento/subcomponente relevante;
- guarda a periodicidade, data da última verificação conhecida, próxima data-limite, entidade responsável e contacto, quando disponíveis;
- agenda a data devida e envia alertas antes do prazo e em caso de atraso;
- permite consultar o estado de cumprimento: por agendar, próximo do prazo, vencido ou confirmado externamente;
- pode guardar referência ou ligação a documentação externa, certificado ou relatório, se o utilizador o disponibilizar.

**A plataforma não executa nem pretende substituir o registo técnico oficial dessas verificações externas neste âmbito.** Não deve apresentar uma verificação como realizada sem evidência ou confirmação. A possibilidade de guardar documentos de referência não equivale a gerir o conteúdo técnico completo da inspeção legal.

A lista de obrigações, periodicidades e responsáveis deve ser parametrizável por tipo de ativo, equipamento, jurisdição e contrato; não codificar como universais periodicidades que dependem da regulamentação aplicável.

## 3. Âmbito e checklist das inspeções de condição

Cada inspeção deve indicar:
- tipo: rotina ou principal;
- ativo, âmbito e lista de componentes/subcomponentes a verificar;
- inspetor e perfil;
- data/hora de início e fim;
- localização e condições relevantes, quando disponíveis;
- versão da checklist e da parametrização;
- estado de execução por elemento: verificado, não acessível, não aplicável ou por verificar;
- estado de manutenção para rotina;
- estado de conservação para principal;
- anomalias, fotografias, extensão, gravidade, descrição e observações;
- motivos para elementos não verificados e plano de regularização.

A inspeção só deve ser dada como concluída quando todos os elementos do âmbito tiverem um resultado ou uma justificação explícita para a não verificação. A aplicação deve permitir execução offline e sincronização posterior.

## 4. Escalas de avaliação

### Estado de manutenção — inspeção de rotina
Escala configurável com, no mínimo, os resultados operacionais definidos pela entidade gestora, incluindo uma distinção clara entre manutenção adequada e inadequada. A escala inicial pode usar Bom / Razoável / Mau, conforme requisitos anteriores do projeto.

### Estado de conservação — inspeção principal
Escala de 0 a 5:
- EC0: ausência de anomalias;
- EC1–EC4: níveis intermédios definidos e parametrizados na metodologia aprovada;
- EC5: anomalias graves, incluindo situações estruturais ou outras que possam comprometer a segurança ou a utilização do ativo.

A escala é baseada no modelo de referência indicado pelo projeto — Manual de Inspeção de Obras de Arte da Infraestruturas de Portugal — adaptada e validada para infraestruturas hoteleiras. Não assumir que todos os critérios de aplicação a obras de arte se transferem automaticamente para hotéis: os critérios específicos devem ser documentados e aprovados.

Cada valor EC deve estar ligado à definição e regra em vigor. A gravidade da anomalia, o risco e a prioridade de reparação são campos separados do EC.

## 5. Registo da anomalia e validação humana da IA

Quando o inspetor deteta uma anomalia:
1. Seleciona o elemento exato no inventário ou identifica-o provisoriamente.
2. Regista fotografias e descrição; a IA pode analisar imagem e contexto.
3. A IA sugere tipo de anomalia/patologia, localização, possível causa e efeitos, indicando confiança e dados em falta.
4. O inspetor confirma, corrige ou rejeita a sugestão.
5. O inspetor caracteriza a extensão do dano (por exemplo, 10 m² de mancha de humidade), com quantidade e unidade.
6. Regista gravidade, impacto funcional e outras observações relevantes.
7. A aplicação conserva o resultado da IA, a decisão humana, a autoria e o histórico de alterações.

A IA não deve transformar uma hipótese em diagnóstico confirmado sem validação. Para situações críticas ou de segurança, devem existir regras de escalonamento e validação técnica apropriada.

## 6. Geração assistida de trabalhos, estimativas e ordens

Após validação da anomalia, a plataforma pode propor:
- trabalho recomendado, descrição, método e critérios de aceitação;
- quantidade e unidade calculadas ou introduzidas (por exemplo, 10 m²);
- materiais e recursos previsíveis;
- custo estimado com base em preços históricos comparáveis, tabela aprovada, orçamento ou preço introduzido;
- prioridade, medidas provisórias e prazo máximo de resposta/resolução, segundo regras configuradas;
- minuta de ordem de trabalho.

O utilizador autorizado deve confirmar os dados relevantes antes da emissão da ordem, especialmente trabalho, quantidade, preço, prioridade e prazo. A automatização pode ser configurada por tipo de ocorrência e nível de risco, mas não deve eliminar a validação exigida para decisões críticas.

Se não existirem dados fiáveis para estimar o custo, apresentar “Sem dados suficientes para estimar” e permitir pedir orçamento ou introduzir um preço; não inventar um custo. Distinguir custo sugerido, estimado, orçamentado, aprovado e real.

## 7. Ordem de trabalho, execução e encerramento

A ordem de trabalho deve ligar-se à anomalia e ao elemento do inventário e conter, conforme aplicável:
- código único, ativo, localização e elemento;
- anomalia validada, descrição do trabalho e quantidade/unidade;
- prioridade, prazo, medidas de segurança e responsável;
- entidade executante/prestador e contrato;
- materiais previstos, orçamento e autorização;
- evidências antes, durante e depois;
- data/hora de início e conclusão;
- materiais efetivamente utilizados, quantidades e custos;
- custo final, com discriminação disponível de mão de obra, materiais e outros encargos;
- técnico/equipa que executou e entidade responsável;
- verificação do resultado e aceitação por responsável autorizado;
- motivo de rejeição, suspensão, reabertura ou exceção, quando aplicável.

Depois da reparação, a ordem passa a “Concluída a aguardar verificação”. Só passa a “Encerrada” após a confirmação exigida pela regra configurada. Se o trabalho não resolver a anomalia, deve ser possível rejeitar a verificação, reabrir a ordem ou criar uma intervenção complementar, mantendo o histórico.

A informação de encerramento deve incluir quem reparou, entidade executante, datas, custo real, materiais usados e evidências disponíveis. A ausência de um dado deve ser assinalada, não preenchida por inferência como se fosse facto.

## 8. Relatório de inspeção

A plataforma gera um relatório de inspeção exportável, contendo:
- identificação do ativo, âmbito, data, inspetor e tipo de inspeção;
- metodologia, escalas e versão da checklist;
- resumo do estado do ativo e dos elementos avaliados;
- listagem dos elementos verificados, não verificados e respetivas justificações;
- estado de manutenção ou EC por componente/subcomponente;
- todas as anomalias registadas, com código, localização, descrição, fotografias, extensão, quantidade/unidade, gravidade, impacto e observações;
- sugestões de IA e respetiva decisão humana, conforme política de transparência;
- prioridade, medidas imediatas e trabalhos propostos/confirmados;
- ordens de trabalho geradas e prazos associados;
- limitações da inspeção, ressalvas e anexos;
- identificação do responsável pela validação do relatório.

O relatório deve permitir navegar da anomalia para a ficha do elemento, fotografias, ordem de trabalho e histórico. Deve suportar exportação para PDF e, quando adequado, Excel, segundo modelos configuráveis.

## 9. Agenda, alertas e rastreabilidade

A agenda deve apresentar:
- próximas inspeções principais e de rotina;
- prazos legais/regulamentares registados para controlo;
- trabalhos por executar, prazos de resposta e resolução;
- tarefas vencidas ou em risco de incumprimento;
- responsáveis e entidades executantes.

O sistema deve distinguir claramente uma inspeção de condição realizada dentro da plataforma de uma verificação legal externa apenas agendada ou confirmada por referência/documento. Todas as alterações, validações, datas e decisões relevantes ficam auditadas.

## 10. Critérios de aceitação

1. A inspeção principal tem periodicidade-base configurável de 4 anos e a inspeção de rotina periodicidade-base configurável de 1 ano.
2. O perfil de execução pode ser definido por tipo de inspeção e âmbito.
3. Todos os subcomponentes do âmbito têm resultado ou justificação de não verificação.
4. A rotina regista estado de manutenção; a principal regista EC de 0 a 5, com EC0 sem anomalias e EC5 associado a anomalias graves segundo critérios aprovados.
5. As verificações legais externas podem ser associadas aos equipamentos, agendadas e alertadas sem se confundirem com inspeções de condição nem se afirmarem executadas sem evidência.
6. A IA propõe a anomalia e o inspetor confirma, corrige ou rejeita.
7. Extensão, quantidade, unidade, trabalho, custo e prazo ficam ligados à anomalia e à ordem de trabalho.
8. Os custos sem base fiável são assinalados como não estimáveis, sem valores inventados.
9. A ordem só é encerrada depois de registados os dados de execução exigidos e efetuada a verificação aplicável.
10. O relatório apresenta fotografias, anomalias, avaliações, trabalhos e rastreabilidade.
11. A parametrização é alterável na plataforma de gestão, com versões e auditoria, sem alteração de código.

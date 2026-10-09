# Requisitos funcionais — recolha automática de dados da inspeção

## Objetivo
Reduzir ao mínimo a escrita manual durante uma inspeção. O sistema deve preencher automaticamente os dados contextuais e pedir ao inspetor apenas confirmação ou informação técnica que não consiga obter de forma fiável.

## Preenchimento automático
- **Inspetor:** utilizador autenticado na app; guardar identificador e nome do utilizador no momento da inspeção. Não usar um nome genérico como “Utilizador atual” em produção.
- **Data:** data local do início da inspeção, preenchida automaticamente.
- **Hora de início:** registada quando o inspetor inicia formalmente a inspeção, não quando abre o ecrã.
- **Hora de fim:** registada quando o inspetor seleciona “Concluir inspeção”; se houver pausa/retoma, guardar também os períodos e a duração efetiva.
- **Fuso horário:** guardar o instante técnico em UTC e apresentar data/hora local com o fuso horário aplicável.
- **Empreendimento/ativo:** herdado do contexto selecionado, sem voltar a pedir ao utilizador.
- **Tipo de inspeção:** sugerir o último tipo utilizado ou o tipo definido pelo plano; exigir confirmação quando possa alterar as regras aplicáveis.
- **Localização:** preencher por GPS quando autorizado e disponível; permitir selecionar a localização estruturada do inventário e acrescentar descrição livre. Se não houver permissão/sinal, não bloquear a inspeção.
- **Condições climatéricas:** obter automaticamente de um serviço meteorológico através de coordenadas e hora, quando disponível; guardar fonte, hora de consulta e estado de confiança. Mostrar os valores ao inspetor para confirmação/correção. Se não houver rede ou dados meteorológicos, permitir registo manual e marcar a origem como manual.
- **Condições de luz, acessibilidade e contexto de observação:** pré-preencher apenas quando exista sensor/fonte fiável; caso contrário, usar campos rápidos de seleção em vez de presumir valores.
- **Identificadores e estado de sincronização:** gerar IDs automaticamente e indicar se o registo está local, pendente, a sincronizar, sincronizado ou com erro.

## Fluxo de inspeção
1. O inspetor seleciona o empreendimento e toca em “Iniciar inspeção”.
2. A app cria o registo, captura data/hora de início, utilizador, ativo/contexto e versão de parametrização.
3. A app tenta obter GPS e condições meteorológicas sem bloquear o trabalho se falharem.
4. O inspetor verifica os dados automáticos e corrige apenas os que estejam errados.
5. Durante a inspeção, a app regista alterações e pode guardar rascunhos automaticamente.
6. Ao tocar em “Concluir inspeção”, regista a hora de fim, calcula duração e apresenta um resumo para validação.
7. Se estiver offline, guarda tudo localmente e apresenta o estado real de sincronização.

## Origem e fiabilidade dos dados
Cada campo automático deve registar, quando aplicável, a origem: autenticação, relógio do dispositivo, GPS, serviço meteorológico, inventário, sensor, importação ou entrada manual. Guardar hora de recolha e, para GPS, precisão estimada. Não apresentar como confirmado um dado que não foi obtido.

## Parametrização administrativa
A plataforma de gestão deve permitir configurar:
- quais os campos automáticos, obrigatórios ou opcionais por tipo de inspeção;
- permissões de GPS e política de privacidade;
- fornecedor/integração meteorológica e fallback manual;
- condições que exigem confirmação;
- eventos de início, pausa, retoma e conclusão;
- tolerâncias, regras de validação e campos que podem ser corrigidos;
- modelos de resumo e relatórios.

## Privacidade e robustez
- Pedir autorização para GPS e explicar a finalidade.
- Não recolher localização contínua fora da atividade de inspeção; obter apenas quando necessário.
- Não inventar condições meteorológicas se o serviço estiver indisponível.
- Usar o relógio do servidor para auditoria/sincronização sempre que disponível, preservando também o instante e fuso horário do dispositivo para contexto de campo.
- Permitir inspeção offline; sincronizar posteriormente sem perder o instante original de início/fim.

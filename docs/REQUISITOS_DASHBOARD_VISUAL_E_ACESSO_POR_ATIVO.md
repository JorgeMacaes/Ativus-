# Seven M Ativus — Dashboard visual e acesso por entidade/ativos

## Objetivo
Evoluir o dashboard para uma área de análise visual e implementar autorização por entidade, utilizador e conjunto de ativos. A configuração deve ser feita na plataforma web e aplicada também à app móvel através de uma API central.

## 1. Dashboard visual
O dashboard deve ser composto por cartões KPI, gráficos, listas de exceções e filtros. Todos os elementos devem derivar dos dados reais disponíveis no servidor; nunca apresentar dados de demonstração como se fossem dados reais.

### Indicadores
- Total de ativos, componentes, subcomponentes e equipamentos;
- Ativos por entidade gestora, empreendimento, tipologia e estado;
- Distribuição dos estados de conservação e manutenção;
- Inspeções concluídas, agendadas, atrasadas e por validar;
- Anomalias por gravidade, estado, idade e prazo;
- Trabalhos por prioridade, estado, responsável e prazo;
- Custos orçamentados, aprovados e reais, apresentados separadamente;
- Garantias e contratos próximos do fim;
- Alertas críticos e riscos que exigem ação;
- Estado de sincronização, conflitos e erros, quando exista backend/app conectados.

### Visualizações e interação
- Gráfico de distribuição dos ativos por tipologia/estado;
- Gráfico de estados de conservação (EC), com legenda e número de registos;
- Barras de anomalias por gravidade e estado;
- Tendência temporal de inspeções, anomalias e custos;
- Trabalhos por prioridade e por prazo;
- Lista de alertas e ações prioritárias;
- Filtros por período, entidade, empreendimento, tipologia e estado, limitados aos dados autorizados;
- Clique num segmento/barra/cartão abre a lista detalhada já filtrada;
- Exportação/impressão apenas dos dados que o utilizador tem autorização para consultar;
- Layout responsivo para telemóvel, tablet e computador, acessibilidade, legendas e alternativas textuais; não depender apenas das cores.
- Permitir configurar, por perfil, quais cartões e gráficos aparecem, a ordem e os filtros predefinidos.

### Integridade dos indicadores
- Definir para cada KPI a fórmula, origem, período e data da última atualização.
- Distinguir dados em falta de valores zero.
- Não calcular custos previstos sem dados e pressupostos suficientes.
- Não duplicar custos de patologia, ordem de trabalho e execução.
- Os gráficos devem respeitar integralmente o âmbito de acesso do utilizador.

## 2. Modelo de entidades e atribuição de ativos
O sistema deve suportar múltiplas organizações/entidades e empreendimentos. Um ativo pertence a uma entidade gestora e pode estar associado a um empreendimento e a uma hierarquia de componentes.

A atribuição de acesso deve ser explícita e configurável:
- Utilizador → uma ou várias entidades;
- Utilizador → um ou vários empreendimentos dentro das entidades autorizadas;
- Utilizador → todos os ativos de um âmbito autorizado ou apenas ativos selecionados;
- Opcionalmente, acesso limitado a componentes/equipamentos, equipas ou tarefas atribuídas;
- Vigência da atribuição (início/fim), estado ativo/inativo, responsável pela atribuição e motivo;
- Atribuição direta e por grupo/equipa, com regras claras de herança e precedência;
- Pré-visualização “Ver como utilizador” para administradores autorizados;
- Consulta e exportação de uma matriz utilizador–entidade–empreendimento–ativos;
- Registo de auditoria para concessão, alteração, expiração e revogação do acesso.

## 3. Perfis e permissões
A plataforma web deve permitir criar e parametrizar perfis, sem os fixar no código:
- Administrador global;
- Administrador da entidade;
- Gestor de ativos;
- Inspetor/técnico;
- Responsável por trabalhos;
- Consulta/auditoria;
- Outros perfis definidos pela organização.

Os nomes acima são exemplos iniciais configuráveis, não uma lista fechada. Para cada perfil devem ser configuráveis permissões de visualizar, criar, editar, atribuir, validar, publicar, encerrar, exportar e administrar por módulo e âmbito de dados.

## 4. Regra obrigatória de autorização
O acesso deve ser negado por defeito. Um utilizador só pode consultar ou alterar ativos incluídos no seu âmbito de atribuição e permitidos pelo seu perfil.

A restrição deve ser aplicada no servidor/API em cada pedido, não apenas ocultando linhas ou menus na interface. Deve abranger:
- Dashboard, pesquisas, filtros, contagens e gráficos;
- Ativos, componentes, inspeções, patologias, trabalhos e documentos;
- Fotografias, anexos, relatórios, mapas, notificações e exportações;
- Pesquisa global, ligações diretas e endpoints da API;
- App móvel, dados offline, sincronização e conflitos.

Não basta filtrar os ativos na interface: o servidor deve verificar autorização para cada registo e relação. Identificadores difíceis de adivinhar não substituem autorização. Alterar o URL ou enviar diretamente um ID de outro ativo nunca deve permitir acesso.

## 5. Configuração e publicação pela plataforma web
- Criar/editar/desativar utilizadores e grupos, conforme permissões;
- Criar perfis e permissões por módulo e âmbito;
- Atribuir entidades, empreendimentos, ativos ou conjuntos de ativos;
- Pesquisar ativos por código, nome, localização e tipologia para atribuição em lote;
- Rever e confirmar alterações antes de publicar;
- Aplicar alterações de acesso imediatamente no servidor e invalidar sessões/tokens quando necessário;
- A app recebe apenas os dados autorizados e deve atualizar o âmbito após sincronização;
- Preservar auditoria histórica sem manter acesso após revogação;
- Disponibilizar testes de autorização para utilizador autorizado, não autorizado, acesso revogado e utilizador com várias entidades.

## 6. Arquitetura e estado atual do protótipo
O protótipo atual usa armazenamento local do navegador e dados de exemplo; não possui autenticação nem autorização central real. Qualquer filtro por utilizador implementado apenas no frontend seria demonstrativo e não constitui controlo de segurança.

Antes de disponibilizar acesso real a vários clientes/entidades, implementar:
1. API/backend autenticado;
2. Base de dados central com relações entre entidades, utilizadores, ativos e permissões;
3. Autorização no servidor em todos os endpoints e consultas;
4. Sessões/tokens seguros, revogação e auditoria;
5. Sincronização da app com verificação de autorização;
6. Testes automatizados de isolamento entre entidades (incluindo tentativas de acesso por ID, URL, pesquisa, exportação e anexos).

## 7. Critérios de aceitação
- Dashboard gráfico, responsivo e com filtros, sem inventar dados;
- Cada gráfico e KPI respeita o âmbito autorizado;
- Utilizador A não consegue consultar, editar, exportar ou descarregar dados de ativos atribuídos apenas ao utilizador B;
- Revogar uma atribuição remove o acesso a partir do servidor e após a política de sessão definida;
- Atribuições e alterações de permissões ficam auditadas;
- A configuração de perfis, entidades e ativos é feita na plataforma web;
- Testes automatizados cobrem acessos autorizados e negados;
- A app e a plataforma usam a mesma fonte central de permissões.

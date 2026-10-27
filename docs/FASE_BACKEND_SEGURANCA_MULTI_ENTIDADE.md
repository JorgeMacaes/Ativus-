# Seven M Ativus — Fase de backend e segurança multi-entidade

## Objetivo
Passar do protótipo local para uma aplicação com autenticação, base de dados central e permissões aplicadas no servidor. A interface não pode decidir sozinha que ativos um utilizador pode ver.

## Artefactos a implementar
- Esquema PostgreSQL/Supabase versionado com tabelas nucleares, índices e políticas Row Level Security (RLS).
- Entidades e membros: utilizadores podem pertencer a várias entidades e ter um perfil por entidade.
- Ativos: entidade obrigatória, código único por entidade, estado de preparação/validação/disponível/inativo, classificação EC0–EC5 e atributos flexíveis.
- Componentes/subcomponentes, inspeções, patologias, ordens de trabalho, documentos, parametrizações versionadas, regras de alerta e registo de auditoria.

## Modelo de autorização
- Acesso concedido por associação ativa em entity_members.
- Papéis iniciais: owner, admin, manager, inspector, technician, viewer.
- RLS em todas as tabelas de negócio.
- Só owner/admin gere membros e parametrizações; só owner/admin pode eliminar registos nucleares; ações de escrita são limitadas por papel.
- A interface deve filtrar por entidade para usabilidade, mas a segurança efetiva é a política do servidor.

## Fases de implementação
1. **Infraestrutura e autenticação:** criar projeto Supabase de desenvolvimento, aplicar esquema, configurar variáveis de ambiente e sessão; nunca incluir service-role key no cliente.
2. **Provisionamento seguro:** fluxo administrativo para criar entidade, primeiro owner, perfis e convites. Não permitir que um visitante se autoatribua papel de owner.
3. **Inventário multi-entidade:** CRUD completo de ativos e componentes, campos parametrizáveis, pesquisa, importação e validação.
4. **Inspeções e patologias:** agenda, execução, checklist por tipologia, fotografias, registo offline com fila de sincronização e resolução de conflitos.
5. **Trabalhos e custos:** ordens de trabalho, estimado/aprovado/real separado, materiais, verificação e reabertura.
6. **Dashboard gráfico:** indicadores derivados de consultas reais, filtros por entidade, ativo, período, gravidade e estado.
7. **Documentação e armazenamento:** fotos/documentos com políticas de acesso no armazenamento, metadados e auditoria.
8. **IA e previsão:** sugestões de patologias com validação humana; previsão Markov apenas após existirem históricos suficientes e validação dos resultados.

## Critérios de aceitação obrigatórios
- Um utilizador da entidade A não consegue ler nem alterar ativos da entidade B, mesmo chamando diretamente a API.
- Viewer não consegue escrever; inspector não consegue administrar membros; manager não consegue mudar políticas ou atribuir-se privilégios.
- Dados criados por um utilizador autenticado persistem após terminar sessão e entrar noutro dispositivo.
- Dashboard reconcilia com os registos da base de dados e apresenta estados vazios/erros de carregamento.
- Testes de RLS com pelo menos duas entidades e contas separadas, incluindo leituras e tentativas de escrita não autorizadas.
- Build, testes e revisão das políticas aprovados antes de usar dados reais.

## Estado atual e limitações
Este plano é uma especificação de implementação, não uma instalação executada nem uma certificação de segurança. Ainda é necessário criar/configurar o projeto backend, executar as migrações, rever a sintaxe e as relações, criar os fluxos de provisionamento, integrar a aplicação e executar testes automatizados. A aplicação atual continua a usar armazenamento local e não deve ser apresentada como multiutilizador funcional até essa integração estar concluída.

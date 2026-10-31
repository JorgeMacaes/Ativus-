# Plano de testes funcionais Android — Seven M Ativus

**Versão de teste:** MVP 0.2.1  
**Branch:** testes/correcao-build-2026-10-31  
**Tipo de pacote:** APK Debug (não é versão de produção)  
**Estado inicial:** compilação Android concluída com sucesso; testes em dispositivo ainda por executar.

## 1. Preparação do dispositivo
- [ ] Descarregar o artefacto `seven-m-ativus-debug-apk` na execução Android indicada no README/relatório de testes.
- [ ] Extrair o ZIP e localizar o ficheiro APK.
- [ ] Transferir o APK para um dispositivo Android de teste.
- [ ] Autorizar temporariamente a instalação a partir da origem utilizada, se o Android o solicitar.
- [ ] Instalar e abrir a aplicação.
- [ ] Registar modelo do dispositivo, versão Android, data e resultado.

> Utilizar apenas dados fictícios. Não introduzir credenciais nem informação pessoal ou dados de clientes em ambiente de teste.

## 2. Teste de instalação e arranque
- [ ] Instala sem erro.
- [ ] Abre sem fechar inesperadamente.
- [ ] Apresenta a identidade Seven M Ativus.
- [ ] Dashboard carrega e não apresenta ecrã em branco.
- [ ] Menu lateral abre e fecha.
- [ ] Cabeçalho e conteúdos adaptam-se ao ecrã do telemóvel.
- [ ] Navegação não fica bloqueada após regressar de um módulo.

## 3. Navegação por módulos
Percorrer e registar o resultado de cada módulo:
- [ ] Dashboard
- [ ] Empreendimentos
- [ ] Ativos / Inventário
- [ ] Inspeções
- [ ] Ocorrências
- [ ] Patologias
- [ ] Agenda
- [ ] Sistemas de Monitorização
- [ ] Documentação
- [ ] Ativus AI
- [ ] CRM
- [ ] Fornecedores e Licenças
- [ ] Parametrização

Para cada módulo: verificar abertura, carregamento, mensagens de erro, botões, formulários, voltar e navegação entre ecrãs.

## 4. Testes de registos locais / demonstração
A aplicação principal contém dados de demonstração e funções que guardam alguns registos em `localStorage`. Confirmar o comportamento real no dispositivo:
- [ ] Criar um ativo fictício.
- [ ] Confirmar que aparece na lista e no detalhe.
- [ ] Fechar e voltar a abrir a aplicação; confirmar persistência local.
- [ ] Criar uma inspeção de rotina a partir de um ativo.
- [ ] Criar uma patologia fictícia.
- [ ] Confirmar que os dados não desaparecem ao navegar entre módulos.
- [ ] Confirmar comportamento após limpar dados da aplicação (apenas se for seguro perder todos os dados de teste).

**Nota:** persistência local não equivale a sincronização entre utilizadores ou dispositivos.

## 5. Testes de integração Supabase
Executar apenas num projeto/ambiente de teste devidamente configurado:
- [ ] Confirmar variáveis de ambiente de teste e URL do projeto.
- [ ] Confirmar autenticação e sessão.
- [ ] Confirmar permissões/RLS para cada perfil.
- [ ] Criar, consultar, editar e eliminar registos de teste, conforme permitido.
- [ ] Confirmar isolamento entre organizações/espaços.
- [ ] Confirmar que erros de rede e permissões são apresentados de forma compreensível.
- [ ] Confirmar que nenhum segredo de serviço é incluído na aplicação cliente.

Não executar alterações destrutivas nem testes com dados reais de produção.

## 6. Testes de robustez
- [ ] Testar com rede Wi-Fi.
- [ ] Testar sem ligação à Internet e regressar à ligação.
- [ ] Fechar e reabrir a aplicação.
- [ ] Rodar o dispositivo, se aplicável.
- [ ] Testar teclado, campos, listas e botões em ecrã pequeno.
- [ ] Verificar textos cortados, sobreposições e deslocamento horizontal.
- [ ] Registar erros, capturas de ecrã e passos para reproduzir.

## 7. Registo de defeitos
Para cada problema, registar:
1. ID sequencial.
2. Módulo/ecrã.
3. Passos exatos para reproduzir.
4. Resultado esperado.
5. Resultado observado.
6. Gravidade: bloqueante, alta, média ou baixa.
7. Captura de ecrã, se possível.
8. Estado: por analisar, em correção, corrigido, retestado.

## 8. Critérios de aceitação Android
- Instalação e arranque sem falhas.
- Navegação pelos módulos sem encerramentos inesperados.
- Operações essenciais de criação/consulta funcionam no contexto indicado.
- Persistência local e sincronização remota são claramente distinguidas.
- Sem exposição de credenciais ou dados reais.
- Defeitos bloqueantes e altos corrigidos e retestados.

**Resultado global:** PENDENTE — aguarda execução dos testes num dispositivo Android físico.

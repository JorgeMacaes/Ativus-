# Preparação iOS — ATIVUS

## Estado técnico
- A aplicação utiliza Capacitor 7 e inclui `@capacitor/ios`.
- O identificador técnico configurado é `com.sevenm.ativus.mobile` (deve ser confirmado antes da publicação).
- O nome apresentado pela aplicação iOS passa a ser `ATIVUS`.
- O build nativo usa caminhos relativos para carregar os recursos locais; o GitHub Pages mantém o caminho `/Ativus-/`.
- O workflow `.github/workflows/test-ios.yml` compila para o simulador iOS em macOS/Xcode, sem assinatura.
- O artefacto `.app` do simulador não é um IPA e não pode ser instalado num iPhone físico.

## Validações já executadas
- Build web e sincronização Capacitor concluídos no workflow iOS.
- `xcodebuild` para `generic/platform=iOS Simulator` concluído com sucesso no run 41211369135.

## Próximas validações
1. Executar novamente o workflow depois das alterações de configuração.
2. Abrir a aplicação no simulador e validar login, navegação, formulários, câmara/fotografias (se usadas), ficheiros, rede e autenticação.
3. Confirmar o Bundle ID antes da publicação.
4. Só depois de existir Apple Developer ativo: configurar assinatura, gerar IPA e preparar TestFlight.

## Segurança
Não guardar certificados, chaves privadas ou credenciais Apple no repositório. Usar GitHub Actions Secrets/Environment quando a assinatura for configurada.

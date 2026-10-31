# Preparação iOS — Seven M Ativus

## Estado
- A aplicação utiliza Capacitor 7.
- A dependência `@capacitor/ios` foi adicionada na branch de testes.
- O workflow `.github/workflows/test-ios.yml` compila a aplicação para o simulador iOS em macOS/Xcode.
- A compilação do simulador não produz um IPA instalável num iPhone.

## Validação em dispositivo e distribuição
Para instalar num iPhone ou distribuir via TestFlight/App Store será necessário:
1. Conta Apple Developer ativa.
2. Identificador Bundle ID definitivo e único.
3. Certificado de assinatura e perfil de aprovisionamento (provisioning profile).
4. Configuração de assinatura no Xcode/GitHub Actions.
5. Teste num iPhone real e validação de permissões, câmara, ficheiros, rede e autenticação.

Não guardar certificados, chaves privadas ou credenciais Apple no repositório. Usar GitHub Actions Secrets/Environment quando a assinatura for configurada.

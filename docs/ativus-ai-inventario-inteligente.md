# Ativus AI — Inventário Inteligente

Estado: requisito funcional aprovado para integrar a arquitetura Seven M Ativus.

## Objetivo
Permitir que utilizadores carreguem plantas, fotografias, vídeos e documentação técnica para obter uma proposta assistida por IA de inventário de ativos, componentes e subcomponentes. A IA apoia o levantamento; não substitui a validação técnica.

## Princípio obrigatório
**A IA propõe; o técnico valida; só os elementos aprovados são gravados no inventário oficial.**
Nenhum resultado de IA pode criar ou alterar ativos/componentes definitivos sem confirmação explícita de um utilizador autorizado.

## Fontes suportadas
- Plantas e desenhos em PDF ou imagem.
- Fotografias de edifícios, espaços, componentes e equipamentos.
- Vídeos de levantamentos e inspeções, quando tecnicamente suportados.
- Fichas técnicas, manuais, mapas de quantidades e documentação de obra.


## Formatos de ficheiro e processamento técnico

O módulo deve permitir carregar documentação multidisciplinar. A aceitação do upload não significa que todos os formatos sejam interpretados diretamente: cada formato terá um adaptador de leitura, conversão ou extração próprio.

### Formatos a suportar
- **Desenho e CAD 2D:** PDF, DWG, DXF, DWT.
- **CAD e modelos 3D:** DWG 3D, DXF 3D, STEP/STP, IGES/IGS.

- **Formatos Autodesk de publicação e consulta:** DWF e DWFx. Devem ser aceites como documentos técnicos de origem, preservando o original e permitindo pré-visualização/conversão quando exista ferramenta compatível. A extração de folhas, vistas, camadas e propriedades depende do conteúdo efetivamente publicado no ficheiro; não assumir que contém toda a estrutura editável do DWG.

- **BIM:** IFC como formato prioritário de intercâmbio; RVT, RFA e PLN quando exista exportação/conversão compatível.
- **Modelos 3D e malhas:** OBJ, STL, PLY, GLB, GLTF, FBX.
- **Nuvens de pontos e digitalização:** E57, LAS, LAZ.
- **Documentação:** DOC, DOCX, XLS, XLSX, CSV, TXT.
- **Imagem e digitalização:** JPG, JPEG, PNG, TIFF, WebP.
- **Vídeo:** MP4 e MOV numa fase própria, sujeito a limites e extração de fotogramas.

### Estratégia de interpretação
- Priorizar IFC para extração BIM estruturada: entidades, pisos, espaços, sistemas, propriedades e relações.
- Para DWG/DXF, extrair camadas, blocos, textos, cotas e geometria com bibliotecas/serviços compatíveis; gerar pré-visualização quando possível.
- Para RVT/RFA e formatos proprietários, exigir exportação para IFC/DWG/PDF quando não houver leitor autorizado e tecnicamente adequado.
- Para STEP/IGES e formatos de malha, extrair geometria e metadados técnicos com ferramentas específicas; não inferir materiais ou função sem evidência.
- Para E57/LAS/LAZ, prever processamento de nuvens de pontos como funcionalidade avançada, não como requisito do primeiro MVP.
- Manter o ficheiro original imutável e guardar derivados/conversões ligados ao original.

### Metadados e limites
Registar extensão, MIME declarado e detetado, tamanho, hash, versão, origem, estado de processamento e ficheiro derivado. Validar extensão e conteúdo real no processamento; não confiar apenas no MIME enviado pelo navegador. Aplicar limites por formato e proteção contra ficheiros malformados ou excessivamente complexos.

### Resultados e rastreabilidade
Cada elemento extraído deve apontar para o ficheiro de origem e, sempre que possível, para camada, entidade IFC, página, região, coordenada ou intervalo de fotogramas. A IA deve distinguir geometria extraída diretamente, valores calculados, estimativas e campos desconhecidos.

## Fluxo funcional
1. Criar uma sessão de levantamento associada a um empreendimento e, opcionalmente, a um ativo existente.
2. Carregar um ou vários ficheiros e registar origem, autor, data e contexto.
3. A IA classifica os documentos e extrai elementos candidatos.
4. Apresentar resultados numa área de revisão, com localização, categoria, descrição, quantidades/dimensões apenas quando sustentadas, fonte e evidência visual.
5. Indicar confiança e estado de cada campo: confirmado no documento, estimado pela IA ou desconhecido.
6. Permitir ao técnico aceitar, editar, rejeitar ou pedir nova análise.
7. Após aprovação, criar os registos nas tabelas oficiais de ativos e componentes, preservando a ligação à sessão e aos ficheiros de origem.

## Capacidades por fase
### Fase 1 — Plantas e documentos
- Identificar pisos, espaços, divisões, tipologias e elementos gráficos relevantes.
- Extrair texto, legendas, referências e tabelas.
- Reconhecer escalas apenas quando legíveis; não produzir medições fiáveis sem escala validada.
- Permitir associar manualmente os elementos aos ativos e espaços.

### Fase 2 — Fotografias
- Classificar elementos visíveis: fachadas, coberturas, vãos, pavimentos, revestimentos, instalações e equipamentos.
- Sugerir material, marca ou modelo apenas quando houver evidência legível.
- Associar cada sugestão à fotografia e, quando possível, à zona/piso.

### Fase 3 — Inventário assistido
- Propor hierarquia Empreendimento → Ativo → Componente → Subcomponente.
- Detetar possíveis duplicados entre documentos e fotografias.
- Permitir importação em lote apenas após validação.
- Manter códigos gerados pela plataforma e não inventar identificadores de campo.

### Fase 4 — Apoio à inspeção
- Sugerir anomalias visíveis e possíveis patologias a partir de imagens.
- Não declarar diagnóstico definitivo, gravidade ou classe EC sem validação técnica.
- Distinguir observação visual de diagnóstico e recomendação.

### Fase 5 — Comparação temporal
- Comparar imagens de inspeções diferentes.
- Assinalar alterações visuais para revisão humana.
- Preservar histórico e evidências originais.

## Modelo de dados proposto
Criar entidades próprias para o processo de IA, sem misturar rascunhos com o inventário oficial:
- `ai_levantamentos`: empreendimento, ativo opcional, estado, solicitante, datas e resumo.
- `ai_documentos`: levantamento, caminho no Storage, tipo, nome, hash, metadados e estado de processamento.
- `ai_analises`: documento/levantamento, versão do modelo, estado, data, resultado estruturado e erros.
- `ai_elementos_propostos`: tipo de elemento, dados extraídos, localização proposta, confiança, evidência, estado de revisão e ligação ao registo oficial após aprovação.
- `ai_revisoes`: utilizador, decisão, alterações, data e histórico de validação.

Os nomes e campos finais destas tabelas devem ser revistos contra o esquema existente antes de aplicar migrações.

## Segurança, privacidade e auditoria
- Armazenamento privado por entidade/empreendimento, com políticas RLS.
- URLs temporários para acesso aos ficheiros.
- Verificação de permissões antes de carregar, analisar, consultar ou aprovar.
- Registo de quem carregou, analisou, alterou e aprovou cada elemento.
- Retenção e eliminação de documentos configuráveis de acordo com contrato e requisitos legais.
- Não expor chaves secretas de fornecedores de IA no cliente.

## Regras de qualidade
- Não inventar quantidades, dimensões, materiais, marcas ou modelos.
- Mostrar a fonte e a evidência de cada proposta.
- Marcar explicitamente valores estimados e campos desconhecidos.
- Não duplicar registos existentes: verificar correspondências antes de criar.
- A aprovação deve ser reversível através do fluxo normal de correção/histórico, sem apagar evidências.

## Critérios de aceitação do primeiro MVP
1. O utilizador consegue iniciar um levantamento num empreendimento.
2. Consegue carregar PDF e imagens.
3. Cada ficheiro fica guardado de forma privada e associado ao levantamento.
4. A análise gera uma lista de elementos propostos, sem alterar o inventário oficial.
5. O técnico consegue aceitar, editar ou rejeitar cada proposta.
6. Apenas propostas aprovadas criam ativos/componentes.
7. Fica registada a origem documental e a identidade do aprovador.

## Integração com o inventário atual
O inventário oficial continua a usar a hierarquia e tabelas existentes de empreendimentos, ativos e componentes. O Ativus AI funciona como camada de levantamento, análise e validação, sem substituir essas tabelas.

# Requisitos do inventário visual e técnico — Seven M Ativus

## 1. Princípio obrigatório

O inventário deve identificar visual e tecnicamente todos os níveis do ativo. **Todos os ativos, componentes, subcomponentes e equipamentos devem ter pelo menos uma fotografia associada.** A fotografia é requisito de identificação, não um campo meramente decorativo.

O sistema deve procurar recolher o máximo de informação útil e disponível, sem tornar obrigatórios dados que não se aplicam ao elemento. Distinguir sempre:
- informação confirmada pelo utilizador/técnico;
- informação importada de documentos ou sistemas;
- sugestão inferida por IA;
- informação desconhecida ou por confirmar.

Uma sugestão de IA não pode ser apresentada como facto confirmado. A publicação do inventário exige validação humana dos campos críticos e das alterações relevantes.

## 2. Hierarquia e relações

Modelo-base:
**Entidade gestora → Ativo → Espaços/Componentes → Elementos/Subcomponentes → Equipamentos e sistemas associados**

A hierarquia deve ser configurável por tipologia de ativo e permitir relações transversais sem duplicar registos.

### Exemplo — hotel
- **Ativo:** Hotel Póvoa de Varzim.
- **Espaços/componentes:** quarto 204, corredor do 2.º piso, escada de acesso à lavandaria, receção, cozinha, lavandaria, instalações sanitárias, cobertura.
- **Elementos/subcomponentes:** paredes, pavimentos, tetos, portas, janelas, armários, camas, candeeiros, tomadas, televisões, frigoríficos/minibares, equipamentos sanitários e outros elementos existentes.
- **Equipamentos/sistemas associados:** sistema elétrico, iluminação, AVAC/climatização, ventilação, abastecimento de água, águas residuais, segurança contra incêndio, telecomunicações, equipamentos audiovisuais, mobiliário, elevadores e outros sistemas aplicáveis.

Um quarto ou corredor deve poder funcionar como espaço/localização, contendo vários elementos. Um elemento pode estar localizado num espaço e estar simultaneamente associado a um sistema técnico. Estas relações não devem obrigar à duplicação da ficha do elemento.

O modelo deve também suportar ativos rodoviários, ferroviários, edifícios residenciais, edifícios de serviços e outras tipologias futuras, através de modelos de localização e campos próprios.

## 3. Fotografias — requisito transversal

Cada ativo, componente, subcomponente e equipamento deve ter pelo menos uma fotografia. Sempre que útil, suportar várias fotografias por registo:
- vista geral/contexto;
- identificação do elemento;
- detalhe de marca, modelo, número de série ou etiqueta;
- detalhe de características construtivas;
- anomalias/patologias;
- antes, durante e depois de uma intervenção.

Requisitos de gestão de imagens:
- captura pela câmara do telemóvel e carregamento de imagens existentes;
- associação inequívoca à ficha e, quando aplicável, à inspeção, ocorrência ou ordem de trabalho;
- data/hora, autor e origem da fotografia, quando disponíveis;
- compressão configurável sem perda indevida de detalhe técnico;
- preservação do original quando a política de armazenamento o permita;
- funcionamento offline, fila de envio e confirmação de sincronização;
- indicação de fotografia em falta, envio pendente ou erro de carregamento;
- controlo de acesso e histórico de substituição/remoção;
- fotografias de evidência de uma patologia ou intervenção não devem substituir silenciosamente as fotografias de identificação do elemento.

O inventário pode estar em preparação enquanto as fotografias são recolhidas, mas não deve ser publicado como completo se faltar a fotografia obrigatória, salvo exceção formalmente autorizada e auditada. A exceção deve indicar motivo, responsável e prazo de regularização.

## 4. Ficha-base de cada elemento

A ficha de componente, subcomponente ou equipamento deve permitir, conforme aplicável:
- identificador único e código/matrícula; QR code e pesquisa manual;
- nome, designação normalizada, descrição e tipologia;
- fotografia(s);
- ativo, espaço pai, componente pai e relações com outros elementos;
- localização estruturada e descrição livre;
- sistema funcional a que pertence;
- classificação (por exemplo, estrutural/não estrutural e principal/secundário, quando aplicável);
- material(is), acabamento, cor e dimensões;
- quantidade, unidade e método de medição;
- marca, fabricante, modelo, referência comercial e número de série;
- data de aquisição, instalação, colocação em serviço e substituição, se conhecidas;
- fornecedor, custo de aquisição e documentos, se disponíveis;
- garantia, datas, condições e evidência documental;
- entidade responsável pela manutenção, contrato e contacto funcional;
- estado ativo/inativo, motivo de desativação e elemento substituto;
- documentação técnica, manuais, certificados, fichas técnicas e garantias;
- estado de conservação e estado de manutenção, cada um com origem e data;
- histórico de inspeções, ocorrências, patologias, intervenções, peças e custos;
- origem dos dados, data de registo/alteração, autor e estado de validação.

Os campos devem ser condicionais por tipologia. Por exemplo, marca/modelo/número de série são relevantes para uma televisão ou unidade de climatização, mas podem não ser aplicáveis a uma parede. Não exigir campos sem sentido para o elemento.

## 5. Tipificação funcional de equipamentos e sistemas

A parametrização deve permitir classificar elementos por sistema/categoria, sem limitar o catálogo a uma lista fechada. Exemplos iniciais:
- sistemas elétricos e quadros/distribuição;
- iluminação e candeeiros;
- ventilação e climatização (AVAC);
- abastecimento de água e produção de água quente;
- drenagem e águas residuais;
- sistemas de segurança e deteção/extinção de incêndio;
- elevadores e transporte vertical;
- telecomunicações, rede e Wi-Fi;
- sistemas audiovisuais e televisões;
- mobiliário e equipamento de quarto;
- equipamento de cozinha e lavandaria;
- equipamentos sanitários;
- envolvente e elementos construtivos;
- sistemas de controlo, sensores e monitorização.

A mesma categoria pode ter fichas específicas com campos próprios, mantendo os campos comuns. A hierarquia, as categorias e os campos devem ser configuráveis na plataforma de gestão, sem alterações ao código.

## 6. Localização

A localização deve ser estruturada e adaptada à tipologia:
- **Hotel/edifício:** edifício, piso, ala/zona, quarto/espaço, fachada/orientação, referência à planta e coordenadas GPS quando úteis.
- **Rodovia:** estrada, secção, sentido, faixa, lado, quilómetro inicial/final e GPS.
- **Ferrovia:** linha, secção, via, ramal/estação, sentido, quilómetro ferroviário inicial/final, lado e GPS.

Suportar elementos pontuais e lineares. Conservar o referencial oficial e as descontinuidades de quilometragem quando existam; não assumir que o quilómetro de referência equivale sempre à distância geográfica.

## 7. IA no levantamento e na manutenção do inventário

A IA pode analisar fotografias, vídeos, plantas, projetos, cortes, alçados, desenhos técnicos, PDFs, digitalizações, folhas de cálculo e relatórios para sugerir:
- identificação e tipologia de elementos;
- marca, modelo ou dados legíveis em etiquetas;
- materiais, dimensões e localização;
- relações hierárquicas e sistema funcional;
- elementos repetidos, duplicados ou em falta;
- diferenças entre documentação nova e inventário existente.

Para cada dado sugerido, guardar origem, nível de confiança e estado de validação. Comparar fontes com o inventário atual e propor alterações; nunca apagar silenciosamente dados ou histórico. A validação humana é obrigatória antes da publicação de alterações materiais.

## 8. Importação, validação e publicação

O inventário deve suportar importação em massa, modelos reutilizáveis por tipo de ativo, edição em lote, deteção de duplicados, validação de campos e relatório de erros. Estados sugeridos:
- Em preparação;
- Em validação;
- Disponível para inspeção.

Antes da publicação, validar pelo menos: identificador único, hierarquia/localização, categoria, fotografia obrigatória e campos críticos aplicáveis. Permitir exceções autorizadas e auditadas, sem mascarar lacunas.

Cada versão publicada deve ser identificável e recuperável. As alterações feitas em campo devem ser sincronizadas com controlo de conflitos, autoria, data e histórico. Desativar ou substituir um elemento não deve eliminar o seu histórico.

## 9. Critérios de aceitação

1. Não é possível publicar um inventário como completo sem fotografia de cada ativo, componente, subcomponente e equipamento, salvo exceção autorizada e auditada.
2. Um hotel pode ser decomposto em espaços e, dentro destes, em todos os elementos efetivamente existentes.
3. Cada elemento tem ficha própria e código único, sem duplicação desnecessária para representar relações com espaços e sistemas.
4. A ficha apresenta os campos adequados à tipologia e não exige marca/modelo em elementos onde não se aplica.
5. É possível consultar fotografias, localização, características técnicas, garantias, contratos, documentos e histórico na mesma ficha.
6. O inventário suporta recolha offline, sincronização e rastreabilidade das alterações.
7. Dados extraídos ou inferidos por IA são distinguíveis dos dados confirmados e não são publicados como factos sem validação.
8. As categorias, campos, hierarquias e regras podem ser parametrizados na plataforma de gestão.

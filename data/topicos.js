// ── topicos.js ──
// Estrutura: Área → Conteúdo → Habilidade (com prioridade)
// Prioridades baseadas na Matriz de Referência ENEM + tendências ENEM 2026

const ENEM = {

  // ════════════════════════════════════════════════════
  matematica: {
    nome: "Matemática",
    icone: "calculator",
    conteudos: [
      {
        id: "mat_razao",
        nome: "Razão, Proporção e Porcentagem",
        habilidades: [
          { id: "H1",  topico: "Razão e proporção",                           prioridade: "alta",  descricao: "Reconhecer diferentes significados e representações dos números" },
          { id: "H3",  topico: "Regra de três simples e composta",             prioridade: "alta",  descricao: "Resolver situação-problema envolvendo conhecimentos numéricos" },
          { id: "H3b", topico: "Porcentagem e juros simples",                  prioridade: "alta",  descricao: "Resolver situação-problema envolvendo conhecimentos numéricos" },
          { id: "H3c", topico: "Juros compostos e matemática financeira",      prioridade: "media", descricao: "Resolver situação-problema envolvendo conhecimentos numéricos" },
          { id: "H11", topico: "Escalas e grandezas",                          prioridade: "alta",  descricao: "Utilizar a noção de escalas na leitura de representação de situações" },
          { id: "H16", topico: "Grandezas diretamente e inversamente proporcionais", prioridade: "alta", descricao: "Resolver situação-problema envolvendo variação de grandezas" },
        ]
      },
      {
        id: "mat_conjuntos",
        nome: "Conjuntos e Números",
        habilidades: [
          { id: "H1b", topico: "Conjuntos numéricos (naturais, inteiros, racionais, irracionais, reais)", prioridade: "media", descricao: "Reconhecer diferentes significados dos números" },
          { id: "H2",  topico: "Operações com frações e potências",            prioridade: "media", descricao: "Identificar padrões numéricos ou princípios de contagem" },
          { id: "H4",  topico: "Equações e inequações do 1º e 2º grau",        prioridade: "media", descricao: "Avaliar a razoabilidade de um resultado numérico" },
        ]
      },
      {
        id: "mat_funcoes",
        nome: "Funções",
        habilidades: [
          { id: "H19",  topico: "Função do 1º grau (linear)",                  prioridade: "alta",  descricao: "Identificar representações algébricas que expressem relação entre grandezas" },
          { id: "H19b", topico: "Função do 2º grau (quadrática)",              prioridade: "alta",  descricao: "Identificar representações algébricas que expressem relação entre grandezas" },
          { id: "H19c", topico: "Função exponencial",                          prioridade: "alta",  descricao: "Identificar representações algébricas que expressem relação entre grandezas" },
          { id: "H19d", topico: "Função logarítmica",                          prioridade: "media", descricao: "Identificar representações algébricas que expressem relação entre grandezas" },
          { id: "H20",  topico: "Leitura e interpretação de gráficos e tabelas", prioridade: "alta", descricao: "Interpretar gráfico cartesiano que represente relações entre grandezas" },
          { id: "H21",  topico: "Sistemas lineares",                           prioridade: "media", descricao: "Resolver situação-problema cuja modelagem envolva conhecimentos algébricos" },
        ]
      },
      {
        id: "mat_sequencias",
        nome: "Sequências e Progressões",
        habilidades: [
          { id: "H2b", topico: "Progressão Aritmética (PA)",                   prioridade: "alta",  descricao: "Identificar padrões numéricos ou princípios de contagem" },
          { id: "H2c", topico: "Progressão Geométrica (PG)",                   prioridade: "alta",  descricao: "Identificar padrões numéricos ou princípios de contagem" },
          { id: "H2d", topico: "Sequências e funções recursivas",              prioridade: "baixa", descricao: "Identificar padrões numéricos" },
        ]
      },
      {
        id: "mat_combinatoria",
        nome: "Combinatória e Probabilidade",
        habilidades: [
          { id: "H2e", topico: "Análise combinatória: arranjos e combinações", prioridade: "alta",  descricao: "Identificar princípios de contagem" },
          { id: "H28", topico: "Probabilidade",                                prioridade: "alta",  descricao: "Resolver situação-problema que envolva conhecimentos de probabilidade" },
          { id: "H27", topico: "Estatística: média, moda, mediana e desvio padrão", prioridade: "alta", descricao: "Calcular medidas de tendência central ou de dispersão" },
        ]
      },
      {
        id: "mat_geometria_plana",
        nome: "Geometria Plana",
        habilidades: [
          { id: "H7",  topico: "Geometria plana: perímetro e área",            prioridade: "alta",  descricao: "Identificar características de figuras planas" },
          { id: "H8",  topico: "Geometria plana: triângulos e teorema de Pitágoras", prioridade: "alta", descricao: "Resolver situação-problema que envolva conhecimentos geométricos" },
          { id: "H8b", topico: "Geometria plana: círculo e circunferência",    prioridade: "alta",  descricao: "Resolver situação-problema que envolva conhecimentos geométricos" },
          { id: "H9",  topico: "Trigonometria no triângulo retângulo",         prioridade: "alta",  descricao: "Utilizar conhecimentos geométricos na solução de problemas" },
          { id: "H9b", topico: "Trigonometria: seno, cosseno e tangente",      prioridade: "media", descricao: "Utilizar conhecimentos geométricos na solução de problemas" },
          { id: "H9c", topico: "Lei dos senos e lei dos cossenos",             prioridade: "media", descricao: "Utilizar conhecimentos geométricos na solução de problemas" },
        ]
      },
      {
        id: "mat_geometria_espacial",
        nome: "Geometria Espacial",
        habilidades: [
          { id: "H8c", topico: "Geometria espacial: prismas e pirâmides",      prioridade: "alta",  descricao: "Resolver situação-problema que envolva conhecimentos geométricos espaciais" },
          { id: "H8d", topico: "Geometria espacial: cilindro, cone e esfera",  prioridade: "alta",  descricao: "Resolver situação-problema que envolva conhecimentos geométricos espaciais" },
        ]
      },
      {
        id: "mat_geometria_analitica",
        nome: "Geometria Analítica",
        habilidades: [
          { id: "H22",  topico: "Geometria analítica: ponto e reta",           prioridade: "media", descricao: "Utilizar conhecimentos algébricos/geométricos como recurso de argumentação" },
          { id: "H22b", topico: "Geometria analítica: circunferência",         prioridade: "baixa", descricao: "Utilizar conhecimentos algébricos/geométricos como recurso de argumentação" },
        ]
      },
      {
        id: "mat_matrizes",
        nome: "Matrizes e Determinantes",
        habilidades: [
          { id: "H21b", topico: "Matrizes e determinantes",                    prioridade: "baixa", descricao: "Resolver situação-problema cuja modelagem envolva conhecimentos algébricos" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  portugues: {
    nome: "Português",
    icone: "book-open",
    conteudos: [
      {
        id: "port_interpretacao",
        nome: "Interpretação de Texto",
        habilidades: [
          { id: "H15", topico: "Interpretação de texto (inferência e dedução)",     prioridade: "alta",  descricao: "Estabelecer relações entre texto literário e momento de produção" },
          { id: "H18", topico: "Coesão e coerência textual",                        prioridade: "alta",  descricao: "Identificar elementos que concorrem para a progressão temática" },
          { id: "H19", topico: "Gêneros textuais (crônica, conto, artigo, notícia...)", prioridade: "alta", descricao: "Analisar a função da linguagem predominante nos textos" },
          { id: "H18b", topico: "Tipos textuais (narração, descrição, dissertação, injunção)", prioridade: "media", descricao: "Identificar elementos que concorrem para a progressão temática" },
          { id: "H23", topico: "Intertextualidade e interdiscursividade",            prioridade: "alta",  descricao: "Inferir objetivos do produtor e público-alvo pelos procedimentos argumentativos" },
        ]
      },
      {
        id: "port_linguagem",
        nome: "Linguagem e Comunicação",
        habilidades: [
          { id: "H19b", topico: "Funções da linguagem (referencial, poética, emotiva...)", prioridade: "alta", descricao: "Analisar a função da linguagem predominante nos textos" },
          { id: "H15b", topico: "Figuras de linguagem (metáfora, metonímia, ironia...)", prioridade: "alta", descricao: "Relacionar informações sobre concepções artísticas e procedimentos de construção" },
          { id: "H25", topico: "Variedades linguísticas e norma culta",               prioridade: "alta",  descricao: "Identificar marcas linguísticas que singularizam variedades linguísticas sociais" },
          { id: "H26", topico: "Variação linguística",                                prioridade: "alta",  descricao: "Relacionar as variedades linguísticas a situações específicas de uso social" },
        ]
      },
      {
        id: "port_gramatica",
        nome: "Gramática",
        habilidades: [
          { id: "H27",  topico: "Ortografia e acentuação gráfica",                   prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27b", topico: "Morfologia: classes de palavras",                   prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27c", topico: "Verbos: conjugação, modo e tempo verbal",           prioridade: "alta",  descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27d", topico: "Análise sintática: sujeito e predicado",            prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27e", topico: "Concordância verbal",                               prioridade: "alta",  descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27f", topico: "Concordância nominal",                              prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27g", topico: "Regência verbal e nominal",                         prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27h", topico: "Crase",                                             prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27i", topico: "Período composto: coordenação e subordinação",      prioridade: "alta",  descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
          { id: "H27j", topico: "Pontuação",                                         prioridade: "media", descricao: "Reconhecer os usos da norma padrão da língua portuguesa" },
        ]
      },
      {
        id: "port_literatura",
        nome: "Literatura",
        habilidades: [
          { id: "H16",  topico: "Literatura: quinhentismo e barroco",                prioridade: "media", descricao: "Relacionar informações sobre concepções artísticas e procedimentos de construção do texto literário" },
          { id: "H16b", topico: "Literatura: arcadismo e romantismo",                prioridade: "media", descricao: "Relacionar informações sobre concepções artísticas e procedimentos de construção do texto literário" },
          { id: "H16c", topico: "Literatura: realismo, naturalismo e parnasianismo", prioridade: "alta",  descricao: "Relacionar informações sobre concepções artísticas — autores como Machado de Assis" },
          { id: "H16d", topico: "Literatura: simbolismo e pré-modernismo",           prioridade: "media", descricao: "Relacionar informações sobre concepções artísticas e procedimentos de construção do texto literário" },
          { id: "H16e", topico: "Literatura: modernismo (fases) — Graciliano, Clarice, Guimarães Rosa", prioridade: "alta", descricao: "Relacionar informações sobre concepções artísticas — foco ENEM 2026" },
          { id: "H17",  topico: "Figuras de linguagem e intertextualidade literária", prioridade: "alta", descricao: "Reconhecer a presença de valores sociais e humanos no patrimônio literário nacional" },
          { id: "H15c", topico: "Gêneros literários (épico, lírico, dramático)",     prioridade: "media", descricao: "Estabelecer relações entre o texto literário e o momento de sua produção" },
        ]
      },
      {
        id: "port_redacao",
        nome: "Redação",
        habilidades: [
          { id: "C1", topico: "Competência 1: domínio da norma culta",               prioridade: "alta",  descricao: "Demonstrar domínio da modalidade escrita formal da língua portuguesa" },
          { id: "C2", topico: "Competência 2: compreensão da proposta",              prioridade: "alta",  descricao: "Compreender a proposta de redação e aplicar conceitos das várias áreas" },
          { id: "C3", topico: "Competência 3: seleção e organização de argumentos",  prioridade: "alta",  descricao: "Selecionar, relacionar, organizar e interpretar informações para argumentar" },
          { id: "C4", topico: "Competência 4: coesão referencial e sequencial",      prioridade: "alta",  descricao: "Demonstrar conhecimento dos mecanismos linguísticos necessários para coesão textual" },
          { id: "C5", topico: "Competência 5: proposta de intervenção (5 elementos)", prioridade: "alta", descricao: "Elaborar proposta de intervenção para o problema abordado" },
          { id: "C6", topico: "Repertório sociocultural (dados, citações, exemplos)", prioridade: "alta", descricao: "Selecionar, organizar e interpretar informações — projeto de texto" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  historia: {
    nome: "História",
    icone: "landmark",
    conteudos: [
      {
        id: "hist_antiguidade",
        nome: "Antiguidade",
        habilidades: [
          { id: "H1",  topico: "Pré-história e primeiras civilizações (Mesopotâmia, Egito)", prioridade: "alta",  descricao: "Interpretar historicamente fontes documentais acerca de aspectos da cultura — foco ENEM 2026" },
          { id: "H2",  topico: "Grécia Antiga: democracia, filosofia e cultura",       prioridade: "alta",  descricao: "Analisar a produção da memória pelas sociedades humanas" },
          { id: "H2b", topico: "Roma Antiga: república, império e legado",             prioridade: "alta",  descricao: "Analisar a produção da memória pelas sociedades humanas" },
        ]
      },
      {
        id: "hist_medieval",
        nome: "Idade Média",
        habilidades: [
          { id: "H3",  topico: "Idade Média: feudalismo e Igreja Católica",            prioridade: "alta",  descricao: "Associar manifestações culturais do presente aos processos históricos" },
          { id: "H3b", topico: "Cruzadas e expansão islâmica",                         prioridade: "media", descricao: "Associar manifestações culturais do presente aos processos históricos" },
        ]
      },
      {
        id: "hist_moderna",
        nome: "Idade Moderna",
        habilidades: [
          { id: "H5",  topico: "Renascimento cultural e científico",                   prioridade: "media", descricao: "Identificar manifestações do patrimônio cultural em diferentes sociedades" },
          { id: "H5b", topico: "Reformas religiosas (Protestante e Contrarreforma)",   prioridade: "media", descricao: "Identificar manifestações do patrimônio cultural em diferentes sociedades" },
          { id: "H7",  topico: "Grandes navegações e expansão marítima europeia",      prioridade: "alta",  descricao: "Identificar significados histórico-geográficos das relações de poder entre nações" },
          { id: "H7b", topico: "Colonização da América",                               prioridade: "alta",  descricao: "Identificar significados histórico-geográficos das relações de poder entre nações" },
          { id: "H13", topico: "Iluminismo e Revolução Científica",                    prioridade: "alta",  descricao: "Analisar a atuação dos movimentos sociais que contribuíram para mudanças no poder" },
          { id: "H13b", topico: "Revolução Americana",                                 prioridade: "media", descricao: "Analisar a atuação dos movimentos sociais — democracia e cidadania" },
          { id: "H13c", topico: "Revolução Francesa",                                  prioridade: "alta",  descricao: "Analisar a atuação dos movimentos sociais que contribuíram para mudanças no poder" },
          { id: "H16", topico: "Revolução Industrial",                                 prioridade: "alta",  descricao: "Identificar o impacto das novas tecnologias no processo de produção" },
        ]
      },
      {
        id: "hist_brasil_colonial",
        nome: "Brasil Colônia",
        habilidades: [
          { id: "H7c", topico: "Brasil Colônia: economia e sociedade",                 prioridade: "alta",  descricao: "Identificar significados histórico-geográficos na formação do Brasil" },
          { id: "H1b", topico: "Escravidão no Brasil e na América",                    prioridade: "alta",  descricao: "Interpretar historicamente fontes documentais — luta dos negros no Brasil" },
        ]
      },
      {
        id: "hist_brasil_imperial",
        nome: "Brasil Imperial e República Velha",
        habilidades: [
          { id: "H10", topico: "Independência do Brasil",                              prioridade: "alta",  descricao: "Reconhecer a dinâmica dos movimentos sociais na transformação histórica" },
          { id: "H10b", topico: "Brasil Imperial: Primeiro e Segundo Reinado",         prioridade: "media", descricao: "Reconhecer a dinâmica dos movimentos sociais na transformação histórica" },
          { id: "H10c", topico: "Abolição da escravidão e República Velha",            prioridade: "alta",  descricao: "Reconhecer a dinâmica dos movimentos sociais — direitos civis" },
        ]
      },
      {
        id: "hist_seculo20",
        nome: "Século XX",
        habilidades: [
          { id: "H9",  topico: "Primeira Guerra Mundial",                              prioridade: "alta",  descricao: "Comparar organizações políticas e socioeconômicas em escala mundial" },
          { id: "H9b", topico: "Revolução Russa e socialismo",                         prioridade: "alta",  descricao: "Comparar organizações políticas — sistemas em conflito no século XX" },
          { id: "H9c", topico: "Totalitarismos: fascismo, nazismo e stalinismo",       prioridade: "alta",  descricao: "Comparar organizações políticas — sistemas totalitários na Europa" },
          { id: "H13d", topico: "Era Vargas no Brasil",                                prioridade: "alta",  descricao: "Analisar atuação de movimentos sociais — foco ENEM 2026" },
          { id: "H9d", topico: "Segunda Guerra Mundial e Holocausto",                  prioridade: "alta",  descricao: "Comparar organizações políticas e socioeconômicas em escala mundial" },
          { id: "H9e", topico: "Guerra Fria e bipolaridade",                           prioridade: "alta",  descricao: "Geopolítica e conflitos — foco ENEM 2026" },
          { id: "H8",  topico: "Descolonização da África e Ásia",                      prioridade: "media", descricao: "Analisar a ação dos estados nacionais no enfrentamento de problemas econômico-sociais" },
        ]
      },
      {
        id: "hist_brasil_republicano",
        nome: "Brasil Republicano Contemporâneo",
        habilidades: [
          { id: "H13e", topico: "Brasil: República Democrática (1945–1964)",           prioridade: "alta",  descricao: "Analisar atuação dos movimentos sociais — foco ENEM 2026" },
          { id: "H13f", topico: "Ditadura Militar no Brasil (1964–1985)",              prioridade: "alta",  descricao: "Analisar atuação dos movimentos sociais — regime militar foco ENEM 2026" },
          { id: "H13g", topico: "Redemocratização e Constituição de 1988",             prioridade: "alta",  descricao: "Luta pela conquista de direitos — direitos civis, humanos e sociais" },
          { id: "H9f", topico: "Globalização e mundo contemporâneo",                   prioridade: "alta",  descricao: "Geopolítica — reorganização política internacional séculos XX e XXI" },
          { id: "H13h", topico: "Brasil República: anos 1990 até hoje",                prioridade: "alta",  descricao: "Governos republicanos contemporâneos — foco ENEM 2026" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  geografia: {
    nome: "Geografia",
    icone: "globe",
    conteudos: [
      {
        id: "geo_cartografia",
        nome: "Cartografia",
        habilidades: [
          { id: "H6",  topico: "Cartografia: escalas, coordenadas e projeções",        prioridade: "alta",  descricao: "Interpretar diferentes representações gráficas e cartográficas dos espaços geográficos" },
          { id: "H6b", topico: "Fusos horários",                                       prioridade: "media", descricao: "Interpretar diferentes representações gráficas e cartográficas" },
        ]
      },
      {
        id: "geo_fisica",
        nome: "Geografia Física",
        habilidades: [
          { id: "H26",  topico: "Relevo: tipos, formação e estrutura geológica",       prioridade: "alta",  descricao: "Identificar o processo de ocupação dos meios físicos — foco ENEM 2026" },
          { id: "H26b", topico: "Hidrografia: bacias hidrográficas do Brasil e do mundo", prioridade: "alta", descricao: "Identificar o processo de ocupação dos meios físicos — foco ENEM 2026" },
          { id: "H26c", topico: "Clima: tipos climáticos, fatores e climatologia",     prioridade: "alta",  descricao: "Identificar o processo de ocupação dos meios físicos — foco ENEM 2026" },
          { id: "H27",  topico: "Biomas brasileiros (Amazônia, Cerrado, Caatinga...)", prioridade: "alta",  descricao: "Analisar criticamente as interações da sociedade com o meio físico" },
          { id: "H27b", topico: "Biomas mundiais (Floresta tropical, tundra, taiga...)", prioridade: "media", descricao: "Analisar criticamente as interações da sociedade com o meio físico" },
        ]
      },
      {
        id: "geo_ambiental",
        nome: "Meio Ambiente e Sustentabilidade",
        habilidades: [
          { id: "H28",  topico: "Questões ambientais globais (aquecimento, desmatamento)", prioridade: "alta", descricao: "Relacionar o uso das tecnologias com impactos sócio-ambientais — foco ENEM 2026" },
          { id: "H28b", topico: "Desenvolvimento sustentável",                          prioridade: "alta",  descricao: "Relacionar o uso das tecnologias com impactos sócio-ambientais" },
          { id: "H29",  topico: "Recursos naturais: mineração, água e energia",        prioridade: "alta",  descricao: "Reconhecer a função dos recursos naturais na produção do espaço geográfico" },
          { id: "H30",  topico: "Desastres naturais e riscos ambientais",              prioridade: "media", descricao: "Avaliar relações entre preservação e degradação da vida no planeta" },
          { id: "H27c", topico: "Domínios morfoclimáticos do Brasil",                  prioridade: "alta",  descricao: "Analisar criticamente as interações da sociedade com o meio físico" },
        ]
      },
      {
        id: "geo_humana",
        nome: "Geografia Humana e Urbana",
        habilidades: [
          { id: "H8",  topico: "Urbanização brasileira e mundial",                     prioridade: "alta",  descricao: "Analisar a ação dos estados nacionais frente a problemas de ordem econômico-social" },
          { id: "H8b", topico: "Problemas urbanos: violência, saneamento, mobilidade", prioridade: "alta",  descricao: "Analisar a ação dos estados nacionais frente a problemas de ordem econômico-social" },
          { id: "H8c", topico: "Migrações e fluxos populacionais",                    prioridade: "alta",  descricao: "Analisar a ação dos estados nacionais no que se refere à dinâmica dos fluxos populacionais" },
          { id: "H8d", topico: "População: crescimento e transição demográfica",       prioridade: "media", descricao: "Analisar a ação dos estados nacionais no que se refere à dinâmica dos fluxos populacionais" },
          { id: "H10", topico: "IDH e indicadores de desenvolvimento",                 prioridade: "media", descricao: "Reconhecer a dinâmica da organização dos movimentos sociais" },
        ]
      },
      {
        id: "geo_economica",
        nome: "Geografia Econômica",
        habilidades: [
          { id: "H17", topico: "Industrialização no Brasil e no mundo",                prioridade: "media", descricao: "Analisar fatores que explicam o impacto das novas tecnologias no processo de territorialização da produção" },
          { id: "H18", topico: "Agropecuária e questão agrária no Brasil",             prioridade: "alta",  descricao: "Analisar diferentes processos de produção ou circulação de riquezas" },
          { id: "H18b", topico: "Matriz energética brasileira e mundial",              prioridade: "alta",  descricao: "Analisar diferentes processos de produção — recursos energéticos" },
        ]
      },
      {
        id: "geo_geopolitica",
        nome: "Geopolítica",
        habilidades: [
          { id: "H7",  topico: "Geopolítica mundial e blocos econômicos",              prioridade: "alta",  descricao: "Identificar significados histórico-geográficos das relações de poder entre nações" },
          { id: "H7b", topico: "Globalização e fluxos econômicos",                    prioridade: "alta",  descricao: "Identificar significados histórico-geográficos das relações de poder entre nações" },
          { id: "H7c", topico: "China e BRICS",                                        prioridade: "alta",  descricao: "Identificar significados histórico-geográficos — cenário mundial foco ENEM 2026" },
          { id: "H7d", topico: "Oriente Médio: conflitos e geopolítica",               prioridade: "media", descricao: "Identificar significados histórico-geográficos das relações de poder" },
          { id: "H7e", topico: "África: subdesenvolvimento e colonialismo",            prioridade: "media", descricao: "Identificar significados histórico-geográficos — descolonização" },
          { id: "H9",  topico: "Formação territorial brasileira e regiões",            prioridade: "alta",  descricao: "Comparar organizações políticas e socioeconômicas em escala local, regional ou mundial" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  ciencias: {
    nome: "Ciências da Natureza",
    icone: "flask-conical",
    conteudos: [
      {
        id: "bio_celula",
        nome: "Biologia — Citologia e Bioquímica",
        habilidades: [
          { id: "H13", topico: "Biologia celular: célula procariótica e eucariótica",  prioridade: "alta",  descricao: "Reconhecer mecanismos de transmissão da vida — foco ENEM 2026" },
          { id: "H13b", topico: "Aspectos bioquímicos das estruturas celulares",       prioridade: "alta",  descricao: "Reconhecer mecanismos de transmissão da vida — bioquímica foco ENEM 2026" },
          { id: "H13c", topico: "Divisão celular: mitose e meiose",                    prioridade: "alta",  descricao: "Reconhecer mecanismos de transmissão da vida" },
          { id: "H15", topico: "Metabolismo energético: fotossíntese e respiração",    prioridade: "alta",  descricao: "Interpretar modelos e experimentos para explicar fenômenos biológicos" },
        ]
      },
      {
        id: "bio_genetica",
        nome: "Biologia — Genética",
        habilidades: [
          { id: "H13d", topico: "Genética: leis de Mendel",                            prioridade: "alta",  descricao: "Reconhecer mecanismos de transmissão da vida — hereditariedade foco ENEM 2026" },
          { id: "H13e", topico: "Genética: herança ligada ao sexo e não mendeliana",   prioridade: "alta",  descricao: "Reconhecer mecanismos de transmissão da vida" },
          { id: "H11", topico: "Biotecnologia: DNA recombinante e transgênicos",       prioridade: "media", descricao: "Reconhecer benefícios, limitações e aspectos éticos da biotecnologia" },
        ]
      },
      {
        id: "bio_evolucao",
        nome: "Biologia — Evolução",
        habilidades: [
          { id: "H16", topico: "Evolução: teorias darwinistas e neodarwinismo",        prioridade: "alta",  descricao: "Compreender o papel da evolução na produção de padrões biológicos — foco ENEM 2026" },
          { id: "H16b", topico: "Sistemática e classificação dos seres vivos",         prioridade: "media", descricao: "Compreender o papel da evolução na organização taxonômica dos seres vivos" },
          { id: "H16c", topico: "Reinos: monera, protista, fungi, plantae, animalia",  prioridade: "media", descricao: "Compreender o papel da evolução na organização taxonômica — reinos" },
          { id: "H3b", topico: "Vírus e doenças virais",                               prioridade: "alta",  descricao: "Associar solução de problemas de saúde com o desenvolvimento científico" },
          { id: "H3c", topico: "Bactérias e doenças bacterianas",                      prioridade: "alta",  descricao: "Associar solução de problemas de saúde com o desenvolvimento científico" },
        ]
      },
      {
        id: "bio_fisiologia",
        nome: "Biologia — Fisiologia Humana",
        habilidades: [
          { id: "H14",  topico: "Sistema digestório e nutrição",                       prioridade: "alta",  descricao: "Identificar padrões em fenômenos e processos vitais dos organismos — foco ENEM 2026" },
          { id: "H14b", topico: "Sistema circulatório e respiratório",                 prioridade: "alta",  descricao: "Identificar padrões em fenômenos e processos vitais dos organismos" },
          { id: "H14c", topico: "Sistema nervoso e endócrino",                         prioridade: "alta",  descricao: "Identificar padrões em fenômenos e processos vitais dos organismos" },
          { id: "H14d", topico: "Sistema reprodutor e embriologia",                    prioridade: "media", descricao: "Identificar padrões em fenômenos e processos vitais dos organismos" },
        ]
      },
      {
        id: "bio_ecologia",
        nome: "Biologia — Ecologia",
        habilidades: [
          { id: "H9",  topico: "Ecologia: cadeias e teias alimentares",                prioridade: "alta",  descricao: "Compreender a importância dos ciclos biogeoquímicos — ecologia base foco ENEM 2026" },
          { id: "H9b", topico: "Ciclos biogeoquímicos",                                prioridade: "alta",  descricao: "Compreender a importância dos ciclos biogeoquímicos ou do fluxo de energia" },
          { id: "H9c", topico: "Ecossistemas e relações ecológicas",                   prioridade: "alta",  descricao: "Compreender a importância dos ciclos para a vida" },
          { id: "H4",  topico: "Impactos ambientais e ecologia aplicada",              prioridade: "alta",  descricao: "Avaliar propostas de intervenção no ambiente considerando qualidade de vida" },
        ]
      },
      {
        id: "quim_basica",
        nome: "Química — Estrutura da Matéria",
        habilidades: [
          { id: "H24",  topico: "Química: estrutura atômica e tabela periódica",       prioridade: "media", descricao: "Utilizar códigos e nomenclatura da química para caracterizar materiais" },
          { id: "H24b", topico: "Ligações químicas (iônica, covalente, metálica)",     prioridade: "alta",  descricao: "Utilizar códigos e nomenclatura da química — foco ENEM 2026" },
          { id: "H24c", topico: "Funções inorgânicas: ácidos, bases, sais e óxidos",  prioridade: "alta",  descricao: "Utilizar códigos e nomenclatura da química para caracterizar materiais" },
          { id: "H25",  topico: "Separação de misturas",                               prioridade: "alta",  descricao: "Caracterizar materiais ou substâncias — foco ENEM 2026" },
          { id: "H25b", topico: "Soluções e concentração",                             prioridade: "media", descricao: "Caracterizar materiais ou substâncias, identificando etapas" },
        ]
      },
      {
        id: "quim_transformacoes",
        nome: "Química — Transformações",
        habilidades: [
          { id: "H21",  topico: "Reações químicas e balanceamento",                    prioridade: "alta",  descricao: "Utilizar leis físicas e químicas para interpretar processos naturais ou tecnológicos" },
          { id: "H21b", topico: "Estequiometria",                                      prioridade: "alta",  descricao: "Utilizar leis químicas — foco ENEM 2026" },
          { id: "H21c", topico: "Termoquímica: entalpia e Hess",                       prioridade: "media", descricao: "Utilizar leis físicas e químicas para interpretar processos" },
          { id: "H21d", topico: "Cinética química e equilíbrio",                       prioridade: "media", descricao: "Utilizar leis químicas para interpretar processos naturais ou tecnológicos" },
          { id: "H21e", topico: "Eletroquímica: pilhas e eletrólise",                  prioridade: "alta",  descricao: "Utilizar leis físicas e químicas — eletroquímica foco ENEM 2026" },
        ]
      },
      {
        id: "quim_organica",
        nome: "Química — Orgânica",
        habilidades: [
          { id: "H25c", topico: "Química orgânica: hidrocarbonetos e funções",         prioridade: "alta",  descricao: "Caracterizar materiais ou substâncias — reações orgânicas foco ENEM 2026" },
          { id: "H26",  topico: "Reações orgânicas de oxidação",                       prioridade: "alta",  descricao: "Avaliar implicações sociais e ambientais na produção de recursos energéticos" },
          { id: "H26b", topico: "Biocombustíveis e petróleo",                          prioridade: "alta",  descricao: "Avaliar implicações sociais e ambientais na produção de recursos energéticos" },
        ]
      },
      {
        id: "fis_mecanica",
        nome: "Física — Mecânica",
        habilidades: [
          { id: "H20",  topico: "Física: cinemática (MU e MUV)",                       prioridade: "alta",  descricao: "Caracterizar causas ou efeitos dos movimentos — foco ENEM 2026" },
          { id: "H20b", topico: "Dinâmica: leis de Newton",                            prioridade: "alta",  descricao: "Caracterizar causas ou efeitos dos movimentos — foco ENEM 2026" },
          { id: "H20c", topico: "Trabalho, energia e potência",                        prioridade: "alta",  descricao: "Avaliar possibilidades de geração e transformação de energia" },
          { id: "H20d", topico: "Quantidade de movimento e impulso",                   prioridade: "media", descricao: "Caracterizar causas ou efeitos dos movimentos" },
          { id: "H20e", topico: "Gravitação universal e Leis de Kepler",               prioridade: "media", descricao: "Caracterizar causas ou efeitos dos movimentos de corpos celestes" },
        ]
      },
      {
        id: "fis_ondas",
        nome: "Física — Ondulatória e Óptica",
        habilidades: [
          { id: "H1",  topico: "Ondulatória: fenômenos, período e frequência",         prioridade: "alta",  descricao: "Reconhecer características de fenômenos ondulatórios — foco ENEM 2026" },
          { id: "H1b", topico: "Som e acústica",                                       prioridade: "alta",  descricao: "Reconhecer características de fenômenos ondulatórios — foco ENEM 2026" },
          { id: "H22", topico: "Óptica: reflexão, refração e lentes",                  prioridade: "alta",  descricao: "Compreender fenômenos decorrentes da interação entre radiação e matéria" },
          { id: "H22b", topico: "Luz: espectro eletromagnético e radiação",            prioridade: "media", descricao: "Compreender fenômenos decorrentes da interação entre radiação e matéria" },
        ]
      },
      {
        id: "fis_termologia",
        nome: "Física — Termologia",
        habilidades: [
          { id: "H21f", topico: "Termologia: calor, temperatura e calorimetria",       prioridade: "alta",  descricao: "Utilizar leis físicas para interpretar processos — foco ENEM 2026" },
          { id: "H21g", topico: "Termodinâmica: leis e máquinas térmicas",             prioridade: "alta",  descricao: "Utilizar leis físicas para interpretar processos termodinâmicos" },
          { id: "H21h", topico: "Dilatação térmica e mudanças de estado",              prioridade: "media", descricao: "Utilizar leis físicas para interpretar processos" },
        ]
      },
      {
        id: "fis_eletricidade",
        nome: "Física — Eletricidade e Magnetismo",
        habilidades: [
          { id: "H5",  topico: "Eletrostática: carga elétrica e Lei de Coulomb",       prioridade: "alta",  descricao: "Dimensionar circuitos ou dispositivos elétricos de uso cotidiano — foco ENEM 2026" },
          { id: "H5b", topico: "Eletrodinâmica: corrente, tensão e resistência",       prioridade: "alta",  descricao: "Dimensionar circuitos ou dispositivos elétricos de uso cotidiano" },
          { id: "H5c", topico: "Circuitos elétricos: potência e consumo",              prioridade: "alta",  descricao: "Dimensionar circuitos ou dispositivos elétricos de uso cotidiano" },
          { id: "H21i", topico: "Magnetismo e eletromagnetismo",                       prioridade: "alta",  descricao: "Utilizar leis físicas para interpretar processos — magnetismo foco ENEM 2026" },
          { id: "H22c", topico: "Física moderna: relatividade e radioatividade",       prioridade: "media", descricao: "Compreender fenômenos decorrentes da interação entre radiação e matéria" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  filosofia: {
    nome: "Filosofia e Sociologia",
    icone: "brain",
    conteudos: [
      {
        id: "fil_antiga",
        nome: "Filosofia Antiga",
        habilidades: [
          { id: "H14", topico: "Filosofia grega: Sócrates, Platão e Aristóteles",      prioridade: "alta",  descricao: "Comparar pontos de vista sobre determinado aspecto da cultura — foco ENEM 2026" },
          { id: "H14b", topico: "Filosofia medieval: Santo Agostinho e Tomás de Aquino", prioridade: "alta", descricao: "Comparar pontos de vista — filosofia medieval foco ENEM 2026" },
        ]
      },
      {
        id: "fil_moderna",
        nome: "Filosofia Moderna",
        habilidades: [
          { id: "H14c", topico: "Filosofia moderna: Descartes, Locke, Hume (racionalismo/empirismo)", prioridade: "alta", descricao: "Filosofia do conhecimento — foco ENEM 2026" },
          { id: "H14d", topico: "Kant e a filosofia crítica",                          prioridade: "alta",  descricao: "Comparar pontos de vista — Kant foco ENEM 2026" },
          { id: "H14e", topico: "Iluminismo: Voltaire, Rousseau, Montesquieu",         prioridade: "alta",  descricao: "Comparar pontos de vista expressos em diferentes fontes" },
          { id: "H14f", topico: "Filosofia política: Maquiavel, Hobbes, Locke",        prioridade: "alta",  descricao: "Cidadania e democracia — filosofia política foco ENEM 2026" },
        ]
      },
      {
        id: "fil_contemporanea",
        nome: "Filosofia Contemporânea",
        habilidades: [
          { id: "H14g", topico: "Filosofia contemporânea: Marx, Nietzsche, Sartre",    prioridade: "alta",  descricao: "Filosofia contemporânea — foco crescente ENEM 2026" },
          { id: "H23",  topico: "Ética e moral: teorias éticas",                       prioridade: "alta",  descricao: "Analisar a importância dos valores éticos na estruturação política" },
          { id: "H14h", topico: "Epistemologia: teoria do conhecimento",               prioridade: "alta",  descricao: "Filosofia do conhecimento — foco ENEM 2026" },
          { id: "H14i", topico: "Lógica formal: premissas e silogismos",               prioridade: "media", descricao: "Comparar pontos de vista — lógica e argumentação" },
        ]
      },
      {
        id: "soc_classicos",
        nome: "Sociologia — Clássicos",
        habilidades: [
          { id: "H11",  topico: "Karl Marx: materialismo histórico e classes sociais", prioridade: "alta",  descricao: "Identificar registros de práticas de grupos sociais no tempo e no espaço" },
          { id: "H11b", topico: "Max Weber: ação social e burocracia",                 prioridade: "alta",  descricao: "Identificar registros de práticas de grupos sociais no tempo e no espaço" },
          { id: "H11c", topico: "Émile Durkheim: fato social e solidariedade",         prioridade: "alta",  descricao: "Identificar registros de práticas de grupos sociais no tempo e no espaço" },
        ]
      },
      {
        id: "soc_tematica",
        nome: "Sociologia — Temática",
        habilidades: [
          { id: "H25",  topico: "Movimentos sociais: racismo e questão da mulher",     prioridade: "alta",  descricao: "Identificar estratégias que promovam formas de inclusão social — foco ENEM 2026" },
          { id: "H22",  topico: "Cidadania, democracia e direitos humanos",            prioridade: "alta",  descricao: "Analisar lutas sociais e conquistas no que se refere a mudanças nas políticas públicas" },
          { id: "H25b", topico: "Política no Brasil: partidos, eleições e Estado",     prioridade: "alta",  descricao: "Cidadania e democracia — relações políticas foco ENEM 2026" },
          { id: "H21",  topico: "Mídia, indústria cultural e sociedade de consumo",    prioridade: "alta",  descricao: "Identificar o papel dos meios de comunicação na construção da vida social" },
          { id: "H16",  topico: "Trabalho e transformações no mundo contemporâneo",    prioridade: "media", descricao: "Identificar registros sobre o papel das técnicas e tecnologias na vida social" },
          { id: "H15",  topico: "Desigualdade social, diversidade cultural e identidade", prioridade: "alta", descricao: "Avaliar criticamente conflitos culturais, sociais e políticos" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  ingles: {
    nome: "Inglês",
    icone: "languages",
    conteudos: [
      {
        id: "ing_interpretacao",
        nome: "Interpretação e Vocabulário",
        habilidades: [
          { id: "H5", topico: "Interpretação de texto em inglês",                      prioridade: "alta",  descricao: "Associar vocábulos e expressões de um texto em LEM ao seu tema" },
          { id: "H5b", topico: "Vocabulário contextual e inferência",                  prioridade: "alta",  descricao: "Associar vocábulos e expressões de um texto em LEM ao seu tema" },
          { id: "H7", topico: "Gêneros textuais em inglês (ads, articles, letters)",   prioridade: "alta",  descricao: "Relacionar texto em LEM, estruturas linguísticas, função e uso social" },
        ]
      },
      {
        id: "ing_gramatica",
        nome: "Gramática",
        habilidades: [
          { id: "H6",  topico: "Tempos verbais (present, past, future)",               prioridade: "media", descricao: "Utilizar conhecimentos da LEM como meio de ampliar acesso a informações" },
          { id: "H6b", topico: "Modal verbs (can, could, should, must...)",            prioridade: "media", descricao: "Utilizar conhecimentos da LEM como meio de ampliar acesso a informações" },
          { id: "H6c", topico: "Voz passiva e discurso indireto",                      prioridade: "media", descricao: "Utilizar conhecimentos da LEM como meio de ampliar acesso a informações" },
          { id: "H6d", topico: "Phrasal verbs e conectivos em inglês",                 prioridade: "baixa", descricao: "Utilizar conhecimentos da LEM como meio de ampliar acesso a informações" },
        ]
      },
    ]
  },

  // ════════════════════════════════════════════════════
  redacao: {
    nome: "Redação",
    icone: "pen-line",
    conteudos: [
      {
        id: "red_estrutura",
        nome: "Estrutura Dissertativa",
        habilidades: [
          { id: "C1", topico: "Introdução: apresentação do tema e tese",               prioridade: "alta",  descricao: "Demonstrar domínio da estrutura dissertativo-argumentativa" },
          { id: "C2", topico: "Desenvolvimento: argumentação e repertório",            prioridade: "alta",  descricao: "Compreender a proposta de redação — seleção de argumentos" },
          { id: "C3", topico: "Conclusão: proposta de intervenção",                    prioridade: "alta",  descricao: "Elaborar proposta de intervenção para o problema abordado" },
          { id: "C4", topico: "Proposta de intervenção: os 5 elementos",               prioridade: "alta",  descricao: "Elaborar proposta de intervenção — agente, ação, modo, efeito, finalidade" },
        ]
      },
      {
        id: "red_competencias",
        nome: "As 5 Competências",
        habilidades: [
          { id: "C1b", topico: "Competência 1: norma culta e ortografia",              prioridade: "alta",  descricao: "Demonstrar domínio da modalidade escrita formal da língua portuguesa" },
          { id: "C2b", topico: "Competência 2: projeto de texto e tema",               prioridade: "alta",  descricao: "Compreender a proposta de redação e não fugir ao tema" },
          { id: "C3b", topico: "Competência 3: progressão temática e argumentação",    prioridade: "alta",  descricao: "Selecionar, relacionar, organizar e interpretar informações" },
          { id: "C4b", topico: "Competência 4: coesão referencial e sequencial",       prioridade: "alta",  descricao: "Demonstrar conhecimento dos mecanismos de coesão textual" },
          { id: "C5b", topico: "Competência 5: proposta de intervenção respeitosa",    prioridade: "alta",  descricao: "Elaborar proposta de intervenção respeitando os direitos humanos" },
        ]
      },
      {
        id: "red_repertorio",
        nome: "Repertório e Prática",
        habilidades: [
          { id: "R1", topico: "Repertório sociocultural (dados, citações, exemplos)",  prioridade: "alta",  descricao: "Selecionar e organizar informações — construção de argumentação" },
          { id: "R2", topico: "Análise de temas recorrentes no ENEM",                  prioridade: "alta",  descricao: "Compreender a proposta de redação e aplicar conceitos das várias áreas" },
          { id: "R3", topico: "Prática: escrita de redações completas",                prioridade: "alta",  descricao: "Elaborar proposta de intervenção solidária — só a prática consolida" },
        ]
      },
    ]
  },
}
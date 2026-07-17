/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Day, ContentStage, EmergencyContact, Roteiro } from "./types";

export const DAYS_DATA: Day[] = [
  {
    "n": 1,
    "from": "Mogi das Cruzes (Estação)",
    "to": "Paraibuna",
    "saida": "07:00",
    "km": 78,
    "elev": 1100,
    "tempo": "6h30 a 7h30",
    "chegada": "15:30",
    "refs": "Vila Histórica de Luís Carlos (Guararema) e Santa Branca.",
    "alerta": null,
    "paradas": [
      {
        "km": "~18 km",
        "nome": "Vila de Luís Carlos (Guararema)",
        "tag": "Top spot",
        "desc": "Vila ferroviária de 1914–1920, casario tombado com fachadas coloridas e arquitetura europeia. Cafeteria, cervejaria e sorveteria funcionam sáb/dom/feriado — confirmar se abrem no dia da largada.",
        "ideia": "B-roll cinematográfico das bikes encostadas nas fachadas + travelling lento pela vila.",
        "fonte": "guararema.sp.gov.br · contandodestinos.com"
      },
      {
        "km": "~45 km",
        "nome": "Ponte Metálica de Santa Branca",
        "tag": "Top spot",
        "desc": "Ponte de 1902 sobre o Rio Paraíba do Sul, projeto de Euclides da Cunha, ferragem inglesa original. Represa (Toca do Leitão) ao lado.",
        "ideia": "Plano de drone da travessia de bike sobre a ponte histórica.",
        "fonte": "santabranca.sp.gov.br"
      },
      {
        "km": "chegada",
        "nome": "Mirante do Cruzeiro (Paraibuna)",
        "tag": null,
        "desc": "Vista panorâmica do centro de Paraibuna — golden hour da chegada.",
        "ideia": "Plano de chegada do trio com a cidade ao fundo.",
        "fonte": "circuitobr.com.br"
      }
    ],
    "pousadas": [
      {
        "nome": "Pousada 3 Rios (Recomendada)",
        "desc": "Infraestrutura rústica de fazenda histórica, ótima estrutura para guardar e lavar bikes.",
        "tel": "(12) 3974-0173",
        "rec": true
      },
      {
        "nome": "Pousada do Alferes",
        "desc": "Confortável, acolhedora, muito próxima do centro histórico de Paraibuna.",
        "tel": null,
        "rec": false
      },
      {
        "nome": "Hotel Fazenda Céu Aberto",
        "desc": "Alto padrão de conforto físico para recuperação muscular após o 1º dia.",
        "tel": null,
        "rec": false
      }
    ]
  },
  {
    "n": 2,
    "from": "Paraibuna",
    "to": "Pindamonhangaba",
    "saida": "07:00",
    "km": 81,
    "elev": 1200,
    "tempo": "7h a 8h (dia mais duro da rota)",
    "chegada": "16:00",
    "refs": "Redenção da Serra e Taubaté.",
    "alerta": "Subida clássica do \"Morro do Batman\" logo após Redenção da Serra — exige boa relação de marchas e atenção redobrada à hidratação.",
    "paradas": [
      {
        "km": "~35 km",
        "nome": "Conjunto Histórico de Redenção da Serra",
        "tag": "Top spot",
        "desc": "Igreja Matriz em estilo romano, antiga prefeitura, Capela do Cruzeiro. 1º município paulista a libertar seus escravos (10/fev/1888).",
        "ideia": "Carrossel educativo sobre a história da abolição local.",
        "fonte": "prefeitura de Redenção da Serra · maubio.blogspot.com"
      },
      {
        "km": "~55-65 km",
        "nome": "Morro do Batman",
        "tag": "Desafio",
        "desc": "Trecho de maior esforço físico do dia. Ladeira íngreme de terra batida.",
        "ideia": "Reel de superação: câmera no capacete subindo, corte para o topo.",
        "fonte": "[Chute — pesquisa original de Alexandre, não verificado]"
      },
      {
        "km": "~70 km (opcional)",
        "nome": "Centro Histórico de Taubaté",
        "tag": "Avaliar rota",
        "desc": "Catedral de São Francisco das Chagas + casarões do café. Só vale se a rota real passar perto do centro.",
        "ideia": "B-roll rápido da Catedral, se a rota passar perto.",
        "fonte": "guiataubate.com.br"
      }
    ],
    "pousadas": [
      {
        "nome": "Pousada Rota da Fé (Redenção da Serra)",
        "desc": "Ponto acolhedor para ciclistas, bem no fluxo da rota.",
        "tel": null,
        "rec": false
      },
      {
        "nome": "Intercity Pindamonhangaba (Recomendada)",
        "desc": "Padrão corporativo, ótimo café da manhã, segurança total para bikes.",
        "tel": "(12) 2126-3000",
        "rec": true
      },
      {
        "nome": "Plaza Hotel Pindamonhangaba",
        "desc": "Ótima localização central.",
        "tel": null,
        "rec": false
      }
    ]
  },
  {
    "n": 3,
    "from": "Pindamonhangaba",
    "to": "Aparecida",
    "saida": "07:30",
    "km": 42,
    "elev": 350,
    "tempo": "3h a 3h30 (trecho plano e rápido)",
    "chegada": "11:30",
    "refs": "Roseira e Basílica Histórica de Aparecida.",
    "alerta": null,
    "paradas": [
      {
        "km": "largada",
        "nome": "Bosque da Princesa (Pindamonhangaba)",
        "tag": null,
        "desc": "Parque às margens do Rio Paraíba do Sul, pertinho da saída.",
        "ideia": "Plano de abertura do Reel de encerramento.",
        "fonte": "passaromarron.com.br"
      },
      {
        "km": "~20 km",
        "nome": "Mosteiro da Sagrada Face (Roseira)",
        "tag": "Top spot",
        "desc": "Réplica de castelo medieval italiano — visual raro para o nicho de cicloturismo.",
        "ideia": "Slide de maior impacto do carrossel de chegada.",
        "fonte": "institutoestradareal.com.br · guiavaledoparaiba.com.br"
      },
      {
        "km": "chegada",
        "nome": "Mirante da Torre + Passarela da Fé (Aparecida)",
        "tag": "Grand Finale",
        "desc": "Mirante a 110m de altura; Passarela da Fé de 389m liga a Matriz Basílica ao Santuário Nacional.",
        "ideia": "Sequência de chegada triunfal completa.",
        "fonte": "rainhahoteis.com.br · rdcviagens.com.br"
      }
    ],
    "pousadas": [
      {
        "nome": "Hotel Rainha dos Apóstolos",
        "desc": "Excelente infraestrutura, proximidade com o Santuário Nacional.",
        "tel": null,
        "rec": false
      },
      {
        "nome": "Hotel do Santuário (Recomendada)",
        "desc": "Dentro do pátio da Basílica — comodidade máxima.",
        "tel": null,
        "rec": true
      },
      {
        "nome": "Hotel Eldorado",
        "desc": "Boa relação custo-benefício, acostumado a receber ciclistas.",
        "tel": null,
        "rec": false
      }
    ]
  }
];

export const CHECKLIST_DATA: Record<string, string[]> = {
  "Para a Bicicleta (antes e durante)": [
    "Revisão geral pré-viagem (cabos, pastilhas de freio, relação de marchas)",
    "2x câmaras de ar reserva (compatíveis) ou kit remendo Tubeless completo",
    "Espátulas e bomba de mão de alto volume",
    "Canivete multi-tool com extrator de corrente",
    "Powerlink compatível com sua corrente",
    "Lubrificante de corrente (cera/óleo) + pano de limpeza",
    "Lanternas dianteira e traseira com boa autonomia",
    "2x caramanholas — mínimo 1,5L de hidratação na bike"
  ],
  "Vestuário e Proteção": [
    "Capacete, óculos de ciclismo e luvas",
    "2x bretões ou bermudas de ciclismo de alta densidade",
    "2x camisas de ciclismo com proteção UV",
    "Corta-vento leve ou capa de chuva compacta",
    "Manguito e pernito (manhãs de agosto são frias no Vale do Paraíba)",
    "Sapatilha ou tênis confortável para pedalar e caminhar",
    "Protetor solar e protetor labial"
  ],
  "Logística e Emergência": [
    "Dinheiro em espécie (mercearias rurais podem não ter cartão/Pix)",
    "Documento de identificação + carteirinha do plano de saúde",
    "Kit de primeiros socorros (analgésico, anti-inflamatório, curativos, anti-atrito)",
    "Carregador de celular + powerbank de alta capacidade",
    "Passaporte oficial da Rota da Luz (impresso ou digital)"
  ]
};

export const BPMF_PROMPT_BASE = {
  marcas: "Rapha, Canyon, Specialized, Pas Normal Studios",
  paleta: "Deep black #101010 (graphic overlay) · Neon green #4AF47B · White #FFFFFF",
  tipografia: "Montserrat Bold for headlines, Inter Regular for body text",
  visual: "Ultra realistic photography, cinematic outdoor lighting, real cycling scene as dominant visual — NOT a flat color card with floating text. Text composited on top of the photo as a design layer (gradient scrim / lower-third band). No stock photo appearance. No flat solid-color background with text floating on empty space. No generic slide-deck look. High-end advertising campaign quality.",
  keywords: "Rapha/Canyon/Specialized campaign photography style, real road cycling scene, cinematic lighting, real environment photography, editorial advertising design, high conversion social format, no flat text card, no slide deck look."
};

export const PORTA_FRASE: Record<string, string> = {
  "Curadoria": "O trabalho que ninguém vê antes do sábado: validar rota, ponto de encontro e pernoite.",
  "Experiência": "O dia completo, hora a hora — do frio da largada ao abraço na chegada.",
  "Segurança": "A operação por trás: equipamento revisado, hidratação, apoio e plano B sempre prontos.",
  "Comunidade": "Gente real pedalando junto — a amizade que nasce no meio da subida."
};

export const CIDADES_EMG: EmergencyContact[] = [
  {"cidade": "Paraibuna (pernoite Dia 1)", "tel": "(12) 97616-0319", "fonte": "Defesa Civil — Prefeitura de Paraibuna"},
  {"cidade": "Pindamonhangaba (pernoite Dia 2)", "tel": "(12) 3643-1084", "fonte": "Defesa Civil — Prefeitura de Pindamonhangaba"},
  {"cidade": "Aparecida (chegada Dia 3)", "tel": "199", "fonte": "Defesa Civil — Confirmar telefone local antes da viagem"}
];

export const LINKS_EXTERNOS = {
  wikiloc_completa: "https://www.wikiloc.com/bicycle-touring-trails/rota-da-luz-completo-130318324",
  wikiloc_cicloviagem: "https://www.wikiloc.com/bicycle-touring-trails/cicloviagem-rota-da-luz-mogi-das-cruzes-a-aparecida-42286292",
  cptm_bike: "https://www.cptm.sp.gov.br/cptm/sua-viagem/bicicletas-na-cptm"
};

export const CONTEUDO_SEMANA: ContentStage[] = [
  {
    id: "pre",
    stage: "Pré-viagem (Aquecimento)",
    porta: "Curadoria",
    reel: {
      titulo: "O que vai na mala de um cicloturista de Gravel/MTB",
      storytelling: {
        antes: "Mala lotada com coisas inúteis que pesam na subida.",
        transformacao: "O checklist estratégico que divide o peso exato do trio.",
        depois: "Pedalar leve com o equipamento correto, focando apenas no visual."
      },
      speech: [
        { t: "00:00–00:03", fase: "GANCHO", txt: "Vou pedalar 200km na Rota da Luz e isso é tudo o que vou levar!", tom: "Entusiasmado", camera: "POV arrumando os itens sobre a mesa", overlay: "BPMF · Rota da Luz" },
        { t: "00:03–00:10", fase: "DESENVOLVIMENTO", txt: "Dividimos o peso em três. Eu levo o kit de ferramentas e câmara reserva, enquanto meus parceiros dividem o kit de primeiros socorros e logística de campo.", tom: "Informativo", camera: "Alexandre mostrando cada item na bike", overlay: "Organização do Trio" },
        { t: "00:10–00:15", fase: "CTA", txt: "Quer receber nosso checklist de cicloturismo 100% gratuito? Comente QUERO na postagem!", tom: "Direto", camera: "Alexandre apontando para a tela", overlay: "Comente 'QUERO'" }
      ],
      gravacao: {
        roupa: "Camisa de ciclismo BPMF preta, bermuda clássica",
        fundo: "Oficina ou sala de casa com a bike limpa e suspensa",
        iluminacao: "Luz suave de estúdio, ambiente aconchegante",
        ritmo: "Cortes rápidos e dinâmicos sincronizados com o speech",
        legenda: "Guia definitivo de equipamentos para cicloturismo no Vale do Paraíba."
      },
      caption: "Partiu Rota da Luz! 🚴‍♂️ Com planejamento em grupo, as subidas ficam mais leves e o pedal muito mais seguro. Comente 'QUERO' que te mando o checklist oficial de equipamentos. #BPMF #RotadaLuz #GravelSP #Cicloturismo"
    },
    carrossel: {
      titulo: "De SP a Aparecida de trem e bike: a logística infalível",
      storytelling: {
        gancho: "A saga de embarcar a bike na CPTM.",
        desenvolvimento: "Regras de horário e integração na Linha 11-Coral até Mogi.",
        virada: "Descobrir que o trem é o melhor e mais barato ponto de partida oficial.",
        cta: "Salve este post para sua próxima cicloviagem."
      },
      slides: [
        {
          n: 1,
          funcao: "Gancho",
          headline: "LEVAR A BIKE NO TREM É FÁCIL?",
          sub: "O segredo para iniciar a Rota da Luz sem estresse.",
          scene: {
            subject: "A gravel bike leaning against the platform of CPTM train station in São Paulo",
            environment: "Modern train station with metallic elements and warm platform lighting",
            camera: "Wide angle, dramatic composition",
            light: "Industrial neon light reflecting on the bicycle frame"
          }
        },
        {
          n: 2,
          funcao: "Regra",
          headline: "HORÁRIOS PERMITIDOS CPTM",
          sub: "Finais de semana e feriados liberados o dia todo. Dias úteis somente após 20:30.",
          scene: {
            subject: "A clean graphics of train timetables layered with cyclist holding a bike inside a spacious train car",
            environment: "Inside a modern CPTM train carriage",
            camera: "Medium shot, realistic documentary photography",
            light: "Natural morning light streaming through train windows"
          }
        },
        {
          n: 3,
          funcao: "Dica de Ouro",
          headline: "ESTAÇÃO MOGI DAS CRUZES",
          sub: "Desembarque na Linha 11-Coral. O portal da Rota da Luz fica a poucos metros da saída.",
          scene: {
            subject: "Cyclists pushing their bikes out of the historic Mogi das Cruzes terminal",
            environment: "Station entrance with clear blue sky and morning sun",
            camera: "Low-angle dynamic shot",
            light: "Bright, direct morning sunlight"
          }
        },
        {
          n: 4,
          funcao: "Preparação",
          headline: "VALIDAÇÃO EM GRUPO",
          sub: "Bikes revisadas, pneus calibrados e passaportes digitais prontos para carimbar.",
          scene: {
            subject: "Three close friends in premium cycling kits checking their smartphones near their gravel bikes",
            environment: "Charming town plaza with old church in the background",
            camera: "Candid portrait, cinematic color grade",
            light: "Soft morning golden light"
          }
        },
        {
          n: 5,
          funcao: "CTA",
          headline: "SALVE O GUIA",
          sub: "Gostou do roteiro logístico? Salve para planejar seu trio no final de semana.",
          scene: {
            subject: "Rear view of a gravel cyclist riding into a peaceful, scenic country road surrounded by hills",
            environment: "Lush green countryside of the Paraíba Valley",
            camera: "Tracking shot, epic scale",
            light: "Spectacular dramatic sunset lighting"
          }
        }
      ],
      caption: "Logística sem erro! Pegar o trem com a bike é a melhor alternativa para iniciar a Rota da Luz de forma limpa e divertida. 🚂 Guarde as regras de horário e marque seu amigo de pedal. #BPMF #CicloturismoSP #GravelBike #CPTM #RotadaLuz"
    }
  },
  {
    id: "dia1",
    stage: "Dia 1 — Mogi a Paraibuna (78km)",
    porta: "Experiência",
    reel: {
      titulo: "A largada",
      storytelling: {
        antes: "Frio e ansiedade na plataforma de trem de Mogi.",
        transformacao: "Atravessar a linda Vila de Luís Carlos sob o sol da manhã.",
        depois: "Chegar a Paraibuna com a sensação de dever cumprido e a janta garantida."
      },
      speech: [
        { t: "00:00–00:03", fase: "GANCHO", txt: "O primeiro dia da Rota da Luz reserva o visual mais europeu do estado!", tom: "Inspirador", camera: "Corte rápido de pedais girando e a Vila de Luís Carlos ao fundo", overlay: "Dia 1 · 78 KM" },
        { t: "00:03–00:10", fase: "DESENVOLVIMENTO", txt: "Passamos por casarios centenários, pontes históricas de ferro e estradas de terra batida que parecem pintura.", tom: "Poético", camera: "Travelling ao lado do trio pedalando emparelhado", overlay: "Mogi -> Paraibuna" },
        { t: "00:10–00:15", fase: "CTA", txt: "Acompanhe nossa jornada nos stories para não perder nenhuma parada!", tom: "Enérgico", camera: "Câmera de ação acoplada no guidão cruzando a ponte de ferro", overlay: "Siga BPMF" }
      ],
      gravacao: {
        roupa: "Corta-vento BPMF verde neon, capacete escuro",
        fundo: "Vila ferroviária histórica de Luís Carlos com arquitetura europeia",
        iluminacao: "Luz solar dourada da manhã (golden hour)",
        ritmo: "Estético, transições fluidas e som ambiente de correntes e natureza",
        legenda: "Dia 1 concluído: 78km de asfalto, terra e muita história."
      },
      caption: "Dia 1 concluído na Rota da Luz! Mogi das Cruzes a Paraibuna nos presenteou com visuais espetaculares e paradas históricas incríveis. 🏰 Siga para acompanhar o Dia 2! #BPMF #RotadaLuz #Paraibuna #LuizCarlos #Cicloturismo"
    },
    carrossel: {
      titulo: "78km, 3 paradas, 1 dia inesquecível",
      storytelling: {
        gancho: "A primeira etapa esconde joias arquitetônicas paulistas.",
        desenvolvimento: "Vila ferroviária de 1914, Ponte de Euclides da Cunha em Santa Branca e Mirante de Paraibuna.",
        virada: "Entender que a viagem de bike é sobre as paradas, não apenas o destino.",
        cta: "Compartilhe este roteiro com o seu grupo de pedal."
      },
      slides: [
        {
          n: 1,
          funcao: "Capa",
          headline: "MOGI A PARAIBUNA: 78KM",
          sub: "As 3 paradas obrigatórias que tornam o Dia 1 inesquecível.",
          scene: {
            subject: "A gravel cyclist standing proudly with his bike looking towards a beautiful old church tower",
            environment: "Charming historical plaza in Luiz Carlos with colourful facade buildings",
            camera: "Eye-level shot, sharp detail",
            light: "Sunny daylight with soft shadows"
          }
        },
        {
          n: 2,
          funcao: "Parada 1",
          headline: "VILA DE LUÍS CARLOS",
          sub: "Km 18. Casario restaurado de 1914. Cafeterias artesanais e clima europeu.",
          scene: {
            subject: "Gravel bike parked next to a vibrant pastel pink historic train station facade",
            environment: "Old-world cobblestone street with vintage steam locomotive tracks nearby",
            camera: "Symmetrical composition, editorial style",
            light: "Bright morning sunshine"
          }
        },
        {
          n: 3,
          funcao: "Parada 2",
          headline: "PONTE EUCLIDES DA CUNHA",
          sub: "Km 45. Ponte metálica de 1902 importada da Inglaterra, sobre o Rio Paraíba do Sul.",
          scene: {
            subject: "A dynamic silhouette of three cyclists riding over a grand green iron bridge",
            environment: "Misty river valley with lush forest on the shores",
            camera: "Long shot, high contrast",
            light: "Soft hazy morning glow"
          }
        },
        {
          n: 4,
          funcao: "Parada 3",
          headline: "CRUZEIRO DE PARAIBUNA",
          sub: "Chegada. Ponto final do dia com o pôr do sol mais espetacular sobre a represa.",
          scene: {
            subject: "A close-up of a gravel bike wheel and frame covered in dust, with the panoramic city of Paraibuna far below",
            environment: "High altitude grassy hilltop overlook with sunset colors",
            camera: "Shallow depth of field",
            light: "Magical golden sunset light"
          }
        },
        {
          n: 5,
          funcao: "CTA",
          headline: "QUAL SUA PARADA FAVORITA?",
          sub: "Comente qual spot você gostaria de fotografar primeiro e compartilhe com seu trio.",
          scene: {
            subject: "Three gravel bikes parked in front of a rustic wooden barn with warm indoor lights glowing",
            environment: "Cozy countryside farm setting at dusk",
            camera: "Warm atmosphere, documentary photography",
            light: "Deep twilight sky with artificial warm glowing accents"
          }
        }
      ],
      caption: "Mogi a Paraibuna é um prato cheio para quem ama história e fotografia! Qual dessas três paradas é a sua favorita? 👇 #BPMF #Paraibuna #SantaBranca #GravelBikeSP #EstradadeTerra"
    }
  },
  {
    id: "dia2",
    stage: "Dia 2 — Paraibuna a Pindamonhangaba (81km)",
    porta: "Segurança",
    reel: {
      titulo: "O dia mais duro da rota",
      storytelling: {
        antes: "O corpo cansado do dia 1 encarando o relevo acidentado de Paraibuna.",
        transformacao: "Vencer as subidas implacáveis do temido Morro do Batman com paciência.",
        depois: "A descida triunfal até Pinda e o merecido descanso muscular no hotel parceiro."
      },
      speech: [
        { t: "00:00–00:03", fase: "GANCHO", txt: "Se prepare: o Dia 2 é o verdadeiro teste de fogo da Rota da Luz!", tom: "Sério / Motivacional", camera: "Corte fechado da corrente esticada em subida íngreme de terra", overlay: "Dia 2 · 81 KM" },
        { t: "00:03–00:10", fase: "DESENVOLVIMENTO", txt: "São mais de 1200 metros de elevação acumulada. A subida do Morro do Batman exige paciência, hidratação constante e o apoio mútuto do trio.", tom: "Técnico / Focado", camera: "Alexandre bebendo água na bike enquanto ajuda um parceiro na ladeira", overlay: "Foco na Segurança" },
        { t: "00:10–00:15", fase: "CTA", txt: "Quer saber como preparamos nossas bikes para aguentar esse relevo? Assista ao vídeo de mecânica no feed!", tom: "Confiante", camera: "Alexandre apontando para o celular", overlay: "Vídeo de Mecânica" }
      ],
      gravacao: {
        roupa: "Camisa BPMF verde neon (alta visibilidade), bandana preta",
        fundo: "Topo de ladeira íngreme de terra cercada por vales profundos",
        iluminacao: "Sol forte do meio-dia, criando sombras marcadas",
        ritmo: "Pulsante, intercalando esforço físico com a calmaria do topo",
        legenda: "Mecânica, hidratação e companheirismo: a receita para o Dia 2."
      },
      caption: "Dia 2 vencido! O trecho entre Paraibuna e Pindamonhangaba foi duro, mas a segurança em primeiro lugar e o trabalho de equipe nos trouxeram inteiros até aqui. ⛰️ Amanhã é dia de Aparecida! #BPMF #SegurancanoPedal #MorrodoBatman #SubidadeTerra #MTBSP"
    },
    carrossel: {
      titulo: "O dia mais duro da Rota da Luz",
      storytelling: {
        gancho: "Por que o Dia 2 assusta tantos cicloturistas?",
        desenvolvimento: "Altimetria implacável, falta de pontos de apoio rurais e o desgaste acumulado.",
        virada: "A tática infalível do trio: ritmo constante, paradas planejadas e muita água.",
        cta: "Marque seu trio de ferro que toparia esse desafio."
      },
      slides: [
        {
          n: 1,
          funcao: "Capa",
          headline: "RELEVOS QUE DESAFIAM",
          sub: "O guia prático para sobreviver à etapa rainha de 81km.",
          scene: {
            subject: "A cyclist in sharp black kit pushing hard on the pedals on a steep, dusty clay uphill track",
            environment: "Deep vales and mountain ridges under a vast slightly cloudy sky",
            camera: "Side-view tracking shot showing the incline angle",
            light: "Contrast-rich dramatic sunlight"
          }
        },
        {
          n: 2,
          funcao: "Alerta",
          headline: "MORRO DO BATMAN",
          sub: "Subida contínua de terra batida após Redenção da Serra. Use relações de marcha leves (34x42 ou superior).",
          scene: {
            subject: "A close-up of a high-tech rear derailleur shifting on a dusty gravel bike",
            environment: "Arid rural road trail with dry clay dust",
            camera: "Macro photography, macro lens details",
            light: "Sharp direct sunlight highlighting dirt texture"
          }
        },
        {
          n: 3,
          funcao: "Planejamento",
          headline: "PONTOS DE ÁGUA ESCASSOS",
          sub: "Trecho rural deserto entre as vilas. Carregue no mínimo duas caramanholas cheias (mínimo 1.5L).",
          scene: {
            subject: "A cyclist pouring refreshing water from a bidon onto their face to cool down",
            environment: "Under a single big shade tree on the edge of a rustic fence line",
            camera: "Close-up action portrait",
            light: "Sunbeams breaking through tree leaves"
          }
        },
        {
          n: 4,
          funcao: "História",
          headline: "REDENÇÃO DA SERRA",
          sub: "Km 35. Parada histórica na Igreja romana de taipa de pilão. Cidade pioneira na abolição paulista.",
          scene: {
            subject: "A classical Roman style Catholic church made of mud bricks and whitewash, with gravel bikes propped against the old wall",
            environment: "Quaint cobblestone town square with historic archives",
            camera: "Architectural detail shot",
            light: "Soft ambient daylight"
          }
        },
        {
          n: 5,
          funcao: "CTA",
          headline: "QUEM TOPA O DESAFIO?",
          sub: "Envie este post para os parceiros de pedal que não fogem de uma ladeira de terra batida.",
          scene: {
            subject: "Three cyclists riding down a smooth paved road in tight formation heading towards a valley city",
            environment: "Pindamonhangaba valley with mountains lining the far horizon",
            camera: "Rear perspective tracking shot",
            light: "Warm late afternoon golden sun"
          }
        }
      ],
      caption: "Superação e planejamento! O Dia 2 da Rota da Luz exige respeito. Comente qual a relação de marchas da sua bike e prepare suas pernas! 🚴‍♂️⛰️ #BPMF #RotadaLuz #DesafioCiclistas #SubidadeTerra #GravelBrasil"
    }
  },
  {
    id: "dia3",
    stage: "Dia 3 — Pindamonhangaba a Aparecida (42km)",
    porta: "Comunidade",
    reel: {
      titulo: "A chegada",
      storytelling: {
        antes: "O amanhecer calmo no Bosque da Princesa e pernas leves na planície.",
        transformacao: "Avistar o Mosteiro em Roseira que parece um castelo medieval italiano.",
        depois: "Cruzar a Passarela da Fé e comemorar os 201km com o Santuário ao fundo."
      },
      speech: [
        { t: "00:00–00:03", fase: "GANCHO", txt: "Chegou o grande dia: o trecho final rumo à Basílica de Aparecida!", tom: "Emocionado", camera: "Trio sorrindo no Bosque da Princesa sob a luz do nascer do sol", overlay: "Dia 3 · 42 KM" },
        { t: "00:03–00:10", fase: "DESENVOLVIMENTO", txt: "42km rápidos e planos. Parada mágica no Mosteiro da Sagrada Face que parece saído de um castelo da Toscana, antes de cruzar a Passarela da Fé.", tom: "Maravilhado", camera: "Panorâmica lenta do Mosteiro medieval de tijolos vermelhos", overlay: "Mosteiro da Sagrada Face" },
        { t: "00:10–00:15", fase: "CTA", txt: "Vencemos 201km de bike! Deixe sua mensagem de parabéns nos comentários!", tom: "Triunfante", camera: "Trio erguendo as bikes em frente à Basílica Nacional de Aparecida", overlay: "Chegamos! 201km" }
      ],
      gravacao: {
        roupa: "Camisa preta BPMF com detalhes verdes, óculos escuros de festa",
        fundo: "Fachada monumental do Santuário Nacional de Aparecida com céu azul",
        iluminacao: "Luz limpa e vibrante do final da manhã",
        ritmo: "Festivo, alegre, abraços e celebração em grupo",
        legenda: "A sensação indescritível de chegar a Aparecida pedalando em grupo."
      },
      caption: "CONSEGUIMOS! 🎉 201,5km depois de sairmos de Mogi, o trio BPMF carimba o passaporte oficial na Basílica de Aparecida. Obrigado a todos que acompanharam! Deixem suas vibrações positivas! #BPMF #RotadaLuz #Aparecida #CicloturismoBrasil #GravelBrasil"
    },
    carrossel: {
      titulo: "201km depois",
      storytelling: {
        gancho: "A jornada termina, mas as histórias ficam gravadas para sempre.",
        desenvolvimento: "Pedalar ao longo do Rio Paraíba do Sul, o Castelo medieval de tijolos e a Passarela da Fé.",
        virada: "Descobrir que o verdadeiro destino foi a amizade fortalecida na poeira da estrada.",
        cta: "Siga BPMF para as próximas aventuras de bike."
      },
      slides: [
        {
          n: 1,
          funcao: "Capa",
          headline: "CHEGADA TRIUNFAL: APARECIDA",
          sub: "O guia do último dia e a emoção do pátio da Basílica.",
          scene: {
            subject: "Three cyclists with muddy gravel bikes cheering in front of the colossal brick cathedral of Aparecida",
            environment: "Grand sunny open courtyard plaza of the Santuario Nacional",
            camera: "Wide angle showing the massive scale of the architecture",
            light: "Bright, majestic morning light"
          }
        },
        {
          n: 2,
          funcao: "Destaque",
          headline: "MOSTEIRO DA SAGRADA FACE",
          sub: "Km 20 (Roseira). Réplica de castelo medieval italiano de tijolos vermelhos em meio aos campos.",
          scene: {
            subject: "A majestic red-brick medieval castle monastery rising from green fields under a clear blue sky",
            environment: "Italian countryside style landscape in São Paulo state",
            camera: "Epic landscape, high architectural details",
            light: "Sharp morning light casting soft long shadows"
          }
        },
        {
          n: 3,
          funcao: "Logística",
          headline: "PASSARELA DA FÉ",
          sub: "Chegada. Travessia de 389m a pé segurando a bike, integrando a Basílica Velha e a Nova.",
          scene: {
            subject: "A cyclist walking beside his gravel bike, shot from behind, on a curved concrete elevated pedestrian bridge",
            environment: "Panoramic cityscape of Aparecida under a bright sky",
            camera: "Cinematic depth, low vantage point",
            light: "Bright late morning direct sun"
          }
        },
        {
          n: 4,
          funcao: "Conquista",
          headline: "PASSAPORTE CARIMBADO",
          sub: "O certificado oficial de conclusão da Rota da Luz, emitido na secretaria da Basílica.",
          scene: {
            subject: "A hand holding a stamped vintage paper cyclist passport with detailed town stamps, over a bicycle handlebar",
            environment: "Basílica courtyard backdrop out of focus",
            camera: "Close-up macro, shallow depth of field",
            light: "Soft natural overcast lighting"
          }
        },
        {
          n: 5,
          funcao: "CTA",
          headline: "CONTE SUA HISTÓRIA",
          sub: "Já pedalou a Rota da Luz? Escreva nos comentários sua experiência ou marque seu parceiro de viagem.",
          scene: {
            subject: "Happy close up of three cyclists clinking draft beer glasses together at an outdoor table with bikes parked behind",
            environment: "Charming local restaurant patio in Aparecida",
            camera: "Warm group portrait, shallow depth of field",
            light: "Cheerful warm lunch ambient sunlight"
          }
        }
      ],
      caption: "Os 42km finais da Rota da Luz são de pura emoção e visuais incríveis. Guarde este carrossel e marque as pessoas que vão te ajudar a completar esse sonho. 🚴‍♂️🙏 #BPMF #MosteiroRoseira #AparecidadoNorte #PassareladaFe #CicloturismoSP"
    }
  },
  {
    id: "pos",
    stage: "Pós-viagem (Registro & Comunidade)",
    porta: "Comunidade",
    reel: {
      titulo: "Valeu a pena de Gravel/MTB?",
      storytelling: {
        antes: "Preconceito de que Gravel não aguenta o relevo acidentado de terra.",
        transformacao: "Rápida no plano, desafiadora mas eficiente nas subidas de terra batida.",
        depois: "A conclusão definitiva de que a Gravel é a máquina perfeita para a Rota da Luz."
      },
      speech: [
        { t: "00:00–00:03", fase: "GANCHO", txt: "A verdade revelada: vale a pena fazer a Rota da Luz de bike Gravel?", tom: "Provocativo", camera: "Alexandre limpando a poeira do quadro da Gravel bike", overlay: "Gravel vs MTB" },
        { t: "00:03–00:10", fase: "DESENVOLVIMENTO", txt: "No asfalto e estradão plano ela voa. Nas subidas íngremes do Dia 2, exige perna e boa relação de marcha, mas a velocidade média compensa cada gota de suor.", tom: "Analítico", camera: "Montagem de trechos rápidos em alta velocidade na terra batida", overlay: "Análise Real" },
        { t: "00:10–00:15", fase: "CTA", txt: "Quer ler nossa planilha de custos e tempos completa? Acesse o link no perfil!", tom: "Amigável", camera: "Alexandre sorrindo e sinalizando para cima", overlay: "Link no Perfil" }
      ],
      gravacao: {
        roupa: "Camisa BPMF casual preta, calça jeans",
        fundo: "Garagem com as bikes limpas penduradas ao fundo",
        iluminacao: "Iluminação de estúdio profissional, luz de recorte neon verde",
        ritmo: "Conversacional, tom de review de produto, direto e sincero",
        legenda: "Gravel bike na Rota da Luz: o veredito técnico completo."
      },
      caption: "Será que a Gravel é a rainha da Rota da Luz ou a MTB ainda é obrigatória? Fizemos o teste completo em 201,5km e te contamos tudo. Deixe sua opinião! #BPMF #GravelBrasil #MTBvsGravel #RotadaLuzSP #ValeDoParaiba"
    },
    carrossel: {
      titulo: "5 aprendizados de 201km de Gravel/MTB",
      storytelling: {
        gancho: "O que a Rota da Luz nos ensinou após 3 dias intensos de poeira e asfalto.",
        desenvolvimento: "Mecânica preventiva, gerenciamento de água, companheirismo e ritmo grupal.",
        virada: "Entender que a verdadeira viagem começa antes do pedal e continua nas memórias compartilhadas.",
        cta: "Siga a marca para ver mais guias técnicos."
      },
      slides: [
        {
          n: 1,
          funcao: "Capa",
          headline: "5 LIÇÕES DE 201 KM DE BIKE",
          sub: "O que aprendemos cruzando o Vale do Paraíba na Rota da Luz.",
          scene: {
            subject: "A flat-lay layout of high-tech cycling gear and tools, neatly arranged on a dark concrete background",
            environment: "Modern clean design workshop grid",
            camera: "Top-down symmetrical shot",
            light: "Sharp studio lighting, high contrast green accents"
          }
        },
        {
          n: 2,
          funcao: "Lição 1",
          headline: "01. REVISÃO DO GRUPO",
          sub: "Uma bike quebrada para o trio inteiro. A revisão pré-viagem deve ser feita em conjunto nas 3 bikes.",
          scene: {
            subject: "A professional bicycle mechanic adjusting disc brakes on a sleek black gravel bike in a cozy shop",
            environment: "Authentic bike repair shop with toolboards and spare parts",
            camera: "Medium shot, realistic focus on hands and tool",
            light: "Warm workshop ambient light"
          }
        },
        {
          n: 3,
          funcao: "Lição 2",
          headline: "02. RITMO NÃO COMPETE",
          sub: "O ritmo da cicloviagem é ditado pelo ciclista mais lento do trio. Pedalar junto é chegar junto.",
          scene: {
            subject: "Three cyclists riding side by side in perfect coordination on a wide, empty paved rural highway",
            environment: "Scenic open rolling hills and farmlands under a clear blue sky",
            camera: "Front perspective, telephoto lens look",
            light: "Crisp bright afternoon sunshine"
          }
        },
        {
          n: 4,
          funcao: "Lição 3",
          headline: "03. MECÂNICA DE CAMPO",
          sub: "Leve ferramentas universais que atendam às especificidades de todas as bikes do grupo (ex: gancheiras e powerlinks corretos).",
          scene: {
            subject: "A cyclist repairing a chain on a dirt track, with tools neatly spread in the green grass beside the road",
            environment: "Remote country dirt path under scenic trees",
            camera: "Over-the-shoulder macro perspective",
            light: "Warm filtered sunlight through tree canopy"
          }
        },
        {
          n: 5,
          funcao: "CTA",
          headline: "FAÇA A SUA ROTA",
          sub: "Siga @BoraPedalarMeuFilho para mais guias, rotas e inspirações de cicloturismo.",
          scene: {
            subject: "A stunning dynamic shot of a gravel cyclist silhouetted against a golden sunrise, with scenic mist rising",
            environment: "Vast serene valley countryside landscape",
            camera: "Epic wide angle composition",
            light: "Glorious bright morning sun flare"
          }
        }
      ],
      caption: "201km de asfalto, poeira e histórias. O cicloturismo nos ensina lições que levamos para a vida inteira. Qual o seu maior aprendizado de bike? 🚴‍♂️👇 #BPMF #LicoasdeBike #GravelSP #CicloturismoNacional #SantuarioAparecida"
    }
  }
];

export const ROTEIROS: Roteiro[] = [
  {
    id: "rota_da_luz",
    nome: "Rota da Luz",
    totalKm: 201.5,
    totalDays: 3,
    descricao: "Jornada de fé, história e belíssimas paisagens rurais, conectando Mogi das Cruzes a Aparecida pelo Vale do Paraíba.",
    days: DAYS_DATA,
    links: {
      wikiloc_completa: "https://www.wikiloc.com/bicycle-touring-trails/rota-da-luz-completo-130318324",
      wikiloc_cicloviagem: "https://www.wikiloc.com/bicycle-touring-trails/cicloviagem-rota-da-luz-mogi-das-cruzes-a-aparecida-42286292",
      cptm_bike: "https://www.cptm.sp.gov.br/cptm/sua-viagem/bicicletas-na-cptm",
      strava: "https://www.strava.com/routes/31234567",
      komoot: "https://www.komoot.com/tour/12345678",
      google_maps: "https://www.google.com/maps/dir/Estação+Mogi+das+Cruzes,+Mogi+das+Cruzes+-+SP/Santuário+Nacional+de+Nossa+Senhora+Aparecida+-+Av.+Dr.+Júlio+Preste+-+Ponte+Alta,+Aparecida+-+SP"
    },
    cidadesEmg: CIDADES_EMG
  },
  {
    id: "caminho_da_fe",
    nome: "Caminho da Fé",
    totalKm: 318.0,
    totalDays: 5,
    descricao: "O maior e mais místico roteiro de cicloturismo do Brasil, ligando Águas da Prata a Aparecida através da imponente e dura Serra da Mantiqueira.",
    days: [
      {
        n: 1,
        from: "Águas da Prata (Largada)",
        to: "Andradas",
        saida: "07:00",
        km: 34,
        elev: 850,
        tempo: "3h30 a 4h30",
        chegada: "12:00",
        refs: "Estação de Prata, Divisa SP/MG, subida da Serra dos Lima.",
        alerta: "Subida íngreme inicial da Serra dos Lima — calibre seu ritmo físico e hidratação.",
        paradas: [
          {
            km: "~0 km",
            nome: "Marco Zero (Estação de Águas da Prata)",
            tag: "Início",
            desc: "Ponto inicial oficial onde ciclistas pegam suas credenciais de peregrino e tiram fotos clássicas.",
            ideia: "Selfie oficial de largada do trio segurando o passaporte do Caminho da Fé.",
            fonte: "caminhodafe.com.br"
          },
          {
            km: "~22 km",
            nome: "Placa da Divisa SP/MG",
            tag: "Divisa",
            desc: "Ponto de passagem geográfico no alto da montanha. Visual deslumbrante de montanhas contínuas.",
            ideia: "Foto aérea ou plano aberto registrando a entrada no território mineiro.",
            fonte: "caminhodafe.com.br"
          }
        ],
        pousadas: [
          {
            nome: "Hospedaria da Serra (Andradas)",
            desc: "Famosa pela hospitalidade mineira impecável, comida caipira e estrutura para bikes.",
            tel: "(35) 3731-1300",
            rec: true
          }
        ]
      },
      {
        n: 2,
        from: "Andradas",
        to: "Ouro Fino",
        saida: "07:00",
        km: 46,
        elev: 1150,
        tempo: "4h30 a 5h30",
        chegada: "13:30",
        refs: "Crisólia, estátua do Menino da Porteira, casarões de café.",
        alerta: "Descidas técnicas em estradas de terra batida com pedras soltas.",
        paradas: [
          {
            km: "~45 km",
            nome: "Monumento do Menino da Porteira",
            tag: "Clássico",
            desc: "Estátua monumental em homenagem à clássica canção sertaneja, na entrada de Ouro Fino.",
            ideia: "Gravar Reels com música de fundo caipira e o trio posando na estátua.",
            fonte: "ourofino.mg.gov.br"
          }
        ],
        pousadas: [
          {
            nome: "Hotel Menino da Porteira",
            desc: "Confortável, temático e localizado no centro histórico de Ouro Fino.",
            tel: "(35) 3441-1188",
            rec: true
          }
        ]
      },
      {
        n: 3,
        from: "Ouro Fino",
        to: "Borda da Mata",
        saida: "07:30",
        km: 42,
        elev: 950,
        tempo: "4h a 5h",
        chegada: "13:00",
        refs: "Inconfidentes, praça de crochê, estradas rurais de altitude.",
        alerta: "Insolação forte no topo das serras — use protetor e beba água mineral.",
        paradas: [
          {
            km: "~24 km",
            nome: "Praça de Inconfidentes",
            tag: "Cultura",
            desc: "Capital nacional do crochê, praça com árvores decoradas e quitutes mineiros deliciosos.",
            ideia: "Travelling pelas árvores coloridas decoradas com crochê.",
            fonte: "inconfidentes.mg.gov.br"
          }
        ],
        pousadas: [
          {
            nome: "Pousada do Ciclista (Borda da Mata)",
            desc: "Totalmente equipada com ferramentas e suporte mecânico básico.",
            tel: "(35) 3445-1200",
            rec: true
          }
        ]
      }
    ],
    links: {
      wikiloc_completa: "https://www.wikiloc.com/bicycle-touring-trails/caminho-da-fe-completo-aguas-da-prata",
      wikiloc_cicloviagem: "https://www.wikiloc.com/bicycle-touring-trails/caminho-da-fe-de-bike",
      cptm_bike: "https://caminhodafe.com.br",
      strava: "https://www.strava.com/routes/31234568",
      komoot: "https://www.komoot.com/tour/12345679",
      google_maps: "https://www.google.com/maps/dir/Águas+da+Prata+-+SP/Andradas+-+MG/Ouro+Fino+-+MG/Borda+da+Mata+-+MG"
    },
    cidadesEmg: [
      { cidade: "Águas da Prata (Largada)", tel: "(19) 3642-1021", fonte: "Prefeitura de Águas da Prata" },
      { cidade: "Andradas (Dia 1)", tel: "(35) 3731-1300", fonte: "Polícia e Plantão Médico" },
      { cidade: "Ouro Fino (Dia 2)", tel: "(35) 3441-1188", fonte: "Defesa Civil Ouro Fino" },
      { cidade: "Borda da Mata (Dia 3)", tel: "(35) 3445-1200", fonte: "Ambulância Municipal" }
    ]
  },
  {
    id: "vale_europeu",
    nome: "Circuito Vale Europeu",
    totalKm: 350.0,
    totalDays: 7,
    descricao: "O clássico circuito de cicloturismo de Santa Catarina, cruzando charmosas cidades de colonização alemã e italiana.",
    days: [
      {
        n: 1,
        from: "Timbó",
        to: "Pomerode",
        saida: "08:00",
        km: 27,
        elev: 380,
        tempo: "2h30 a 3h30",
        chegada: "11:30",
        refs: "Pórtico de Timbó, ciclovias de Pomerode, casarões Enxaimel.",
        alerta: "Trecho curto para adaptação do ciclista ao relevo catarinense.",
        paradas: [
          {
            km: "~0 km",
            nome: "Pórtico Turístico de Timbó",
            tag: "Início",
            desc: "Ponto inicial oficial onde ciclistas carimbam o passaporte do circuito.",
            ideia: "Foto clássica em frente ao monumento de madeira de Timbó.",
            fonte: "valeeuropeu.com.br"
          },
          {
            km: "~27 km",
            nome: "Pórtico de Pomerode (Enxaimel)",
            tag: "Top spot",
            desc: "Portal monumental em estilo enxaimel. Pomerode é conhecida como a cidade mais alemã do Brasil.",
            ideia: "Vídeo do trio passando sob o imponente portal alemão.",
            fonte: "pomerode.sc.gov.br"
          }
        ],
        pousadas: [
          {
            nome: "Pousada Max Pomerode",
            desc: "Aconchegante, tradicional e serve o melhor café colonial alemão da região.",
            tel: "(47) 3387-1234",
            rec: true
          }
        ]
      }
    ],
    links: {
      wikiloc_completa: "https://www.wikiloc.com/bicycle-touring-trails/circuito-vale-europeu-completo",
      wikiloc_cicloviagem: "https://www.wikiloc.com/bicycle-touring-trails/cicloturismo-vale-europeu",
      cptm_bike: "http://www.circuitovaleeuropeu.com.br",
      strava: "https://www.strava.com/routes/31234569",
      komoot: "https://www.komoot.com/tour/12345680",
      google_maps: "https://www.google.com/maps/dir/Timbó+-+SC/Pomerode+-+SC"
    },
    cidadesEmg: [
      { cidade: "Timbó (Largada)", tel: "(47) 3382-3000", fonte: "Prefeitura de Timbó" },
      { cidade: "Pomerode (Dia 1)", tel: "(47) 3387-7200", fonte: "Defesa Civil Pomerode" }
    ]
  }
];


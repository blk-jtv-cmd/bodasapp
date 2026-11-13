import type { LegalDocs } from "./types";

const docs: LegalDocs = {
  "aviso-legal": {
    title: "Aviso legal",
    sections: [
      {
        h: "1. Titular do site",
        p: [
          "Nos termos do artigo 10.º da Lei espanhola 34/2002, sobre serviços da sociedade da informação e comércio eletrónico (LSSI-CE), a titular deste site é:",
          "• Titular: {name}",
          "• Número fiscal espanhol (NIF): {nif}",
          "• Morada: {address}",
          "• Email: {email}",
          "• Atividade: venda online de uma ferramenta digital para organizar casamentos, comercializada com a marca {brand}.",
        ],
      },
      {
        h: "2. Objeto",
        p: [
          "Este aviso legal regula o acesso e a utilização do site e da aplicação {brand}. Ao navegar no site ou criar uma conta, aceitas estas condições. As compras regem-se também pelas Condições de venda.",
        ],
      },
      {
        h: "3. Utilização do site",
        p: [
          "Comprometes-te a utilizar o site de forma lícita e de boa-fé. Em particular, não é permitido aceder ou tentar aceder a contas de terceiros, introduzir vírus ou código malicioso, sobrecarregar intencionalmente o serviço ou utilizá-lo para fins ilícitos ou que violem direitos de terceiros.",
        ],
      },
      {
        h: "4. Propriedade intelectual e industrial",
        p: [
          "Os textos, o design, o logótipo, a marca, o código da aplicação e o modelo Excel pertencem a {name} ou são utilizados sob licença. É concedido um direito de utilização pessoal e não exclusivo. Não é permitido copiar, revender, distribuir ou disponibilizar a terceiros a aplicação ou o modelo sem autorização escrita.",
        ],
      },
      {
        h: "5. Responsabilidade",
        p: [
          "As informações do site, incluindo a calculadora de orçamento, são indicativas e não constituem aconselhamento profissional. As decisões sobre o vosso casamento e a contratação de fornecedores são vossas.",
          "Trabalhamos para que o serviço esteja sempre disponível, mas não podemos garantir que funcione sem interrupções ou erros. O site pode incluir ligações para sites de terceiros, por cujo conteúdo não somos responsáveis.",
          "Cada utilizador é responsável pelos dados que introduz na sua conta.",
        ],
      },
      {
        h: "6. Legislação aplicável",
        p: [
          "Este aviso legal rege-se pela legislação espanhola. Se agires como consumidor, podes também recorrer aos tribunais do teu local de residência.",
        ],
      },
    ],
  },

  privacidad: {
    title: "Política de privacidade",
    sections: [
      {
        h: "1. Responsável pelo tratamento",
        p: ["{name}, NIF {nif}, com morada em {address} e email {email}."],
      },
      {
        h: "2. Que dados tratamos",
        p: [
          "• Dados da conta: email, palavra-passe (guardada cifrada; não a conseguimos ver) e os nomes do casal.",
          "• Dados que introduzem para organizar o casamento: data, local, orçamento, tarefas, fornecedores, quintas, menu, cronograma e lista de convidados (nome, grupo, mesa, acompanhantes, se é uma criança, alergias ou dieta, confirmação de presença e notas).",
          "• Dados de pagamento: o pagamento é gerido pela Stripe. Não vemos nem guardamos os dados do cartão; recebemos apenas a confirmação do pagamento, o email e o identificador da operação.",
          "• Sugestões que nos enviam a partir das Definições: a mensagem e o email da conta.",
          "• Dados técnicos: o idioma escolhido e a sessão iniciada no teu navegador.",
        ],
      },
      {
        h: "3. Finalidades e fundamento jurídico",
        p: [
          "• Prestar o serviço: criar e manter a tua conta e guardar o vosso planeamento. Fundamento: execução do contrato (art. 6.º, n.º 1, al. b) RGPD).",
          "• Gerir o pagamento, a faturação e as obrigações contabilísticas e fiscais. Fundamento: contrato e obrigação legal (art. 6.º, n.º 1, als. b) e c) RGPD).",
          "• Responder aos teus pedidos. Fundamento: o teu pedido e o nosso interesse legítimo em ajudar-te (art. 6.º, n.º 1, al. f) RGPD).",
          "• Manter a segurança do serviço e prevenir abusos. Fundamento: interesse legítimo (art. 6.º, n.º 1, al. f) RGPD).",
          "• Ler as vossas sugestões e usá-las para melhorar a ferramenta. Fundamento: interesse legítimo (art. 6.º, n.º 1, al. f) RGPD).",
          "Não enviamos publicidade sem o teu consentimento, não vendemos dados e não tomamos decisões automatizadas nem fazemos definição de perfis.",
        ],
      },
      {
        h: "4. Dados dos vossos convidados e fornecedores",
        p: [
          "Ao adicionar dados de outras pessoas (convidados, fornecedores), garantem que o podem fazer, por exemplo porque vos foram fornecidos para organizar o casamento, e que só os usarão para esse fim. Nós apenas os tratamos para vos prestar o serviço, por vossa conta.",
          "Alergias e dieta: saber que um convidado é celíaco ou alérgico é informação de saúde (art. 9.º RGPD). É um campo opcional que serve apenas para organizar o menu com o catering. Não usamos esta informação para mais nada, não a partilhamos com ninguém e só lhe acedemos se for preciso para resolver um problema que nos comuniquem. Se preferirem, deixem-no em branco e informem diretamente o catering.",
          "Crianças: podem indicar que um convidado é uma criança para contar os menus infantis. Não pedimos idade nem data de nascimento; basta o nome.",
          "Se um convidado vos pedir para corrigir ou apagar os seus dados, podem fazê-lo a qualquer momento na lista de convidados.",
          "Confirmações online: se partilharem o link de confirmação, os vossos convidados podem responder eles próprios (se vêm, acompanhantes, crianças, alergias ou dieta e um comentário). Essas respostas ficam guardadas na vossa lista; são vocês que decidem sobre elas e nós tratamo-las por vossa conta. O formulário explica a cada convidado para que servem.",
        ],
      },
      {
        h: "5. Quem trata os dados connosco",
        p: [
          "Recorremos a fornecedores que tratam dados por nossa conta, com as garantias exigidas pelo RGPD:",
          "• Supabase: base de dados e gestão de contas. Os dados estão alojados em servidores na União Europeia (Irlanda).",
          "• Stripe Payments Europe Ltd. (Irlanda): processamento de pagamentos. A Stripe trata os dados de pagamento de acordo com a sua própria política de privacidade.",
          "• Cloudflare: alojamento e entrega do site.",
          "• Resend: envio dos emails da conta (confirmação e alteração de palavra-passe), a partir de servidores na União Europeia (Irlanda).",
          "• Google (só se escolheres «Continuar com Google»): a Google partilha connosco o teu nome, email e foto de perfil para iniciares sessão.",
          "• Assessoria fiscal e contabilística, para cumprir as nossas obrigações legais.",
          "Alguns destes fornecedores, ou as respetivas empresas-mãe, estão nos Estados Unidos. As transferências estão abrangidas pelo Quadro de Privacidade de Dados UE-EUA ou pelas cláusulas contratuais-tipo da Comissão Europeia.",
        ],
      },
      {
        h: "6. Durante quanto tempo os guardamos",
        p: [
          "Enquanto a tua conta estiver ativa. Se a apagares ou nos pedires a eliminação, apagaremos os teus dados no prazo máximo de 30 dias, exceto os dados de faturação, que temos de conservar durante os prazos previstos na lei (em geral, até 6 anos). Se apagares a conta nas Definições, o casamento e todos os seus dados (incluindo as sugestões enviadas) são eliminados de imediato; as cópias de segurança técnicas renovam-se num prazo máximo de 30 dias.",
        ],
      },
      {
        h: "7. Os teus direitos",
        p: [
          "Podes exercer os direitos de acesso, retificação, apagamento, oposição, limitação do tratamento e portabilidade, e retirar o teu consentimento a qualquer momento, escrevendo para {email}. Indica qual o direito que pretendes exercer. Nas Definições também podes descarregar uma cópia de todos os vossos dados ou apagar a conta tu mesmo.",
          "Se considerares que o teu pedido não foi bem tratado, podes apresentar reclamação à Agência Espanhola de Proteção de Dados (www.aepd.es) ou à Comissão Nacional de Proteção de Dados (CNPD).",
        ],
      },
      {
        h: "8. Segurança",
        p: [
          "As ligações são cifradas (HTTPS), as palavras-passe são guardadas cifradas e cada casal só pode aceder aos dados do seu próprio casamento.",
        ],
      },
      { h: "9. Idade mínima", p: ["O serviço destina-se a pessoas com 18 anos ou mais."] },
      {
        h: "10. Alterações",
        p: [
          "Podemos atualizar esta política. Se as alterações forem importantes, avisaremos por email ou na aplicação.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de cookies",
    sections: [
      {
        h: "1. O que são",
        p: [
          "Os cookies e tecnologias semelhantes, como o armazenamento local do navegador, são pequenos ficheiros ou dados que um site guarda no teu dispositivo para funcionar ou lembrar informações.",
        ],
      },
      {
        h: "2. O que usamos",
        p: [
          "Usamos apenas armazenamento técnico, necessário para o funcionamento do serviço, que não requer consentimento:",
          "• Sessão de utilizador (armazenamento local, Supabase): mantém a sessão iniciada. Dura até terminares a sessão.",
          "• Idioma (armazenamento local): lembra o idioma escolhido. Dura até o apagares.",
          "• Avisos fechados (armazenamento local): lembra que fechaste o aviso para instalar a app, para não voltar a mostrá-lo. Dura até o apagares.",
          "Não usamos cookies de análise, de publicidade nem de redes sociais.",
        ],
      },
      {
        h: "3. Terceiros",
        p: [
          "Ao pagar abre-se a página de pagamento da Stripe, que usa os seus próprios cookies para processar o pagamento e prevenir fraudes. Podes consultá-los na política de cookies da Stripe.",
        ],
      },
      {
        h: "4. Como eliminá-los",
        p: [
          "Podes apagar ou bloquear os cookies e o armazenamento local nas definições do teu navegador. Se o fizeres, terás de voltar a iniciar sessão.",
        ],
      },
      {
        h: "5. Alterações",
        p: [
          "Se no futuro usarmos cookies que exijam o teu consentimento, por exemplo de análise, pedi-lo-emos antes através de um aviso.",
        ],
      },
    ],
  },

  condiciones: {
    title: "Condições de venda e utilização",
    sections: [
      {
        h: "1. Quem somos",
        p: [
          "Estas condições regulam a compra e a utilização de {brand}, vendido por {name}, NIF {nif}, com morada em {address} e email {email}. Destinam-se a pessoas maiores de idade que compram como consumidoras.",
        ],
      },
      {
        h: "2. O que inclui",
        p: [
          "{brand} é uma ferramenta web para organizar o casamento: checklist, orçamento, comparador de quintas, convidados e planta das mesas, menu, fornecedores e cronograma do dia, além de um modelo Excel para descarregar.",
          "Criar a conta é grátis e inclui o Resumo e a Checklist. As restantes secções e o modelo são desbloqueados com o pagamento do plano.",
        ],
      },
      {
        h: "3. Preço e pagamento",
        p: [
          "O plano custa 37 € num único pagamento, impostos incluídos. Não há subscrições nem prestações. O preço aplicável é o indicado no site no momento da compra. Pode haver ofertas temporárias anunciadas no site (por exemplo, Black Friday), com datas de início e fim; durante uma oferta, é cobrado o preço da oferta.",
          "O pagamento é feito com cartão através da Stripe, de forma segura. Receberás a confirmação da compra por email.",
        ],
      },
      {
        h: "4. Acesso e duração",
        p: [
          "O acesso ao plano completo é ativado automaticamente assim que o pagamento é confirmado. O acesso não tem data de validade enquanto o serviço continuar em funcionamento.",
          "Se um dia deixarmos de oferecer o serviço, avisaremos com pelo menos 90 dias de antecedência para que possam guardar os vossos dados.",
          "A conta é do casal: podem usá-la os dois com os mesmos dados de acesso. São responsáveis por manter a palavra-passe em segredo.",
        ],
      },
      {
        h: "5. Direito de livre resolução",
        p: [
          "Em regra, os consumidores dispõem de 14 dias de calendário para resolver uma compra online. No entanto, tratando-se de conteúdo digital fornecido de imediato e sem suporte material, nos termos do artigo 103.º, alínea m), da lei geral espanhola de defesa dos consumidores e utilizadores (Real Decreto Legislativo 1/2007) e da Diretiva 2011/83/UE, o direito de livre resolução não se aplica quando, antes de pagares, dás o teu consentimento expresso para que o acesso comece de imediato e reconheces que, por isso, perdes esse direito.",
          "Este consentimento é recolhido através de uma caixa obrigatória antes do pagamento.",
        ],
      },
      {
        h: "6. Garantia",
        p: [
          "O serviço deve funcionar tal como descrito. Se algo não funcionar, escreve-nos para {email} e resolveremos o problema. Se não for possível, poderás pedir uma redução do preço ou a resolução do contrato, ao abrigo da garantia legal dos conteúdos e serviços digitais.",
        ],
      },
      {
        h: "7. Utilização permitida",
        p: [
          "O plano é para uso pessoal, para organizar o vosso próprio casamento. Não é permitido revender o acesso, partilhar o modelo com terceiros nem copiar a aplicação ou os seus conteúdos.",
        ],
      },
      {
        h: "8. Disponibilidade e responsabilidade",
        p: [
          "Trabalhamos para que o serviço esteja sempre disponível, embora possam ocorrer interrupções pontuais por manutenção ou por causas alheias à nossa vontade. Recomendamos que guardes uma cópia das informações mais importantes; o modelo Excel também serve para isso.",
          "{brand} é uma ferramenta de organização. Não somos wedding planners nem intermediários com os fornecedores, e os valores indicativos do site não são orçamentos reais.",
        ],
      },
      {
        h: "9. Alterações a estas condições",
        p: [
          "Podemos atualizar estas condições. A cada compra aplicam-se as condições em vigor no momento em que é efetuada.",
        ],
      },
      {
        h: "10. Contacto, reclamações e legislação",
        p: [
          "Para qualquer dúvida ou reclamação, escreve-nos para {email}. Estas condições regem-se pela legislação espanhola, sem prejuízo das normas imperativas de proteção dos consumidores do teu país de residência. Se fores consumidor, podes recorrer aos tribunais do teu local de residência.",
        ],
      },
    ],
  },
};

export default docs;

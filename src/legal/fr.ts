import type { LegalDocs } from "./types";

const docs: LegalDocs = {
  "aviso-legal": {
    title: "Mentions légales",
    sections: [
      {
        h: "1. Éditrice du site",
        p: [
          "Conformément à l'article 10 de la loi espagnole 34/2002 sur les services de la société de l'information et le commerce électronique (LSSI-CE), l'éditrice de ce site est :",
          "• Titulaire : {name}",
          "• Numéro fiscal espagnol (NIF) : {nif}",
          "• Adresse : {address}",
          "• E-mail : {email}",
          "• Activité : vente en ligne d'un outil numérique d'organisation de mariage, commercialisé sous la marque {brand}.",
        ],
      },
      {
        h: "2. Objet",
        p: [
          "Les présentes mentions légales régissent l'accès et l'utilisation du site et de l'application {brand}. En naviguant sur le site ou en créant un compte, tu acceptes ces conditions. Les achats sont également régis par les Conditions de vente.",
        ],
      },
      {
        h: "3. Utilisation du site",
        p: [
          "Tu t'engages à utiliser le site de manière licite et de bonne foi. Il est notamment interdit d'accéder ou de tenter d'accéder aux comptes d'autrui, d'introduire des virus ou du code malveillant, de surcharger volontairement le service ou de l'utiliser à des fins illicites ou en violation des droits de tiers.",
        ],
      },
      {
        h: "4. Propriété intellectuelle et industrielle",
        p: [
          "Les textes, le design, le logo, la marque, le code de l'application et le modèle Excel appartiennent à {name} ou sont utilisés sous licence. Un droit d'utilisation personnel et non exclusif t'est accordé. Il est interdit de copier, revendre, distribuer ou mettre à disposition de tiers l'application ou le modèle sans autorisation écrite.",
        ],
      },
      {
        h: "5. Responsabilité",
        p: [
          "Les informations du site, y compris le calculateur de budget, sont indicatives et ne constituent pas un conseil professionnel. Les décisions concernant votre mariage et le choix des prestataires vous appartiennent.",
          "Nous faisons en sorte que le service soit toujours disponible, mais nous ne pouvons pas garantir l'absence d'interruptions ou d'erreurs. Le site peut contenir des liens vers des sites tiers, dont nous ne sommes pas responsables.",
          "Chaque utilisateur est responsable des informations qu'il saisit dans son compte.",
        ],
      },
      {
        h: "6. Droit applicable",
        p: [
          "Les présentes mentions légales sont régies par le droit espagnol. Si tu agis en tant que consommateur, tu peux également saisir les tribunaux de ton lieu de résidence.",
        ],
      },
    ],
  },

  privacidad: {
    title: "Politique de confidentialité",
    sections: [
      {
        h: "1. Responsable du traitement",
        p: ["{name}, NIF {nif}, domiciliée {address}, e-mail {email}."],
      },
      {
        h: "2. Quelles données nous traitons",
        p: [
          "• Données du compte : e-mail, mot de passe (stocké chiffré ; nous ne pouvons pas le voir) et les prénoms du couple.",
          "• Données que vous saisissez pour organiser le mariage : date, lieu, budget, tâches, prestataires, lieux, menu, planning et liste d'invités (nom, coordonnées, groupe, table, régimes alimentaires et notes).",
          "• Données de paiement : le paiement est géré par Stripe. Nous ne voyons ni ne conservons les données de carte ; nous recevons uniquement la confirmation du paiement, l'e-mail et l'identifiant de la transaction.",
          "• Données techniques : la langue choisie et la session ouverte dans ton navigateur.",
        ],
      },
      {
        h: "3. Finalités et base légale",
        p: [
          "• Fournir le service : créer et gérer ton compte et enregistrer votre organisation. Base légale : exécution du contrat (art. 6.1.b RGPD).",
          "• Gérer le paiement, la facturation et les obligations comptables et fiscales. Base légale : contrat et obligation légale (art. 6.1.b et 6.1.c RGPD).",
          "• Répondre à tes demandes. Base légale : ta demande et notre intérêt légitime à t'aider (art. 6.1.f RGPD).",
          "• Assurer la sécurité du service et prévenir les abus. Base légale : intérêt légitime (art. 6.1.f RGPD).",
          "Nous n'envoyons pas de publicité sans ton consentement, nous ne vendons pas de données et nous ne prenons pas de décisions automatisées ni ne faisons de profilage.",
        ],
      },
      {
        h: "4. Données de vos invités et prestataires",
        p: [
          "En ajoutant les données d'autres personnes (invités, prestataires), vous garantissez être en droit de le faire, par exemple parce qu'elles vous les ont communiquées pour organiser le mariage, et de ne les utiliser qu'à cette fin. Nous ne les traitons que pour vous fournir le service, pour votre compte.",
          "Les régimes alimentaires peuvent révéler des informations de santé (par exemple, la maladie cœliaque). Ne saisissez que le strict nécessaire pour organiser le menu.",
        ],
      },
      {
        h: "5. Qui traite les données avec nous",
        p: [
          "Nous faisons appel à des prestataires qui traitent les données pour notre compte, avec les garanties exigées par le RGPD :",
          "• Supabase : base de données et gestion des comptes. Les données sont hébergées sur des serveurs dans l'Union européenne (Irlande).",
          "• Stripe Payments Europe Ltd. (Irlande) : traitement des paiements. Stripe traite les données de paiement selon sa propre politique de confidentialité.",
          "• Cloudflare : hébergement et diffusion du site.",
          "• Google Fonts : polices du site. Au chargement de la page, ton navigateur se connecte aux serveurs de Google, qui reçoivent ton adresse IP.",
          "• Conseil fiscal et comptable, pour respecter nos obligations légales.",
          "Certains de ces prestataires, ou leurs sociétés mères, sont situés aux États-Unis. Les transferts sont encadrés par le Data Privacy Framework UE–États-Unis ou par les clauses contractuelles types de la Commission européenne.",
        ],
      },
      {
        h: "6. Durée de conservation",
        p: [
          "Tant que ton compte est actif. Si tu le supprimes ou en demandes l'effacement, nous supprimerons tes données sous 30 jours maximum, sauf les données de facturation, que nous devons conserver pendant les durées prévues par la loi (en général jusqu'à 6 ans).",
        ],
      },
      {
        h: "7. Tes droits",
        p: [
          "Tu peux exercer tes droits d'accès, de rectification, d'effacement, d'opposition, de limitation du traitement et de portabilité, et retirer ton consentement à tout moment, en écrivant à {email}. Indique quel droit tu souhaites exercer.",
          "Si tu estimes que ta demande n'a pas été traitée correctement, tu peux introduire une réclamation auprès de l'Agence espagnole de protection des données (www.aepd.es) ou de la CNIL.",
        ],
      },
      {
        h: "8. Sécurité",
        p: [
          "Les connexions sont chiffrées (HTTPS), les mots de passe sont stockés chiffrés et chaque couple n'a accès qu'aux données de son propre mariage.",
        ],
      },
      { h: "9. Âge minimum", p: ["Le service s'adresse aux personnes âgées de 18 ans ou plus."] },
      {
        h: "10. Modifications",
        p: [
          "Nous pouvons mettre à jour cette politique. En cas de changement important, nous te préviendrons par e-mail ou dans l'application.",
        ],
      },
    ],
  },

  cookies: {
    title: "Politique de cookies",
    sections: [
      {
        h: "1. Ce que c'est",
        p: [
          "Les cookies et technologies similaires, comme le stockage local du navigateur, sont de petits fichiers ou données qu'un site enregistre sur ton appareil pour fonctionner ou mémoriser des informations.",
        ],
      },
      {
        h: "2. Ce que nous utilisons",
        p: [
          "Nous utilisons uniquement un stockage technique, nécessaire au fonctionnement du service, qui ne requiert pas de consentement :",
          "• Session utilisateur (stockage local, Supabase) : te garde connecté. Dure jusqu'à la déconnexion.",
          "• Langue (stockage local) : mémorise la langue choisie. Dure jusqu'à ce que tu la supprimes.",
          "Nous n'utilisons pas de cookies d'analyse, de publicité ou de réseaux sociaux.",
        ],
      },
      {
        h: "3. Tiers",
        p: [
          "Lors du paiement, la page de Stripe s'ouvre et utilise ses propres cookies pour traiter le paiement et prévenir la fraude. Tu peux les consulter dans la politique de cookies de Stripe.",
          "Google Fonts ne dépose pas de cookies, mais reçoit ton adresse IP lors du chargement des polices (voir la Politique de confidentialité).",
        ],
      },
      {
        h: "4. Comment les supprimer",
        p: [
          "Tu peux supprimer ou bloquer les cookies et le stockage local dans les réglages de ton navigateur. Dans ce cas, tu devras te reconnecter.",
        ],
      },
      {
        h: "5. Modifications",
        p: [
          "Si nous utilisons un jour des cookies nécessitant ton consentement, par exemple d'analyse, nous te le demanderons d'abord via un bandeau.",
        ],
      },
    ],
  },

  condiciones: {
    title: "Conditions de vente et d'utilisation",
    sections: [
      {
        h: "1. Qui sommes-nous",
        p: [
          "Les présentes conditions régissent l'achat et l'utilisation de {brand}, vendu par {name}, NIF {nif}, domiciliée {address}, e-mail {email}. Elles s'adressent aux personnes majeures achetant en tant que consommateurs.",
        ],
      },
      {
        h: "2. Ce qui est inclus",
        p: [
          "{brand} est un outil web pour organiser votre mariage : checklist, budget, comparateur de lieux, invités et plan de table, menu, prestataires et planning du jour, ainsi qu'un modèle Excel téléchargeable.",
          "La création du compte est gratuite et comprend le Résumé et la Checklist. Les autres sections et le modèle se débloquent avec le paiement du plan.",
        ],
      },
      {
        h: "3. Prix et paiement",
        p: [
          "Le plan coûte 37 € en un paiement unique, taxes comprises. Il n'y a ni abonnement ni mensualités. Le prix applicable est celui affiché sur le site au moment de l'achat.",
          "Le paiement s'effectue par carte via Stripe, de façon sécurisée. Tu recevras la confirmation de l'achat par e-mail.",
        ],
      },
      {
        h: "4. Accès et durée",
        p: [
          "L'accès au plan complet est activé automatiquement dès la confirmation du paiement. L'accès n'a pas de date d'expiration tant que le service reste en fonctionnement.",
          "Si nous cessions un jour de proposer le service, nous vous préviendrions au moins 90 jours à l'avance afin que vous puissiez conserver vos données.",
          "Le compte appartient au couple : vous pouvez l'utiliser tous les deux avec les mêmes identifiants. Vous êtes responsables de garder le mot de passe secret.",
        ],
      },
      {
        h: "5. Droit de rétractation",
        p: [
          "En règle générale, les consommateurs disposent de 14 jours calendaires pour se rétracter d'un achat en ligne. Toutefois, s'agissant d'un contenu numérique fourni immédiatement et sans support matériel, conformément à l'article 103, point m), de la loi générale espagnole pour la défense des consommateurs et des usagers (Real Decreto Legislativo 1/2007) et à la directive 2011/83/UE, le droit de rétractation ne s'applique pas lorsque, avant de payer, tu donnes ton consentement exprès au commencement immédiat de l'accès et reconnais perdre ainsi ce droit.",
          "Ce consentement est recueilli au moyen d'une case obligatoire avant le paiement.",
        ],
      },
      {
        h: "6. Garantie",
        p: [
          "Le service doit fonctionner tel que décrit. Si quelque chose ne fonctionne pas, écris-nous à {email} et nous le réglerons. Si ce n'est pas possible, tu pourras demander une réduction du prix ou la résolution du contrat, au titre de la garantie légale des contenus et services numériques.",
        ],
      },
      {
        h: "7. Utilisation autorisée",
        p: [
          "Le plan est destiné à un usage personnel, pour organiser votre propre mariage. Il est interdit de revendre l'accès, de partager le modèle avec des tiers ou de copier l'application ou son contenu.",
        ],
      },
      {
        h: "8. Disponibilité et responsabilité",
        p: [
          "Nous faisons en sorte que le service soit toujours disponible, mais des interruptions ponctuelles peuvent survenir pour maintenance ou pour des raisons indépendantes de notre volonté. Nous te conseillons de conserver une copie des informations les plus importantes ; le modèle Excel est aussi là pour ça.",
          "{brand} est un outil d'organisation. Nous ne sommes ni wedding planners ni intermédiaires avec les prestataires, et les chiffres indicatifs du site ne sont pas de vrais devis.",
        ],
      },
      {
        h: "9. Modification des conditions",
        p: [
          "Nous pouvons mettre à jour ces conditions. Chaque achat est régi par les conditions en vigueur au moment où il est effectué.",
        ],
      },
      {
        h: "10. Contact, réclamations et droit applicable",
        p: [
          "Pour toute question ou réclamation, écris-nous à {email}. Les présentes conditions sont régies par le droit espagnol, sans préjudice des règles impératives de protection des consommateurs de ton pays de résidence. Si tu es consommateur, tu peux saisir les tribunaux de ton lieu de résidence.",
        ],
      },
    ],
  },
};

export default docs;

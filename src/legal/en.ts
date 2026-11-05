import type { LegalDocs } from "./types";

const docs: LegalDocs = {
  "aviso-legal": {
    title: "Legal notice",
    sections: [
      {
        h: "1. Website owner",
        p: [
          "In accordance with article 10 of Spanish Law 34/2002 on information society services and e-commerce (LSSI-CE), the owner of this website is:",
          "• Owner: {name}",
          "• Tax ID (NIF): {nif}",
          "• Address: {address}",
          "• Email: {email}",
          "• Activity: online sale of a digital wedding-planning tool, marketed under the brand {brand}.",
        ],
      },
      {
        h: "2. Purpose",
        p: [
          "This legal notice governs access to and use of the {brand} website and app. By browsing the website or creating an account you accept these terms. Purchases are also governed by the Terms of sale.",
        ],
      },
      {
        h: "3. Use of the website",
        p: [
          "You agree to use the website lawfully and in good faith. In particular, you may not access or attempt to access other people's accounts, introduce viruses or harmful code, deliberately overload the service, or use it for unlawful purposes or in breach of third-party rights.",
        ],
      },
      {
        h: "4. Intellectual and industrial property",
        p: [
          "The texts, design, logo, brand, app code and Excel template belong to {name} or are used under licence. You are granted a personal, non-exclusive right of use. You may not copy, resell, distribute or make the app or the template available to third parties without written permission.",
        ],
      },
      {
        h: "5. Liability",
        p: [
          "The information on the website, including the budget calculator, is for guidance only and does not constitute professional advice. Decisions about your wedding and about hiring suppliers are yours.",
          "We work to keep the service available at all times but cannot guarantee it will be free of interruptions or errors. The website may contain links to third-party websites, for whose content we are not responsible.",
          "Each user is responsible for the information they enter into their account.",
        ],
      },
      {
        h: "6. Governing law",
        p: [
          "This legal notice is governed by Spanish law. If you are a consumer, you may also bring proceedings before the courts of your place of residence.",
        ],
      },
    ],
  },

  privacidad: {
    title: "Privacy policy",
    sections: [
      {
        h: "1. Data controller",
        p: ["{name}, tax ID (NIF) {nif}, address {address}, email {email}."],
      },
      {
        h: "2. What data we process",
        p: [
          "• Account data: email, password (stored encrypted; we cannot see it) and the couple's names.",
          "• Data you enter to plan your wedding: date, venue, budget, tasks, suppliers, venues, menu, timeline and guest list (name, contact details, group, table, dietary requirements and notes).",
          "• Payment data: payments are handled by Stripe. We do not see or store card details; we only receive the payment confirmation, the email address and the transaction ID.",
          "• Technical data: your chosen language and the logged-in session in your browser.",
        ],
      },
      {
        h: "3. Why we use it and legal basis",
        p: [
          "• To provide the service: creating and maintaining your account and saving your planning. Legal basis: performance of a contract (art. 6.1.b GDPR).",
          "• To manage payment, invoicing and accounting and tax obligations. Legal basis: contract and legal obligation (art. 6.1.b and 6.1.c GDPR).",
          "• To answer your enquiries. Legal basis: your request and our legitimate interest in helping you (art. 6.1.f GDPR).",
          "• To keep the service secure and prevent abuse. Legal basis: legitimate interest (art. 6.1.f GDPR).",
          "We do not send marketing without your consent, we do not sell data and we do not make automated decisions or create profiles.",
        ],
      },
      {
        h: "4. Your guests' and suppliers' data",
        p: [
          "When you add other people's data (guests, suppliers) you confirm that you are entitled to do so, for example because they gave it to you to organise the wedding, and that you will only use it for that purpose. We only process it to provide the service on your behalf.",
          "Dietary requirements may reveal health information (for example, coeliac disease). Only enter what is strictly necessary to plan the menu.",
        ],
      },
      {
        h: "5. Who processes data with us",
        p: [
          "We use providers that process data on our behalf, with the safeguards required by the GDPR:",
          "• Supabase: database and account management. Data is hosted on servers in the European Union (Ireland).",
          "• Stripe Payments Europe Ltd. (Ireland): payment processing. Stripe processes payment data under its own privacy policy.",
          "• Cloudflare: website hosting and delivery.",
          "• Resend: sending account emails (confirmation and password changes), from servers in the European Union (Ireland).",
          "• Google (only if you choose \"Continue with Google\"): Google shares your name, email and profile picture with us so you can log in.",
          "• Tax and accounting advisers, to meet our legal obligations.",
          "Some of these providers, or their parent companies, are located in the United States. Transfers are covered by the EU-US Data Privacy Framework or the European Commission's standard contractual clauses.",
        ],
      },
      {
        h: "6. How long we keep it",
        p: [
          "For as long as your account is active. If you delete it or ask us to erase it, we will delete your data within 30 days, except invoicing data, which we must keep for the periods required by law (generally up to 6 years).",
        ],
      },
      {
        h: "7. Your rights",
        p: [
          "You can exercise your rights of access, rectification, erasure, objection, restriction of processing and portability, and withdraw your consent at any time, by writing to {email}. Please state which right you wish to exercise.",
          "If you believe we have not handled your request properly, you can complain to the Spanish Data Protection Agency (www.aepd.es) or to the data protection authority in your country.",
        ],
      },
      {
        h: "8. Security",
        p: [
          "Connections are encrypted (HTTPS), passwords are stored encrypted and each couple can only access the data for their own wedding.",
        ],
      },
      { h: "9. Minimum age", p: ["The service is intended for people aged 18 or over."] },
      {
        h: "10. Changes",
        p: [
          "We may update this policy. If the changes are significant, we will let you know by email or in the app.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    sections: [
      {
        h: "1. What they are",
        p: [
          "Cookies and similar technologies, such as the browser's local storage, are small files or data that a website saves on your device in order to work or remember information.",
        ],
      },
      {
        h: "2. What we use",
        p: [
          "We only use technical storage that is necessary for the service to work. Under article 22.2 of the Spanish LSSI-CE it does not require consent:",
          "• User session (local storage, Supabase): keeps you logged in. Lasts until you log out.",
          "• Language (local storage): remembers the language you chose. Lasts until you delete it.",
          "We do not use analytics, advertising or social media cookies.",
        ],
      },
      {
        h: "3. Third parties",
        p: [
          "When you pay, Stripe's payment page opens and uses its own cookies to process the payment and prevent fraud. You can read about them in Stripe's cookie policy.",
        ],
      },
      {
        h: "4. How to delete them",
        p: [
          "You can delete or block cookies and local storage in your browser settings. If you do, you will need to log in again.",
        ],
      },
      {
        h: "5. Changes",
        p: [
          "If we ever use cookies that require your consent, such as analytics cookies, we will ask for it first with a notice.",
        ],
      },
    ],
  },

  condiciones: {
    title: "Terms of sale and use",
    sections: [
      {
        h: "1. Who we are",
        p: [
          "These terms govern the purchase and use of {brand}, sold by {name}, tax ID (NIF) {nif}, address {address}, email {email}. They are intended for adults buying as consumers.",
        ],
      },
      {
        h: "2. What is included",
        p: [
          "{brand} is a web tool for planning your wedding: checklist, budget, venue comparison, guests and seating plan, menu, suppliers and the day's timeline, plus a downloadable Excel template.",
          "Creating an account is free and includes the Overview and the Checklist. The other sections and the template are unlocked when you pay for the plan.",
        ],
      },
      {
        h: "3. Price and payment",
        p: [
          "The plan costs €37 as a single payment, taxes included. There are no subscriptions or instalments. The applicable price is the one shown on the website at the time of purchase.",
          "Payment is made securely by card through Stripe. You will receive confirmation of your purchase by email.",
        ],
      },
      {
        h: "4. Access and duration",
        p: [
          "Access to the full plan is activated automatically as soon as the payment is confirmed. Access has no expiry date for as long as the service remains in operation.",
          "If we ever stop offering the service, we will give you at least 90 days' notice so that you can keep your data.",
          "The account belongs to the couple: you can both use it with the same login details. You are responsible for keeping your password secret.",
        ],
      },
      {
        h: "5. Right of withdrawal",
        p: [
          "As a general rule, consumers have 14 calendar days to withdraw from an online purchase. However, because this is digital content supplied immediately and not on a tangible medium, under article 103(m) of the Spanish General Law for the Protection of Consumers and Users (Royal Legislative Decree 1/2007) and Directive 2011/83/EU, the right of withdrawal does not apply when, before paying, you expressly consent to access starting immediately and acknowledge that you thereby lose that right.",
          "This consent is collected through a mandatory checkbox before payment.",
        ],
      },
      {
        h: "6. Guarantee",
        p: [
          "The service must work as described. If something does not work, write to us at {email} and we will fix it. If that is not possible, you may request a price reduction or termination of the contract under the legal guarantee for digital content and services.",
        ],
      },
      {
        h: "7. Permitted use",
        p: [
          "The plan is for personal use, to organise your own wedding. You may not resell access, share the template with third parties or copy the app or its content.",
        ],
      },
      {
        h: "8. Availability and liability",
        p: [
          "We work to keep the service available at all times, although there may be occasional interruptions for maintenance or for reasons beyond our control. We recommend keeping a copy of your most important information; the Excel template is also there for that.",
          "{brand} is a planning tool. We are not wedding planners or intermediaries with suppliers, and the guide figures on the website are not real quotes.",
        ],
      },
      {
        h: "9. Changes to these terms",
        p: [
          "We may update these terms. Each purchase is governed by the terms in force at the time it is made.",
        ],
      },
      {
        h: "10. Contact, complaints and governing law",
        p: [
          "For any questions or complaints, write to us at {email}. These terms are governed by Spanish law, without prejudice to the mandatory consumer protection rules of your country of residence. If you are a consumer, you may bring proceedings before the courts of your place of residence.",
        ],
      },
    ],
  },
};

export default docs;

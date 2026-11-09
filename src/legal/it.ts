import type { LegalDocs } from "./types";

const docs: LegalDocs = {
  "aviso-legal": {
    title: "Note legali",
    sections: [
      {
        h: "1. Titolare del sito",
        p: [
          "Ai sensi dell'articolo 10 della legge spagnola 34/2002 sui servizi della società dell'informazione e sul commercio elettronico (LSSI-CE), il titolare di questo sito è:",
          "• Titolare: {name}",
          "• Codice fiscale spagnolo (NIF): {nif}",
          "• Indirizzo: {address}",
          "• Email: {email}",
          "• Attività: vendita online di uno strumento digitale per organizzare matrimoni, commercializzato con il marchio {brand}.",
        ],
      },
      {
        h: "2. Oggetto",
        p: [
          "Queste note legali regolano l'accesso e l'uso del sito e dell'app {brand}. Navigando nel sito o creando un account accetti queste condizioni. Gli acquisti sono regolati anche dalle Condizioni di vendita.",
        ],
      },
      {
        h: "3. Uso del sito",
        p: [
          "Ti impegni a usare il sito in modo lecito e in buona fede. In particolare non è consentito accedere o tentare di accedere ad account altrui, introdurre virus o codice dannoso, sovraccaricare intenzionalmente il servizio o usarlo per scopi illeciti o in violazione dei diritti di terzi.",
        ],
      },
      {
        h: "4. Proprietà intellettuale e industriale",
        p: [
          "I testi, il design, il logo, il marchio, il codice dell'app e il modello Excel appartengono a {name} o sono usati in licenza. Viene concesso un diritto d'uso personale e non esclusivo. Non è consentito copiare, rivendere, distribuire o mettere a disposizione di terzi l'app o il modello senza autorizzazione scritta.",
        ],
      },
      {
        h: "5. Responsabilità",
        p: [
          "Le informazioni del sito, incluso il calcolatore del budget, sono indicative e non costituiscono consulenza professionale. Le decisioni sul vostro matrimonio e sulla scelta dei fornitori spettano a voi.",
          "Lavoriamo perché il servizio sia sempre disponibile, ma non possiamo garantire che funzioni senza interruzioni o errori. Il sito può contenere link a siti di terzi, del cui contenuto non siamo responsabili.",
          "Ogni utente è responsabile dei dati che inserisce nel proprio account.",
        ],
      },
      {
        h: "6. Legge applicabile",
        p: [
          "Queste note legali sono regolate dalla legge spagnola. Se agisci come consumatore, puoi rivolgerti anche ai tribunali del tuo luogo di residenza.",
        ],
      },
    ],
  },

  privacidad: {
    title: "Informativa sulla privacy",
    sections: [
      {
        h: "1. Titolare del trattamento",
        p: ["{name}, NIF {nif}, con indirizzo in {address} ed email {email}."],
      },
      {
        h: "2. Quali dati trattiamo",
        p: [
          "• Dati dell'account: email, password (conservata in forma cifrata; noi non possiamo vederla) e i nomi della coppia.",
          "• Dati che inserite per organizzare il matrimonio: data, luogo, budget, attività, fornitori, location, menù, programma e lista degli invitati (nome, gruppo, tavolo, accompagnatori, se è un bambino o una bambina, allergie o dieta, conferma di partecipazione e note).",
          "• Dati di pagamento: il pagamento è gestito da Stripe. Non vediamo né conserviamo i dati della carta; riceviamo solo la conferma del pagamento, l'email e l'identificativo dell'operazione.",
          "• Suggerimenti che ci inviate dalle Impostazioni: il messaggio e l'email dell'account.",
          "• Dati tecnici: la lingua scelta e la sessione aperta nel tuo browser.",
        ],
      },
      {
        h: "3. Finalità e base giuridica",
        p: [
          "• Fornire il servizio: creare e mantenere il tuo account e salvare la vostra pianificazione. Base giuridica: esecuzione del contratto (art. 6.1.b GDPR).",
          "• Gestire il pagamento, la fatturazione e gli obblighi contabili e fiscali. Base giuridica: contratto e obbligo di legge (art. 6.1.b e 6.1.c GDPR).",
          "• Rispondere alle tue richieste. Base giuridica: la tua richiesta e il nostro legittimo interesse ad assisterti (art. 6.1.f GDPR).",
          "• Garantire la sicurezza del servizio e prevenire abusi. Base giuridica: legittimo interesse (art. 6.1.f GDPR).",
          "• Leggere i vostri suggerimenti e usarli per migliorare lo strumento. Base giuridica: legittimo interesse (art. 6.1.f GDPR).",
          "Non inviamo pubblicità senza il tuo consenso, non vendiamo dati e non prendiamo decisioni automatizzate né facciamo profilazione.",
        ],
      },
      {
        h: "4. Dati dei vostri invitati e fornitori",
        p: [
          "Inserendo dati di altre persone (invitati, fornitori) garantite di poterlo fare, ad esempio perché ve li hanno forniti per organizzare il matrimonio, e di usarli solo a tale scopo. Noi li trattiamo solo per fornirvi il servizio e per vostro conto.",
          "Allergie e dieta: sapere che un invitato è celiaco o allergico è un'informazione sulla salute (art. 9 GDPR). È un campo facoltativo che serve solo a organizzare il menù con il catering. Non usiamo queste informazioni per altro, non le condividiamo con nessuno e vi accediamo solo se serve a risolvere un problema che ci segnalate. Se preferite, lasciatelo vuoto e comunicatelo direttamente al catering.",
          "Bambini: potete indicare che un invitato è un bambino o una bambina per contare i menù bimbi. Non chiediamo età né data di nascita; basta il nome.",
          "Se un invitato vi chiede di correggere o cancellare i suoi dati, potete farlo in qualsiasi momento dalla lista degli invitati.",
          "Conferme online: se condividete il link di conferma, i vostri invitati possono rispondere da soli (se partecipano, accompagnatori, bambini, allergie o dieta e un commento). Le risposte vengono salvate nella vostra lista; siete voi a decidere su di esse e noi le trattiamo per vostro conto. Il modulo spiega a ogni invitato a cosa servono.",
        ],
      },
      {
        h: "5. Chi tratta i dati con noi",
        p: [
          "Ci avvaliamo di fornitori che trattano i dati per nostro conto, con le garanzie richieste dal GDPR:",
          "• Supabase: database e gestione degli account. I dati sono ospitati su server nell'Unione europea (Irlanda).",
          "• Stripe Payments Europe Ltd. (Irlanda): elaborazione dei pagamenti. Stripe tratta i dati di pagamento secondo la propria informativa.",
          "• Cloudflare: hosting e distribuzione del sito.",
          "• Resend: invio delle email dell'account (conferma e cambio password), da server nell'Unione europea (Irlanda).",
          "• Google (solo se scegli «Continua con Google»): Google ci fornisce nome, email e foto del profilo per l'accesso.",
          "• Consulenza fiscale e contabile, per adempiere ai nostri obblighi di legge.",
          "Alcuni di questi fornitori, o le loro società madri, si trovano negli Stati Uniti. I trasferimenti sono coperti dal Data Privacy Framework UE-USA o dalle clausole contrattuali tipo della Commissione europea.",
        ],
      },
      {
        h: "6. Per quanto tempo li conserviamo",
        p: [
          "Finché il tuo account è attivo. Se lo elimini o ci chiedi la cancellazione, elimineremo i tuoi dati entro 30 giorni, tranne i dati di fatturazione, che dobbiamo conservare per i periodi previsti dalla legge (in generale fino a 6 anni). Se elimini l'account dalle Impostazioni, il matrimonio e tutti i suoi dati (compresi i suggerimenti inviati) vengono cancellati subito; i backup tecnici si rinnovano entro un massimo di 30 giorni.",
        ],
      },
      {
        h: "7. I tuoi diritti",
        p: [
          "Puoi esercitare i diritti di accesso, rettifica, cancellazione, opposizione, limitazione del trattamento e portabilità, e revocare il consenso in qualsiasi momento, scrivendo a {email}. Indica quale diritto vuoi esercitare. Dalle Impostazioni puoi anche scaricare una copia di tutti i vostri dati o eliminare l'account in autonomia.",
          "Se ritieni che la tua richiesta non sia stata gestita correttamente, puoi presentare reclamo all'Agenzia spagnola per la protezione dei dati (www.aepd.es) o al Garante per la protezione dei dati personali.",
        ],
      },
      {
        h: "8. Sicurezza",
        p: [
          "Le connessioni sono cifrate (HTTPS), le password sono conservate in forma cifrata e ogni coppia può accedere solo ai dati del proprio matrimonio.",
        ],
      },
      { h: "9. Età minima", p: ["Il servizio è rivolto a persone maggiorenni (18 anni o più)."] },
      {
        h: "10. Modifiche",
        p: [
          "Possiamo aggiornare questa informativa. Se le modifiche sono rilevanti, ti avviseremo via email o nell'app.",
        ],
      },
    ],
  },

  cookies: {
    title: "Cookie policy",
    sections: [
      {
        h: "1. Cosa sono",
        p: [
          "I cookie e le tecnologie simili, come l'archiviazione locale del browser, sono piccoli file o dati che un sito salva sul tuo dispositivo per funzionare o ricordare informazioni.",
        ],
      },
      {
        h: "2. Cosa usiamo",
        p: [
          "Usiamo solo archiviazione tecnica, necessaria al funzionamento del servizio, che non richiede consenso:",
          "• Sessione utente (archiviazione locale, Supabase): mantiene l'accesso. Dura finché non esci.",
          "• Lingua (archiviazione locale): ricorda la lingua scelta. Dura finché non la cancelli.",
          "• Avvisi chiusi (archiviazione locale): ricorda che hai chiuso l'avviso per installare l'app, per non mostrarlo di nuovo. Dura finché non lo cancelli.",
          "Non usiamo cookie di analisi, pubblicità o social network.",
        ],
      },
      {
        h: "3. Terze parti",
        p: [
          "Al momento del pagamento si apre la pagina di Stripe, che usa i propri cookie per elaborare il pagamento e prevenire le frodi. Puoi consultarli nella cookie policy di Stripe.",
        ],
      },
      {
        h: "4. Come eliminarli",
        p: [
          "Puoi cancellare o bloccare i cookie e l'archiviazione locale dalle impostazioni del browser. In tal caso dovrai accedere di nuovo.",
        ],
      },
      {
        h: "5. Modifiche",
        p: [
          "Se in futuro useremo cookie che richiedono il tuo consenso, ad esempio di analisi, te lo chiederemo prima con un avviso.",
        ],
      },
    ],
  },

  condiciones: {
    title: "Condizioni di vendita e d'uso",
    sections: [
      {
        h: "1. Chi siamo",
        p: [
          "Queste condizioni regolano l'acquisto e l'uso di {brand}, venduto da {name}, NIF {nif}, con indirizzo in {address} ed email {email}. Sono rivolte a persone maggiorenni che acquistano come consumatori.",
        ],
      },
      {
        h: "2. Cosa include",
        p: [
          "{brand} è uno strumento web per organizzare il matrimonio: checklist, budget, confronto location, invitati e piantina dei tavoli, menù, fornitori e programma della giornata, oltre a un modello Excel da scaricare.",
          "La creazione dell'account è gratuita e include il Riepilogo e la Checklist. Le altre sezioni e il modello si sbloccano con il pagamento del piano.",
        ],
      },
      {
        h: "3. Prezzo e pagamento",
        p: [
          "Il piano costa 37 € in un unico pagamento, imposte incluse. Non ci sono abbonamenti né rate. Il prezzo applicabile è quello indicato sul sito al momento dell'acquisto.",
          "Il pagamento avviene con carta tramite Stripe, in modo sicuro. Riceverai la conferma dell'acquisto via email.",
        ],
      },
      {
        h: "4. Accesso e durata",
        p: [
          "L'accesso al piano completo si attiva automaticamente non appena il pagamento è confermato. L'accesso non ha scadenza finché il servizio resta attivo.",
          "Se un giorno smettessimo di offrire il servizio, vi avviseremmo con almeno 90 giorni di anticipo perché possiate conservare i vostri dati.",
          "L'account è della coppia: potete usarlo entrambi con le stesse credenziali. Siete responsabili di mantenere segreta la password.",
        ],
      },
      {
        h: "5. Diritto di recesso",
        p: [
          "In generale i consumatori hanno 14 giorni di calendario per recedere da un acquisto online. Tuttavia, trattandosi di contenuto digitale fornito immediatamente e non su supporto materiale, ai sensi dell'articolo 103, lettera m), della legge generale spagnola per la tutela dei consumatori e degli utenti (Real Decreto Legislativo 1/2007) e della Direttiva 2011/83/UE, il diritto di recesso non si applica quando, prima di pagare, dai il tuo consenso espresso all'inizio immediato dell'accesso e riconosci di perdere così tale diritto.",
          "Questo consenso viene raccolto con una casella obbligatoria prima del pagamento.",
        ],
      },
      {
        h: "6. Garanzia",
        p: [
          "Il servizio deve funzionare come descritto. Se qualcosa non funziona, scrivici a {email} e lo risolveremo. Se non fosse possibile, potrai chiedere una riduzione del prezzo o la risoluzione del contratto, in base alla garanzia legale per i contenuti e i servizi digitali.",
        ],
      },
      {
        h: "7. Uso consentito",
        p: [
          "Il piano è per uso personale, per organizzare il vostro matrimonio. Non è consentito rivendere l'accesso, condividere il modello con terzi né copiare l'app o i suoi contenuti.",
        ],
      },
      {
        h: "8. Disponibilità e responsabilità",
        p: [
          "Lavoriamo perché il servizio sia sempre disponibile, anche se possono verificarsi interruzioni occasionali per manutenzione o per cause indipendenti dalla nostra volontà. Ti consigliamo di conservare una copia delle informazioni più importanti; anche per questo c'è il modello Excel.",
          "{brand} è uno strumento di organizzazione. Non siamo wedding planner né intermediari con i fornitori, e le cifre indicative del sito non sono preventivi reali.",
        ],
      },
      {
        h: "9. Modifiche alle condizioni",
        p: [
          "Possiamo aggiornare queste condizioni. A ogni acquisto si applicano le condizioni in vigore al momento in cui viene effettuato.",
        ],
      },
      {
        h: "10. Contatti, reclami e legge applicabile",
        p: [
          "Per qualsiasi domanda o reclamo scrivici a {email}. Queste condizioni sono regolate dalla legge spagnola, fatte salve le norme imperative a tutela dei consumatori del tuo paese di residenza. Se sei un consumatore, puoi rivolgerti ai tribunali del tuo luogo di residenza.",
        ],
      },
    ],
  },
};

export default docs;

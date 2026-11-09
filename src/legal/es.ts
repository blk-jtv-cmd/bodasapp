import type { LegalDocs } from "./types";

const docs: LegalDocs = {
  "aviso-legal": {
    title: "Aviso legal",
    sections: [
      {
        h: "1. Titular de la web",
        p: [
          "En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE), se informa de los datos del titular de esta web:",
          "• Titular: {name}",
          "• NIF: {nif}",
          "• Domicilio: {address}",
          "• Email: {email}",
          "• Actividad: venta online de una herramienta digital para organizar bodas, comercializada con la marca {brand}.",
        ],
      },
      {
        h: "2. Objeto",
        p: [
          "Este aviso legal regula el acceso y el uso de la web y de la aplicación {brand}. Al navegar por la web o crear una cuenta aceptas estas condiciones. La compra del plan se rige además por las Condiciones de venta.",
        ],
      },
      {
        h: "3. Uso de la web",
        p: [
          "Te comprometes a usar la web de forma lícita y de buena fe. En particular, no está permitido: acceder o intentar acceder a cuentas ajenas, introducir virus o código dañino, sobrecargar el servicio de forma intencionada ni utilizarlo para fines ilícitos o que vulneren derechos de terceros.",
        ],
      },
      {
        h: "4. Propiedad intelectual e industrial",
        p: [
          "Los textos, el diseño, el logotipo, la marca, el código de la aplicación y la plantilla en Excel pertenecen a {name} o se usan con licencia. Se concede un derecho de uso personal y no exclusivo. No está permitido copiar, revender, distribuir ni poner a disposición de terceros la aplicación o la plantilla sin autorización por escrito.",
        ],
      },
      {
        h: "5. Responsabilidad",
        p: [
          "La información de la web, incluida la calculadora de presupuesto, es orientativa y no constituye asesoramiento profesional. Las decisiones sobre vuestra boda y la contratación de proveedores son vuestras.",
          "Trabajamos para que el servicio esté siempre disponible, pero no podemos garantizar que funcione sin interrupciones ni errores. La web puede incluir enlaces a webs de terceros, de cuyo contenido no somos responsables.",
          "Cada persona usuaria es responsable de los datos que introduce en su cuenta.",
        ],
      },
      {
        h: "6. Legislación aplicable",
        p: [
          "Este aviso legal se rige por la legislación española. Si actúas como consumidor, podrás acudir a los juzgados de tu domicilio.",
        ],
      },
    ],
  },

  privacidad: {
    title: "Política de privacidad",
    sections: [
      {
        h: "1. Responsable del tratamiento",
        p: ["{name}, con NIF {nif}, domicilio en {address} y email {email}."],
      },
      {
        h: "2. Qué datos tratamos",
        p: [
          "• Datos de la cuenta: email, contraseña (guardada cifrada; nosotros no podemos verla) y los nombres de la pareja.",
          "• Datos que introducís para organizar la boda: fecha, lugar, presupuesto, tareas, proveedores, fincas, menú, cronograma y lista de invitados (nombre, grupo, mesa, acompañantes, si es un niño o una niña, alergias o dieta, confirmación de asistencia y notas).",
          "• Datos del pago: el pago lo gestiona Stripe. Nosotros no vemos ni guardamos los datos de la tarjeta; solo recibimos la confirmación del pago, el email y el identificador de la operación.",
          "• Sugerencias que nos enviáis desde Ajustes: el mensaje y el email de la cuenta.",
          "• Datos técnicos: el idioma elegido y la sesión iniciada en tu navegador.",
        ],
      },
      {
        h: "3. Para qué los usamos y base legal",
        p: [
          "• Prestar el servicio: crear y mantener tu cuenta y guardar vuestra planificación. Base legal: ejecución del contrato (art. 6.1.b RGPD).",
          "• Gestionar el pago, la facturación y las obligaciones contables y fiscales. Base legal: contrato y obligación legal (art. 6.1.b y 6.1.c RGPD).",
          "• Responder a tus consultas. Base legal: tu solicitud y nuestro interés legítimo en atenderte (art. 6.1.f RGPD).",
          "• Mantener la seguridad del servicio y prevenir abusos. Base legal: interés legítimo (art. 6.1.f RGPD).",
          "• Leer vuestras sugerencias y usarlas para mejorar la herramienta. Base legal: interés legítimo (art. 6.1.f RGPD).",
          "No enviamos publicidad sin tu consentimiento, no vendemos datos y no tomamos decisiones automatizadas ni elaboramos perfiles.",
        ],
      },
      {
        h: "4. Datos de vuestros invitados y proveedores",
        p: [
          "Al añadir datos de otras personas (invitados, proveedores) garantizáis que podéis hacerlo, por ejemplo porque os los han dado para organizar la boda, y que solo los usaréis con ese fin. Nosotros solo los tratamos para prestaros el servicio y por cuenta vuestra.",
          "Alergias y dieta: saber que un invitado es celíaco o alérgico es información de salud (art. 9 RGPD). Es un campo opcional que solo sirve para organizar el menú con el catering. No usamos esa información para nada más, no la compartimos con nadie y solo accedemos a ella si hace falta para resolver una incidencia que nos planteéis. Si lo preferís, podéis dejarlo en blanco y contárselo directamente al catering.",
          "Niños y niñas: podéis marcar a un invitado como niño o niña para calcular los menús infantiles. No pedimos edad ni fecha de nacimiento; basta con el nombre.",
          "Si un invitado os pide corregir o borrar sus datos, podéis hacerlo en cualquier momento desde la lista de invitados.",
        ],
      },
      {
        h: "5. Quién trata los datos con nosotros",
        p: [
          "Usamos proveedores que tratan datos por nuestra cuenta, con las garantías que exige el RGPD:",
          "• Supabase: base de datos y gestión de cuentas. Los datos se alojan en servidores de la Unión Europea (Irlanda).",
          "• Stripe Payments Europe Ltd. (Irlanda): procesamiento de pagos. Stripe trata los datos de pago según su propia política de privacidad.",
          "• Cloudflare: alojamiento y entrega de la web.",
          "• Resend: envío de los correos de la cuenta (confirmación y cambio de contraseña), desde servidores de la Unión Europea (Irlanda).",
          "• Google (solo si eliges «Continuar con Google»): Google nos facilita tu nombre, email y foto de perfil para iniciar sesión.",
          "• Asesoría fiscal y contable, para cumplir nuestras obligaciones legales.",
          "Algunos de estos proveedores, o sus empresas matrices, están en Estados Unidos. Las transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo de la Comisión Europea.",
        ],
      },
      {
        h: "6. Cuánto tiempo los guardamos",
        p: [
          "Mientras tu cuenta esté activa. Si la borras o nos pides su supresión, eliminaremos tus datos en un máximo de 30 días, salvo los datos de facturación, que debemos conservar durante los plazos que marca la ley (en general, hasta 6 años). Si borras la cuenta desde Ajustes, la boda y todos sus datos (incluidas las sugerencias enviadas) se eliminan al momento; las copias de seguridad técnicas se renuevan en un máximo de 30 días.",
        ],
      },
      {
        h: "7. Tus derechos",
        p: [
          "Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad, y retirar tu consentimiento cuando quieras, escribiendo a {email}. Indica qué derecho quieres ejercer. Desde Ajustes también puedes descargar una copia de todos vuestros datos o borrar la cuenta tú mismo.",
          "Si consideras que no hemos atendido bien tu solicitud, puedes reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).",
        ],
      },
      {
        h: "8. Seguridad",
        p: [
          "Las conexiones van cifradas (HTTPS), las contraseñas se guardan cifradas y cada pareja solo puede acceder a los datos de su propia boda.",
        ],
      },
      {
        h: "9. Edad mínima",
        p: ["El servicio está dirigido a personas mayores de 18 años."],
      },
      {
        h: "10. Cambios",
        p: [
          "Podemos actualizar esta política. Si los cambios son importantes, te avisaremos por email o en la propia aplicación.",
        ],
      },
    ],
  },

  cookies: {
    title: "Política de cookies",
    sections: [
      {
        h: "1. Qué son",
        p: [
          "Las cookies y tecnologías parecidas, como el almacenamiento local del navegador, son pequeños archivos o datos que una web guarda en tu dispositivo para funcionar o recordar información.",
        ],
      },
      {
        h: "2. Qué usamos",
        p: [
          "Solo usamos almacenamiento técnico, necesario para que el servicio funcione. Está exento de consentimiento según el artículo 22.2 de la LSSI-CE:",
          "• Sesión de usuario (almacenamiento local, Supabase): mantiene tu sesión iniciada. Dura hasta que cierras sesión.",
          "• Idioma (almacenamiento local): recuerda el idioma que has elegido. Dura hasta que lo borras.",
          "• Avisos cerrados (almacenamiento local): recuerda que has cerrado el aviso para instalar la app, para no volver a mostrarlo. Dura hasta que lo borras.",
          "No usamos cookies de análisis, de publicidad ni de redes sociales.",
        ],
      },
      {
        h: "3. Terceros",
        p: [
          "Al pagar se abre la página de pago de Stripe, que usa sus propias cookies para procesar el pago y prevenir el fraude. Puedes consultarlas en la política de cookies de Stripe.",
        ],
      },
      {
        h: "4. Cómo eliminarlas",
        p: [
          "Puedes borrar o bloquear las cookies y el almacenamiento local desde la configuración de tu navegador. Si lo haces, tendrás que volver a iniciar sesión.",
        ],
      },
      {
        h: "5. Cambios",
        p: [
          "Si en el futuro usamos cookies que necesiten tu consentimiento, por ejemplo de análisis, te lo pediremos antes con un aviso.",
        ],
      },
    ],
  },

  condiciones: {
    title: "Condiciones de venta y uso",
    sections: [
      {
        h: "1. Quiénes somos",
        p: [
          "Estas condiciones regulan la compra y el uso de {brand}, que vende {name}, con NIF {nif}, domicilio en {address} y email {email}. Están dirigidas a personas mayores de edad que compran como consumidoras.",
        ],
      },
      {
        h: "2. Qué incluye",
        p: [
          "{brand} es una herramienta web para organizar la boda: checklist, presupuesto, comparador de fincas, invitados y plano de mesas, menú, proveedores y cronograma del día, además de una plantilla en Excel descargable.",
          "Crear la cuenta es gratis e incluye el Resumen y el Checklist. El resto de secciones y la plantilla se desbloquean con el pago del plan.",
        ],
      },
      {
        h: "3. Precio y pago",
        p: [
          "El plan cuesta 37 € en un único pago, impuestos incluidos. No hay suscripciones ni cuotas. El precio aplicable es el que aparece en la web en el momento de la compra.",
          "El pago se hace con tarjeta a través de Stripe, de forma segura. Recibirás la confirmación de la compra por email.",
        ],
      },
      {
        h: "4. Acceso y duración",
        p: [
          "El acceso al plan completo se activa automáticamente en cuanto se confirma el pago. El acceso no tiene fecha de caducidad mientras el servicio siga en funcionamiento.",
          "Si algún día dejáramos de ofrecer el servicio, os avisaríamos con al menos 90 días de antelación para que podáis conservar vuestros datos.",
          "La cuenta es de la pareja: podéis usarla los dos con los mismos datos de acceso. Sois responsables de mantener la contraseña en secreto.",
        ],
      },
      {
        h: "5. Derecho de desistimiento",
        p: [
          "Con carácter general, los consumidores tienen 14 días naturales para desistir de una compra online. Sin embargo, al tratarse de contenido digital que se entrega al momento y sin soporte material, según el artículo 103.m) de la Ley General para la Defensa de los Consumidores y Usuarios (Real Decreto Legislativo 1/2007) y la Directiva 2011/83/UE, el derecho de desistimiento no se aplica cuando, antes de pagar, das tu consentimiento expreso para que el acceso empiece de inmediato y reconoces que, por ello, pierdes ese derecho.",
          "Ese consentimiento se recoge con una casilla obligatoria antes del pago.",
        ],
      },
      {
        h: "6. Garantía",
        p: [
          "El servicio debe funcionar tal como se describe. Si algo no funciona, escríbenos a {email} y lo solucionaremos. Si no fuera posible, podrás pedir una rebaja del precio o la resolución del contrato, según la garantía legal de los contenidos y servicios digitales.",
        ],
      },
      {
        h: "7. Uso permitido",
        p: [
          "El plan es para uso personal, para organizar vuestra propia boda. No está permitido revender el acceso, compartir la plantilla con terceros ni copiar la aplicación o sus contenidos.",
        ],
      },
      {
        h: "8. Disponibilidad y responsabilidad",
        p: [
          "Trabajamos para que el servicio esté siempre disponible, aunque puede haber interrupciones puntuales por mantenimiento o por causas ajenas. Te recomendamos guardar copia de la información más importante; para eso también tienes la plantilla en Excel.",
          "{brand} es una herramienta de organización. No somos wedding planners ni intermediarios con los proveedores, y las cifras orientativas de la web no son presupuestos reales.",
        ],
      },
      {
        h: "9. Cambios en estas condiciones",
        p: [
          "Podemos actualizar estas condiciones. A cada compra se le aplican las condiciones vigentes en el momento de realizarla.",
        ],
      },
      {
        h: "10. Contacto, reclamaciones y legislación",
        p: [
          "Para cualquier duda o reclamación, escríbenos a {email}. Estas condiciones se rigen por la legislación española, sin perjuicio de las normas imperativas de protección de los consumidores de tu país de residencia. Si eres consumidor, puedes acudir a los juzgados de tu domicilio.",
        ],
      },
    ],
  },
};

export default docs;

// Tareas sugeridas del checklist, con su guía.
// Los textos están en español y se traducen con t() (diccionarios de src/i18n).
// La fecha límite se calcula a partir de la fecha de la boda según la carpeta.

export type Priority = "alta" | "media" | "baja";

export type TaskGuide = {
  title: string;
  category: string;
  priority: Priority;
  /** Pasos que se pueden ir marcando dentro de la tarea. */
  steps: string[];
  /** Cuándo se puede dar por hecha. */
  done: string;
  /** Consejo corto (opcional). */
  tip?: string;
  /** Mensaje listo para copiar y mandar a un proveedor (opcional). */
  template?: string;
};

export const TASK_LIBRARY: TaskGuide[] = [
  // 12 meses antes
  {
    title: "Fijar la fecha y el presupuesto total",
    category: "12 meses antes",
    priority: "alta",
    steps: ["Elegir dos o tres fechas posibles", "Decidir cuánto queréis gastar como máximo", "Apuntarlo en Ajustes"],
    done: "Tenéis fecha (o temporada) y una cifra máxima que no vais a pasar.",
    tip: "Guardad un 10% del presupuesto para imprevistos.",
  },
  {
    title: "Elegir y reservar el lugar de la ceremonia",
    category: "12 meses antes",
    priority: "alta",
    steps: ["Decidir si será civil o religiosa", "Pedir disponibilidad para vuestra fecha", "Reservar y guardar la confirmación"],
    done: "La ceremonia tiene lugar, fecha y hora confirmados.",
    template: "Hola, nos casamos el [FECHA] y nos gustaría saber si tenéis disponibilidad para la ceremonia ese día y qué pasos hay que seguir para reservar. ¡Gracias!",
  },
  {
    title: "Reservar el espacio del banquete",
    category: "12 meses antes",
    priority: "alta",
    steps: ["Comparar fincas en la pestaña Fincas", "Visitar las dos favoritas", "Firmar la reserva y pagar la señal"],
    done: "Finca reservada con contrato firmado.",
    tip: "Preguntad si el catering va incluido o hay que traerlo de fuera.",
    template: "Hola, nos casamos el [FECHA] con unos [Nº] invitados. ¿Tenéis disponibilidad ese día? Nos gustaría recibir precios y concertar una visita. ¡Gracias!",
  },
  {
    title: "Pensar el estilo de la boda",
    category: "12 meses antes",
    priority: "media",
    steps: ["Guardar ideas que os gusten", "Elegir dos o tres colores", "Decidir el tono: íntima, clásica, de fiesta…"],
    done: "Podéis describir vuestra boda en una frase.",
  },
  // 10 meses antes
  {
    title: "Cerrar la lista inicial de invitados",
    category: "10 meses antes",
    priority: "alta",
    steps: ["Apuntar a todos en Invitados", "Repasar la lista juntos", "Ajustarla al presupuesto y a la finca"],
    done: "Tenéis una lista con un número aproximado de invitados.",
  },
  {
    title: "Buscar wedding planner (si queréis)",
    category: "10 meses antes",
    priority: "baja",
    steps: ["Decidir si os hace falta", "Pedir dos o tres presupuestos", "Contratar o descartarlo"],
    done: "Sabéis si contáis con wedding planner o lo organizáis vosotros.",
  },
  // 9 meses antes
  {
    title: "Contratar fotógrafo y vídeo",
    category: "9 meses antes",
    priority: "alta",
    steps: ["Ver bodas completas de cada fotógrafo", "Pedir tres presupuestos", "Firmar contrato y pagar la señal"],
    done: "Fotógrafo (y vídeo, si queréis) contratados.",
    template: "Hola, nos casamos el [FECHA] en [LUGAR]. Nos encanta vuestro trabajo: ¿tenéis disponibilidad y nos podéis pasar precios? ¡Gracias!",
  },
  {
    title: "Elegir la música (DJ o grupo)",
    category: "9 meses antes",
    priority: "alta",
    steps: ["Decidir música para ceremonia, cóctel y fiesta", "Pedir presupuestos", "Reservar"],
    done: "La música de todo el día está contratada.",
    template: "Hola, nos casamos el [FECHA] en [LUGAR] y buscamos música para [CEREMONIA / CÓCTEL / FIESTA]. ¿Tenéis disponibilidad y precios? ¡Gracias!",
  },
  // 8 meses antes
  {
    title: "Elegir los trajes y vestidos",
    category: "8 meses antes",
    priority: "alta",
    steps: ["Pedir cita en dos o tres tiendas", "Elegir y encargar", "Apuntar las fechas de las pruebas"],
    done: "Vestido y traje encargados, con fechas de prueba.",
    tip: "Los vestidos a medida tardan entre 6 y 8 meses.",
  },
  {
    title: "Reservar alojamiento para invitados de fuera",
    category: "8 meses antes",
    priority: "baja",
    steps: ["Buscar hoteles cerca de la finca", "Pedir precio para grupo", "Pasar la información a los invitados"],
    done: "Los invitados de fuera saben dónde dormir.",
  },
  // 6 meses antes
  {
    title: "Reservar catering y menú de prueba",
    category: "6 meses antes",
    priority: "alta",
    steps: ["Pedir presupuestos a dos o tres caterings", "Hacer la prueba de menú", "Elegir el menú y confirmar"],
    done: "Catering contratado y menú elegido.",
    tip: "Preguntad por menús infantiles y para alergias.",
    template: "Hola, nos casamos el [FECHA] con unos [Nº] invitados. Nos gustaría hacer una prueba de menú y conocer vuestras opciones. ¡Gracias!",
  },
  {
    title: "Enviar el Save the Date",
    category: "6 meses antes",
    priority: "media",
    steps: ["Diseñar el aviso", "Mandarlo a todos los invitados"],
    done: "Todos los invitados saben la fecha.",
  },
  {
    title: "Elegir las alianzas",
    category: "6 meses antes",
    priority: "media",
    steps: ["Probar estilos y tallas", "Encargarlas", "Decidir si las grabáis"],
    done: "Alianzas encargadas.",
  },
  {
    title: "Hacer los trámites de la ceremonia",
    category: "6 meses antes",
    priority: "alta",
    steps: ["Preguntar qué papeles os piden", "Reunir los documentos", "Entregarlos y apuntar las citas"],
    done: "El expediente está entregado y sabéis los pasos que faltan.",
  },
  // 4 meses antes
  {
    title: "Enviar las invitaciones",
    category: "4 meses antes",
    priority: "alta",
    steps: ["Cerrar el diseño", "Revisar direcciones y nombres", "Enviarlas y apuntar una fecha para confirmar"],
    done: "Invitaciones enviadas con fecha límite para responder.",
  },
  {
    title: "Contratar música y flores",
    category: "4 meses antes",
    priority: "media",
    steps: ["Elegir florista", "Decidir ramo, centros y decoración", "Confirmar presupuesto"],
    done: "Florista y decoración contratados.",
    template: "Hola, nos casamos el [FECHA] en [LUGAR]. Nos gustaría un presupuesto para ramo, centros de mesa y decoración de la ceremonia. ¡Gracias!",
  },
  {
    title: "Reservar el transporte",
    category: "4 meses antes",
    priority: "baja",
    steps: ["Decidir el coche de los novios", "Ver si hace falta autobús para invitados", "Reservar"],
    done: "Sabéis cómo llega todo el mundo a la boda y cómo vuelve.",
  },
  // 3 meses antes
  {
    title: "Organizar las despedidas de soltero",
    category: "3 meses antes",
    priority: "baja",
    steps: ["Hablar con los amigos", "Elegir fecha que no choque con nada"],
    done: "Las despedidas tienen fecha.",
  },
  {
    title: "Comprar los detalles para invitados",
    category: "3 meses antes",
    priority: "baja",
    steps: ["Elegir el detalle", "Encargar uno por invitado"],
    done: "Los detalles están encargados.",
  },
  {
    title: "Prueba de peluquería y maquillaje",
    category: "3 meses antes",
    priority: "media",
    steps: ["Reservar profesional", "Hacer la prueba con fotos de referencia", "Confirmar horario del día B"],
    done: "Peinado y maquillaje decididos, con hora reservada.",
  },
  // 2 meses antes
  {
    title: "Confirmar a todos los proveedores",
    category: "2 meses antes",
    priority: "alta",
    steps: ["Revisar contratos en Proveedores", "Confirmar horas de llegada", "Apuntar los pagos pendientes"],
    done: "Cada proveedor sabe qué hace, a qué hora y cuánto falta por pagar.",
  },
  {
    title: "Preparar el cronograma del día",
    category: "2 meses antes",
    priority: "media",
    steps: ["Apuntar cada momento en Cronograma", "Repartir responsables"],
    done: "El día B está organizado hora a hora.",
  },
  // 1 mes antes
  {
    title: "Cerrar el número final de invitados",
    category: "1 mes antes",
    priority: "alta",
    steps: ["Llamar a quien no ha confirmado", "Apuntar alergias y menús infantiles", "Pasar el número final al catering"],
    done: "El catering tiene el número definitivo y las alergias.",
  },
  {
    title: "Hacer el plano de mesas",
    category: "1 mes antes",
    priority: "alta",
    steps: ["Crear las mesas en la pestaña Mesas", "Sentar a cada invitado", "Pasar el plano a la finca"],
    done: "Todos los invitados tienen mesa.",
  },
  {
    title: "Última prueba del vestido y del traje",
    category: "1 mes antes",
    priority: "media",
    steps: ["Probar con zapatos y complementos", "Decidir quién lo recoge"],
    done: "Vestido y traje listos para recoger.",
  },
  // 1 semana antes
  {
    title: "Repartir el cronograma del día",
    category: "1 semana antes",
    priority: "alta",
    steps: ["Mandarlo a proveedores", "Mandarlo a padrinos y testigos"],
    done: "Todos saben dónde tienen que estar y a qué hora.",
  },
  {
    title: "Preparar los pagos finales",
    category: "1 semana antes",
    priority: "alta",
    steps: ["Revisar lo pendiente en Presupuesto", "Preparar sobres o transferencias"],
    done: "Cada pago tiene fecha y forma de pago.",
  },
  // Día antes
  {
    title: "Dejar todo preparado",
    category: "Día antes",
    priority: "media",
    steps: ["Llevar decoración y detalles a la finca", "Preparar un neceser de emergencia", "Dormir bien"],
    done: "Todo lo que necesitáis mañana está listo.",
  },
  // Día B
  {
    title: "Disfrutar del día",
    category: "Día B",
    priority: "baja",
    steps: ["Delegar en alguien de confianza", "Comer algo antes de la ceremonia"],
    done: "¡Os habéis casado!",
  },
];

const BY_TITLE = new Map(TASK_LIBRARY.map((g) => [g.title, g]));

export function guideFor(title: string): TaskGuide | undefined {
  return BY_TITLE.get(title);
}

/** Meses (o días, en negativo) antes de la boda para cada carpeta. */
const OFFSETS: Record<string, { months?: number; days?: number }> = {
  "12 meses antes": { months: 12 },
  "10 meses antes": { months: 10 },
  "9 meses antes": { months: 9 },
  "8 meses antes": { months: 8 },
  "6 meses antes": { months: 6 },
  "4 meses antes": { months: 4 },
  "3 meses antes": { months: 3 },
  "2 meses antes": { months: 2 },
  "1 mes antes": { months: 1 },
  "1 semana antes": { days: 7 },
  "Día antes": { days: 1 },
  "Día B": { days: 0 },
};

/**
 * Fecha sugerida (AAAA-MM-DD) según la carpeta y la fecha de la boda.
 * Si la pareja se apunta tarde (p. ej. a 5 meses de la boda), las tareas de "12 meses antes"
 * no nacen con retraso: se les da un margen de 2 semanas desde que se crearon.
 */
export function suggestedDue(category: string, weddingDate: string | null, createdAt?: string | null): string | null {
  const off = OFFSETS[category];
  if (!off || !weddingDate) return null;
  const wedding = new Date(`${weddingDate}T12:00:00`);
  if (Number.isNaN(wedding.getTime())) return null;
  const d = new Date(wedding);
  if (off.months) d.setMonth(d.getMonth() - off.months);
  if (off.days) d.setDate(d.getDate() - off.days);
  if (createdAt) {
    const floor = new Date(createdAt);
    if (!Number.isNaN(floor.getTime())) {
      floor.setDate(floor.getDate() + 14);
      if (d < floor) return (floor < wedding ? floor : wedding).toISOString().slice(0, 10);
    }
  }
  return d.toISOString().slice(0, 10);
}

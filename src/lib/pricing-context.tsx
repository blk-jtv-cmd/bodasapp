import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { pricingAt, type Pricing } from "./pricing";

/**
 * El precio que ha decidido el servidor, disponible en toda la web.
 * Lo rellena __root.tsx con lo que devuelve getPricing().
 */
const PricingContext = createContext<Pricing | null>(null);

export function PricingProvider({ value, children }: { value: Pricing | undefined; children: ReactNode }) {
  return <PricingContext.Provider value={value ?? null}>{children}</PricingContext.Provider>;
}

/** Precio actual. Si por lo que sea no llegó del servidor, se enseña el normal (sin oferta). */
export function usePricing(): Pricing {
  const p = useContext(PricingContext);
  return p ?? pricingAt(0);
}

/**
 * Milisegundos que quedan de oferta, contados desde la hora del servidor (no la del móvil).
 * Se actualiza cada 30 segundos; cuando llega a 0 la oferta se da por terminada en pantalla.
 */
export function useOfferRemaining(): number {
  const p = usePricing();
  const [remaining, setRemaining] = useState(() => (p.offer ? p.endsAt - p.now : 0));
  useEffect(() => {
    if (!p.offer) {
      setRemaining(0);
      return;
    }
    // Diferencia entre el reloj del servidor y el del dispositivo, medida al cargar.
    const skew = p.now - Date.now();
    const tick = () => setRemaining(Math.max(0, p.endsAt - (Date.now() + skew)));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [p.offer, p.endsAt, p.now]);
  return remaining;
}

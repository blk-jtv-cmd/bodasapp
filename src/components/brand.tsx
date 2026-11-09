import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-tu-boda-en-orden.png";

export const BRAND_NAME = "Tu Boda en Orden";

/** Nombre de la marca, a la izquierda de la barra superior. */
export function BrandName({ className = "" }: { className?: string }) {
  return (
    <Link
      to="/"
      className={`font-brand text-[1.7rem] leading-[0.9] sm:text-4xl sm:leading-none ${className}`}
    >
      {BRAND_NAME}
    </Link>
  );
}

/** Logo circular, en el centro de la barra superior. */
export function BrandLogo() {
  return (
    <Link to="/" aria-label={`${BRAND_NAME}, inicio`} className="justify-self-center">
      <img
        src={logo}
        alt={BRAND_NAME}
        width={64}
        height={64}
        className="h-12 w-12 sm:h-16 sm:w-16"
      />
    </Link>
  );
}

# Pendientes para el lanzamiento

## Cuando tengas el dominio (`tubodaenorden.com`)

- [x] Dominio `tubodaenorden.com` comprado en Cloudflare.
- [x] Email de contacto `hola@tubodaenorden.com` puesto en los textos legales (`src/legal/config.ts`).
- [x] `hola@tubodaenorden.com` activo en Cloudflare Email Routing → reenvía a `tubodaenorden@gmail.com`.
- [x] **Web publicada** en https://tubodaenorden.com (Cloudflare Workers, se actualiza sola al aprobar cambios en GitHub).
- [x] **Supabase → Authentication → URL Configuration**: Site URL = `https://tubodaenorden.com` y añadir `https://tubodaenorden.com/**` a Redirect URLs.
- [x] **Stripe** (modo prueba): cambiar la redirección del enlace de pago a `https://tubodaenorden.com/panel?pago=ok`.
- [ ] **Inicio con Google sin la dirección de Supabase**:
  - Opción 1 (código): botón de Google integrado en la web (Google Identity Services + `signInWithIdToken`), para que Google muestre "continuar a tubodaenorden.com".
  - Opción 2 (Google Cloud): Google Auth Platform → Marca/Branding con logo, web, enlaces a privacidad y condiciones y dominio verificado, para que salga "Tu Boda en Orden".
  - [x] Añadido `https://tubodaenorden.com` a los "Orígenes de JavaScript autorizados" del cliente OAuth.
- [ ] **Correos con tu marca** (Resend + dominio): confirmación de cuenta y recuperación de contraseña en los 5 idiomas. Después, volver a activar "Confirm email" en Supabase.

## Antes de vender

- [ ] **Stripe en modo real**: datos fiscales y bancarios; producto de 37 €; enlace de pago, webhook y secreto `STRIPE_WEBHOOK_SECRET` de modo real; actualizar `VITE_STRIPE_PAYMENT_LINK`. Opciones del enlace: nombre del cliente, códigos de promoción y aceptación de las condiciones (con la URL de `/legal/condiciones`).
- [ ] **Gestor**: confirmar el IVA incluido en los 37 €, la facturación y si hace falta Stripe Tax / OSS.
- [ ] **Revisión profesional** de los textos legales.
- [ ] **Revisión de las traducciones** (EN, IT, FR, PT) por nativos, sobre todo la página principal.
- [ ] **Compra real de prueba** de principio a fin.

## Mejoras opcionales

- [ ] Alojar las tipografías en la propia web en lugar de usar Google Fonts (mejor para la privacidad).
- [ ] Plantilla Excel en otros idiomas.
- [ ] Liberar espacio en el Mac (tenía menos de 3 GB libres).

# Pendientes para el lanzamiento

## Cuando tengas el dominio (`tubodaenorden.com`)

- [x] Dominio `tubodaenorden.com` comprado en Cloudflare.
- [x] Email de contacto `hola@tubodaenorden.com` puesto en los textos legales (`src/legal/config.ts`).
- [x] `hola@tubodaenorden.com` activo en Cloudflare Email Routing → reenvía a `tubodaenorden@gmail.com`.
- [x] **Web publicada** en https://tubodaenorden.com (Cloudflare Workers, se actualiza sola al aprobar cambios en GitHub).
- [x] **Supabase → Authentication → URL Configuration**: Site URL = `https://tubodaenorden.com` y añadir `https://tubodaenorden.com/**` a Redirect URLs.
- [x] **Stripe** (modo prueba): cambiar la redirección del enlace de pago a `https://tubodaenorden.com/panel?pago=ok`.
- [x] **Inicio con Google sin la dirección de Supabase**:
  - [x] Opción 1 (código): botón de Google integrado en la web (`src/components/google-button.tsx`). Requiere `VITE_GOOGLE_CLIENT_ID` en `.env` y en las variables de compilación de Cloudflare.
  - [x] Opción 2 (Google Cloud): Google Auth Platform → Marca/Branding con logo, web, enlaces a privacidad y condiciones y dominio verificado, para que salga "Tu Boda en Orden".
  - [x] Añadido `https://tubodaenorden.com` a los "Orígenes de JavaScript autorizados" del cliente OAuth.
- [x] **Correos con tu marca** (Resend + `hola@tubodaenorden.com`): confirmación y contraseña en 5 idiomas (`supabase/templates`). "Confirm email" activado de nuevo.
- [x] **Verificación de marca en Google**: verificada y publicada (6/11).
- [x] **Responder desde `hola@tubodaenorden.com`** en Gmail ("Enviar como", con el SMTP de Resend).

## Antes de vender

- [x] **Plano de mesas en el móvil**: rehacer el arrastre de la sección Mesas del panel con eventos de puntero (ratón + dedo); ahora usa arrastrar HTML5, que no va con el dedo en muchos móviles (sobre todo iPhone). En ordenador debe seguir igual.

- [x] **Stripe en modo real** (8/11): cuenta activada, producto de 37 €, enlace de pago, webhook y `STRIPE_WEBHOOK_SECRET` reales, `VITE_STRIPE_PAYMENT_LINK` actualizado en Cloudflare, marca (icono, colores) y recibos por email activados.
- [ ] **Gestor**: confirmar el IVA incluido en los 37 €, la facturación (¿facturas de Stripe o las suyas?) y si hace falta Stripe Tax / OSS para ventas a otros países de la UE.
- [ ] **Revisión profesional** de los textos legales.
- [ ] **Revisión de las traducciones** (EN, IT, FR, PT) por nativos, sobre todo la página principal.
- [x] **Compra real de prueba** de principio a fin (8/11, con Apple Pay): plan desbloqueado y pago reembolsado.

## Mejoras opcionales

- [x] Alojar las tipografías en la propia web en lugar de usar Google Fonts (mejor para la privacidad).
- [x] Plantilla Excel en 5 idiomas, con las fórmulas revisadas y corregidas (8/11). Archivos en Supabase Storage `descargas`: `plantilla-tu-boda-en-orden.xlsx` y `-en/-it/-fr/-pt`.
- [x] Liberar espacio en el Mac (cachés: ~11 GB libres). Para mucho más: copias del iPhone (193 GB) y Fotos (181 GB).

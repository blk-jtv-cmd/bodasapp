# Plantillas de correo (Supabase → Authentication → Emails)

Cada pareja recibe el correo en su idioma, según `user_metadata.lang` (lo guarda la app al registrarse, al entrar y al cambiar de idioma). Si no hay idioma, va en español.

| Plantilla en Supabase | Asunto (Subject) | Cuerpo (Body) |
|---|---|---|
| Confirm signup | `confirmacion-asunto.txt` | `confirmacion.html` |
| Reset password | `contrasena-asunto.txt` | `contrasena.html` |

Copia el contenido entero de cada archivo en su campo y guarda.

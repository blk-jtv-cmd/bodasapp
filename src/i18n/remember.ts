import { supabase } from "@/integrations/supabase/client";
import { getLang } from "./index";

/**
 * Guarda el idioma actual en la cuenta (user_metadata.lang) para que los correos
 * de Supabase (confirmación, contraseña…) lleguen en el idioma de cada pareja.
 */
export async function rememberLangInAccount() {
  try {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) return;
    const lang = getLang();
    if (user.user_metadata?.lang === lang) return;
    await supabase.auth.updateUser({ data: { lang } });
  } catch {
    /* no es importante si falla */
  }
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo, BrandName } from "@/components/brand";
import { LanguageSwitcher } from "@/i18n/switcher";
import { t as tr, useI18n } from "@/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar o crear cuenta — Tu Boda en Orden" },
      {
        name: "description",
        content:
          "Accede a tu plan de Tu Boda en Orden: checklist, presupuesto, invitados, proveedores y cronograma en un solo panel.",
      },
      { property: "og:title", content: "Entrar o crear cuenta — Tu Boda en Orden" },
      {
        property: "og:description",
        content: "Crea tu cuenta y empieza a organizar tu boda con Tu Boda en Orden por 37€.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signup" | "login" | "forgot" | "reset";

const inputCls =
  "w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-clay-ink";

function AuthPage() {
  const { t: tr } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  // Aviso de "revisad vuestro correo": por confirmación de cuenta o por cambio de contraseña.
  const [notice, setNotice] = useState<{ kind: "confirm" | "reset"; email: string } | null>(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const isRecovery =
      hash.get("type") === "recovery" ||
      new URLSearchParams(window.location.search).get("reset") === "1";

    // Enlace caducado o ya usado.
    if (hash.get("error_description")) {
      toast.error(tr("El enlace ha caducado o ya se ha usado. Pedid uno nuevo."));
      window.history.replaceState(null, "", window.location.pathname);
      setMode("login");
      return;
    }

    if (isRecovery) setMode("reset");

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
    });

    // Leer la sesión también procesa los enlaces de los correos (#access_token=...).
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && !isRecovery) navigate({ to: "/panel" });
    });

    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setNotice(null);
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/panel`,
            data: { display_name: names || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          // La confirmación por correo está desactivada: entran directamente.
          toast.success(tr("Cuenta creada. Ya podéis empezar."));
          navigate({ to: "/panel" });
        } else {
          // Hay que confirmar el correo antes de entrar.
          setNotice({ kind: "confirm", email });
          setMode("login");
          setPassword("");
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/panel" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=1`,
        });
        if (error) throw error;
        setNotice({ kind: "reset", email });
        setMode("login");
      } else {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success(tr("Contraseña cambiada. ¡Bienvenidos de nuevo!"));
        window.history.replaceState(null, "", window.location.pathname);
        navigate({ to: "/panel" });
      }
    } catch (err) {
      toast.error(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/panel`,
      },
    });
    if (error) {
      toast.error(tr("No hemos podido entrar con Google"));
      return;
    }
  }

  const titles: Record<Mode, [string, string]> = {
    signup: ["Crea vuestro plan", "Una cuenta para los dos novios, con todo guardado."],
    login: ["Volved a vuestro plan", "Entrad y seguid donde lo dejasteis."],
    forgot: [
      "¿Habéis olvidado la contraseña?",
      "Escribid vuestro email y os enviaremos un enlace para crear una nueva.",
    ],
    reset: ["Elegid una contraseña nueva", "Escribidla y entraréis directamente a vuestro plan."],
  };
  const submitLabel: Record<Mode, string> = {
    signup: "Crear cuenta",
    login: "Entrar",
    forgot: "Enviar enlace",
    reset: "Guardar contraseña",
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-2">
          <BrandName className="justify-self-start" />
          <BrandLogo />
          <div className="flex items-center gap-3 justify-self-end">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground sm:inline">
              {tr("Plan · 37€")}
            </span>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-balance font-display text-4xl tracking-tight">{tr(titles[mode][0])}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{tr(titles[mode][1])}</p>

        {(mode === "signup" || mode === "login") && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="mt-8 w-full rounded-full border border-line bg-panel px-5 py-3 text-sm font-medium transition-colors hover:bg-clay-soft"
            >
              {tr("Continuar con Google")}
            </button>

            <div className="my-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="h-px flex-1 bg-line" />{tr("o")}<span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}
        {(mode === "forgot" || mode === "reset") && <div className="mt-8" />}

        {notice && (
          <div className="mb-6 rounded-2xl bg-clay-soft px-5 py-4 text-sm">
            <div className="font-display text-lg font-semibold">{tr("Revisad vuestro correo")}</div>
            <p className="mt-1 text-muted-foreground">
              {(() => {
                // El email va en negrita en mitad de la frase, sea cual sea el idioma.
                const [before, after = ""] = tr(
                  notice.kind === "confirm"
                    ? "Os hemos enviado un enlace a {email} para confirmar la cuenta. Pulsadlo y después entrad aquí con vuestro email y contraseña."
                    : "Os hemos enviado un enlace a {email} para crear una contraseña nueva. Abridlo en este mismo dispositivo.",
                ).split("{email}");
                return (
                  <>
                    {before}
                    <strong className="text-foreground">{notice.email}</strong>
                    {after}
                  </>
                );
              })()}{" "}
              {tr("Si no lo veis, mirad en la carpeta de spam.")}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder={tr("Vuestros nombres")}
              className={inputCls}
            />
          )}
          {mode !== "reset" && (
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={tr("Email")}
              className={inputCls}
            />
          )}
          {mode !== "forgot" && (
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "reset" ? tr("Contraseña nueva (mínimo 6 caracteres)") : tr("Contraseña")}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className={inputCls}
            />
          )}
          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-xs text-muted-foreground underline decoration-clay/40 underline-offset-4 hover:text-foreground"
              >
                {tr("¿Habéis olvidado la contraseña?")}
              </button>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-clay px-5 py-3 font-medium text-foreground transition-colors hover:bg-clay-ink hover:text-background disabled:opacity-60"
          >
            {loading ? tr("Un momento…") : tr(submitLabel[mode])}
          </button>
        </form>

        {mode !== "reset" && (
          <button
            type="button"
            onClick={() => switchMode(mode === "signup" ? "login" : mode === "login" ? "signup" : "login")}
            className="mt-6 text-sm text-muted-foreground underline decoration-clay/40 underline-offset-4 hover:text-foreground"
          >
            {mode === "signup"
              ? tr("Ya tenemos cuenta")
              : mode === "login"
                ? tr("Aún no tenemos cuenta")
                : tr("Volver a entrar")}
          </button>
        )}
      </main>
    </div>
  );
}

function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return tr("El email o la contraseña no son correctos.");
  if (m.includes("email not confirmed"))
    return tr("Todavía no habéis confirmado el email. Revisad vuestro correo (y la carpeta de spam).");
  if (m.includes("already registered") || m.includes("already been registered"))
    return tr("Ya existe una cuenta con este email. Pulsad «Ya tenemos cuenta» para entrar.");
  if (m.includes("password should be at least") || m.includes("weak password"))
    return tr("La contraseña es demasiado corta. Usad al menos 6 caracteres.");
  if (m.includes("rate limit") || m.includes("security purposes"))
    return tr("Demasiados intentos seguidos. Esperad un minuto y volved a probar.");
  if (m.includes("same password") || m.includes("different from the old"))
    return tr("La contraseña nueva tiene que ser distinta de la anterior.");
  if (m.includes("session") && m.includes("missing"))
    return tr("El enlace ha caducado. Pedid uno nuevo desde «¿Habéis olvidado la contraseña?».");
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return tr("Ese email no parece válido.");
  return message || tr("Algo no ha salido bien. Volved a intentarlo.");
}

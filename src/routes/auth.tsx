import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar o crear cuenta — Coro" },
      {
        name: "description",
        content:
          "Accede a tu plan de boda de Coro: checklist, presupuesto, invitados, proveedores y cronograma en un solo panel.",
      },
      { property: "og:title", content: "Entrar o crear cuenta — Coro" },
      {
        property: "og:description",
        content: "Crea tu cuenta y empieza a organizar tu boda con Coro por 27€.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [names, setNames] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/panel" });
    });
  }, [navigate]);

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
          toast.success("Cuenta creada. Ya podéis empezar.");
          navigate({ to: "/panel" });
        } else {
          // Hay que confirmar el correo antes de entrar.
          setSentTo(email);
          setMode("login");
          setPassword("");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
      toast.error("No hemos podido entrar con Google");
      return;
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-foreground">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="font-display text-2xl font-semibold tracking-tight">
            Coro
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
            Plan · 27€
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <h1 className="text-balance font-display text-4xl tracking-tight">
          {mode === "signup" ? "Crea vuestro plan" : "Volved a vuestro plan"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {mode === "signup"
            ? "Una cuenta para los dos novios, con todo guardado."
            : "Entrad y seguid donde lo dejasteis."}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          className="mt-8 w-full rounded-full border border-line bg-panel px-5 py-3 text-sm font-medium transition-colors hover:bg-clay-soft"
        >
          Continuar con Google
        </button>

        <div className="my-6 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-line" />o<span className="h-px flex-1 bg-line" />
        </div>

        {sentTo && (
          <div className="mb-6 rounded-2xl bg-clay-soft px-5 py-4 text-sm">
            <div className="font-display text-lg font-semibold">Revisad vuestro correo</div>
            <p className="mt-1 text-muted-foreground">
              Os hemos enviado un enlace a <strong className="text-foreground">{sentTo}</strong> para
              confirmar la cuenta. Pulsadlo y después entrad aquí con vuestro email y contraseña. Si no
              lo veis, mirad en la carpeta de spam.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <input
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Vuestros nombres"
              className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-clay"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-clay"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm outline-none focus:border-clay"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-clay px-5 py-3 font-medium text-background transition-colors hover:bg-foreground disabled:opacity-60"
          >
            {loading ? "Un momento…" : mode === "signup" ? "Crear cuenta" : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setSentTo(null);
          }}
          className="mt-6 text-sm text-muted-foreground underline decoration-clay/40 underline-offset-4 hover:text-foreground"
        >
          {mode === "signup" ? "Ya tenemos cuenta" : "Aún no tenemos cuenta"}
        </button>
      </main>
    </div>
  );
}

function translateAuthError(err: unknown): string {
  const message = err instanceof Error ? err.message : "";
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "El email o la contraseña no son correctos.";
  if (m.includes("email not confirmed"))
    return "Todavía no habéis confirmado el email. Revisad vuestro correo (y la carpeta de spam).";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Ya existe una cuenta con este email. Pulsad «Ya tenemos cuenta» para entrar.";
  if (m.includes("password should be at least") || m.includes("weak password"))
    return "La contraseña es demasiado corta. Usad al menos 6 caracteres.";
  if (m.includes("rate limit") || m.includes("security purposes"))
    return "Demasiados intentos seguidos. Esperad un minuto y volved a probar.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "Ese email no parece válido.";
  return message || "Algo no ha salido bien. Volved a intentarlo.";
}

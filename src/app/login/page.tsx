"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, AtSign, HelpCircle, Key, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/products";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.replace(redirect);
    router.refresh();
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-white text-zinc-900">
      {/* Ambient color washes */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-[520px] w-[520px] rounded-full bg-red-100/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 bottom-0 h-[520px] w-[520px] rounded-full bg-yellow-100/60 blur-3xl"
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-zinc-900"
        >
          FimeTienda
        </Link>
        <button
          type="button"
          aria-label="Ayuda"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-white transition-colors hover:bg-zinc-700"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 pb-16">
        <div className="relative w-full max-w-md">
          {/* Left accent bar */}
          <div
            aria-hidden
            className="absolute -left-px top-10 bottom-10 w-0.5 bg-red-600"
          />

          {/* Secure access badge */}
          <div className="absolute -top-3 left-10 z-10 inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-red-600/25">
            <Lock className="h-3.5 w-3.5" />
            Acceso Seguro
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-lg bg-white px-10 pb-10 pt-12 shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-200/60"
          >
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              FimeTienda
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Diseñado para tu estilo de vida de alto rendimiento.
              <br />
              Autentícate para continuar.
            </p>

            <div className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-bold uppercase tracking-wider text-zinc-700"
                >
                  Correo electrónico
                </Label>
                <InputWithIcon
                  icon={<AtSign className="h-4 w-4" />}
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="nombre@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wider text-zinc-700"
                  >
                    Contraseña
                  </Label>
                  <Link
                    href="#"
                    className="text-xs font-bold uppercase tracking-wider text-red-600 hover:text-red-700"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <InputWithIcon
                  icon={<Key className="h-4 w-4" />}
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="mt-7 h-12 w-full gap-2 bg-gradient-to-b from-red-600 to-red-700 text-base font-bold text-white shadow-lg shadow-red-600/30 hover:from-red-700 hover:to-red-800"
            >
              {loading ? "Entrando…" : "Iniciar sesión"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="my-7 h-px bg-zinc-200" />

            <button
              type="button"
              className="flex h-11 w-full items-center justify-center gap-3 rounded-md bg-zinc-100 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-200"
            >
              <GoogleMark />
              Entrar con Google
            </button>

            <p className="mt-6 text-center text-sm text-zinc-500">
              ¿Nuevo por aquí?{" "}
              <Link
                href="/signup"
                className="font-semibold text-red-600 hover:text-red-700"
              >
                Crea una cuenta
              </Link>
            </p>
          </form>

          {/* Status bar */}
          <div className="mt-10 grid grid-cols-3 gap-6 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            <StatusCell label="Estado del sistema" tone="yellow" />
            <StatusCell label="Nodo cifrado" tone="red" />
            <StatusCell label="v 2.0.4 – PRE" tone="muted" />
          </div>
        </div>
      </main>
    </div>
  );
}

function InputWithIcon({
  icon,
  className,
  ...props
}: React.ComponentProps<"input"> & { icon: React.ReactNode }) {
  return (
    <div className="relative">
      <Input
        {...props}
        className={cn(
          "h-12 rounded-md border-zinc-200 bg-zinc-100/70 pr-11 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:border-red-500 focus-visible:ring-red-500/20",
          className
        )}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
        {icon}
      </span>
    </div>
  );
}

function StatusCell({
  label,
  tone,
}: {
  label: string;
  tone: "yellow" | "red" | "muted";
}) {
  const bar =
    tone === "yellow"
      ? "bg-yellow-400"
      : tone === "red"
        ? "bg-red-200"
        : "bg-zinc-200";
  return (
    <div className="space-y-1.5">
      <span>{label}</span>
      <div className={cn("h-0.5 w-full", bar)} />
    </div>
  );
}

function GoogleMark() {
  return (
    <span
      aria-hidden
      className="flex h-5 w-5 items-center justify-center rounded-sm bg-zinc-900 text-[10px] font-bold text-white"
    >
      G
    </span>
  );
}

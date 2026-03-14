"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerSchema } from "@/lib/validators";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    // Confirm password check
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Les mots de passe ne correspondent pas" });
      return;
    }

    // Client-side validation with zod
    const validation = registerSchema.safeParse({ email, username, password });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(data.details)) {
            if (Array.isArray(messages) && messages.length > 0) {
              fieldErrors[key] = messages[0];
            }
          }
          setErrors(fieldErrors);
        } else {
          setGlobalError(data.error || "Une erreur est survenue");
        }
        return;
      }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError("Compte cree ! Connectez-vous.");
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setGlobalError("Une erreur est survenue. Reessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="mb-6 text-center text-xl font-semibold text-text">
        Creer un compte
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          required
          autoComplete="email"
        />

        <Input
          label="Pseudo"
          type="text"
          placeholder="TonPseudo"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          error={errors.username}
          required
          autoComplete="username"
        />

        <Input
          label="Mot de passe"
          type="password"
          placeholder="6 caracteres minimum"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          autoComplete="new-password"
        />

        <Input
          label="Confirmer le mot de passe"
          type="password"
          placeholder="••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        {globalError && (
          <p className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm text-[#EF4444]">
            {globalError}
          </p>
        )}

        <Button type="submit" loading={loading} className="mt-2 w-full">
          Creer mon compte
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Deja un compte ?{" "}
        <Link
          href="/login"
          className="font-medium text-accent hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}

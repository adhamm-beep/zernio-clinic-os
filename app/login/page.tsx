"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
        signal: controller.signal,
      });
      const result = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok) {
        setMessage(result.error || "Sign in failed.");
        setLoading(false);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "Login request timed out. Check your connection and try again."
          : "Could not connect to the login service. Try again."
      );
      setLoading(false);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setMessage("Enter your email address first.");
      return;
    }

    setResetLoading(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setResetLoading(false);
    setMessage(
      error
        ? error.message
        : "Password reset link sent. Check your email inbox and spam folder."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Zernio Clinic OS
        </h1>

        <p className="mt-2 text-center text-gray-500">
          Sign in to continue
        </p>

        <label className="mt-8 block text-sm font-medium text-gray-700">
          Email
        </label>

        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
          placeholder="name@panthera.sa"
        />

        <label className="mt-5 block text-sm font-medium text-gray-700">
          Password
        </label>

        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 text-gray-900 outline-none focus:border-green-600"
          placeholder="Enter your password"
        />

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading || loading}
          className="mt-3 w-full rounded-lg px-5 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
        >
          {resetLoading ? "Sending reset link..." : "Forgot password?"}
        </button>
      </form>
    </main>
  );
}

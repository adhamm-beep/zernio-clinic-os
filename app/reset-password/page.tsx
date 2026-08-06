"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(
        error.message || "The recovery link is invalid or has expired. Request a new link."
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={updatePassword}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg"
      >
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Choose a new password
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Use at least 8 characters and keep it private.
        </p>

        <label className="mt-8 block text-sm font-medium text-gray-700">
          New password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-600"
        />

        <label className="mt-5 block text-sm font-medium text-gray-700">
          Confirm new password
        </label>
        <input
          type="password"
          required
          minLength={8}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className="mt-2 w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-green-600"
        />

        {message && (
          <p className="mt-4 text-center text-sm text-red-600">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-green-600 px-5 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Updating password..." : "Update password"}
        </button>
      </form>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useClinic } from "@/features/clinic/hooks/useClinic";

export default function Header() {
  const router = useRouter();
  const { clinic, selectedBranch } = useClinic();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-8">
      <h2 className="text-2xl font-bold">
        Dashboard
      </h2>

      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span>
          {clinic?.name ?? "Clinic"}
          {selectedBranch ? ` · ${selectedBranch.name}` : ""}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="rounded-lg border px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

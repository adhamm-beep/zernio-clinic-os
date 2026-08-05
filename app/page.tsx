"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";

export default function Home() {
  const [search, setSearch] = useState("");

  return (
    <main className="min-h-screen bg-gray-100 p-10">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-center">
          Zernio Clinic OS
        </h1>

        <p className="mt-2 text-center text-gray-500">
          AI Powered Clinic Management System
        </p>

        <div className="mt-8">
          <SearchBar
            value={search}
            onChange={setSearch}
          />
        </div>

        <div className="mt-6 rounded-lg border border-dashed p-6 text-center text-gray-500">
          Search results will appear here...
        </div>
      </div>
    </main>
  );
}
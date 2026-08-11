"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import RealtimeDataSync from "@/components/RealtimeDataSync";
import { LocaleProvider } from "@/components/LocaleProvider";
import SystemTranslationBridge from "@/components/SystemTranslationBridge";

export default function Providers({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <SystemTranslationBridge />
        <RealtimeDataSync />
        {children}
      </LocaleProvider>
    </QueryClientProvider>
  );
}

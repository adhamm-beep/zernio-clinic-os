import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import Providers from "@/components/Providers";
import NativePickerEnhancer from "@/components/NativePickerEnhancer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Panthera Clinics OS",
  description: "Panthera Clinics operating system",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A request-time render lets Next apply the per-request CSP nonce.
  await headers();
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning className="font-sans">
      <body suppressHydrationWarning>
  <Providers>
    <NativePickerEnhancer />
    {children}
    <Toaster richColors position="top-right" />
  </Providers>
</body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import NativePickerEnhancer from "@/components/NativePickerEnhancer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Panthera Clinics OS",
  description: "Panthera Clinics operating system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

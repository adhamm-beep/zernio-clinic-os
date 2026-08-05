import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Zernio Clinic OS",
  description: "Clinic Operating System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body suppressHydrationWarning>
  <Providers>
    {children}
    <Toaster richColors position="top-right" />
  </Providers>
</body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter, Space_Grotesk, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppShell } from "@/components/AppShell";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-headline" });
const sourceCodePro = Source_Code_Pro({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: "ProjectStack",
  description: "Your AI-powered project library.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased", inter.variable, spaceGrotesk.variable, sourceCodePro.variable)}>
        <AppShell>{children}</AppShell>
        <Toaster />
      </body>
    </html>
  );
}

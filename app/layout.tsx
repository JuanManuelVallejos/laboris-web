import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, IBM_Plex_Mono } from "next/font/google";
import AppClerkProvider from "@/components/AppClerkProvider";
import WarmupPing from "@/components/WarmupPing";
import IconSprite from "@/components/icons/sprite";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laboris",
  description: "Encontrá profesionales de confianza para tu hogar",
};

// Todas las páginas se renderizan por request en vez de prerenderizarse en
// el build, para que el nonce del CSP estricto (ver proxy.ts) siempre
// coincida entre el header y el script que ClerkProvider inyecta.
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${fraunces.variable} ${jakarta.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script src="/theme-init.js" />
      </head>
      <body className="min-h-full flex flex-col bg-page" suppressHydrationWarning>
        <IconSprite />
        <WarmupPing />
        <AppClerkProvider>{children}</AppClerkProvider>
      </body>
    </html>
  );
}

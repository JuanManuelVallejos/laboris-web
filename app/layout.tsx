import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import WarmupPing from "@/components/WarmupPing";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Laboris",
  description: "Encontrá profesionales de confianza para tu hogar",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream">
        <WarmupPing />
        <ClerkProvider
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/onboarding"
          appearance={{
            variables: {
              colorPrimary:        "#5C6B3A",
              colorBackground:     "#FFFFFF",
              colorInputBackground:"#F7F3ED",
              colorInputText:      "#1A1A1A",
              colorText:           "#1A1A1A",
              colorTextSecondary:  "#6B7280",
              colorNeutral:        "#6B7280",
              borderRadius:        "12px",
              fontFamily:          "var(--font-geist-sans), Arial, sans-serif",
            },
            elements: {
              card:              "shadow-none border border-[#E8E3DC] rounded-2xl",
              headerTitle:       "text-[#1A1A1A] font-bold",
              headerSubtitle:    "text-[#6B7280]",
              socialButtonsBlockButton: "border border-[#E8E3DC] hover:bg-[#F7F3ED] transition-colors",
              formButtonPrimary: "bg-[#5C6B3A] hover:bg-[#4a5730] text-white transition-colors",
              footerActionLink:  "text-[#5C6B3A] hover:text-[#4a5730]",
              formFieldInput:    "bg-[#F7F3ED] border-[#E8E3DC] text-[#1A1A1A]",
              dividerLine:       "bg-[#E8E3DC]",
              dividerText:       "text-[#6B7280]",
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

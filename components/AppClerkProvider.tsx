"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "@/lib/useTheme";
import { clerkThemeDark, clerkThemeLight, clerkElements } from "@/lib/theme";

export default function AppClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      appearance={{
        // El preset base de Clerk resuelve los colores internos que sus propios
        // elementos no exponen vía `variables` (ej. el texto por defecto de .cl-card);
        // sin esto, alternar solo `variables` deja esos valores hardcodeados en claro.
        baseTheme: theme === "dark" ? dark : undefined,
        variables: theme === "dark" ? clerkThemeDark : clerkThemeLight,
        elements: clerkElements,
      }}
    >
      {children}
    </ClerkProvider>
  );
}

"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { esES } from "@clerk/localizations";
import { useTheme } from "@/lib/useTheme";
import { clerkThemeDark, clerkThemeLight, clerkElements } from "@/lib/theme";

// Algunas claves de @clerk/localizations quedan sin traducir en es-ES y caen
// al fallback en inglés (ej. userProfile.emailAddressPage.formHint) — se
// sobreescriben acá a mano.
const esESPatched = {
  ...esES,
  userProfile: {
    ...esES.userProfile,
    emailAddressPage: {
      ...esES.userProfile?.emailAddressPage,
      formHint: "Vas a necesitar verificar esta dirección de correo electrónico antes de poder agregarla a tu cuenta.",
    },
  },
};

export default function AppClerkProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/onboarding"
      localization={esESPatched}
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

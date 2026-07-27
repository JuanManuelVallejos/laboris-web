/**
 * Paleta Laboris en hex crudo para Clerk: su prop `appearance` resuelve estilos
 * en JS, no a través de la cascada CSS, así que no puede consumir var(--token).
 * Esta es la única fuente de verdad para theming de Clerk — no duplicar hex
 * en otros archivos (antes vivía repetido en layout.tsx, sign-in y sign-up).
 */

export const clerkThemeLight = {
  colorPrimary: "#3EC87A",        // --brand-accent
  colorBackground: "#FFFFFF",     // --surface-2
  colorInputBackground: "#FAFAF7",// --surface
  colorInputText: "#111810",      // --ink
  colorText: "#111810",           // --ink
  colorTextSecondary: "#3D4A40",  // --ink-mid
  colorNeutral: "#7A8C7E",        // --ink-soft
  colorDanger: "#E84040",         // --brand-alert
  borderRadius: "13px",           // --r-lg
  fontFamily: "var(--font-ui)",
} as const;

export const clerkThemeDark = {
  ...clerkThemeLight,
  colorBackground: "#1B241D",     // --surface-2 (dark)
  colorInputBackground: "#1B241D",// --field-bg (dark)
  colorInputText: "#ECF3ED",      // --ink (dark)
  colorText: "#ECF3ED",
  colorTextSecondary: "#AFC2B5",  // --ink-mid (dark)
  colorNeutral: "#7E948A",        // --ink-soft (dark)
} as const;

export const clerkElements = {
  // Clerk fija un color de texto propio en .cl-cardBox que no reacciona a
  // `variables.colorText`; se fuerza acá (los descendientes lo heredan).
  cardBox: "!text-ink",
  card: "shadow-none border border-border rounded-2xl bg-surface-2",
  headerTitle: "!text-ink font-bold",
  headerSubtitle: "!text-ink-mid",
  socialButtonsBlockButton: "border border-border hover:bg-surface transition-colors",
  socialButtonsBlockButtonText: "!text-ink",
  formFieldLabel: "!text-ink",
  formButtonPrimary: "bg-brand-accent hover:brightness-95 text-[color:var(--brand-accent-text)] transition-colors",
  formFieldInput: "bg-surface border-border !text-ink",
  identityPreviewText: "!text-ink",
  identityPreviewEditButton: "!text-brand-vivid",
  dividerLine: "bg-border",
  dividerText: "!text-ink-mid",
  footerActionText: "!text-ink-mid",
  footerActionLink: "!text-brand-vivid hover:brightness-90",
} as const;

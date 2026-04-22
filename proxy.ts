import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtected = createRouteMatcher([
  "/professionals/(.*)/request",
  "/pedidos(.*)",
  "/perfil(.*)",
]);

const isOnboarding = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Si está autenticado y no completó onboarding → redirigir a /onboarding
  if (userId && !isOnboarding(req)) {
    const onboardingComplete = (sessionClaims?.unsafeMetadata as Record<string, unknown>)?.onboardingComplete;
    if (!onboardingComplete) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // Rutas que requieren login
  if (isProtected(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

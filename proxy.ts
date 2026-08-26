import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublic = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublic(req)) await auth.protect();
  },
  {
    contentSecurityPolicy: {
      directives: {
        "connect-src": ["https://laboris-api.onrender.com", "https://*.supabase.co", "https://*.googleapis.com", "https://*.gstatic.com"],
        "img-src": ["https://*.supabase.co", "https://*.gstatic.com", "https://*.googleapis.com", "data:"],
        "font-src": ["self", "data:", "https://fonts.gstatic.com"],
        "style-src": ["https://fonts.googleapis.com"],
        "base-uri": ["self"],
        // google.maps.importLibrary carga parte de su código en un Web
        // Worker creado a partir de una URL blob: e internamente llama
        // importScripts() ahí adentro — eso lo gobierna script-src (no
        // worker-src, que ya permite blob: por defecto), así que hace
        // falta agregarlo acá también.
        "script-src": ["blob:"],
      },
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

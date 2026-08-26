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
      strict: true,
      directives: {
        "connect-src": ["https://laboris-api.onrender.com", "https://*.supabase.co"],
        "img-src": ["https://*.supabase.co", "data:"],
        "font-src": ["self", "data:"],
        "base-uri": ["self"],
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

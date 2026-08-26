"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { useActiveRole } from "@/lib/useActiveRole";

export default function OnboardingGuard() {
  const { user, isLoaded } = useUser();
  const { hasClient, hasProfessional, active } = useActiveRole();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setReady(true); return; }
    if (pathname.startsWith("/admin")) { setReady(true); return; }
    const done = user.unsafeMetadata?.onboardingComplete;
    if (!done) { router.replace("/onboarding"); return; }
    // Con doble rol, solo manda a /pro si ese es el modo activo — un
    // cliente-y-profesional en modo cliente se queda en el inicio normal.
    if (hasProfessional && (!hasClient || active === "professional")) { router.replace("/pro"); return; }
    setReady(true);
  }, [isLoaded, user, router, pathname, hasClient, hasProfessional, active]);

  if (!ready) return <div className="fixed inset-0 bg-page z-50" />;
  return null;
}

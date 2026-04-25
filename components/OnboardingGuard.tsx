"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";

export default function OnboardingGuard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setReady(true); return; }
    if (pathname.startsWith("/admin")) { setReady(true); return; }
    const done = user.unsafeMetadata?.onboardingComplete;
    if (!done) { router.replace("/onboarding"); return; }
    const roles = user.unsafeMetadata?.roles as string[] | undefined;
    if (roles?.includes("professional")) { router.replace("/pro"); return; }
    setReady(true);
  }, [isLoaded, user, router]);

  if (!ready) return <div className="fixed inset-0 bg-cream z-50" />;
  return null;
}

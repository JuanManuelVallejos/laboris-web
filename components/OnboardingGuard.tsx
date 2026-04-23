"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function OnboardingGuard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;
    const done = user.unsafeMetadata?.onboardingComplete;
    if (!done) { router.replace("/onboarding"); return; }
    const roles = user.unsafeMetadata?.roles as string[] | undefined;
    if (roles?.includes("professional")) router.replace("/pro");
  }, [isLoaded, user, router]);

  return null;
}

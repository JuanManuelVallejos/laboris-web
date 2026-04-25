"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { getAdminProfessionals } from "@/lib/api";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/"); return; }
    getAdminProfessionals(1, getToken)
      .then(() => setReady(true))
      .catch(() => router.replace("/"));
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!ready) return <div className="fixed inset-0 bg-cream z-50" />;
  return <>{children}</>;
}

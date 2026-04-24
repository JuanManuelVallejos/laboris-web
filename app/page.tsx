import { getProfessionals } from "@/lib/api";
import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import OnboardingGuard from "@/components/OnboardingGuard";
import HomeClient from "@/components/HomeClient";

export default async function Home() {
  const professionals = await getProfessionals().catch(() => []);

  return (
    <div className="flex flex-col min-h-screen bg-cream">
      <OnboardingGuard />
      <Topbar />

      <main className="flex-1 px-4 pt-4 pb-24 md:pb-8 max-w-5xl mx-auto w-full">
        <HomeClient professionals={professionals} />
      </main>

      <NavBottom />
    </div>
  );
}

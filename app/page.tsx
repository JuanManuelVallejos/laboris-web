import Topbar from "@/components/Topbar";
import NavBottom from "@/components/NavBottom";
import OnboardingGuard from "@/components/OnboardingGuard";
import HomeClient from "@/components/HomeClient";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-page">
      <OnboardingGuard />
      <Topbar />

      <main className="flex-1 px-4 pt-4 pb-24 md:pb-10 max-w-5xl mx-auto w-full">
        <HomeClient />
      </main>

      <NavBottom />
    </div>
  );
}

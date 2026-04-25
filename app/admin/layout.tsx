import AdminGuard from "@/components/AdminGuard";
import AdminTopbar from "@/components/AdminTopbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="min-h-screen bg-cream flex flex-col">
        <AdminTopbar />
        <main className="flex-1 px-4 py-6 max-w-6xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AdminGuard>
  );
}

import Link from "next/link";
import { getProfessional } from "@/lib/api";

export default async function ProfessionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const professional = await getProfessional(id).catch(() => null);

  if (!professional) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-gray-500">Profesional no encontrado.</p>
          <Link href="/" className="text-blue-600 text-sm mt-4 inline-block">← Volver</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 text-sm mb-6 inline-block">← Volver</Link>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{professional.name}</h1>
            {professional.verified && (
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">verificado</span>
            )}
          </div>
          <p className="text-gray-500 capitalize mb-2">{professional.trade} · {professional.zone}</p>
          <p className="text-yellow-500 font-medium">★ {professional.rating}</p>
        </div>
      </div>
    </main>
  );
}

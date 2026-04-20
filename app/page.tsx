import Link from "next/link";
import { getProfessionals, ping } from "@/lib/api";

export default async function Home() {
  const [professionals, apiUp] = await Promise.all([
    getProfessionals().catch(() => []),
    ping(),
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Laboris</h1>
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${apiUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            API {apiUp ? "online" : "offline"}
          </span>
        </div>

        <h2 className="text-lg font-semibold text-gray-700 mb-4">Profesionales</h2>

        {professionals.length === 0 ? (
          <p className="text-gray-500">No hay profesionales disponibles.</p>
        ) : (
          <ul className="space-y-3">
            {professionals.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/professionals/${p.id}`}
                  className="flex items-center justify-between bg-white rounded-xl px-5 py-4 shadow-sm hover:shadow-md transition"
                >
                  <div>
                    <p className="font-medium text-gray-900">{p.name}</p>
                    <p className="text-sm text-gray-500 capitalize">{p.trade} · {p.zone}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.verified && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">verificado</span>
                    )}
                    <span className="text-sm text-yellow-500 font-medium">★ {p.rating}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}

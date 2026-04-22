import Link from "next/link";

export default function RequestSentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-cream items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">

        <div className="w-20 h-20 rounded-full bg-verified/10 flex items-center justify-center mx-auto">
          <span className="text-4xl">✓</span>
        </div>

        <div>
          <h1 className="text-xl font-bold text-ink mb-2">¡Solicitud enviada!</h1>
          <p className="text-sm text-muted leading-relaxed">
            El profesional recibirá tu solicitud y te responderá a la brevedad. Podés hacer seguimiento desde <span className="font-medium text-ink">Pedidos</span>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link
            href="/pedidos"
            className="block w-full bg-primary text-surface text-center font-semibold py-3.5 rounded-2xl shadow-md active:scale-95 transition-transform"
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className="block w-full bg-surface text-ink text-center font-medium py-3.5 rounded-2xl border border-border active:scale-95 transition-transform"
          >
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}

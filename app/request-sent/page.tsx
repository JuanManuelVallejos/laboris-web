import Link from "next/link";
import Button from "@/components/ui/Button";

export default function RequestSentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-page items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-5">

        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-4xl"
          style={{ background: "var(--brand-light)", color: "var(--brand-mid)" }}
        >
          ✓
        </div>

        <div>
          <h1 className="serif text-xl font-bold text-ink mb-2">¡Solicitud enviada!</h1>
          <p className="text-sm text-ink-mid leading-relaxed">
            El profesional recibirá tu solicitud y te responderá a la brevedad. Podés hacer seguimiento desde <span className="font-medium text-ink">Pedidos</span>.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href="/pedidos" className="block">
            <Button variant="accent" size="lg" block className="active:scale-95 transition-transform">
              Ver mis pedidos
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="secondary" size="lg" block className="active:scale-95 transition-transform">
              Volver al inicio
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

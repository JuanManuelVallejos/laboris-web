"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getApproxLocation } from "@/lib/api";
import { ensureGoogleMapsBootstrap } from "@/lib/googleMaps";

interface Props {
  requestId: string;
}

/**
 * Se muestra en vez de la dirección exacta mientras no se confirmó la
 * visita — un círculo de ~300m (nunca un pin exacto) para que el
 * profesional pueda ubicar la zona sin ver el domicilio puntual.
 */
export default function ApproxLocationSection({ requestId }: Props) {
  const { getToken } = useAuth();
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    getApproxLocation(requestId, getToken)
      .then(async ({ lat, lng }) => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError("Falta configurar la clave de Google Maps.");
          return;
        }
        ensureGoogleMapsBootstrap(apiKey);
        const { Map, Circle } = (await window.google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        if (cancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: { lat, lng },
          zoom: 15,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        });
        new Circle({
          map,
          center: { lat, lng },
          radius: 300,
          strokeColor: "#16A34A",
          strokeOpacity: 0.7,
          strokeWeight: 2,
          fillColor: "#16A34A",
          fillOpacity: 0.15,
        });
      })
      .catch((err) => {
        console.error("No se pudo cargar la zona aproximada:", err);
        if (!cancelled) setError(err instanceof Error ? err.message : "No se pudo cargar la zona aproximada.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showMap, requestId, getToken]);

  return (
    <div className="bg-surface-2 border border-border rounded-2xl p-4 shadow-sm space-y-2">
      <p className="text-xs text-ink-soft">
        La dirección exacta se muestra una vez que confirmes la visita con el cliente.
      </p>
      <button
        type="button"
        onClick={() => setShowMap((v) => !v)}
        className="text-xs font-medium text-brand-vivid"
      >
        {showMap ? "Ocultar zona aproximada" : "Ver zona aproximada (~300 m)"}
      </button>

      {showMap && (
        <>
          {loading && <div className="h-52 rounded-xl bg-surface-3 animate-pulse" />}
          {error && (
            <p className="text-xs" style={{ color: "var(--brand-alert)" }}>{error}</p>
          )}
          <div
            ref={mapContainerRef}
            className="rounded-xl overflow-hidden"
            style={{ height: 220, display: loading || error ? "none" : "block" }}
          />
        </>
      )}
    </div>
  );
}

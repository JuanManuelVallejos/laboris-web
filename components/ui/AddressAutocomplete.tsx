"use client";

import { useEffect, useRef, useState } from "react";

// Carga el script de Google Maps una sola vez por sesión de navegador,
// aunque se monten varios AddressAutocomplete en la misma página o en
// distintas navegaciones.
let mapsLoader: Promise<void> | null = null;

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window.google?.maps?.importLibrary === "function") return Promise.resolve();
  if (mapsLoader) return mapsLoader;
  mapsLoader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar el script de Google Maps"));
    document.head.appendChild(script);
  });
  return mapsLoader;
}

interface AddressAutocompleteProps {
  /** Domicilio ya guardado (si lo hay) — se muestra como referencia; para cambiarlo hay que elegir una sugerencia nueva, no se edita como texto libre. */
  currentValue?: string;
  /** Se dispara solo cuando el usuario elige una sugerencia real de Google — nunca con texto libre. */
  onSelect: (address: string) => void;
}

/**
 * Input de domicilio respaldado por el autocompletado de Google (Places API
 * nueva — PlaceAutocompleteElement, el widget viejo google.maps.places.Autocomplete
 * ya no está disponible para proyectos de Google Cloud nuevos desde marzo 2025).
 * A propósito no permite texto libre: la única forma de setear un valor es
 * eligiendo una sugerencia de la lista.
 */
export default function AddressAutocomplete({ currentValue, onSelect }: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError("Falta configurar la clave de Google Maps.");
      return;
    }

    loadGoogleMaps(apiKey)
      .then(async () => {
        if (cancelled || !containerRef.current || !window.google) return;

        const { PlaceAutocompleteElement } = await window.google.maps.importLibrary("places");
        const el = new PlaceAutocompleteElement({ includedRegionCodes: ["ar"] });

        el.addEventListener("gmp-select", async (event: google.maps.places.PlacePredictionSelectEvent) => {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          if (place.formattedAddress) onSelectRef.current(place.formattedAddress);
        });

        containerRef.current.replaceChildren(el);
      })
      .catch((err) => {
        // Si el mensaje real de Google quedó en un console.error propio (ej.
        // key inválida/restringida), va a aparecer arriba de este log.
        console.error("No se pudo inicializar el autocompletado de Google:", err);
        if (!cancelled) setError("No se pudo cargar el buscador de direcciones. Recargá la página o probá de nuevo en un momento.");
      });

    return () => {
      cancelled = true;
      containerRef.current?.replaceChildren();
    };
  }, []);

  return (
    <div>
      {currentValue && (
        <p className="text-xs text-ink-soft mb-2">
          Domicilio actual: <span className="text-ink font-medium">{currentValue}</span>
        </p>
      )}
      <div ref={containerRef} />
      {error && (
        <p className="text-xs mt-1" style={{ color: "var(--brand-alert)" }}>{error}</p>
      )}
    </div>
  );
}

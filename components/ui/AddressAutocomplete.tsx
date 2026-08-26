"use client";

import { useEffect, useRef, useState } from "react";

let bootstrapped = false;

/**
 * Bootstrap loader oficial de Google para carga dinámica de librerías
 * (https://developers.google.com/maps/documentation/javascript/load-maps-js-api#dynamic-library-import).
 * No alcanza con un <script src=".../maps/api/js">: este snippet define
 * `google.maps.importLibrary` como un shim que recién inserta el script real
 * la primera vez que se pide una librería — sin este bootstrap, `importLibrary`
 * no existe en absoluto (por eso fallaba con "is not a function").
 */
function ensureGoogleMapsBootstrap(apiKey: string): void {
  if (bootstrapped) return;
  bootstrapped = true;

  (function (g: Record<string, string>) {
    let h: Promise<void> | undefined;
    let a: HTMLScriptElement;
    let k: string;
    const p = "The Google Maps JavaScript API";
    const c = "google";
    const l = "importLibrary";
    const q = "__ib__";
    const m = document;
    const b = window as unknown as Record<string, Record<string, unknown>>;
    const gObj = (b[c] = b[c] || {});
    const d = (gObj.maps = (gObj.maps as Record<string, unknown>) || {}) as Record<string, unknown>;
    const r = new Set<string>();
    const e = new URLSearchParams();
    const u = (): Promise<void> =>
      h ||
      (h = new Promise<void>((resolve, reject) => {
        a = m.createElement("script");
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = resolve;
        a.onerror = () => { h = undefined; reject(new Error(p + " could not load.")); };
        a.nonce = (m.querySelector("script[nonce]") as HTMLScriptElement | null)?.nonce || "";
        m.head.append(a);
      }));
    if (d[l]) {
      console.warn(p + " only loads once. Ignoring:", g);
    } else {
      d[l] = (f: string, ...n: unknown[]) => r.add(f) && u().then(() => (d[l] as (f: string, ...n: unknown[]) => unknown)(f, ...n));
    }
  })({ key: apiKey, v: "weekly" });
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

    ensureGoogleMapsBootstrap(apiKey);

    window.google.maps
      .importLibrary("places")
      .then(({ PlaceAutocompleteElement }) => {
        if (cancelled || !containerRef.current) return;

        const el = new PlaceAutocompleteElement({ includedRegionCodes: ["ar"] });

        el.addEventListener("gmp-select", async (event: google.maps.places.PlacePredictionSelectEvent) => {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ["formattedAddress"] });
          if (place.formattedAddress) onSelectRef.current(place.formattedAddress);
        });

        containerRef.current.replaceChildren(el);
      })
      .catch((err) => {
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

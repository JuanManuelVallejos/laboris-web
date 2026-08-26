"use client";

import { useEffect, useRef, useState } from "react";
import Button from "@/components/ui/Button";

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
  /** Avisa cuando se abre/cierra el mapa de respaldo — los formularios que editan un domicilio ya cargado lo usan para no dejar guardar mientras hay un pin sin confirmar. */
  onMapOpenChange?: (open: boolean) => void;
}

/**
 * Input de domicilio respaldado por el autocompletado de Google (Places API
 * nueva — PlaceAutocompleteElement, el widget viejo google.maps.places.Autocomplete
 * ya no está disponible para proyectos de Google Cloud nuevos desde marzo 2025).
 * A propósito no permite texto libre: la única forma de setear un valor es
 * eligiendo una sugerencia de la lista.
 */
export default function AddressAutocomplete({ currentValue, onSelect, onMapOpenChange }: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  // Se incrementa en cada click del mapa — si la respuesta de un click viejo
  // llega después de uno más nuevo, se descarta en vez de pisar el resultado
  // correcto.
  const reverseGeocodeRequestIdRef = useRef(0);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onMapOpenChangeRef = useRef(onMapOpenChange);
  onMapOpenChangeRef.current = onMapOpenChange;
  const [error, setError] = useState("");

  const [showMapFallback, setShowMapFallback] = useState(false);
  const [pinAddress, setPinAddress] = useState("");
  const [pinError, setPinError] = useState("");

  // Avisa al formulario padre + arranca cada apertura/cierre del mapa sin
  // restos de un intento anterior (pin marcado o error de una sesión previa).
  useEffect(() => {
    onMapOpenChangeRef.current?.(showMapFallback);
    setPinAddress("");
    setPinError("");
  }, [showMapFallback]);

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

        const el = new PlaceAutocompleteElement({
          includedRegionCodes: ["ar"],
          // Exige una dirección específica (calle + altura, edificio con
          // nombre propio, o unidad dentro de un edificio) — sin esto Google
          // también sugiere localidades/partidos enteros (ej. "Bernal").
          includedPrimaryTypes: ["street_address", "premise", "subpremise"],
        });

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

  // Fallback para cuando Google no encuentra la dirección exacta (barrios
  // nuevos, countries, zonas rurales) — se arma solo cuando se pide, no de
  // entrada, para que siga siendo la vía secundaria y no la principal.
  useEffect(() => {
    if (!showMapFallback || !mapContainerRef.current) return;
    let cancelled = false;
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    ensureGoogleMapsBootstrap(apiKey);

    Promise.all([
      window.google.maps.importLibrary("maps") as Promise<google.maps.MapsLibrary>,
      window.google.maps.importLibrary("marker") as Promise<google.maps.MarkerLibrary>,
      window.google.maps.importLibrary("geocoding") as Promise<google.maps.GeocodingLibrary>,
    ])
      .then(([{ Map }, { Marker }, { Geocoder }]) => {
        if (cancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires
          zoom: 12,
          streetViewControl: false,
          mapTypeControl: false,
        });
        geocoderRef.current = new Geocoder();

        // Tipos específicos aceptados — mismo criterio que el autocompletado
        // de texto (includedPrimaryTypes): sin esto, un punto en medio de un
        // barrio puede resolver a un resultado a nivel localidad/zona en vez
        // de una dirección puntual.
        const SPECIFIC_TYPES = ["street_address", "premise", "subpremise"];

        const reverseGeocode = (latLng: google.maps.LatLng) => {
          setPinError("");
          const requestId = ++reverseGeocodeRequestIdRef.current;
          geocoderRef.current!.geocode({ location: latLng }, (results, status) => {
            if (cancelled || requestId !== reverseGeocodeRequestIdRef.current) return;
            const specific = results?.find((r) => r.types.some((t) => SPECIFIC_TYPES.includes(t)));
            if (status === "OK" && specific) {
              setPinAddress(specific.formatted_address);
            } else {
              console.error("Reverse geocode sin resultado específico:", status, results);
              setPinError("No pudimos identificar una dirección específica para ese punto — probá con otro lugar del mapa.");
            }
          });
        };

        const placePin = (latLng: google.maps.LatLng) => {
          if (!markerRef.current) {
            markerRef.current = new Marker({ position: latLng, map, draggable: true });
            markerRef.current.addListener("dragend", () => {
              const pos = markerRef.current!.getPosition();
              if (pos) reverseGeocode(pos);
            });
          } else {
            markerRef.current.setPosition(latLng);
          }
          reverseGeocode(latLng);
        };

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) placePin(e.latLng);
        });
      })
      .catch((err) => {
        console.error("No se pudo cargar el mapa:", err);
        if (!cancelled) setPinError("No se pudo cargar el mapa. Recargá la página o probá de nuevo en un momento.");
      });

    return () => {
      cancelled = true;
      markerRef.current = null;
    };
  }, [showMapFallback]);

  function handleConfirmPin() {
    if (!pinAddress) return;
    onSelectRef.current(pinAddress);
    setShowMapFallback(false);
  }

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

      <button
        type="button"
        onClick={() => setShowMapFallback((v) => !v)}
        className="text-xs font-medium text-brand-vivid mt-2"
      >
        {showMapFallback ? "Ocultar mapa" : "¿No encontrás tu domicilio? Marcalo en el mapa"}
      </button>

      {showMapFallback && (
        <div className="mt-2 space-y-2">
          <p className="text-xs text-ink-soft">Tocá el mapa para marcar tu domicilio.</p>
          <div ref={mapContainerRef} className="rounded-xl overflow-hidden" style={{ height: 260 }} />
          {pinAddress && <p className="text-xs text-ink">Ubicación marcada: {pinAddress}</p>}
          {pinError && (
            <p className="text-xs" style={{ color: "var(--brand-alert)" }}>{pinError}</p>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={handleConfirmPin} disabled={!pinAddress}>
            Confirmar ubicación
          </Button>
        </div>
      )}
    </div>
  );
}

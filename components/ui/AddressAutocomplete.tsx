"use client";

import { useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/ui/Field";
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
  /** Se dispara solo cuando el usuario elige una sugerencia real de Google (o confirma un pin en el mapa) — nunca con texto libre. */
  onSelect: (address: string) => void;
  /** Avisa cuando hay una interacción sin confirmar (texto tipeado sin elegir sugerencia, o el mapa de respaldo abierto sin pin confirmado) — los formularios que editan un domicilio ya cargado lo usan para no dejar guardar en ese estado. */
  onUnconfirmedChange?: (unconfirmed: boolean) => void;
}

// Dirección específica: calle con altura, edificio con nombre propio, o
// unidad dentro de un edificio. "route" (calle sin altura) se acepta como
// SUGERENCIA (para que aparezca mientras se escribe, antes de llegar al
// número) pero se rechaza al confirmar la selección final.
const SPECIFIC_TYPES = ["street_address", "premise", "subpremise"];
const SUGGESTION_TYPES = [...SPECIFIC_TYPES, "route"];

/**
 * Input de domicilio respaldado por la Autocomplete Data API de Google
 * (AutocompleteSuggestion) — a propósito NO usa el widget prearmado
 * PlaceAutocompleteElement: no expone el texto en tiempo real (imposible
 * validar "elegí una sugerencia" al guardar) y en mobile puede tomar toda la
 * pantalla. Acá el input y el dropdown de sugerencias son nuestros.
 * A propósito no permite texto libre: la única forma de setear un valor es
 * eligiendo una sugerencia de la lista (o confirmando un pin en el mapa).
 */
export default function AddressAutocomplete({ currentValue, onSelect, onUnconfirmedChange }: AddressAutocompleteProps) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onUnconfirmedChangeRef = useRef(onUnconfirmedChange);
  onUnconfirmedChangeRef.current = onUnconfirmedChange;

  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectError, setSelectError] = useState("");

  const placesLibRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestRequestIdRef = useRef(0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const reverseGeocodeRequestIdRef = useRef(0);
  const [showMapFallback, setShowMapFallback] = useState(false);
  const [pinAddress, setPinAddress] = useState("");
  const [pinError, setPinError] = useState("");

  const hasPendingText = inputText.trim().length > 0 && !confirmed;
  const mapPending = showMapFallback && !pinAddress;

  useEffect(() => {
    onUnconfirmedChangeRef.current?.(hasPendingText || mapPending);
  }, [hasPendingText, mapPending]);

  // Carga la librería "places" una vez (para AutocompleteSuggestion +
  // AutocompleteSessionToken) y arranca el primer token de sesión.
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
      .then((lib) => {
        if (cancelled) return;
        const placesLib = lib as google.maps.PlacesLibrary;
        placesLibRef.current = placesLib;
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      })
      .catch((err) => {
        console.error("No se pudo inicializar el autocompletado de Google:", err);
        if (!cancelled) setError("No se pudo cargar el buscador de direcciones. Recargá la página o probá de nuevo en un momento.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleInputChange(value: string) {
    setInputText(value);
    setConfirmed(false);
    setSelectError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3 || !placesLibRef.current) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const requestId = ++suggestRequestIdRef.current;
    debounceRef.current = setTimeout(async () => {
      try {
        const placesLib = placesLibRef.current!;
        const { suggestions: results } = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: value,
          includedRegionCodes: ["ar"],
          includedPrimaryTypes: SUGGESTION_TYPES,
          sessionToken: sessionTokenRef.current ?? undefined,
        });
        if (requestId !== suggestRequestIdRef.current) return; // llegó tarde, ya hay una búsqueda más nueva
        setSuggestions(results.filter((s) => s.placePrediction));
        setShowDropdown(true);
      } catch (err) {
        console.error("Error buscando sugerencias:", err);
      }
    }, 300);
  }

  async function handleSelectSuggestion(suggestion: google.maps.places.AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["formattedAddress", "types"] });
    if (!place.formattedAddress) return;

    const isSpecific = (place.types ?? []).some((t) => SPECIFIC_TYPES.includes(t));
    if (!isSpecific) {
      setSelectError("Esa dirección no tiene número — agregá la altura para que sea específica.");
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setInputText(place.formattedAddress);
    setConfirmed(true);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectError("");
    onSelectRef.current(place.formattedAddress);

    // Nueva sesión para la próxima búsqueda — agrupa la facturación de cada
    // búsqueda completa por separado, como recomienda Google.
    if (placesLibRef.current) {
      sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
    }
  }

  // Fallback para cuando Google no encuentra la dirección exacta (barrios
  // nuevos, countries, zonas rurales) — se arma solo cuando se pide, no de
  // entrada, para que siga siendo la vía secundaria y no la principal.
  useEffect(() => {
    setPinAddress("");
    setPinError("");
  }, [showMapFallback]);

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
    setInputText(pinAddress);
    setConfirmed(true);
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

      <div className="relative">
        <TextInput
          value={inputText}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          onBlur={() => setShowDropdown(false)}
          placeholder="Escribí tu domicilio…"
          autoComplete="off"
        />
        {showDropdown && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-surface-2 border border-border rounded-xl shadow-lg divide-y divide-border overflow-hidden">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3 py-2 text-sm text-ink hover:bg-surface-3 transition-colors"
              >
                {s.placePrediction?.text.toString()}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasPendingText && !selectError && (
        <p className="text-xs mt-1 text-ink-soft">Elegí una dirección de la lista de sugerencias.</p>
      )}
      {selectError && (
        <p className="text-xs mt-1" style={{ color: "var(--brand-alert)" }}>{selectError}</p>
      )}
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

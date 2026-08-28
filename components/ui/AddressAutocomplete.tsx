"use client";

import { useEffect, useRef, useState } from "react";
import { TextInput } from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import Icon from "@/components/icons/Icon";
import { ensureGoogleMapsBootstrap } from "@/lib/googleMaps";

interface AddressAutocompleteProps {
  /** Domicilio ya guardado (si lo hay) — se muestra como referencia; para cambiarlo hay que elegir una sugerencia nueva, no se edita como texto libre. */
  currentValue?: string;
  /** Se dispara solo cuando el usuario elige una sugerencia real de Google (o confirma un pin en el mapa) — nunca con texto libre. */
  onSelect: (address: string) => void;
  /** Avisa cuando hay una interacción sin confirmar (texto tipeado sin elegir sugerencia, o el mapa de respaldo abierto sin pin confirmado) — los formularios que editan un domicilio ya cargado lo usan para no dejar guardar en ese estado. */
  onUnconfirmedChange?: (unconfirmed: boolean) => void;
  /** El formulario padre lo pone en `true` cuando el usuario intentó enviar el formulario sin haber confirmado el domicilio — fuerza el aviso a rojo (aunque el texto tipeado ya "parezca" una dirección válida) y hace scroll hasta acá. */
  highlightUnconfirmed?: boolean;
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
export default function AddressAutocomplete({ currentValue, onSelect, onUnconfirmedChange, highlightUnconfirmed }: AddressAutocompleteProps) {
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onUnconfirmedChangeRef = useRef(onUnconfirmedChange);
  onUnconfirmedChangeRef.current = onUnconfirmedChange;
  const rootRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState("");
  const [inputText, setInputText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectError, setSelectError] = useState("");
  // true cuando la búsqueda actual ya devuelve alguna sugerencia con altura
  // (aunque todavía no se haya clickeado ninguna) — feedback positivo previo
  // a la confirmación, sin necesidad de una llamada extra a la API (types
  // viene poblado en la propia respuesta de fetchAutocompleteSuggestions).
  const [looksSpecific, setLooksSpecific] = useState(false);

  const placesLibRef = useRef<google.maps.PlacesLibrary | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestRequestIdRef = useRef(0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const placePinRef = useRef<((latLng: google.maps.LatLng, onFound?: (address: string) => void) => void) | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const reverseGeocodeRequestIdRef = useRef(0);
  const [showMapFallback, setShowMapFallback] = useState(false);
  const [pinAddress, setPinAddress] = useState("");
  const [pinError, setPinError] = useState("");

  const hasPendingText = inputText.trim().length > 0 && !confirmed;
  const mapPending = showMapFallback && !pinAddress;
  // El padre pide resaltar esto porque se intentó enviar el formulario sin
  // haber confirmado — manda por sobre el ámbar de "parece válido".
  const unconfirmedNudge = !!highlightUnconfirmed && !confirmed;
  // El verde + check queda reservado para cuando ya está realmente
  // confirmado (se clickeó una sugerencia o se confirmó el pin) — antes de
  // eso, aunque el texto ya matchee una dirección específica, todavía hace
  // falta esa acción, así que el aviso es ámbar (no verde) y sin check.
  const showConfirmed = !selectError && !unconfirmedNudge && confirmed;
  const showPromising = !selectError && !unconfirmedNudge && !confirmed && looksSpecific;
  const showInvalid = !showConfirmed && !showPromising && (hasPendingText || !!selectError || unconfirmedNudge);

  useEffect(() => {
    if (unconfirmedNudge) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [unconfirmedNudge]);

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
    setLooksSpecific(false);
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
        setLooksSpecific(results.some((s) => (s.placePrediction?.types ?? []).some((t) => SPECIFIC_TYPES.includes(t))));
      } catch (err) {
        console.error("Error buscando sugerencias:", err);
      }
    }, 300);
  }

  async function ensureGeocoder(): Promise<google.maps.Geocoder> {
    if (geocoderRef.current) return geocoderRef.current;
    const { Geocoder } = (await window.google.maps.importLibrary("geocoding")) as google.maps.GeocodingLibrary;
    geocoderRef.current = new Geocoder();
    return geocoderRef.current;
  }

  // Google a veces resuelve el Place de una sugerencia a nivel "route" (sin
  // altura) aunque el TEXTO de esa sugerencia sí incluya un número — pasa en
  // calles poco mapeadas. Antes de rechazarla probamos geocodificar el texto
  // tal cual (que sí trae el número) y nos quedamos con eso si es específico.
  async function geocodeIfSpecific(text: string): Promise<string | null> {
    try {
      const geocoder = await ensureGeocoder();
      return await new Promise((resolve) => {
        geocoder.geocode({ address: text, region: "ar" }, (results, status) => {
          if (status !== "OK" || !results) return resolve(null);
          const specific = results.find((r) => r.types.some((t) => SPECIFIC_TYPES.includes(t)));
          resolve(specific ? specific.formatted_address : null);
        });
      });
    } catch (err) {
      console.error("Error geocodificando dirección tipeada:", err);
      return null;
    }
  }

  function confirmAddress(formattedAddress: string) {
    setInputText(formattedAddress);
    setConfirmed(true);
    setSuggestions([]);
    setShowDropdown(false);
    setSelectError("");
    // Si había quedado abierto el mapa de respaldo de una exploración
    // anterior (ej. probó una dirección incompleta, abrió el mapa, y
    // terminó resolviéndolo acá en vez de con un pin), hay que cerrarlo:
    // si no, mapPending queda pegado en true y nunca deja de avisarle al
    // padre que falta confirmar, aunque el domicilio ya esté listo.
    setShowMapFallback(false);
    onSelectRef.current(formattedAddress);

    // Nueva sesión para la próxima búsqueda — agrupa la facturación de cada
    // búsqueda completa por separado, como recomienda Google.
    if (placesLibRef.current) {
      sessionTokenRef.current = new placesLibRef.current.AutocompleteSessionToken();
    }
  }

  async function handleSelectSuggestion(suggestion: google.maps.places.AutocompleteSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    const rawText = prediction.text.toString();
    const place = prediction.toPlace();
    await place.fetchFields({ fields: ["formattedAddress", "types"] });
    if (!place.formattedAddress) return;

    const isSpecific = (place.types ?? []).some((t) => SPECIFIC_TYPES.includes(t));
    if (isSpecific) {
      confirmAddress(place.formattedAddress);
      return;
    }

    if (/\d/.test(rawText)) {
      const geocoded = await geocodeIfSpecific(rawText);
      if (geocoded) {
        confirmAddress(geocoded);
        return;
      }
    }

    setInputText(rawText);
    setConfirmed(false);
    setSelectError("Esa dirección no tiene número — agregá la altura para que sea específica.");
    setSuggestions([]);
    setShowDropdown(false);
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
      .then(async ([{ Map }, { Marker }, { Geocoder }]) => {
        if (cancelled || !mapContainerRef.current) return;
        geocoderRef.current = new Geocoder();

        // Si ya hay algo tipeado (aunque no sea una dirección completa, ej.
        // "Bernal"), arrancamos el mapa ya centrado/zoomeado ahí en vez de
        // en Buenos Aires — el viewport que devuelve el geocoder ya viene
        // más o menos amplio según qué tan específico sea el resultado.
        let initialViewport: google.maps.LatLngBounds | null = null;
        // Si el domicilio ya está confirmado y es específico (con altura),
        // se marca el pin ahí apenas se abre el mapa — sin importar que se
        // haya confirmado eligiendo una sugerencia de la lista en vez de
        // haber tocado el mapa antes.
        let initialPinLocation: google.maps.LatLng | null = null;
        const textToLocate = inputText.trim();
        if (textToLocate) {
          try {
            const results = await new Promise<google.maps.GeocoderResult[] | null>((resolve) => {
              geocoderRef.current!.geocode({ address: textToLocate, region: "ar" }, (res, status) => {
                resolve(status === "OK" && res ? res : null);
              });
            });
            const best = results?.[0];
            if (best?.geometry?.viewport) initialViewport = best.geometry.viewport;
            if (confirmed && best?.geometry?.location && best.types.some((t) => SPECIFIC_TYPES.includes(t))) {
              initialPinLocation = best.geometry.location;
            }
          } catch (err) {
            console.error("No se pudo centrar el mapa según lo tipeado:", err);
          }
        }
        if (cancelled || !mapContainerRef.current) return;

        const map = new Map(mapContainerRef.current, {
          center: { lat: -34.6037, lng: -58.3816 }, // Buenos Aires — fallback si no hay texto o falla el geocode
          zoom: 12,
          streetViewControl: false,
          mapTypeControl: false,
        });
        mapRef.current = map;
        if (initialPinLocation) {
          map.setCenter(initialPinLocation);
          map.setZoom(17);
        } else if (initialViewport) {
          map.fitBounds(initialViewport);
        }

        const reverseGeocode = (latLng: google.maps.LatLng, onFound?: (address: string) => void) => {
          setPinError("");
          const requestId = ++reverseGeocodeRequestIdRef.current;
          geocoderRef.current!.geocode({ location: latLng }, (results, status) => {
            if (cancelled || requestId !== reverseGeocodeRequestIdRef.current) return;
            const specific = results?.find((r) => r.types.some((t) => SPECIFIC_TYPES.includes(t)));
            if (status === "OK" && specific) {
              setPinAddress(specific.formatted_address);
              onFound?.(specific.formatted_address);
            } else {
              console.error("Reverse geocode sin resultado específico:", status, results);
              setPinError("No pudimos identificar una dirección específica para ese punto — probá con otro lugar del mapa.");
            }
          });
        };

        const placePin = (latLng: google.maps.LatLng, onFound?: (address: string) => void) => {
          if (!markerRef.current) {
            markerRef.current = new Marker({ position: latLng, map, draggable: true });
            markerRef.current.addListener("dragend", () => {
              const pos = markerRef.current!.getPosition();
              if (pos) reverseGeocode(pos);
            });
          } else {
            markerRef.current.setPosition(latLng);
          }
          reverseGeocode(latLng, onFound);
        };

        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) placePin(e.latLng);
        });
        placePinRef.current = placePin;
        if (initialPinLocation) placePin(initialPinLocation);
      })
      .catch((err) => {
        console.error("No se pudo cargar el mapa:", err);
        if (!cancelled) setPinError("No se pudo cargar el mapa. Recargá la página o probá de nuevo en un momento.");
      });

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current = null;
      placePinRef.current = null;
    };
  }, [showMapFallback]);

  function confirmPinAddress(address: string, opts?: { keepMapOpen?: boolean }) {
    setInputText(address);
    setConfirmed(true);
    onSelectRef.current(address);
    if (!opts?.keepMapOpen) setShowMapFallback(false);
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setPinError("Tu navegador no admite geolocalización.");
      return;
    }
    setPinError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const map = mapRef.current;
        const placePin = placePinRef.current;
        if (!map || !placePin) return;
        const latLng = new window.google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        map.setCenter(latLng);
        map.setZoom(16);
        // Ubicación real del dispositivo: se confirma sola apenas el
        // reverse-geocode resuelve una dirección específica, sin que haga
        // falta apretar "Confirmar ubicación" — a diferencia de un click o
        // arrastre manual del pin, que sigue requiriendo esa confirmación.
        // El mapa queda abierto por si se lo quiere correr un poco (el GPS
        // puede no ser exacto).
        placePin(latLng, (address) => confirmPinAddress(address, { keepMapOpen: true }));
      },
      (err) => {
        console.error("Error obteniendo la ubicación actual:", err);
        setPinError("No pudimos acceder a tu ubicación — revisá los permisos del navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function handleConfirmPin() {
    if (!pinAddress) return;
    confirmPinAddress(pinAddress);
  }

  return (
    <div ref={rootRef}>
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
          className={(showConfirmed || showPromising) ? "pr-9" : undefined}
          style={
            showConfirmed
              ? { borderColor: "#16A34A" }
              : showPromising
              ? { borderColor: "var(--amber)" }
              : showInvalid
              ? { borderColor: "var(--brand-alert)" }
              : undefined
          }
        />
        {showConfirmed && (
          <Icon
            name="check"
            className="ico absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none"
            style={{ width: 18, height: 18, color: "#16A34A" }}
          />
        )}
        {showPromising && (
          <Icon
            name="alert"
            className="ico absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none"
            style={{ width: 18, height: 18, color: "var(--amber)" }}
          />
        )}
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

      {unconfirmedNudge && (
        <p className="text-xs font-semibold mt-1" style={{ color: "var(--brand-alert)" }}>
          Todavía te falta confirmar tu domicilio — elegí una sugerencia de la lista o marcalo en el mapa.
        </p>
      )}
      {hasPendingText && !selectError && !unconfirmedNudge && (
        <p className="text-xs mt-1" style={showPromising ? { color: "var(--amber)" } : undefined}>
          {showPromising
            ? "Esa dirección existe — elegila de la lista para confirmar."
            : <span className="text-ink-soft">Elegí una dirección de la lista de sugerencias.</span>}
        </p>
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
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-ink-soft">Tocá el mapa para marcar tu domicilio.</p>
            <button type="button" onClick={handleUseMyLocation} className="text-xs font-medium text-brand-vivid whitespace-nowrap">
              Usar mi ubicación actual
            </button>
          </div>
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

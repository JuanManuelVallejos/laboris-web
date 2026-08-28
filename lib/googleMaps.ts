let bootstrapped = false;

/**
 * Bootstrap loader oficial de Google para carga dinámica de librerías
 * (https://developers.google.com/maps/documentation/javascript/load-maps-js-api#dynamic-library-import).
 * No alcanza con un <script src=".../maps/api/js">: este snippet define
 * `google.maps.importLibrary` como un shim que recién inserta el script real
 * la primera vez que se pide una librería — sin este bootstrap, `importLibrary`
 * no existe en absoluto (por eso fallaba con "is not a function").
 */
export function ensureGoogleMapsBootstrap(apiKey: string): void {
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

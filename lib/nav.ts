// Pestaña activa = el href más específico (prefijo más largo) que matchea el
// pathname actual, para que rutas anidadas (/jobs/123, /pro/pedidos/456)
// resalten la pestaña correcta sin activar más de una a la vez.
export function activeHref(pathname: string, hrefs: string[]): string | undefined {
  // /pro/edit no cuelga de /perfil en la URL, pero es parte de "editar mi perfil".
  if (pathname === "/pro/edit" && hrefs.includes("/perfil")) return "/perfil";

  return hrefs
    .filter((href) => pathname === href || pathname.startsWith(href + "/"))
    .sort((a, b) => b.length - a.length)[0];
}

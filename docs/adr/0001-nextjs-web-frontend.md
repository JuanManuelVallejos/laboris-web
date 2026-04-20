# ADR-0001: Next.js como framework web frontend

**Estado:** Aceptado  
**Fecha:** 2026-04-20

## Contexto

Laboris necesita un frontend web que sirva como punto de entrada para clientes y proveedores. El producto requiere SEO (los perfiles de profesionales deben ser indexables), soporte para dashboards internos, y flexibilidad para crecer en superficie de producto. El equipo ya trabaja con React en el prototipo existente.

## Decisión

Usar **Next.js** con App Router y TypeScript como framework web frontend.

## Alternativas consideradas

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Vite + React SPA | Sin SSR/SSG nativo; SEO requiere soluciones adicionales |
| Remix | Ecosistema más chico; menor adopción en el equipo |
| Nuxt / Vue | Cambio de ecosistema innecesario dado el conocimiento React existente |

## Consecuencias

**Positivas:**
- Server Components permiten fetch directo al API sin exponer lógica al cliente
- SSR/SSG para SEO de perfiles de profesionales sin configuración extra
- App Router facilita layouts anidados (shell de cliente vs. shell de proveedor)
- Deploy directo en Vercel sin configuración adicional

**Negativas/trade-offs:**
- App Router tiene curva de aprendizaje respecto a Pages Router
- Bundler y runtime de Node añaden overhead vs. una SPA pura

## Stack relacionado

- **API:** `laboris-api` (Go + Gin) en `https://laboris-api.onrender.com`
- **Deploy web:** Vercel
- **Estilos:** Tailwind CSS

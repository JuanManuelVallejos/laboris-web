# ADR 0002 — Clerk como proveedor de autenticación

## Estado
Aceptado

## Contexto
laboris-web necesita autenticación para proteger rutas del cliente (formulario de solicitud, pedidos, perfil). El equipo es de 3 personas en etapa de MVP. Se necesita auth confiable y rápido de implementar, con integración nativa al App Router de Next.js 16 y que genere JWTs verificables por el backend en Go.

## Decisión
Usar **Clerk** como auth provider.

## Alternativas consideradas

| Opción | Pros | Contras |
|--------|------|---------|
| **Clerk** | App Router nativo, UI pre-built, 10k MAU free, JWT para Go | Vendor lock-in moderado |
| Auth0 | Más enterprise, más historial | Dashboard complejo, pricing menos amigable para MVP |
| NextAuth.js | Open source, sin vendor lock-in | No cubre Go backend nativamente, más setup |
| Custom JWT | Control total | Semanas de trabajo, riesgo de bugs de seguridad |

## Consecuencias
- `ClerkProvider` wrappea el `RootLayout`
- `middleware.ts` usa `clerkMiddleware` para proteger rutas
- `UserButton` de Clerk reemplaza el avatar placeholder en Topbar
- El token JWT de Clerk viaja como `Authorization: Bearer` a laboris-api
- Go verifica el token con `clerk-sdk-go/v2` (ver ADR 0002 de laboris-api)
- Si en el futuro se necesita migrar: los JWTs de Clerk son RS256 estándar, el cambio afecta solo la clave pública de verificación

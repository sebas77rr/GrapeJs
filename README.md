# Backend: KiuFlow Builder (API & Renderer)

## Tech Stack
- Node.js
- Express.js
- Prisma (ORM)
- Supabase (PostgreSQL)
- Despliegue: Render

## Responsabilidad Principal
Servidor API REST, renderizado de Landing Pages públicas (`funnel-renderer.js`), despacho del frontend compilado y persistencia de datos (Leads, Configuración, Proyectos).

## Lógica Clave
- **Infraestructura (Demo):** La aplicación está conectada a **Supabase** (PostgreSQL) para la base de datos a través de Prisma, y desplegada en servicios cloud como **Render** para la demostración.
- **Sistema Anti-Cheat (Video Funnels):** 
  Para evitar que los leads salten el video y revelen el formulario prematuramente:
  1. El sistema rastrea el video por fragmentos o "chunks" de 1%.
  2. A medida que avanza a velocidad 1x normal, se registran los índices vistos.
  3. El botón del formulario (CTA) permanece inyectado pero bloqueado, y solo se libera por código cliente inyectado cuando el array de `chunks` vistos alcanza el umbral (ej. 90%).
  4. Mantiene el progreso en `sessionStorage` para tolerar recargas de página.

## Comandos de Ejecución
```bash
pnpm install
npx prisma generate
pnpm start
```

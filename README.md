# Backend: KiuFlow Builder (API & Renderer)

## Tech Stack
- Node.js
- Express.js
- File System nativo (`fs.promises`)

## Responsabilidad Principal
Servidor API REST, renderizado de Landing Pages públicas (`funnel-renderer.js`), despacho del frontend compilado y persistencia de datos (Leads, Configuración, Proyectos).

## Lógica Clave
- **Persistencia Local (Zero Dependencies):** No utiliza bases de datos externas ni ORMs. Toda la información se gestiona de forma local y atómica en `demo-db.json` y `/storage`. Esto asegura portabilidad total e independencia de servicios cloud para los servidores de la empresa.
- **Sistema Anti-Cheat (Video Funnels):** 
  Para evitar que los leads salten el video y revelen el formulario prematuramente:
  1. El sistema rastrea el video por fragmentos o "chunks" de 1%.
  2. A medida que avanza a velocidad 1x normal, se registran los índices vistos.
  3. El botón del formulario (CTA) permanece inyectado pero bloqueado, y solo se libera por código cliente inyectado cuando el array de `chunks` vistos alcanza el umbral (ej. 90%).
  4. Mantiene el progreso en `sessionStorage` para tolerar recargas de página.

## Comandos de Ejecución
```bash
npm install
npm start  # Levanta la API y sirve el frontend estático en el puerto 3001
```

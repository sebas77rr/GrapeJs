# Backend: KiuFlow Builder (API & Renderer)

Node.js impulsa **Constructor de Landings y Video Funnels**. 

## 🛠️ Stack Tecnológico
- **Entorno:** Node.js
- **Framework:** Express.js
- **Integración:** API REST nativa de KiuFlow
- **Arquitectura:** Capas de Servicios y Controladores MVC

## 🎯 Responsabilidad Principal
1. **API Gateway (Proxy Seguro):** Actúa como puente entre el editor frontend (React/GrapesJS) y la API oficial de KiuFlow, evitando exponer credenciales en el navegador.
2. **Motor SSR (Server-Side Rendering):** Intercepta las URLs públicas (`/p/` para Landings y `/f/` para Funnels) inyectando en tiempo real el código HTML/CSS almacenado en KiuFlow para lograr tiempos de carga ultrarrápidos y alto rendimiento SEO.
3. **Manejo de Sesión (Service Account):** Mantiene una sesión persistente contra KiuFlow renovando automáticamente el token JWT.

## 🧠 Lógica Clave

### 1. Sistema Anti-Cheat (Video Funnels)
Para evitar que los prospectos (leads) salten el video y revelen el formulario prematuramente:
- El motor SSR inyecta un script inteligente (`funnel-renderer.js`) que rastrea la reproducción del video por "chunks" (fragmentos) del 1%.
- Solo cuando el espectador alcanza orgánicamente el umbral configurado (ej. 90%), se desbloquea dinámicamente el botón o formulario (Call To Action).
- Tolerante a recargas de página mediante el uso de `sessionStorage`.

### 2. Sincronización de Leads en Tiempo Real
Cuando un usuario llena un formulario en una Landing Page, el backend captura los datos:
- Extrae campos estándar (nombre, email, teléfono).
- Empaqueta los campos extra en formato `customFields`.
- Inyecta el Lead directamente al CRM de KiuFlow, asignándole la ruta (leadSource).
- Dispara asíncronamente el primer recordatorio automático (si el embudo lo tiene configurado).

## 🚀 Comandos de Ejecución

Instalar dependencias:
```bash
pnpm install
```

Arrancar en modo desarrollo:
```bash
pnpm run dev
```

Arrancar en producción:
```bash
pnpm start
```

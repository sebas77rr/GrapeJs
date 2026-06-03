# Frontend: KiuFlow Builder & Funnel Wizard

Cliente React impulsado por **Vite**. 
Sirve como interfaz gráfica principal para construir, gestionar y publicar **Landing Pages** (vía GrapesJS) y **Video Funnels**.

## 🛠️ Stack Tecnológico
- **Core:** React 18, Vite
- **Estilos:** TailwindCSS, Vanilla CSS
- **Editor:** GrapesJS (para Classic Builder)
- **Iconografía:** Lucide React

## 🎯 Estructura de Arquitectura (SPA)
El proyecto utiliza un enrutador interno ligero (`router/AppRouter.jsx`) para cambiar entre los diferentes módulos sin recargar la página, ofreciendo una experiencia Single Page Application (SPA).

- **`src/services/AppServices.js`**: Capa de abstracción para todas las llamadas HTTP. Conecta directamente con nuestro API Gateway (Backend en Node.js), que a su vez se comunica con el servidor central de KiuFlow.
- **`src/context/AppContext.jsx`**: Manejo de estado global para caché de perfiles, suscripciones y permisos en memoria.
- **`src/pages/`**: Vistas principales divididas modularmente:
  - `Dashboard`: Estadísticas y accesos rápidos.
  - `Landings` & `ClassicBuilder`: Listado y editor drag-and-drop.
  - `FunnelsList` & `FunnelWizard`: Asistente paso a paso de diseño e integraciones (Recordatorios, Canales).

## 🚀 Comandos de Ejecución

Instalar dependencias:
```bash
pnpm install
```

Arrancar en modo desarrollo local:
```bash
pnpm run dev
```

Construir para Producción (Genera la carpeta `/dist` consumida por el SSR del backend):
```bash
pnpm run build
```

# KiuFlow Builder - Funnels & Landing Pages 🚀

Bienvenido al repositorio de **KiuFlow Builder**, una plataforma completa para la creación, gestión y publicación de Landing Pages y Video Funnels dinámicos.

Este proyecto fue diseñado con una arquitectura **Full-Stack** optimizada para despliegues locales y corporativos (sin dependencias de bases de datos externas en la nube), priorizando la portabilidad, el rendimiento y la seguridad.

---

## 🏗️ Arquitectura del Proyecto

El proyecto está dividido en dos repositorios principales (Front y Back) para mantener una separación de responsabilidades limpia, pero la lógica fluye de la siguiente manera:

### 1. Frontend (React + Vite + GrapeJS)
El frontend es el **Constructor Visual**. Está construido con React y empaquetado con Vite para máxima velocidad.
- **GrapeJS Integration:** Utilizamos GrapeJS como motor principal para el *Drag & Drop*.
- **Extracción Híbrida:** A diferencia de una implementación tradicional de GrapeJS, aquí extraemos el **esquema JSON** (para volver a cargar el editor) y el **HTML/CSS en crudo** (para servir la página pública). Esto garantiza que el cliente final NUNCA cargue la pesada librería de GrapeJS al visitar la Landing Page, obteniendo tiempos de carga de menos de 1 segundo.
- **Rutas clave:**
  - `src/App.jsx`: Controlador principal del editor.
  - `src/components/...`: Componentes modulares de React para la UI del dashboard.

### 2. Backend (Node.js + Express)
El backend es el **Motor de Renderizado y Gestión de Datos**.
- **Independencia de Servicios Externos:** Por requerimiento de negocio, **no utilizamos ORMs pesados ni bases de datos en la nube (como Postgres o AWS)**. Toda la capa de persistencia se maneja de forma local y segura mediante el `File System` nativo de Node.js, utilizando un archivo maestro estructurado llamado `demo-db.json`. 
- **Ventaja:** Esto permite a la empresa desplegar el proyecto en cualquier servidor propio con un simple `npm install` y `npm start`, sin necesidad de aprovisionar infraestructuras complejas.
- **Funnel Renderer:** El archivo crítico aquí es `funnel-renderer.js`. Este script toma el HTML en crudo enviado por el Frontend, y le inyecta dinámicamente:
  - Reproductores de video (YouTube/Vimeo/MP4).
  - Scripts de analítica.
  - El sistema **Anti-Cheat** (Anti-Trampas).

---

## 🧠 Lógica Destacada: Sistema Anti-Cheat en Video Funnels

Uno de los mayores retos en los Video Funnels es evitar que el usuario se salte el video o adelante la barra de reproducción para llegar directamente al formulario de captura (Lead).

Para solucionar esto, no usamos una simple verificación de `currentTime` (que es fácilmente hackeable).
Implementamos una lógica de **Segmentación por Chunks**:
1. El video se divide lógicamente en 100 segmentos (1%).
2. A medida que el video avanza en velocidad normal (1x), un array interno registra qué fragmentos exactos han sido *realmente* visualizados.
3. El botón del formulario (Call to Action) se encuentra **bloqueado por defecto**. Solo se desbloquea dinámicamente si el array de segmentos visualizados alcanza el umbral definido por el creador (por ejemplo, 90%).
4. **Persistencia de sesión:** El progreso se guarda en `sessionStorage` para que, si el usuario recarga la página por accidente, no pierda su progreso de visualización y no se frustre.

---

## 📁 Estructura de Datos (JSON Local Database)

El archivo `backend/demo-db.json` actúa como nuestra base de datos relacional simulada. Sus colecciones principales son:
- **`clients`**: Usuarios de la plataforma (Agencias/Empresas).
- **`projects`**: Landing Pages estáticas.
- **`funnels`**: Embudos de venta en video con configuraciones de diseño, colores, umbrales de video y textos de CTA.
- **`leads`**: Datos de contacto capturados a través de los formularios públicos.
- **`storage/`**: Un directorio físico paralelo usado para almacenar los `assets` pesados localmente (imágenes y videos) sin depender de buckets de terceros.

---

## 🚀 Despliegue y Ejecución

**Requisitos:** Node.js (v18+)

### Arrancar el Backend (Motor)
```bash
cd backend
npm install
npm run start
# El servidor correrá en http://localhost:3001
```

### Arrancar el Frontend (Editor Visual)
```bash
cd frontend
npm install
npm run dev
# Vite correrá en http://localhost:5173
```

> **Nota para Producción:** El backend está configurado en `server.js` para servir automáticamente los archivos estáticos de la carpeta `frontend/dist`. Así que para producción, solo necesitas compilar el frontend (`npm run build`) y encender el backend. Él se encargará de despachar toda la aplicación web.

---
*Desarrollado y optimizado para la infraestructura interna de KiuFlow.*

import type { ComponentTemplate, ComponentCategory } from "../types/editor"

// Define component categories
export const componentCategories: ComponentCategory[] = [
  { id: "layouts", label: "Diseños Base" },
  { id: "hero", label: "Encabezados" },
  { id: "navigation", label: "Navegación" },
  { id: "features", label: "Características" },
  { id: "testimonials", label: "Testimonios" },
  { id: "pricing", label: "Precios" },
  { id: "cta", label: "Llamado a la Acción" },
  { id: "forms", label: "Formularios" },
  { id: "footer", label: "Pie de página" },
  { id: "ecommerce", label: "E-Commerce" },
  { id: "gallery", label: "Galería" },
  { id: "contact", label: "Contacto" },
  { id: "sections", label: "Secciones" },
]

// Create component templates
export const componentTemplates: ComponentTemplate[] = [
  {
    id: "landing-basica",
    label: "Landing Page Básica",
    category: "layouts",
    content: `
      <div style="font-family: sans-serif; color: #333; background: #ffffff;">
        <nav style="background: #ffffff; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0; color: #E94A6E; font-size: 24px; font-weight: bold;">MiMarca</h2>
          <div>
            <a href="#" style="margin-right: 20px; text-decoration: none; color: #666; font-weight: 500;">Inicio</a>
            <a href="#" style="margin-right: 20px; text-decoration: none; color: #666; font-weight: 500;">Servicios</a>
            <a href="#" style="text-decoration: none; color: #666; font-weight: 500;">Contacto</a>
          </div>
        </nav>
        <section style="background: linear-gradient(135deg, #E94A6E, #b92b4c); color: white; padding: 100px 20px; text-align: center;">
          <h1 style="font-size: 3.5rem; margin-bottom: 20px; font-weight: 800; line-height: 1.2;">Crea tu sitio web de<br>manera profesional</h1>
          <p style="font-size: 1.2rem; max-width: 600px; margin: 0 auto 35px auto; opacity: 0.9; line-height: 1.6;">
            Edita este texto, cambia los colores y construye la página perfecta para tu negocio en minutos.
          </p>
          <a href="#" style="display: inline-block; padding: 16px 36px; background: white; color: #E94A6E; text-decoration: none; font-weight: bold; border-radius: 50px; font-size: 1.1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">Comenzar Ahora</a>
        </section>
        <section style="padding: 80px 20px; text-align: center; background: #f8fafc;">
          <h2 style="margin-bottom: 50px; color: #1e293b; font-size: 2.5rem; font-weight: 700;">Nuestros Beneficios</h2>
          <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
            <div style="background: white; padding: 40px 30px; border-radius: 12px; width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
              <div style="width: 50px; height: 50px; background: #fee2e2; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">🚀</span>
              </div>
              <h3 style="color: #0f172a; margin-bottom: 10px; font-size: 1.25rem;">Rápido</h3>
              <p style="color: #64748b; margin: 0; line-height: 1.5;">Construye tu página en minutos usando nuestro potente editor visual sin saber programar.</p>
            </div>
            <div style="background: white; padding: 40px 30px; border-radius: 12px; width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
              <div style="width: 50px; height: 50px; background: #e0e7ff; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">🎨</span>
              </div>
              <h3 style="color: #0f172a; margin-bottom: 10px; font-size: 1.25rem;">Flexible</h3>
              <p style="color: #64748b; margin: 0; line-height: 1.5;">Personaliza absolutamente cada detalle para adaptarlo perfectamente a tu marca.</p>
            </div>
            <div style="background: white; padding: 40px 30px; border-radius: 12px; width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: left;">
              <div style="width: 50px; height: 50px; background: #dcfce7; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                <span style="font-size: 24px;">💎</span>
              </div>
              <h3 style="color: #0f172a; margin-bottom: 10px; font-size: 1.25rem;">Profesional</h3>
              <p style="color: #64748b; margin: 0; line-height: 1.5;">Obtén resultados de alta calidad que encantarán a tus clientes y generarán confianza.</p>
            </div>
          </div>
        </section>
        <footer style="background: #0f172a; color: #94a3b8; text-align: center; padding: 40px 20px;">
          <p style="margin: 0; font-size: 0.9rem;">© 2026 Todos los derechos reservados. Creado con Builder.</p>
        </footer>
      </div>
    `,
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
  }
]

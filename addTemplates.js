const fs = require('fs');

const file = 'frontend/src/utils/component-library.ts';
let content = fs.readFileSync(file, 'utf8');

const newTemplates = `
  ,{
    id: "landing-lead-magnet",
    label: "Lead Magnet (Captura)",
    category: "layouts",
    content: \`
      <div style="font-family: sans-serif; color: #333; background: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
        <div style="max-width: 1000px; margin: 40px auto; background: white; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; display: flex; flex-wrap: wrap;">
          <div style="flex: 1 1 400px; background: linear-gradient(135deg, #E94A6E, #b92b4c); padding: 50px; display: flex; flex-direction: column; justify-content: center; color: white;">
            <h2 style="font-size: 2rem; margin-bottom: 20px; font-weight: 800;">Descubre el Secreto para Escalar tu Negocio</h2>
            <p style="font-size: 1.1rem; opacity: 0.9; margin-bottom: 30px; line-height: 1.5;">Descarga nuestra guía gratuita y aprende paso a paso cómo duplicar tus ventas en 30 días sin invertir más en publicidad.</p>
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
              <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                <li>✅ Estrategias probadas en 2026</li>
                <li>✅ Plantillas de correos incluidas</li>
                <li>✅ 100% Gratis por tiempo limitado</li>
              </ul>
            </div>
          </div>
          <div style="flex: 1 1 400px; padding: 50px; display: flex; flex-direction: column; justify-content: center;">
            <h3 style="font-size: 1.8rem; margin-bottom: 10px; color: #0f172a; font-weight: 700;">¿A dónde te la enviamos?</h3>
            <p style="color: #64748b; margin-bottom: 30px;">Ingresa tus datos y recibe acceso inmediato al PDF.</p>
            <form style="display: flex; flex-direction: column; gap: 15px;" onsubmit="event.preventDefault()">
              <div>
                <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #334155; margin-bottom: 5px;">Nombre Completo</label>
                <input type="text" placeholder="Ej. Juan Pérez" style="width: 100%; padding: 12px 15px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none;">
              </div>
              <div>
                <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #334155; margin-bottom: 5px;">Correo Electrónico</label>
                <input type="email" placeholder="juan@correo.com" style="width: 100%; padding: 12px 15px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 1rem; outline: none;">
              </div>
              <button type="button" style="margin-top: 10px; width: 100%; padding: 15px; background: #E94A6E; color: white; border: none; border-radius: 8px; font-size: 1.1rem; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(233, 74, 110, 0.4);">¡Quiero mi Guía Gratis!</button>
              <p style="font-size: 0.8rem; color: #94a3b8; text-align: center; margin-top: 15px;">Tus datos están 100% seguros con nosotros.</p>
            </form>
          </div>
        </div>
      </div>
    \`,
    thumbnail: "https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "landing-saas",
    label: "SaaS / Software",
    category: "layouts",
    content: \`
      <div style="font-family: sans-serif; color: #1e293b; background: #ffffff;">
        <nav style="display: flex; justify-content: space-between; align-items: center; padding: 20px 50px; background: #ffffff;">
          <h2 style="margin: 0; color: #3b82f6; font-size: 24px; font-weight: 900;">AppSaaS</h2>
          <div>
            <a href="#" style="margin-right: 25px; text-decoration: none; color: #475569; font-weight: 600;">Funciones</a>
            <a href="#" style="margin-right: 25px; text-decoration: none; color: #475569; font-weight: 600;">Precios</a>
            <a href="#" style="padding: 10px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600;">Pruébalo Gratis</a>
          </div>
        </nav>
        
        <header style="padding: 80px 50px; display: flex; align-items: center; gap: 50px; background: #f8fafc; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 300px;">
            <div style="display: inline-block; padding: 6px 12px; background: #dbeafe; color: #1d4ed8; border-radius: 20px; font-size: 0.85rem; font-weight: bold; margin-bottom: 20px;">v2.0 Ya Disponible</div>
            <h1 style="font-size: 3.5rem; line-height: 1.1; margin-bottom: 20px; font-weight: 800; color: #0f172a;">Gestiona tu equipo como nunca antes.</h1>
            <p style="font-size: 1.2rem; color: #64748b; margin-bottom: 30px; line-height: 1.6;">La herramienta definitiva para organizar proyectos, delegar tareas y escalar la productividad de tu empresa sin estrés.</p>
            <div style="display: flex; gap: 15px;">
              <a href="#" style="padding: 14px 28px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">Comenzar Prueba</a>
              <a href="#" style="padding: 14px 28px; background: white; color: #334155; border: 1px solid #cbd5e1; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 1.1rem;">Ver Demo</a>
            </div>
          </div>
          <div style="flex: 1; min-width: 300px;">
            <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" alt="Dashboard" style="width: 100%; border-radius: 12px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
          </div>
        </header>

        <section style="padding: 80px 50px; text-align: center;">
          <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 15px;">Planes Simples y Transparentes</h2>
          <p style="color: #64748b; font-size: 1.1rem; margin-bottom: 50px;">Sin contratos ocultos. Paga solo por lo que usas.</p>
          <div style="display: flex; justify-content: center; gap: 30px; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 280px; max-width: 350px; padding: 40px 30px; border: 1px solid #e2e8f0; border-radius: 16px; text-align: left;">
              <h3 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 10px;">Básico</h3>
              <div style="font-size: 3rem; font-weight: 800; color: #0f172a; margin-bottom: 20px;">$19<span style="font-size: 1rem; color: #64748b; font-weight: normal;">/mes</span></div>
              <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; line-height: 2.5; color: #475569;">
                <li>✓ 5 Proyectos activos</li>
                <li>✓ Hasta 10 usuarios</li>
                <li>✓ Soporte por email</li>
              </ul>
              <a href="#" style="display: block; text-align: center; padding: 12px; background: #f1f5f9; color: #334155; text-decoration: none; border-radius: 8px; font-weight: bold;">Elegir Básico</a>
            </div>
            <div style="flex: 1; min-width: 280px; max-width: 350px; padding: 40px 30px; background: #0f172a; border-radius: 16px; text-align: left; color: white; position: relative; transform: scale(1.05); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);">
              <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #3b82f6; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">MÁS POPULAR</div>
              <h3 style="font-size: 1.5rem; color: white; margin-bottom: 10px;">Profesional</h3>
              <div style="font-size: 3rem; font-weight: 800; color: white; margin-bottom: 20px;">$49<span style="font-size: 1rem; color: #94a3b8; font-weight: normal;">/mes</span></div>
              <ul style="list-style: none; padding: 0; margin: 0 0 30px 0; line-height: 2.5; color: #cbd5e1;">
                <li>✓ Proyectos ilimitados</li>
                <li>✓ Usuarios ilimitados</li>
                <li>✓ Soporte prioritario 24/7</li>
                <li>✓ Reportes avanzados</li>
              </ul>
              <a href="#" style="display: block; text-align: center; padding: 12px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Comenzar Prueba Gratis</a>
            </div>
          </div>
        </section>
      </div>
    \`,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "landing-vsl",
    label: "Video Promocional (VSL)",
    category: "layouts",
    content: \`
      <div style="font-family: sans-serif; color: white; background: #000000; min-height: 100vh;">
        <div style="max-width: 900px; margin: 0 auto; padding: 60px 20px; text-align: center;">
          <h1 style="font-size: 3rem; font-weight: 900; line-height: 1.2; margin-bottom: 20px;">Cómo logramos generar <span style="color: #fbbf24;">+100 clientes mensuales</span> usando un simple video de 5 minutos.</h1>
          <p style="font-size: 1.2rem; color: #a1a1aa; margin-bottom: 40px;">Asegúrate de tener el volumen encendido y presta mucha atención al minuto 2:15.</p>
          
          <div style="width: 100%; aspect-ratio: 16/9; background: #18181b; border: 2px solid #27272a; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 40px; box-shadow: 0 0 40px rgba(251, 191, 36, 0.1);">
            <div style="text-align: center; color: #52525b;">
              <div style="font-size: 4rem; margin-bottom: 10px;">▶</div>
              <p>[Inserta aquí tu elemento de Video / Iframe de YouTube]</p>
            </div>
          </div>

          <a href="#" style="display: inline-block; padding: 20px 50px; background: linear-gradient(to bottom, #f59e0b, #d97706); color: white; text-decoration: none; font-size: 1.5rem; font-weight: 900; border-radius: 50px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.4);">Sí, quiero acceso al sistema ahora</a>
          <p style="font-size: 0.9rem; color: #71717a; margin-top: 20px;">Garantía de satisfacción 100%. Cupos limitados.</p>
        </div>
      </div>
    \`,
    thumbnail: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "landing-gallery",
    label: "Producto / Galería",
    category: "layouts",
    content: \`
      <div style="font-family: sans-serif; color: #2d3748; background: #ffffff;">
        <section style="display: flex; flex-wrap: wrap; background: #f7fafc;">
          <div style="flex: 1 1 500px; min-height: 400px; background-image: url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'); background-size: cover; background-position: center;"></div>
          <div style="flex: 1 1 400px; padding: 80px 50px; display: flex; flex-direction: column; justify-content: center;">
            <div style="font-size: 0.9rem; font-weight: bold; color: #718096; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Novedad Exclusiva</div>
            <h1 style="font-size: 3.5rem; font-weight: 900; margin-bottom: 20px; line-height: 1.1;">SmartWatch Pro X</h1>
            <p style="font-size: 1.2rem; color: #4a5568; margin-bottom: 30px; line-height: 1.6;">El reloj inteligente más avanzado jamás creado. Control de salud, batería para 7 días y diseño premium de titanio.</p>
            <div style="font-size: 2.5rem; font-weight: bold; margin-bottom: 30px; color: #1a202c;">$299<span style="font-size: 1.2rem; color: #a0aec0; text-decoration: line-through; margin-left: 15px;">$399</span></div>
            <a href="#" style="padding: 18px 40px; background: #000000; color: white; text-decoration: none; font-weight: bold; font-size: 1.2rem; text-align: center; border-radius: 4px;">Comprar Ahora</a>
          </div>
        </section>
        
        <section style="padding: 80px 50px; text-align: center;">
          <h2 style="font-size: 2.5rem; font-weight: 800; margin-bottom: 40px;">Galería de Producto</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
            <img src="https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=400&q=80" style="width: 100%; border-radius: 8px; aspect-ratio: 1/1; object-fit: cover;">
            <img src="https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=400&q=80" style="width: 100%; border-radius: 8px; aspect-ratio: 1/1; object-fit: cover;">
            <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=400&q=80" style="width: 100%; border-radius: 8px; aspect-ratio: 1/1; object-fit: cover;">
            <img src="https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?auto=format&fit=crop&w=400&q=80" style="width: 100%; border-radius: 8px; aspect-ratio: 1/1; object-fit: cover;">
          </div>
        </section>
      </div>
    \`,
    thumbnail: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: "landing-webinar",
    label: "Evento / Masterclass",
    category: "layouts",
    content: \`
      <div style="font-family: sans-serif; background: #ffffff; color: #1f2937;">
        <div style="background: #ef4444; color: white; text-align: center; padding: 12px; font-weight: bold; font-size: 0.95rem;">
          ⚠️ ATENCIÓN: Solo quedan 15 cupos disponibles para la Masterclass en vivo.
        </div>
        
        <div style="max-width: 1200px; margin: 0 auto; padding: 60px 20px; display: flex; flex-wrap: wrap; gap: 60px; align-items: center;">
          <div style="flex: 1 1 500px;">
            <div style="display: inline-block; padding: 6px 15px; background: #fee2e2; color: #b91c1c; border-radius: 50px; font-weight: 800; font-size: 0.85rem; letter-spacing: 1px; margin-bottom: 20px;">CLASE ONLINE GRATUITA</div>
            <h1 style="font-size: 3.5rem; font-weight: 900; line-height: 1.1; margin-bottom: 25px;">Aprende a Invertir en Bienes Raíces sin Capital Propio.</h1>
            <p style="font-size: 1.25rem; color: #4b5563; margin-bottom: 40px; line-height: 1.6;">Descubre el método exacto que utilizan los expertos para adquirir propiedades rentables utilizando dinero de terceros de forma 100% legal y segura.</p>
            
            <div style="background: #f3f4f6; padding: 25px; border-radius: 12px; border-left: 5px solid #ef4444; margin-bottom: 40px;">
              <div style="font-weight: 800; margin-bottom: 10px; font-size: 1.1rem;">📅 Fecha: Jueves 24 de Agosto, 19:00 hrs (GMT-5)</div>
              <div style="color: #4b5563;">Formato: Transmisión en Vivo (Vía Zoom)</div>
            </div>
            
            <a href="#" style="display: block; width: 100%; text-align: center; padding: 20px; background: #ef4444; color: white; text-decoration: none; font-size: 1.4rem; font-weight: 900; border-radius: 8px; box-shadow: 0 10px 15px -3px rgba(239, 68, 68, 0.4);">RESERVAR MI ASIENTO GRATIS AHORA</a>
          </div>
          
          <div style="flex: 1 1 400px; text-align: center;">
            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=600&q=80" style="width: 100%; max-width: 450px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
            <div style="margin-top: 20px;">
              <h3 style="font-size: 1.2rem; font-weight: 800; margin-bottom: 5px;">Carlos Empresario</h3>
              <p style="color: #6b7280;">Inversor y Fundador de RealEstate Group</p>
            </div>
          </div>
        </div>
      </div>
    \`,
    thumbnail: "https://images.unsplash.com/photo-1556761175-5973dc0f32b7?auto=format&fit=crop&w=400&q=80",
  }
`;

const matchRegex = /}\s*\]\s*$/;
if (matchRegex.test(content)) {
  content = content.replace(matchRegex, '}' + newTemplates + '\n]');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Templates successfully injected.');
} else {
  console.log('Error: Could not find the end of the array to inject templates.');
}

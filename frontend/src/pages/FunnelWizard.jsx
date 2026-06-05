import { useState, useEffect } from "react";
import { Bell, MessageSquare, CalendarClock, CheckCircle2, Timer, Target, FileText, Moon, Sun, Video, FormInput, Clock, Eye, Clapperboard, Lock, PartyPopper, Rocket, Save, ArrowLeft, ArrowRight } from "lucide-react";
import { FunnelService } from "../services/AppServices";
import { BASE_URL } from "../infrastructure/api/config";

/**
 * FunnelWizardView
 * Asistente paso a paso para la creación y configuración de Video Funnels.
 * Gestiona el diseño, video, colores, integraciones y notificaciones CRM.
 */
export default function FunnelWizardView({ clientId, subId, funnelId, onBack }) {
  const renderVideoPreview = (url) => {
    if (!url) return null;
    
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return <iframe className="w-full aspect-video" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allowFullScreen></iframe>;
    }
    
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return <iframe className="w-full aspect-video" src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} frameBorder="0" allowFullScreen></iframe>;
    }
    
    // Default to native video player for MP4
    return (
      <div className={`mx-auto ${form.video_orientation === 'vertical' ? 'max-w-[280px]' : 'w-full'}`}>
        <video controls className={`w-full ${form.video_orientation === 'vertical' ? 'aspect-[9/16]' : 'aspect-video'} object-cover rounded-md`} src={url}>Tu navegador no soporta la reproducción.</video>
      </div>
    );
  };
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!funnelId);
  const [created, setCreated] = useState(null);
  
  const [reminders, setReminders] = useState({
    r1_enabled: true, r1_templateId: '', r1_text: '¡Hola! Gracias por registrarte. En breve nos pondremos en contacto contigo. 🚀', r1_hours: 0,
    r2_enabled: true, r2_templateId: '', r2_text: 'Recuerda que mañana tienes tu cita programada. ¡Te esperamos!', r2_hours: 24,
    r3_enabled: true, r3_templateId: '', r3_url: '', r3_text: 'Tu sesión comienza en 1 hora.', r3_hours: 48,
    r4_enabled: true, r4_templateId: '', r4_text: 'Tu sesión comienza en 5 minutos. ¡Entra ahora!', r4_url: '', r4_hours: 72,
  });
  
  const [channels, setChannels] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [kiuflowFiles, setKiuflowFiles] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  
  const updateReminder = (key, val) => setReminders(prev => ({ ...prev, [key]: val }));
  
  const [form, setForm] = useState({
    title: '', highlight_text: '', video_url: '', video_type: 'youtube', video_orientation: 'horizontal', theme: '', bg_color: '', bg_image: '',
    text_color: '', cta_color: '#DB2C52', cta_text: 'Quiero inscribirme', locked_btn_text: 'Ve el video para desbloquear el beneficio', video_threshold: 90,
    form_fields: [
      { name: 'nombre', label: 'Nombre completo', type: 'text', required: true },
      { name: 'email', label: 'Correo electrónico', type: 'email', required: true },
      { name: 'telefono', label: 'Teléfono / WhatsApp', type: 'tel', required: true },
      { name: 'empresa', label: 'Empresa', type: 'text', required: false },
      { name: 'mensaje', label: 'Mensaje', type: 'textarea', required: false },
    ],
    defaultChannelId: ''
  });

  useEffect(() => {
    FunnelService.getChannels(subId).then(res => setChannels(res.channels || [])).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.defaultChannelId) {
      FunnelService.getTemplates(form.defaultChannelId, subId).then(res => setTemplates(res.templates || [])).catch(console.error);
    } else {
      setTemplates([]);
    }
  }, [form.defaultChannelId]);

  useEffect(() => {
    if (funnelId) {
      FunnelService.getFunnelById(funnelId, clientId, subId).then(({ funnel }) => {
        let parsed = funnel.form_fields;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); if (typeof parsed === 'string') parsed = JSON.parse(parsed); } 
          catch(e) { parsed = []; }
        }
        setForm({
          title: funnel.title || '', highlight_text: funnel.highlight_text || '', video_url: funnel.video_url || '', video_type: funnel.video_type || 'youtube', video_orientation: funnel.video_orientation || 'horizontal',
          theme: funnel.theme || '', bg_color: funnel.bg_color || '', bg_image: funnel.bg_image || '', text_color: funnel.text_color || '', cta_color: funnel.cta_color || '#DB2C52',
          cta_text: funnel.cta_text || 'Quiero inscribirme', locked_btn_text: funnel.locked_btn_text || 'Ve el video para desbloquear el beneficio',
          video_threshold: funnel.video_threshold || 90, form_fields: parsed || [], defaultChannelId: funnel.defaultChannelId || ''
        });
        
        if (funnel.reminders_config) {
          try {
            const parsedReminders = JSON.parse(funnel.reminders_config);
            setReminders(prev => ({ ...prev, ...parsedReminders }));
          } catch(e) {}
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [funnelId]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const addField = () => setForm(prev => ({ ...prev, form_fields: [...prev.form_fields, { name: 'campo_' + Date.now(), label: 'Nuevo campo', type: 'text', required: false }] }));
  const updateField = (idx, updates) => { setForm(prev => { const f = [...prev.form_fields]; f[idx] = { ...f[idx], ...updates }; return { ...prev, form_fields: f }; }); };
  const removeField = (idx) => setForm(prev => ({ ...prev, form_fields: prev.form_fields.filter((_, i) => i !== idx) }));
  const moveField = (idx, dir) => {
    if (idx + dir < 0 || idx + dir >= form.form_fields.length) return;
    const f = [...form.form_fields];
    const temp = f[idx]; f[idx] = f[idx + dir]; f[idx + dir] = temp;
    setForm(prev => ({ ...prev, form_fields: f }));
  };

  const canNext = () => {
    if (step === 1) return form.title.trim() && form.highlight_text.trim();
    if (step === 2) return form.video_url.trim();
    if (step === 3) return form.cta_text.trim();
    return true;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const remindersArray = [
        { enabled: reminders.r1_enabled, channelId: form.defaultChannelId, templateId: reminders.r1_templateId, content: reminders.r1_text, hours_offset: reminders.r1_hours },
        { enabled: reminders.r2_enabled, channelId: form.defaultChannelId, templateId: reminders.r2_templateId, content: reminders.r2_text, hours_offset: reminders.r2_hours },
        { enabled: reminders.r3_enabled, channelId: form.defaultChannelId, templateId: reminders.r3_templateId, content: reminders.r3_text || reminders.r3_url, hours_offset: reminders.r3_hours },
        { enabled: reminders.r4_enabled, channelId: form.defaultChannelId, templateId: reminders.r4_templateId, content: reminders.r4_text || reminders.r4_url, hours_offset: reminders.r4_hours },
      ].filter(r => r.enabled);

      const payload = { 
        ...form, 
        form_fields: JSON.stringify(form.form_fields), 
        reminders: remindersArray,
        reminders_config: JSON.stringify(reminders)
      };

      if (funnelId) {
        // UPDATE: el backend devuelve { ok: true, savedAt: '...' }
        const result = await FunnelService.updateFunnel(funnelId, clientId, { ...payload, sub_id: subId });
        if (result.ok) {
          setCreated(result.funnel || { id: funnelId, title: form.title, url: null });
          setStep(6);
        } else {
          alert('Error al guardar el funnel');
        }
      } else {
        // CREATE: el backend devuelve { funnel: { id, title, url, ... } }
        const result = await FunnelService.createFunnel({ ...payload, client_id: clientId, sub_id: subId });
        if (result.funnel) {
          setCreated(result.funnel);
          setStep(6);
        } else {
          alert('Error al crear el funnel');
        }
      }
    } catch(e) { 
      console.error('Error guardando funnel:', e);
      alert('Error al guardar el funnel'); 
    }
    setSaving(false);
  };

  if (loading) return <div className="p-10 text-zinc-500">Cargando funnel...</div>;

  const totalSteps = 5;

  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight flex items-center"><Target className="mr-2" size={24} /> Nuevo Video Funnel</h1>
          <p className="text-slate-500 text-sm mt-1">Paso {Math.min(step, totalSteps)} de {totalSteps}</p>
        </div>
        <button className="bg-transparent border border-slate-300 text-slate-700 rounded-lg py-2.5 px-5 text-sm font-semibold cursor-pointer hover:bg-slate-50 transition-colors flex items-center" onClick={onBack}>
          <ArrowLeft className="mr-2" size={16} /> Volver a Funnels
        </button>
      </div>

      <div className="bg-slate-200 rounded-full h-1 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-sidebar to-sidebar-border transition-all duration-400 ease-out" style={{ width: `${(Math.min(step, totalSteps) / totalSteps) * 100}%` }} />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="text-slate-900 text-lg font-bold border-b border-slate-100 pb-3 flex items-center"><FileText className="mr-2 text-slate-400" size={20} /> Contenido de la landing</div>
            <div>
              <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Título principal</label>
              <input className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none focus:border-sidebar" placeholder="Ej: Descubre cómo duplicar tus ventas" value={form.title} onChange={e => update('title', e.target.value)} />
              <div className="text-slate-500 text-xs mt-1.5">El título grande que verá el visitante al entrar.</div>
            </div>
            <div>
              <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Texto destacado</label>
              <textarea className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none min-h-[80px] resize-y focus:border-sidebar" placeholder="Ej: En este video exclusivo te mostramos..." value={form.highlight_text} onChange={e => update('highlight_text', e.target.value)} />
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-dashed border-slate-300">
            {/* ── Apariencia Base ── */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-5">
              <div className="text-slate-700 text-[13px] font-bold uppercase tracking-wider flex items-center gap-2">
                <Moon size={14} className="text-slate-400" /> Tema Base
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { update('theme', 'dark'); update('bg_color', ''); update('bg_image', ''); }} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${form.theme === 'dark' ? 'ring-2 ring-sidebar bg-slate-900 text-white shadow-md' : 'border border-slate-200 bg-slate-900 text-white hover:shadow-sm'}`}>
                  <Moon size={20} /><div className="text-[13px] font-semibold">Dark Premium</div>
                </button>
                <button onClick={() => { update('theme', 'light'); update('bg_color', ''); update('bg_image', ''); }} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${form.theme === 'light' ? 'ring-2 ring-sidebar bg-white text-slate-900 shadow-md' : 'border border-slate-200 bg-white text-slate-900 hover:shadow-sm'}`}>
                  <Sun size={20} className="text-amber-500" /><div className="text-[13px] font-semibold">Light Minimal</div>
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="text-slate-700 text-[13px] font-bold uppercase tracking-wider mb-3">Personalización (Opcional)</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 text-xs block mb-2 font-semibold">Color de Letras</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-[42px] h-[42px] p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white" value={form.text_color || '#ffffff'} onChange={e => { update('text_color', e.target.value); update('theme', ''); }} />
                      <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 text-slate-800 text-sm outline-none focus:border-sidebar" placeholder="#HEX" value={form.text_color} onChange={e => { update('text_color', e.target.value); update('theme', ''); }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-500 text-xs block mb-2 font-semibold">Color Sólido (Fondo)</label>
                    <div className="flex gap-2">
                      <input type="color" className="w-[42px] h-[42px] p-0.5 border border-slate-200 rounded-lg cursor-pointer bg-white" value={form.bg_color || '#ffffff'} onChange={e => { update('bg_color', e.target.value); update('bg_image', ''); update('theme', ''); }} />
                      <input className="flex-1 bg-white border border-slate-200 rounded-lg px-3 text-slate-800 text-sm outline-none focus:border-sidebar" placeholder="#HEX" value={form.bg_color} onChange={e => { update('bg_color', e.target.value); update('bg_image', ''); update('theme', ''); }} />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="text-slate-500 text-xs block mb-2 font-semibold">Logo URL (Opcional)</label>
                  <input className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-sm outline-none focus:border-sidebar" placeholder="https://ejemplo.com/logo.png" value={form.logo_url || ''} onChange={e => update('logo_url', e.target.value)} />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Imagen de Fondo</label>
                  <button
                    onClick={async () => {
                      if (!showImageGallery && kiuflowFiles.length === 0) {
                        const res = await FunnelService.getFiles(85, subId);
                        setKiuflowFiles(res.files || []);
                      }
                      setShowImageGallery(!showImageGallery);
                    }}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    {showImageGallery ? 'Cerrar Galería' : '📁 Explorar Galería'}
                  </button>
                </div>
                {showImageGallery && (
                  <div className="mb-3 bg-white border border-slate-200 rounded-xl p-3 max-h-[180px] overflow-y-auto">
                    {kiuflowFiles.length === 0 ? (
                      <div className="text-xs text-slate-400 text-center py-4">No se encontraron imágenes en KiuFlow.</div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {kiuflowFiles.filter(f => f.type?.includes('image') || f.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)).map(file => (
                          <div
                            key={file.id}
                            onClick={() => { update('bg_image', file.url); update('bg_color', ''); update('theme', ''); setShowImageGallery(false); }}
                            className="cursor-pointer border border-slate-200 bg-slate-50 hover:border-indigo-500 hover:bg-indigo-50 rounded-lg p-1.5 text-center transition-all"
                          >
                            <img src={file.url} alt={file.name} referrerPolicy="no-referrer" className="w-full h-10 object-cover rounded mb-1" />
                            <div className="text-[9px] text-slate-500 truncate">{file.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <input
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-slate-800 text-sm outline-none focus:border-sidebar"
                  placeholder="https://... o selecciona de galería"
                  value={form.bg_image}
                  onChange={e => { update('bg_image', e.target.value); update('bg_color', ''); update('theme', ''); }}
                />
              </div>
            </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-6 fade-in active">
            <div className="text-slate-900 text-lg font-bold border-b border-slate-100 pb-3 flex items-center"><Video className="mr-2 text-slate-400" size={20} /> Configuración del Video</div>
            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
              <div className="text-indigo-900 text-sm font-medium mb-1">Carga tu Video VSL</div>
              <div className="text-indigo-700 text-[13px]">Pega el enlace directo a tu archivo de video (.mp4). Asegúrate de que la URL sea pública.</div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-slate-600 text-[13px] font-semibold">URL del Video (MP4)</label>
                <button 
                  onClick={async () => {
                    if (!showGallery && kiuflowFiles.length === 0) {
                      const res = await FunnelService.getFiles(85, subId);
                      setKiuflowFiles(res.files || []);
                    }
                    setShowGallery(!showGallery);
                  }}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                >
                  {showGallery ? 'Cerrar Galería' : 'Explorar Galería KiuFlow'}
                </button>
              </div>

              {showGallery && (
                <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[250px] overflow-y-auto">
                  <div className="text-xs font-bold text-slate-500 mb-3">SELECCIONA UN VIDEO DE TU GALERÍA</div>
                  {kiuflowFiles.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-4">No se encontraron archivos en la carpeta de KiuFlow.</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {kiuflowFiles.filter(f => f.type?.includes('video') || f.name?.match(/\.(mp4|mov|webm)$/i)).map(file => (
                        <div 
                          key={file.id} 
                          onClick={() => { update('video_url', file.url); update('video_type', 'mp4'); setShowGallery(false); }}
                          className="cursor-pointer border border-slate-200 bg-white hover:border-indigo-500 rounded-lg p-2 text-center transition-all group"
                        >
                          <div className="aspect-video bg-slate-100 flex items-center justify-center rounded mb-2 group-hover:bg-indigo-50">
                            <Clapperboard size={24} className="text-slate-400 group-hover:text-indigo-500" />
                          </div>
                          <div className="text-[10px] text-slate-600 truncate px-1" title={file.name}>{file.name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <input 
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-slate-900 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                placeholder="https://ejemplo.com/video.mp4" 
                value={form.video_url} 
                onChange={e => {
                  update('video_url', e.target.value);
                  update('video_type', 'mp4');
                }} 
              />
              
              <div className="mt-4 flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="fullscreen_video"
                  checked={form.video_mode === 'fullscreen'}
                  onChange={e => update('video_mode', e.target.checked ? 'fullscreen' : 'normal')}
                  className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="fullscreen_video" className="text-sm text-slate-700 font-medium cursor-pointer">
                  Mostrar video en Pantalla Completa
                  <p className="text-xs text-slate-500 font-normal mt-0.5">Ignora la barra de progreso y muestra solo el video gigante.</p>
                </label>
              </div>

              {/* Vista previa del video */}
              {form.video_url && (
                <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden bg-slate-900 shadow-sm">
                  <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Vista Previa del Video
                  </div>
                  {renderVideoPreview(form.video_url)}
                </div>
              )}
            </div>

            {/* Orientación del video */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
              <div className="text-slate-700 text-[13px] font-bold uppercase tracking-wider mb-3">Orientación del Video</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => update('video_orientation', 'horizontal')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.video_orientation !== 'vertical'
                      ? 'border-sidebar bg-sidebar/5 text-sidebar'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="w-16 h-10 rounded-md border-2 border-current opacity-80 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-current" />
                  </div>
                  <span className="text-[13px] font-semibold">Horizontal</span>
                  <span className="text-[11px] opacity-60">Formato panorámico 16:9</span>
                </button>
                <button
                  onClick={() => update('video_orientation', 'vertical')}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.video_orientation === 'vertical'
                      ? 'border-sidebar bg-sidebar/5 text-sidebar'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-16 rounded-md border-2 border-current opacity-80 flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full border-2 border-current" />
                  </div>
                  <span className="text-[13px] font-semibold">Vertical</span>
                  <span className="text-[11px] opacity-60">Formato reels/stories 9:16</span>
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mt-2">
              <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Umbral de Desbloqueo (%)</label>
              <div className="text-slate-500 text-[12px] mb-3">
                ¿En qué porcentaje del video quieres que aparezca el botón de compra o formulario? 
                (Ej: 90% para que vean casi todo el video antes de decidir).
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="range" 
                  min="50" 
                  max="100" 
                  className="flex-1 accent-indigo-600" 
                  value={Math.max(50, form.video_threshold)} 
                  onChange={e => update('video_threshold', parseInt(e.target.value))} 
                />
                <div className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-indigo-700 w-16 text-center shadow-sm">
                  {form.video_threshold}%
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6 fade-in active">
            <div className="text-slate-900 text-lg font-bold border-b border-slate-100 pb-3 flex items-center"><FormInput className="mr-2 text-slate-400" size={20} /> Call to Action y Formulario</div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Texto del Botón Bloqueado</label>
                <input className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none" value={form.locked_btn_text} onChange={e => update('locked_btn_text', e.target.value)} />
                <div className="text-slate-500 text-xs mt-1">Se muestra antes de alcanzar el umbral del video.</div>
              </div>
              <div>
                <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Texto del Botón Desbloqueado (CTA)</label>
                <input className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none" value={form.cta_text} onChange={e => update('cta_text', e.target.value)} />
                <div className="text-slate-500 text-xs mt-1">El botón real para registrarse/comprar.</div>
              </div>
            </div>

            <div>
              <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Color del Botón Principal</label>
              <div className="flex gap-2">
                <input type="color" className="w-[50px] h-[42px] p-0 border-none rounded-lg cursor-pointer" value={form.cta_color} onChange={e => update('cta_color', e.target.value)} />
                <input className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-slate-900 text-sm outline-none" value={form.cta_color} onChange={e => update('cta_color', e.target.value)} />
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-slate-900 text-[15px] block font-bold">Campos del Formulario</label>
                <button onClick={addField} className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                  + Añadir Campo
                </button>
              </div>
              
              <div className="flex flex-col gap-3">
                {form.form_fields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">▲</button>
                      <button onClick={() => moveField(idx, 1)} disabled={idx === form.form_fields.length - 1} className="text-slate-400 hover:text-slate-700 disabled:opacity-30">▼</button>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Label (Visible)</span>
                        <input className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm outline-none mt-1" value={field.label} onChange={e => { updateField(idx, { label: e.target.value, name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }); }} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">Tipo</span>
                          <select className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm outline-none mt-1" value={field.type} onChange={e => updateField(idx, { type: e.target.value })}>
                            <option value="text">Texto Corto</option>
                            <option value="email">Email</option>
                            <option value="tel">Teléfono</option>
                            <option value="textarea">Área de Texto</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 border-l border-slate-200 pl-3">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                        <input type="checkbox" checked={field.required} onChange={e => updateField(idx, { required: e.target.checked })} className="accent-indigo-600 w-4 h-4" />
                        Req.
                      </label>
                      <button onClick={() => removeField(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold text-left">
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
                {form.form_fields.length === 0 && (
                  <div className="text-center p-6 text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                    No hay campos. Añade uno para capturar datos de tus leads.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-6 fade-in active">
            <div className="text-slate-900 text-lg font-bold border-b border-slate-100 pb-3 flex items-center">
              <Clock className="mr-2 text-slate-400" size={20} /> Secuencia de Recordatorios (WhatsApp)
            </div>

            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 flex flex-col gap-4">
              <div>
                <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Canal de WhatsApp (Remitente)</label>
                <select className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none focus:border-sidebar" value={form.defaultChannelId} onChange={e => update('defaultChannelId', e.target.value)}>
                  <option value="">-- Selecciona un Canal KiuFlow --</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type?.name})</option>
                  ))}
                </select>
              </div>

              {/* ✅ NUEVO: Aplicar plantilla a todos */}
              {form.defaultChannelId && templates.length > 0 && (
                <div>
                  <label className="text-slate-600 text-[13px] block mb-2 font-semibold">Aplicar plantilla a todos los recordatorios</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none"
                      defaultValue=""
                      id="globalTemplate"
                    >
                      <option value="">-- Selecciona una plantilla --</option>
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                    <button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap"
                      onClick={() => {
                        const val = document.getElementById('globalTemplate').value;
                        if (!val) return;
                        ['r1','r2','r3','r4'].forEach(key => updateReminder(`${key}_templateId`, val));
                      }}
                    >
                      Aplicar a todos
                    </button>
                  </div>
                  <div className="text-slate-400 text-xs mt-1.5">Puedes cambiar la plantilla individualmente en cada recordatorio después.</div>
                </div>
              )}
            </div>

            {[
              { key: 'r1', bg: 'bg-green-500', icon: CheckCircle2, text: 'text-green-500', title: '1. Confirmación de Registro', desc: 'Se envía 5 minutos después de que el cliente se registra.' },
              { key: 'r2', bg: 'bg-blue-500', icon: CalendarClock, text: 'text-blue-500', title: '2. Recordatorio de Cita', desc: 'Se envía 24 horas antes de la cita.' },
              { key: 'r3', bg: 'bg-orange-500', icon: Timer, text: 'text-orange-500', title: '3. Confirmación de Asistencia', desc: 'Se envía 3 horas antes de la cita.', hasButtons: true },
              { key: 'r4', bg: 'bg-red-500', icon: MessageSquare, text: 'text-red-500', title: '4. Último Aviso', desc: 'Se envía 5 minutos antes de la cita.' }
            ].map((r) => {
              const Icon = r.icon;
              return (
                <div key={r.key} className={`bg-slate-50 rounded-xl p-5 border border-slate-200 relative overflow-hidden group ${!form.defaultChannelId ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className={`absolute top-0 left-0 w-1 h-full ${r.bg}`}></div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <Icon size={18} className={r.text} />
                        {r.title}
                      </div>
                      <div className="text-xs text-slate-500 ml-6">{r.desc}</div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={reminders[`${r.key}_enabled`]} onChange={e => updateReminder(`${r.key}_enabled`, e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                      <span className="text-xs font-semibold text-slate-600">Activo</span>
                    </label>
                  </div>

                  {reminders[`${r.key}_enabled`] && (
                    <div className="flex flex-col gap-3 mt-3">
                      <div>
                        <label className="text-slate-600 text-xs block mb-1 font-semibold">Plantilla Oficial KiuFlow</label>
                        <select className="w-full bg-white border border-slate-300 rounded-md p-2 text-slate-900 text-sm outline-none" value={reminders[`${r.key}_templateId`]} onChange={e => updateReminder(`${r.key}_templateId`, e.target.value)}>
                          <option value="">-- Sin Plantilla (Texto Libre) --</option>
                          {templates.map(t => (
                            <option key={t.id} value={t.id}>{t.title}</option>
                          ))}
                        </select>
                      </div>

                      {!reminders[`${r.key}_templateId`] && (
                        <div>
                          <label className="text-slate-600 text-xs block mb-1 font-semibold">Mensaje Personalizado</label>
                          <textarea className="w-full bg-white border border-slate-300 rounded-lg p-3 text-slate-900 text-sm outline-none min-h-[60px]" placeholder="Hola, te recordamos..." value={reminders[`${r.key}_text`]} onChange={e => updateReminder(`${r.key}_text`, e.target.value)} />
                        </div>
                      )}

                      {/* Botones fijos solo para R3 */}
                      {r.hasButtons && (
                        <div className="mt-2">
                          <label className="text-slate-600 text-xs block mb-2 font-semibold">Botones de Respuesta (fijos)</label>
                          <div className="flex gap-3">
                            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-center text-green-700 text-sm font-semibold">
                              ✅ Sí, asistiré
                            </div>
                            <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-center text-red-700 text-sm font-semibold">
                              ❌ No, reagendar
                            </div>
                          </div>
                          <div className="text-slate-400 text-xs mt-1.5">Estos botones se enviarán automáticamente con el mensaje.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-5">
            <div className="text-slate-900 text-lg font-bold border-b border-slate-100 pb-3 flex items-center"><Eye className="mr-2 text-slate-400" size={20} /> Preview y Confirmación</div>
            <div className="relative overflow-hidden rounded-xl border border-slate-200 p-8 text-center" style={{ background: form.bg_color || (form.theme === 'dark' ? '#0f172a' : '#f8fafc'), backgroundImage: form.bg_image ? `url(${form.bg_image})` : 'none', backgroundSize: 'cover' }}>
              {form.bg_image && <div className="absolute inset-0 bg-black/60" />}
              <div className="relative z-10" style={{ color: form.bg_image || form.theme === 'dark' || form.bg_color ? '#ffffff' : '#0f172a' }}>
                <h2 className="text-2xl font-bold m-0">{form.title || 'Sin título'}</h2>
                <p className="text-[15px] mt-2 opacity-80">{form.highlight_text || 'Sin descripción'}</p>
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-8 my-6 mx-auto max-w-[400px] border border-white/10">
                  <Clapperboard className="mx-auto text-white mb-2" size={40} />
                  <div className="text-xs mt-2 opacity-70">{form.video_type.toUpperCase()} · Desbloqueo al {form.video_threshold}%</div>
                </div>
                <div className="inline-block px-7 py-3 rounded-lg text-[15px] font-semibold shadow-lg text-white flex items-center mx-auto justify-center max-w-fit" style={{ background: form.cta_color }}>
                  <Lock className="mr-2" size={16} /> {form.locked_btn_text}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 6 && created && (
          <div className="text-center py-10 px-5">
            <PartyPopper className="mx-auto text-indigo-500 mb-4" size={60} />
            <h2 className="text-slate-900 text-2xl font-bold m-0 mb-2">{funnelId ? '¡Funnel actualizado!' : '¡Funnel creado y publicado!'}</h2>
            <p className="text-slate-500 text-[15px] mb-6">{funnelId ? 'Tus cambios ya están en vivo.' : 'Tu embudo de ventas está listo para recibir visitantes.'}</p>
            <div className="bg-slate-50 rounded-xl p-4 px-6 border border-dashed border-slate-300 inline-block mb-6">
              <div className="text-slate-500 text-[11px] mb-1.5 font-semibold tracking-wider">ENLACE PÚBLICO</div>
              <div className="text-sidebar text-base font-bold">{created.url || 'URL no disponible'}</div>
            </div>
            <div className="flex gap-3 justify-center">
              <button className="bg-sidebar hover:bg-sidebar-border text-white border-none rounded-lg py-2.5 px-5 font-semibold cursor-pointer flex items-center" onClick={() => window.open(created.url || '#', '_blank')}>
                <Rocket className="mr-2" size={16} /> Abrir Landing
              </button>
              <button className="bg-transparent hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg py-2.5 px-5 font-semibold cursor-pointer flex items-center" onClick={onBack}>
                <ArrowLeft className="mr-2" size={16} /> Volver a Funnels
              </button>
            </div>
          </div>
        )}

        {step <= totalSteps && (
          <div className="flex justify-between mt-8 pt-5 border-t border-slate-100">
            <button className="bg-transparent border border-slate-300 text-slate-700 rounded-lg py-2.5 px-5 font-semibold cursor-pointer hover:bg-slate-50 disabled:opacity-50 flex items-center" onClick={() => step > 1 ? setStep(step - 1) : onBack()} disabled={saving}>
              <ArrowLeft className="mr-2" size={16} /> {step === 1 ? 'Cancelar' : 'Anterior'}
            </button>
            {step < totalSteps ? (
              <button className="bg-sidebar hover:bg-sidebar-border text-white border-none rounded-lg py-2.5 px-5 font-semibold cursor-pointer disabled:opacity-40 flex items-center" disabled={!canNext()} onClick={() => setStep(step + 1)}>
                Siguiente <ArrowRight className="ml-2" size={16} />
              </button>
            ) : (
              <button className="bg-gradient-to-r from-sidebar to-sidebar-border text-white border-none rounded-lg py-2.5 px-5 font-semibold cursor-pointer disabled:opacity-50 flex items-center" disabled={saving} onClick={handleSave}>
                {saving ? (
                  'Guardando...'
                ) : funnelId ? (
                  <><Save className="mr-2" size={16} /> Guardar Cambios</>
                ) : (
                  <><Rocket className="mr-2" size={16} /> Crear y Publicar</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Video, Calendar as CalendarIcon, Clock, MapPin, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { API_URL } from "../../infrastructure/api/config";
import { Calendar } from "../../components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function CallPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appointment, setAppointment] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null); // en milisegundos

  // Vistas: "confirm", "reschedule", "success_confirm", "success_reschedule"
  const [viewState, setViewState] = useState("confirm");

  // Reagendamiento
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAppointment = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const metadataBase64 = urlParams.get("metadata");

      if (!metadataBase64) {
        setError("El enlace no es válido o está incompleto.");
        setLoading(false);
        return;
      }

      let cleanBase64 = metadataBase64;
      const eyIndex = cleanBase64.indexOf("ey");
      if (eyIndex !== -1) {
        cleanBase64 = cleanBase64.substring(eyIndex);
      }

      const decoded = atob(cleanBase64);
      const metadata = JSON.parse(decoded);
      setClientData(metadata);

      if (!metadata.client_id || !metadata.suscription_id) {
        throw new Error("Información incompleta");
      }

      const res = await fetch(`${API_URL.replace('/api', '')}/api/public/appointment?client_id=${metadata.client_id}&sub_id=${metadata.suscription_id}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al obtener la cita");
      }

      setAppointment(data.appointment);
    } catch (err) {
      console.error("Error validando metadata:", err);
      setError(err.message || "No pudimos validar tu enlace. Verifica que esté completo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointment();
  }, []);

  useEffect(() => {
    if (!appointment) return;
    const timer = setInterval(() => {
      const now = new Date();
      const start = new Date(appointment.startDate);
      const diff = start - now;
      setTimeLeft(diff);
    }, 1000);
    return () => clearInterval(timer);
  }, [appointment]);

  useEffect(() => {
    if (selectedDate && viewState === "reschedule") {
      const fetchSlots = async () => {
        setSlotsLoading(true);
        setSelectedSlot(null);
        try {
          const formattedDate = format(selectedDate, "yyyy-MM-dd");
          const res = await fetch(`${API_URL.replace('/api', '')}/api/crm/availability?date=${formattedDate}&sub_id=${clientData.suscription_id}`);
          const data = await res.json();
          setTimeSlots(data.slots || []);
        } catch (err) {
          console.error("Error fetching slots:", err);
        } finally {
          setSlotsLoading(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDate, viewState]);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/api/public/appointment/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.id,
          sub_id: clientData.suscription_id
        }),
      });
      if (res.ok) {
        setViewState("success_confirm");
      } else {
        alert("Hubo un problema confirmando tu cita.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) return;
    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const combinedDateTime = `${dateStr}T${selectedSlot}:00`;
      
      const res = await fetch(`${API_URL.replace('/api', '')}/api/public/appointment/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientData.client_id,
          sub_id: clientData.suscription_id,
          appointment_id: appointment.id,
          funnel_id: clientData.funnel_id,
          date: combinedDateTime
        }),
      });
      if (res.ok) {
        await fetchAppointment(); // Refetch the updated appointment
        setViewState("success_reschedule");
      } else {
        alert("Hubo un problema al reagendar la cita.");
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertCircle size={32} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Enlace no válido</h1>
        <p className="text-slate-500 max-w-sm">{error}</p>
      </div>
    );
  }

  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  const isLinkActive = timeLeft !== null && timeLeft <= THREE_HOURS_MS;
  
  const dateObj = new Date(appointment.startDate);
  const dateStr = dateObj.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatCountdown = (ms) => {
    if (ms < 0) return "La cita ya comenzó";
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const mins = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((ms % (1000 * 60)) / 1000);
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} día${days !== 1 ? 's' : ''} y ${hours % 24}h`;
    }
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] max-w-[400px] max-h-[400px] bg-indigo-500/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] max-w-[500px] max-h-[500px] bg-emerald-400/20 rounded-full blur-3xl mix-blend-multiply pointer-events-none"></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl border border-white rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-8 relative z-10">
        
        {viewState === "confirm" && (
          <div className="fade-in">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 mb-5">
                <Video size={32} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Tu cita está programada</h1>
              <p className="text-slate-500 text-[15px] mt-2">
                Hola <span className="font-semibold text-slate-700">{clientData?.client_name?.split(' ')[0]}</span>, verifica los detalles de tu reunión.
              </p>
            </div>

            <div className="bg-white/80 rounded-2xl p-5 shadow-sm border border-slate-100 mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                  <CalendarIcon size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fecha</div>
                  <div className="text-slate-800 font-medium capitalize">{dateStr}</div>
                </div>
              </div>
              <div className="h-[1px] bg-slate-100"></div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hora</div>
                  <div className="text-slate-800 font-medium">{timeStr}</div>
                </div>
              </div>
            </div>

            <h3 className="text-center text-lg font-bold text-slate-800 mb-4">¿Asistirás a tu cita?</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-emerald-400 text-white rounded-xl font-bold text-[15px] shadow-[0_8px_16px_-6px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : "✅ Sí, asistiré"}
              </button>
              <button 
                onClick={() => setViewState("reschedule")}
                disabled={isSubmitting}
                className="w-full py-4 bg-white border-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 rounded-xl font-bold text-[15px] transition-all flex items-center justify-center"
              >
                📅 No, necesito reagendar
              </button>
            </div>
          </div>
        )}

        {viewState === "reschedule" && (
          <div className="fade-in">
            <button 
              onClick={() => setViewState("confirm")}
              className="text-slate-400 hover:text-slate-700 text-sm font-semibold mb-4 flex items-center"
            >
              &larr; Volver
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Reagendar Cita</h2>
            <p className="text-slate-500 text-sm mb-6">Selecciona la nueva fecha y hora que mejor te convenga.</p>
            
            <div className="bg-white rounded-2xl border border-slate-200 p-2 mb-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={es}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="w-full"
              />
            </div>

            {selectedDate && (
              <div className="mb-6 fade-in">
                <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider mb-3">Horarios Disponibles</h3>
                {slotsLoading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-500" /></div>
                ) : timeSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <button
                        key={slot.start}
                        onClick={() => setSelectedSlot(slot.start)}
                        className={`py-2 rounded-lg text-sm font-semibold transition-all border ${selectedSlot === slot.start ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'}`}
                      >
                        {slot.start}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-500 text-sm py-4 bg-slate-50 rounded-xl border border-slate-100">
                    No hay horarios para este día.
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={handleReschedule}
              disabled={isSubmitting || !selectedSlot}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-bold text-[15px] shadow-[0_10px_20px_-10px_rgba(79,70,229,0.6)] hover:shadow-[0_15px_30px_-10px_rgba(79,70,229,0.8)] hover:-translate-y-0.5 transition-all flex items-center justify-center disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirmar Reagendamiento"}
            </button>
          </div>
        )}

        {(viewState === "success_confirm" || viewState === "success_reschedule") && (
          <div className="fade-in text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full mb-5">
              <CheckCircle2 size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {viewState === "success_reschedule" ? "¡Cita Reagendada!" : "¡Cita Confirmada!"}
            </h2>
            <p className="text-slate-500 mb-6">Hemos actualizado tu espacio. Te esperamos a la hora acordada.</p>
            
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-8 text-left space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Nueva Fecha</div>
                <div className="text-slate-800 font-medium capitalize">{dateStr}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-400">Hora</div>
                <div className="text-slate-800 font-medium">{timeStr}</div>
              </div>
            </div>

            {isLinkActive ? (
              <a 
                href={appointment.meetingUrl || '#'} 
                target="_blank" 
                rel="noreferrer"
                className="block w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-xl font-bold text-[15px] shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Entrar a Google Meet
              </a>
            ) : (
              <div className="w-full p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center gap-1">
                <div className="text-indigo-600 text-sm font-semibold mb-1">Tu enlace de Meet se activará en:</div>
                <div className="text-2xl font-black text-indigo-700 tracking-tight tabular-nums">
                  {timeLeft !== null ? formatCountdown(timeLeft - THREE_HOURS_MS) : "..."}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

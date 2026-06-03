export default function SettingsView({ client }) {
  return (
    <div className="flex flex-col gap-7 max-w-[1000px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-slate-900 text-[26px] font-bold tracking-tight">Ajustes</h1>
          <p className="text-slate-500 text-sm mt-1">Configuración de tu cuenta.</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 max-w-[560px]">
        {[
          { label: "Cliente", val: client?.name || "—" },
          { label: "Email", val: client?.email || "—" },
          { label: "Plan", val: `${client?.max_landings || 1} landing page(s) máximo` },
          { label: "Licencia GrapesJS SDK", val: "Demo (localhost)" },
        ].map((f) => (
          <div key={f.label} className="bg-white border border-slate-200 rounded-xl p-4 px-5 shadow-sm">
            <div className="text-zinc-500 text-xs mb-1.5">{f.label}</div>
            <div className="flex gap-2.5">
              <div className="flex-1 bg-slate-50 border border-slate-300 rounded-lg p-2.5 px-3.5 text-slate-900 text-sm">
                {f.val}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

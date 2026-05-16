"use client";

import { useActionState, useState } from "react";
import { updateLeagueSettingsAction, SettingsActionState } from "@/actions/settings";
import { LeagueSettings } from "@/lib/db/schema";

interface Props {
  leagueId: string;
  leagueName: string;
  initialSettings: Partial<LeagueSettings> | null;
}

/**
 * LeagueSettingsForm
 * Componente de cliente que gestiona la edición de configuraciones de liga.
 * Utiliza useActionState de React 19 para un manejo de estado nativo y eficiente.
 */
export function LeagueSettingsForm({ leagueId, leagueName, initialSettings }: Props) {
  const [state, formAction, isPending] = useActionState(updateLeagueSettingsAction, {
    success: false,
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(initialSettings?.loginLogoUrl || null);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Cabecera del Formulario */}
      <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800 leading-none">
              Configuración de Liga
            </h3>
            <p className="text-xs font-bold text-blue-600 mt-1 uppercase tracking-tight">
              {leagueName}
            </p>
          </div>
        </div>
        
        {(state as any).success && (
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-in zoom-in">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            {(state as any).message || "Cambios Guardados"}
          </div>
        )}
      </div>

      <form action={formAction} className="p-6 space-y-8">
        <input type="hidden" name="leagueId" value={leagueId} />

        {/* Sección 1: General */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Nombre de la Temporada</label>
            <input
              type="text"
              name="seasonName"
              defaultValue={initialSettings?.seasonName || ""}
              placeholder="Ej: Temporada 2026 - Apertura"
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
              required
            />
            {(state as any).errors?.seasonName && (
              <p className="text-[11px] text-red-500 font-bold ml-1">{(state as any).errors.seasonName[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Máximo de Jugadores por Club</label>
            <div className="relative">
              <input
                type="number"
                name="maxPlayersPerClub"
                defaultValue={initialSettings?.maxPlayersPerClub || 15}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium pl-12"
                min="1"
                max="100"
                required
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 2: Puntuación */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>Reglas de Puntuación</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                Victoria
              </label>
              <input
                type="number"
                name="pointsWin"
                defaultValue={initialSettings?.pointsWin || 2}
                min="0"
                max="10"
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                Derrota
              </label>
              <input
                type="number"
                name="pointsLoss"
                defaultValue={initialSettings?.pointsLoss || 1}
                min="0"
                max="10"
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                Walkover (W.O.)
              </label>
              <input
                type="number"
                name="pointsWalkover"
                defaultValue={initialSettings?.pointsWalkover || 0}
                min="0"
                max="10"
                className="w-full bg-white px-3 py-2 rounded-xl border border-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all font-bold text-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Sección 3: Marca Blanca */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>Marca Blanca (White Label)</span>
            <div className="flex-1 h-px bg-slate-100"></div>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 ml-1">Logo de Login Personalizado</label>
              <div className="relative group">
                <input
                  type="file"
                  name="loginLogo"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setPreviewUrl(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-50/50 group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:scale-110 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-600">Sube tu logo institucional</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-medium">PNG, JPG o SVG (Recomendado 400x400px)</p>
                  </div>
                </div>
              </div>
              <input type="hidden" name="currentLoginLogoUrl" value={initialSettings?.loginLogoUrl || ""} />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-400 ml-1">Previsualización de Marca</label>
              <div className="aspect-square w-48 mx-auto md:mx-0 bg-white rounded-[2rem] border border-slate-100 shadow-inner flex items-center justify-center p-6 overflow-hidden relative">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Logo Login" 
                    className="max-w-full max-h-full object-contain animate-in fade-in zoom-in duration-500"
                  />
                ) : (
                  <div className="text-center space-y-2 opacity-30">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sin Logo</p>
                  </div>
                )}
                <div className="absolute top-2 right-2 px-2 py-1 bg-slate-900/5 backdrop-blur-sm rounded-lg text-[8px] font-black uppercase text-slate-400">Preview</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 4: Comunicación */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Banner del Dashboard</label>
          <textarea
            name="bannerText"
            defaultValue={initialSettings?.bannerText || ""}
            placeholder="Introduce un mensaje institucional para los clubes..."
            className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-28 resize-none font-medium placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400 ml-1">Este texto aparecerá en la parte superior del panel de todos los clubes.</p>
        </div>

        {/* Mensajes de Feedback */}
        {((state as any).message || (state as any).error) && !state.success && (
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-rose-600 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p className="text-sm text-rose-700 font-bold">
              {(state as any).message || (state as any).error}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-xl shadow-blue-200/50 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            {isPending ? (
              <>
                <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <>
                <span>Guardar Cambios</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7 7 7-7"/><path d="M12 19V5"/></svg>
              </>
            )}
          </button>
          
          <p className="text-xs text-slate-400 font-medium italic">
            * Los cambios se aplican instantáneamente a todos los inquilinos.
          </p>
        </div>
      </form>
    </div>
  );
}

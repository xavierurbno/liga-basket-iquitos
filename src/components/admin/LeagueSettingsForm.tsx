"use client";

import { useActionState, useRef, useState } from "react";
import { updateLeagueSettingsAction, SettingsActionState } from "@/actions/settings";
import { DEFAULT_CARNET_AUTHORIZATION_TEMPLATE } from "@/lib/carnet/carnetInstitucionalText";
import {
  CARNET_THEME_PRESETS,
  CARNET_THEME_PRESET_LABELS,
  parseCarnetThemePreset,
} from "@/lib/carnet/carnetTheme";
import { LEAGUE_SOCIAL_FORM_FIELDS } from "@/lib/leagues/league-social-links";
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
  const [fedPreviewUrl, setFedPreviewUrl] = useState<string | null>(
    initialSettings?.carnetFederationLogoUrl || null,
  );
  const [presidentSigPreview, setPresidentSigPreview] = useState<string | null>(
    initialSettings?.presidentSignatureUrl || null,
  );
  const [secretarySigPreview, setSecretarySigPreview] = useState<string | null>(
    initialSettings?.secretarySignatureUrl || null,
  );
  const [sportGraphicPreview, setSportGraphicPreview] = useState<string | null>(
    initialSettings?.carnetSportGraphicUrl || null,
  );
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const accentColorRef = useRef<HTMLInputElement>(null);

  function previewFromFile(
    file: File | undefined,
    setter: (url: string | null) => void,
  ) {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Color primario del portal</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  defaultValue={initialSettings?.portalPrimaryColor || "#1e3a5f"}
                  className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                  onChange={(e) => {
                    if (primaryColorRef.current) primaryColorRef.current.value = e.target.value;
                  }}
                />
                <input
                  ref={primaryColorRef}
                  type="text"
                  name="portalPrimaryColor"
                  defaultValue={initialSettings?.portalPrimaryColor || "#1e3a5f"}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 font-mono text-sm uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                  aria-label="Código hex color primario"
                />
              </div>
              {(state as SettingsActionState).errors?.portalPrimaryColor && (
                <p className="text-[11px] text-red-500 font-bold ml-1">
                  {(state as SettingsActionState).errors!.portalPrimaryColor![0]}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Color de acento (enlaces, botones)</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  defaultValue={initialSettings?.portalAccentColor || "#005CEE"}
                  className="h-12 w-14 cursor-pointer rounded-xl border border-slate-200 bg-white p-1"
                  onChange={(e) => {
                    if (accentColorRef.current) accentColorRef.current.value = e.target.value;
                  }}
                />
                <input
                  ref={accentColorRef}
                  type="text"
                  name="portalAccentColor"
                  defaultValue={initialSettings?.portalAccentColor || "#005CEE"}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 font-mono text-sm uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                  aria-label="Código hex color acento"
                />
              </div>
              {(state as SettingsActionState).errors?.portalAccentColor && (
                <p className="text-[11px] text-red-500 font-bold ml-1">
                  {(state as SettingsActionState).errors!.portalAccentColor![0]}
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Se aplican en <code className="text-slate-500">/l/[slug]/</code>, login con{" "}
            <code className="text-slate-500">?l=</code> y tarjetas de campeonatos.
          </p>

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
              <div className="aspect-square w-48 mx-auto md:mx-0 bg-white rounded-4xl border border-slate-100 shadow-inner flex items-center justify-center p-6 overflow-hidden relative">
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

        {/* Sección 3b: Redes sociales */}
        <div id="social-settings" className="scroll-mt-24 space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>Redes sociales del portal</span>
            <div className="flex-1 h-px bg-slate-100" />
          </h4>
          <p className="text-[10px] text-slate-500 ml-1">
            Iconos en la cabecera pública (junto a Búsqueda 365). Deja vacío cualquier red que no uses.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEAGUE_SOCIAL_FORM_FIELDS.map((field) => (
              <div key={field.name} className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">{field.label}</label>
                <input
                  type="text"
                  name={field.name}
                  defaultValue={
                    (initialSettings?.[field.name as keyof typeof initialSettings] as string) || ""
                  }
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                <p className="text-[10px] text-slate-400 ml-1">{field.hint}</p>
                {(state as SettingsActionState).errors?.[field.name] && (
                  <p className="text-[11px] text-red-500 font-bold ml-1">
                    {(state as SettingsActionState).errors![field.name]![0]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sección 4: Carnet deportista */}
        <div id="carnet-settings" className="scroll-mt-24 space-y-4 pt-2">
          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span>Carnet de identificación (CR80)</span>
            <div className="flex-1 h-px bg-slate-100" />
          </h4>
          <p className="text-[10px] text-slate-500 ml-1">
            El logo de liga del carnet es el mismo que &quot;Logo de Login&quot; arriba. Las ligas existentes
            siguen con plantilla <strong>institucional sobria</strong> hasta que elijas otra aquí.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Plantilla del carnet (CR80)</label>
              <select
                name="carnetThemePreset"
                defaultValue={parseCarnetThemePreset(initialSettings?.carnetThemePreset)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium bg-white"
              >
                {CARNET_THEME_PRESETS.map((id) => (
                  <option key={id} value={id}>
                    {CARNET_THEME_PRESET_LABELS[id]}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 ml-1">
                Solo una plantilla activa por liga: <strong>lddbi_bold</strong> (diseño en código) o{" "}
                <strong>lddbi_template</strong> (PNG en <code>public/carnet/lddbi-template/</code>).
                No se combinan en el mismo carnet.
              </p>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1 cursor-pointer">
                <input
                  type="checkbox"
                  name="carnetShowFederation"
                  defaultChecked={initialSettings?.carnetShowFederation !== false}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Mostrar federación en el carnet
              </label>
              <input
                type="text"
                name="carnetFederationDisplayName"
                defaultValue={initialSettings?.carnetFederationDisplayName || ""}
                placeholder="Ej: FEDERACIÓN DEPORTIVA PERUANA DE BASKETBALL"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium text-sm"
              />
              <p className="text-[10px] text-slate-400 ml-1">
                Desmarca para torneos particulares sin federación. Deja vacío para texto FDPB por defecto.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Etiqueta deporte (opcional)</label>
              <input
                type="text"
                name="carnetSportLabel"
                defaultValue={initialSettings?.carnetSportLabel || ""}
                placeholder="Ej: BÁSQUET"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium"
              />
              <label className="text-sm font-bold text-slate-700 ml-1">Gráfico deportivo / marca de agua</label>
              <input
                type="file"
                name="carnetSportGraphic"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => previewFromFile(e.target.files?.[0], setSportGraphicPreview)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-bold"
              />
              <input
                type="hidden"
                name="currentCarnetSportGraphicUrl"
                value={initialSettings?.carnetSportGraphicUrl || ""}
              />
              {sportGraphicPreview && (
                <img
                  src={sportGraphicPreview}
                  alt="Gráfico deporte"
                  className="h-16 object-contain rounded-lg border border-slate-100 bg-white p-1"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Vigencia del carnet</label>
              <input
                type="text"
                name="carnetValidityLabel"
                defaultValue={initialSettings?.carnetValidityLabel || ""}
                placeholder="Ej: 03/2026 - 03/2027"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium"
              />
              <p className="text-[10px] text-slate-400 ml-1">
                Si queda vacío, se usa el nombre de temporada.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Logo federación (opcional)</label>
              <input
                type="file"
                name="carnetFederationLogo"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => previewFromFile(e.target.files?.[0], setFedPreviewUrl)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-bold"
              />
              <input
                type="hidden"
                name="currentCarnetFederationLogoUrl"
                value={initialSettings?.carnetFederationLogoUrl || ""}
              />
              {fedPreviewUrl && (
                <img
                  src={fedPreviewUrl}
                  alt="Federación"
                  className="h-14 object-contain rounded-lg border border-slate-100 bg-white p-1"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Nombre del presidente</label>
              <input
                type="text"
                name="presidentDisplayName"
                defaultValue={initialSettings?.presidentDisplayName || ""}
                placeholder='Ej: KEMA VALERA VÁSQUEZ'
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium"
              />
              <label className="text-sm font-bold text-slate-700 ml-1">Firma presidente (PNG)</label>
              <input
                type="file"
                name="presidentSignature"
                accept="image/png,image/webp"
                onChange={(e) => previewFromFile(e.target.files?.[0], setPresidentSigPreview)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-bold"
              />
              <input
                type="hidden"
                name="currentPresidentSignatureUrl"
                value={initialSettings?.presidentSignatureUrl || ""}
              />
              {presidentSigPreview && (
                <img
                  src={presidentSigPreview}
                  alt="Firma presidente"
                  className="h-16 object-contain"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Nombre del secretario</label>
              <input
                type="text"
                name="secretaryDisplayName"
                defaultValue={initialSettings?.secretaryDisplayName || ""}
                placeholder="Ej: ERWIN REÁTEGUI MASLUCAN"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 uppercase focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-medium"
              />
              <label className="text-sm font-bold text-slate-700 ml-1">Firma secretario (PNG)</label>
              <input
                type="file"
                name="secretarySignature"
                accept="image/png,image/webp"
                onChange={(e) => previewFromFile(e.target.files?.[0], setSecretarySigPreview)}
                className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-100 file:font-bold"
              />
              <input
                type="hidden"
                name="currentSecretarySignatureUrl"
                value={initialSettings?.secretarySignatureUrl || ""}
              />
              {secretarySigPreview && (
                <img
                  src={secretarySigPreview}
                  alt="Firma secretario"
                  className="h-16 object-contain"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Texto de autorización (reverso)</label>
            <textarea
              name="carnetAuthorizationTemplate"
              defaultValue={initialSettings?.carnetAuthorizationTemplate || ""}
              placeholder={DEFAULT_CARNET_AUTHORIZATION_TEMPLATE}
              className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-24 resize-none font-medium text-sm"
            />
            <p className="text-[10px] text-slate-400 ml-1">
              Usa <code className="text-slate-500">{`{ligaNombre}`}</code> para insertar el nombre oficial de la liga.
            </p>
          </div>
        </div>

        {/* Sección 5: Comunicación */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Mensaje institucional (banner)</label>
          <textarea
            name="bannerText"
            defaultValue={initialSettings?.bannerText || ""}
            placeholder="Ej: Temporada 2026 — ¡Bienvenidos al portal!"
            className="w-full px-4 py-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all h-28 resize-none font-medium placeholder:text-slate-300"
          />
          <p className="text-[10px] text-slate-400 ml-1">
            Aparece en la franja superior del portal público, bajo el título en la pantalla de login y
            como cita en la portada de la liga.
          </p>
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

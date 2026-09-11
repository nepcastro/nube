import React, { useState } from 'react';
import { CloudConfig, FontFamilyId, PaletteId, RotationMode, TextTransform, SessionData } from '../types';
import { FONTS, PALETTES } from '../constants/palettes';
import {
  Palette,
  Type,
  Compass,
  Sliders,
  Paintbrush,
  Plus,
  Trash2,
  ArrowLeft,
  Check,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Edit3,
} from 'lucide-react';

interface CustomizationPanelProps {
  config: CloudConfig;
  onChangeConfig: (newConfig: CloudConfig) => void;
  onBackToCloud?: () => void;
  session?: SessionData;
  onUpdateSessionSettings?: (title: string, promptQuestion: string, resetWords?: boolean) => Promise<void> | void;
  onOpenQuestionModal?: () => void;
}

export const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  config,
  onChangeConfig,
  onBackToCloud,
  session,
  onUpdateSessionSettings,
  onOpenQuestionModal,
}) => {
  const [customColorInput, setCustomColorInput] = useState('#6366f1');
  const [inlinePromptInput, setInlinePromptInput] = useState(session?.promptQuestion || '');
  const [inlineTitleInput, setInlineTitleInput] = useState(session?.title || '');
  const [isSavedPrompt, setIsSavedPrompt] = useState(false);

  // Sync inputs when session changes
  React.useEffect(() => {
    if (session) {
      setInlinePromptInput(session.promptQuestion);
      setInlineTitleInput(session.title);
    }
  }, [session?.promptQuestion, session?.title]);

  const handleSaveInlinePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePromptInput.trim() || !onUpdateSessionSettings) return;
    await onUpdateSessionSettings(
      inlineTitleInput.trim() || session?.title || 'Sesión Interactiva',
      inlinePromptInput.trim(),
      false
    );
    setIsSavedPrompt(true);
    setTimeout(() => setIsSavedPrompt(false), 2500);
  };

  const update = <K extends keyof CloudConfig>(key: K, value: CloudConfig[K]) => {
    onChangeConfig({ ...config, [key]: value });
  };

  const addCustomColor = () => {
    if (!config.customColors.includes(customColorInput)) {
      update('customColors', [...config.customColors, customColorInput]);
      update('palette', 'custom');
    }
  };

  const removeCustomColor = (colorToRemove: string) => {
    const next = config.customColors.filter((c) => c !== colorToRemove);
    update('customColors', next.length > 0 ? next : ['#38bdf8', '#818cf8', '#f43f5e']);
  };

  return (
    <div
      id="customization-panel-section"
      className="w-full max-w-full overflow-hidden bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-6 text-slate-200 shadow-xl"
    >
      {/* Top Header of the Independent Configuration Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sección Independiente de Configuración</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Configuración de la Actividad & Diseño
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Personaliza la pregunta activa para los participantes y los estilos visuales de la nube.
          </p>
        </div>

        {onBackToCloud && (
          <button
            type="button"
            id="back-to-cloud-btn"
            onClick={onBackToCloud}
            className="self-start sm:self-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver Nube de Palabras</span>
          </button>
        )}
      </div>

      {/* 0. Configuración de la Pregunta y Actividad en Vivo */}
      {session && (
        <section
          id="activity-prompt-config-section"
          className="w-full bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-300">
                  Pregunta Activa de la Actividad
                </h3>
                <p className="text-[11px] text-slate-400">
                  Los participantes verán esta pregunta al responder desde sus celulares.
                </p>
              </div>
            </div>

            {onOpenQuestionModal && (
              <button
                type="button"
                id="open-question-templates-btn"
                onClick={onOpenQuestionModal}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Banco de Preguntas & Plantillas</span>
              </button>
            )}
          </div>

          <form onSubmit={handleSaveInlinePrompt} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                  <span>Pregunta o Consigna para la Audiencia:</span>
                </label>
                <input
                  type="text"
                  value={inlinePromptInput}
                  onChange={(e) => setInlinePromptInput(e.target.value)}
                  placeholder="¿Qué palabra describe mejor...?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Título / Tema de la Actividad:</span>
                </label>
                <input
                  type="text"
                  value={inlineTitleInput}
                  onChange={(e) => setInlineTitleInput(e.target.value)}
                  placeholder="Tema de la sesión"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-slate-400 italic">
                {isSavedPrompt ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> ¡Pregunta y actividad actualizadas con éxito!
                  </span>
                ) : (
                  'Al guardar, se actualiza automáticamente la pantalla y los celulares de la audiencia.'
                )}
              </span>

              <button
                type="submit"
                id="save-inline-prompt-btn"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Guardar Pregunta</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 1. Paletas de Colores */}
      <section className="w-full">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Palette className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              1. Esquema y Paletas de Colores
            </h3>
          </div>
          <button
            type="button"
            onClick={() => update('palette', 'custom')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              config.palette === 'custom'
                ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                : 'border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white'
            }`}
          >
            + Crear Paleta Propia
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {PALETTES.map((pal) => {
            const isSelected = config.palette === pal.id;
            return (
              <button
                key={pal.id}
                type="button"
                id={`palette-btn-${pal.id}`}
                onClick={() => {
                  update('palette', pal.id);
                  if (pal.recommendedBg && !config.isTransparentBg) {
                    update('background', pal.recommendedBg);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white truncate">{pal.name}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                </div>
                <div className="flex items-center gap-1 h-3.5 w-full rounded overflow-hidden">
                  {pal.colors.map((c, i) => (
                    <div
                      key={i}
                      className="flex-1 h-full"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Color Palette Editor */}
        {config.palette === 'custom' && (
          <div className="mt-3.5 p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Colores seleccionados para la nube:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {config.customColors.map((color, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-mono text-[11px]">{color}</span>
                  {config.customColors.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeCustomColor(color)}
                      className="text-slate-500 hover:text-rose-400 ml-1"
                      title="Eliminar este color"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="color"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
              />
              <input
                type="text"
                value={customColorInput}
                onChange={(e) => setCustomColorInput(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white w-24"
              />
              <button
                type="button"
                onClick={addCustomColor}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir a la Paleta</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 2. Tipografías y Orientación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tipografía */}
        <section>
          <div className="flex items-center gap-2 mb-3 text-slate-200">
            <Type className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
              2. Tipografía de las Palabras
            </h3>
          </div>

          <div className="space-y-1.5">
            {FONTS.map((font) => {
              const isSelected = config.font === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  id={`font-btn-${font.id}`}
                  onClick={() => update('font', font.id)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="text-xs font-semibold">{font.label}</span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded bg-slate-950/60"
                    style={{ fontFamily: font.cssFamily }}
                  >
                    {font.sample}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Orientación y Fondo */}
        <div className="space-y-5">
          {/* Rotación */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-slate-200">
              <Compass className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                3. Orientación de las Palabras
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'horizontal', label: 'Solo Horizontal' },
                { id: 'mixed90', label: 'Horizontal y 90°' },
                { id: 'diagonal45', label: 'Diagonal 45°' },
                { id: 'free', label: 'Ángulo Libre' },
              ].map((rot) => (
                <button
                  key={rot.id}
                  type="button"
                  id={`rotation-btn-${rot.id}`}
                  onClick={() => update('rotation', rot.id as RotationMode)}
                  className={`p-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                    config.rotation === rot.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {rot.label}
                </button>
              ))}
            </div>
          </section>

          {/* Color de Fondo */}
          <section>
            <div className="flex items-center gap-2 mb-3 text-slate-200">
              <Paintbrush className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
                4. Fondo del Lienzo
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'Oscuro', bg: '#0f172a', transp: false },
                { label: 'Negro', bg: '#000000', transp: false },
                { label: 'Blanco', bg: '#ffffff', transp: false },
                { label: 'Crema', bg: '#f8fafc', transp: false },
                { label: 'Transparente', bg: 'transparent', transp: true },
              ].map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    update('isTransparentBg', b.transp);
                    if (!b.transp) update('background', b.bg);
                  }}
                  className={`flex-1 min-w-[75px] py-2 px-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                    (b.transp && config.isTransparentBg) ||
                    (!config.isTransparentBg && config.background === b.bg)
                      ? 'border-indigo-500 bg-indigo-600/25 text-white font-bold shadow-sm'
                      : 'border-slate-700/70 bg-slate-800/50 text-slate-300 hover:text-white'
                  }`}
                >
                  {b.label}
                </button>
              ))}

              {!config.isTransparentBg && (
                <div className="flex items-center gap-1.5 p-1 bg-slate-800/60 rounded-xl border border-slate-700/70">
                  <input
                    type="color"
                    value={config.background}
                    onChange={(e) => update('background', e.target.value)}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0 shrink-0"
                    title="Elegir color exacto de fondo"
                  />
                  <span className="font-mono text-[11px] text-slate-300 pr-1">{config.background}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 3. Sliders de Ajuste, Transformación de Texto y Filtros */}
      <section className="pt-4 border-t border-slate-800 space-y-4">
        <div className="flex items-center gap-2 text-slate-200">
          <Sliders className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            5. Densidad, Tamaños y Filtros de Texto
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Límite de palabras */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Máximo de palabras</span>
              <span className="text-indigo-400 font-bold">{config.maxWords}</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={config.maxWords}
              onChange={(e) => update('maxWords', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Escala de Tamaño */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Escala de tamaño general</span>
              <span className="text-indigo-400 font-bold">{config.scaleFactor.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.6"
              step="0.1"
              value={config.scaleFactor}
              onChange={(e) => update('scaleFactor', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Espaciado */}
          <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Separación (Padding)</span>
              <span className="text-indigo-400 font-bold">{config.padding}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="1"
              value={config.padding}
              onChange={(e) => update('padding', Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Text transform and stop-words toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Formato de texto:</span>
            <div className="flex flex-wrap rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              {[
                { id: 'none', label: 'Original' },
                { id: 'uppercase', label: 'MAYÚSCULAS' },
                { id: 'capitalize', label: 'Tipo Título' },
                { id: 'lowercase', label: 'minúsculas' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => update('textTransform', t.id as TextTransform)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-all ${
                    config.textTransform === t.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs cursor-pointer select-none bg-slate-800/50 p-2 rounded-xl border border-slate-700/60">
            <input
              type="checkbox"
              checked={config.filterStopWords}
              onChange={(e) => update('filterStopWords', e.target.checked)}
              className="rounded accent-indigo-500 w-4 h-4 cursor-pointer"
            />
            <span className="text-slate-300">
              Filtrar conectores comunes (de, la, el, que, por...)
            </span>
          </label>
        </div>
      </section>

      {/* Action Footer */}
      {onBackToCloud && (
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onBackToCloud}
            className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar y Ver Nube de Palabras</span>
          </button>
        </div>
      )}
    </div>
  );
};

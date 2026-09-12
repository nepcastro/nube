import React, { useRef, useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Lightbulb,
  Target,
  Users,
  BookOpen,
  MessageSquare,
  Flame,
  ImageIcon,
  Trash2,
  UploadCloud,
} from 'lucide-react';

interface ActivityTemplate {
  category: string;
  icon: React.ReactNode;
  questions: Array<{ question: string; defaultTitle: string }>;
}

const ACTIVITY_TEMPLATES: ActivityTemplate[] = [
  {
    category: 'Rompehielos & Bienvenida',
    icon: <Users className="w-3.5 h-3.5 text-sky-400" />,
    questions: [
      {
        question: '¿Qué palabra describe mejor cómo te sientes el día de hoy?',
        defaultTitle: 'Rompehielos: Estado de Ánimo',
      },
      {
        question: '¿Qué expectativa principal tienes de este taller o sesión?',
        defaultTitle: 'Expectativas de la Sesión',
      },
      {
        question: '¿En una sola palabra, cómo resumirías tu semana?',
        defaultTitle: 'Check-in Semanal',
      },
    ],
  },
  {
    category: 'Creatividad & Lluvia de Ideas',
    icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
    questions: [
      {
        question: '¿Qué concepto o palabra asocias con nuestra próxima gran idea?',
        defaultTitle: 'Lluvia de Ideas Creativas',
      },
      {
        question: '¿Qué palabra describe la experiencia ideal para nuestros usuarios?',
        defaultTitle: 'Experiencia de Usuario',
      },
      {
        question: '¿Qué habilidad consideras más valiosa en la era digital actual?',
        defaultTitle: 'Habilidades del Futuro',
      },
    ],
  },
  {
    category: 'Estrategia & Retos',
    icon: <Target className="w-3.5 h-3.5 text-rose-400" />,
    questions: [
      {
        question: '¿Cuál es el mayor desafío u oportunidad para nuestro equipo este trimestre?',
        defaultTitle: 'Reto Estratégico',
      },
      {
        question: '¿Qué valor fundamental representa la esencia de nuestro proyecto?',
        defaultTitle: 'Valores del Proyecto',
      },
      {
        question: '¿Qué meta debe ser nuestra máxima prioridad en esta fase?',
        defaultTitle: 'Alineación de Metas',
      },
    ],
  },
  {
    category: 'Aprendizaje & Cierre',
    icon: <BookOpen className="w-3.5 h-3.5 text-emerald-400" />,
    questions: [
      {
        question: '¿Cuál fue el aprendizaje o concepto más valioso que te llevas hoy?',
        defaultTitle: 'Retrospectiva & Aprendizajes',
      },
      {
        question: '¿Qué palabra define el impacto positivo de la jornada?',
        defaultTitle: 'Conclusiones y Cierre',
      },
      {
        question: '¿Qué compromiso o acción clave implementarás a partir de hoy?',
        defaultTitle: 'Compromisos de Acción',
      },
    ],
  },
];

interface ActivityQuestionModalProps {
  isOpen: boolean;
  currentTitle: string;
  currentPrompt: string;
  onClose: () => void;
  onSave: (title: string, promptQuestion: string, resetWords: boolean) => Promise<void> | void;
  totalWordsInCloud: number;
  currentLogoUrl?: string;
  onUploadLogo?: (file: File) => Promise<void>;
  onRemoveLogo?: () => Promise<void>;
}

export const ActivityQuestionModal: React.FC<ActivityQuestionModalProps> = ({
  isOpen,
  currentTitle,
  currentPrompt,
  onClose,
  onSave,
  totalWordsInCloud,
  currentLogoUrl,
  onUploadLogo,
  onRemoveLogo,
}) => {
  const [title, setTitle] = useState(currentTitle);
  const [promptQuestion, setPromptQuestion] = useState(currentPrompt);
  const [resetWords, setResetWords] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
      setPromptQuestion(currentPrompt);
      setResetWords(false);
    }
  }, [isOpen, currentTitle, currentPrompt]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptQuestion.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(
        title.trim() || 'Sesión Interactiva',
        promptQuestion.trim(),
        resetWords
      );
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectTemplate = (templateQuestion: string, defaultTitle: string) => {
    setPromptQuestion(templateQuestion);
    if (!title.trim() || title === currentTitle) {
      setTitle(defaultTitle);
    }
  };

  const handleLogoFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !onUploadLogo) return;

    if (!file.type.startsWith('image/')) {
      setLogoError('El archivo debe ser una imagen (PNG, JPG o SVG).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setLogoError('La imagen es demasiado grande (máx. 3MB).');
      return;
    }

    setLogoError(null);
    setIsUploadingLogo(true);
    try {
      await onUploadLogo(file);
    } catch (err) {
      setLogoError('No se pudo subir el logo. Intenta de nuevo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!onRemoveLogo) return;
    setLogoError(null);
    setIsUploadingLogo(true);
    try {
      await onRemoveLogo();
    } catch (err) {
      setLogoError('No se pudo quitar el logo. Intenta de nuevo.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div
      id="activity-question-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="activity-question-modal-card"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Configurar Pregunta y Actividad
              </h2>
              <p className="text-xs text-slate-400">
                Cambia la consigna detonante que responderán los participantes en sus teléfonos.
              </p>
            </div>
          </div>

          <button
            id="close-question-modal-btn"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Main Question Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="activity-prompt-question-input"
                className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                <span>Pregunta o Consigna para la Audiencia *</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {promptQuestion.length} caracteres
              </span>
            </div>

            <textarea
              id="activity-prompt-question-input"
              rows={3}
              value={promptQuestion}
              onChange={(e) => setPromptQuestion(e.target.value)}
              placeholder="Ejemplo: ¿Qué palabra define mejor nuestro próximo desafío?"
              className="w-full px-3.5 py-2.5 bg-slate-950/90 border border-slate-700 focus:border-indigo-500 rounded-xl text-sm sm:text-base text-white placeholder-slate-500 outline-none transition-all shadow-inner resize-none font-medium leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400">
              Esta pregunta aparecerá destacada en la pantalla de proyección y en el teléfono móvil de cada participante al escanear el QR.
            </p>
          </div>

          {/* Title or Activity Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="activity-title-input"
              className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Título o Tema de la Actividad</span>
            </label>
            <input
              id="activity-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ejemplo: Taller de Innovación 2026 / Dinámica de Equipo"
              className="w-full px-3.5 py-2 bg-slate-950/90 border border-slate-700 focus:border-indigo-500 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Client / Brand Logo for the Presentation Landing Screen */}
          {(onUploadLogo || onRemoveLogo) && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Logo del Cliente (Pantalla de Bienvenida)</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Se mostrará en una portada de marca antes de revelar la nube en la pantalla de proyección.
              </p>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="w-16 h-16 rounded-lg bg-white/5 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {currentLogoUrl ? (
                    <img
                      src={currentLogoUrl}
                      alt="Logo actual"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-slate-600" />
                  )}
                </div>

                <div className="flex flex-col gap-1.5 flex-1">
                  <input
                    ref={logoFileInputRef}
                    id="activity-logo-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileSelected}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      id="upload-logo-btn"
                      type="button"
                      disabled={isUploadingLogo}
                      onClick={() => logoFileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {isUploadingLogo ? (
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5" />
                      )}
                      <span>{currentLogoUrl ? 'Cambiar logo' : 'Subir logo'}</span>
                    </button>
                    {currentLogoUrl && (
                      <button
                        id="remove-logo-btn"
                        type="button"
                        disabled={isUploadingLogo}
                        onClick={handleRemoveLogo}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 disabled:opacity-50 text-slate-300 hover:text-rose-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    )}
                  </div>
                  {logoError ? (
                    <span className="text-[11px] text-rose-400">{logoError}</span>
                  ) : (
                    <span className="text-[11px] text-slate-500">PNG, JPG o SVG · máx. 3MB</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Activity Templates Bank */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Banco de Preguntas Rápidas por Tipo de Dinámica</span>
              </span>
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {ACTIVITY_TEMPLATES.map((cat, idx) => (
                <button
                  key={cat.category}
                  type="button"
                  onClick={() => setSelectedCategory(idx)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    selectedCategory === idx
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.icon}
                  <span>{cat.category}</span>
                </button>
              ))}
            </div>

            {/* Questions for current category */}
            <div className="grid grid-cols-1 gap-2 pt-1">
              {ACTIVITY_TEMPLATES[selectedCategory].questions.map((item, qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => handleSelectTemplate(item.question, item.defaultTitle)}
                  className="text-left p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/50 transition-all text-xs text-slate-200 group flex items-start justify-between gap-2"
                >
                  <span className="font-medium group-hover:text-white leading-snug">
                    "{item.question}"
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded shrink-0">
                    Usar
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Option to Reset Cloud Words for this new Activity */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                id="reset-cloud-words-toggle"
                type="checkbox"
                checked={resetWords}
                onChange={(e) => setResetWords(e.target.checked)}
                className="mt-0.5 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Iniciar lienzo limpio para esta nueva actividad
                </span>
                <span className="text-slate-400 block text-[11px] mt-0.5">
                  Elimina las {totalWordsInCloud} palabras acumuladas para que los participantes comiencen a responder la nueva pregunta desde cero.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              id="cancel-question-modal-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              id="save-activity-question-btn"
              type="submit"
              disabled={isSubmitting || !promptQuestion.trim()}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>Guardar y Actualizar Actividad</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

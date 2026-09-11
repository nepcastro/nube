import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Send, Sparkles, User, PlusCircle, Edit3 } from 'lucide-react';

interface ParticipantFormProps {
  promptQuestion?: string;
  onSubmitWords: (words: string[], participantName: string) => Promise<void>;
  isLoading?: boolean;
  onQuickVote?: (word: string) => void;
  existingTopWords?: Array<{ text: string; count: number }>;
  onOpenQuestionModal?: () => void;
}

export const ParticipantForm: React.FC<ParticipantFormProps> = ({
  promptQuestion = '¿Qué palabra describe tu experiencia o idea?',
  onSubmitWords,
  isLoading = false,
  onQuickVote,
  existingTopWords = [],
  onOpenQuestionModal,
}) => {
  const [inputWord, setInputWord] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [justSubmitted, setJustSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputWord.trim() || isLoading) return;

    // Split words by commas, semicolons or newlines
    const words = inputWord
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;

    try {
      await onSubmitWords(words, participantName.trim() || 'Participante');

      // Trigger celebratory micro-confetti
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'],
      });

      setInputWord('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      id="participant-submission-box"
      className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-5 shadow-xl transition-all"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Participación en Vivo</span>
          </div>
          <h3 className="text-lg font-bold text-white mt-0.5">{promptQuestion}</h3>
        </div>
        {onOpenQuestionModal && (
          <button
            type="button"
            id="change-question-participant-view-btn"
            onClick={onOpenQuestionModal}
            className="px-3 py-1.5 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
            title="Cambiar la pregunta de la actividad"
          >
            <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Cambiar Pregunta</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Words Input */}
          <div className="sm:col-span-8 relative">
            <input
              id="participant-word-input"
              type="text"
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              placeholder="Escribe una o varias palabras (ej. Creatividad, Liderazgo)"
              maxLength={120}
              className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all shadow-inner"
              disabled={isLoading}
              autoComplete="off"
            />
          </div>

          {/* Participant Name Optional */}
          <div className="sm:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="participant-name-input"
              type="text"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              maxLength={30}
              className="w-full pl-9 pr-3 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all shadow-inner"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <p className="text-xs text-slate-400">
            Puedes ingresar varias palabras separadas por comas.
          </p>

          <button
            id="submit-word-btn"
            type="submit"
            disabled={!inputWord.trim() || isLoading}
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Enviando...' : 'Enviar a la Nube'}</span>
          </button>
        </div>
      </form>

      {/* Success notification */}
      {justSubmitted && (
        <div className="mt-3 p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>¡Palabra agregada con éxito! La nube se ha actualizado en tiempo real.</span>
        </div>
      )}

      {/* Quick Vote on popular existing words */}
      {existingTopWords.length > 0 && onQuickVote && (
        <div className="mt-4 pt-3 border-t border-slate-700/60">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>O vota por palabras ya sugeridas por otros participantes:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {existingTopWords.slice(0, 8).map((item) => (
              <button
                key={item.text}
                type="button"
                onClick={() => onQuickVote(item.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-indigo-950/70 border border-slate-700/70 hover:border-indigo-500/60 text-xs text-slate-300 hover:text-white transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span>{item.text}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

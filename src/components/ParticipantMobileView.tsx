import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SessionData } from '../types';
import { Send, Sparkles, User, ThumbsUp, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react';
import { BrandLockup } from './BrandLockup';

interface ParticipantMobileViewProps {
  session: SessionData;
  onSubmitWords: (words: string[], name: string) => Promise<void>;
  onVoteWord: (word: string) => void;
  onSwitchToStudio: () => void;
  isLoading?: boolean;
}

export const ParticipantMobileView: React.FC<ParticipantMobileViewProps> = ({
  session,
  onSubmitWords,
  onVoteWord,
  onSwitchToStudio,
  isLoading = false,
}) => {
  const [wordInput, setWordInput] = useState('');
  const [name, setName] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordInput.trim() || isLoading) return;

    const words = wordInput
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length === 0) return;

    try {
      await onSubmitWords(words, name.trim() || 'Participante');
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
      });
      setWordInput('');
      setSubmittedMessage(`¡"${words.join(', ')}" agregada con éxito!`);
      setTimeout(() => setSubmittedMessage(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const topWords = (Object.entries(session.words) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  if (showLanding) {
    return (
      <div
        id="participant-landing-screen"
        className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn"
      >
        <BrandLockup clientLogoUrl={session.logoUrl} size="lg" className="mb-7" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Acceso libre · Sin registro ni cuentas</span>
        </div>

        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-indigo-400 font-bold mb-3">
          Taller en Vivo
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white max-w-md leading-tight mb-3">
          {session.title}
        </h1>
        {session.promptQuestion && (
          <p className="text-sm sm:text-base text-slate-300 max-w-sm mb-9 leading-snug">
            {session.promptQuestion}
          </p>
        )}

        <button
          id="participant-landing-continue-btn"
          type="button"
          onClick={() => setShowLanding(false)}
          className="px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2.5"
        >
          <span>Registrar mi palabra</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={onSwitchToStudio}
          className="mt-8 text-xs text-slate-500 hover:text-indigo-400 flex items-center gap-1 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Ver Estudio / Nube</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="participant-mobile-view"
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6"
    >
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              En Vivo
            </span>
          </div>
          <button
            type="button"
            onClick={onSwitchToStudio}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Estudio / Nube</span>
          </button>
        </div>

        {/* Question Title Card */}
        <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 shadow-xl text-center space-y-2.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{session.title}</span>
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 text-[11px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Acceso libre · Sin registro ni cuentas</span>
            </div>
          </div>
          <h1 className="text-xl font-extrabold text-white leading-snug">
            {session.promptQuestion}
          </h1>
          <p className="text-xs text-slate-400">
            Escribe tus palabras clave para que aparezcan en tiempo real en la pantalla principal.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tu Palabra o Frase:
            </label>
            <input
              type="text"
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              placeholder="Ej. Innovación, Trabajo en equipo..."
              maxLength={60}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Tu Nombre (Opcional):</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anónimo"
              maxLength={25}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={!wordInput.trim() || isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{isLoading ? 'Enviando...' : 'Enviar a la Pantalla'}</span>
          </button>

          {submittedMessage && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-emerald-300 text-xs text-center font-medium animate-fadeIn">
              {submittedMessage}
            </div>
          )}
        </form>

        {/* Existing Words Voting */}
        {topWords.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vota por palabras ya sugeridas:</span>
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {topWords.map(([word, count]) => (
                <button
                  key={word}
                  type="button"
                  onClick={() => {
                    onVoteWord(word);
                    confetti({ particleCount: 15, spread: 45 });
                  }}
                  className="p-2.5 bg-slate-900/90 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl text-left flex items-center justify-between gap-1 transition-all active:scale-95"
                >
                  <span className="text-xs font-semibold text-white truncate">{word}</span>
                  <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="py-4 text-center text-xs text-slate-500">
        Nube de Palabras Colaborativa
      </footer>
    </div>
  );
};

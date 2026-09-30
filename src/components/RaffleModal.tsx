import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Dices, X, RotateCcw, PartyPopper } from 'lucide-react';

interface RaffleModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: Record<string, number>;
}

const SPIN_DURATION_MS = 2400;
const SPIN_TICK_MS = 80;

export const RaffleModal: React.FC<RaffleModalProps> = ({ isOpen, onClose, words }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [displayWord, setDisplayWord] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uniqueWords = Object.keys(words);

  useEffect(() => {
    if (isOpen) {
      setWinner(null);
      setDisplayWord('');
      setIsSpinning(false);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Every distinct word has an equal chance — this is meant to pick a
  // comment to highlight or a small prize winner, not to reward the most
  // popular idea (the ranking already does that).
  const handleSpin = () => {
    if (uniqueWords.length === 0 || isSpinning) return;
    setIsSpinning(true);
    setWinner(null);

    const finalWord = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
    const startedAt = Date.now();

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const randomWord = uniqueWords[Math.floor(Math.random() * uniqueWords.length)];
      setDisplayWord(randomWord);
      if (elapsed >= SPIN_DURATION_MS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, SPIN_TICK_MS);

    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayWord(finalWord);
      setWinner(finalWord);
      setIsSpinning(false);
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'],
      });
    }, SPIN_DURATION_MS);
  };

  return (
    <div
      id="raffle-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sorteo de Palabra</h2>
              <p className="text-xs text-slate-400">
                Elige al azar una palabra entre las {uniqueWords.length} recibidas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 flex flex-col items-center justify-center min-h-[220px]">
          {uniqueWords.length === 0 ? (
            <p className="text-sm text-slate-400 text-center">
              Todavía no hay palabras en la nube para sortear.
            </p>
          ) : (
            <>
              <div
                className={`w-full text-center px-6 py-8 rounded-2xl border-2 transition-all ${
                  winner
                    ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20'
                    : 'border-slate-700 bg-slate-950/60'
                }`}
              >
                {winner && (
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <PartyPopper className="w-4 h-4" />
                    <span>¡Palabra ganadora!</span>
                  </div>
                )}
                <span
                  className={`block font-extrabold break-words leading-tight transition-all ${
                    winner ? 'text-3xl sm:text-4xl text-white' : 'text-2xl sm:text-3xl text-slate-300'
                  } ${isSpinning ? 'animate-pulse' : ''}`}
                >
                  {displayWord || '—'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                className="mt-6 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all active:scale-95"
              >
                {isSpinning ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Dices className="w-4 h-4" />
                )}
                <span>{isSpinning ? 'Girando...' : winner ? 'Girar de Nuevo' : 'Girar'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

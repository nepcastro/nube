import React, { useState } from 'react';
import { STOP_WORDS } from '../constants/palettes';
import { ModerationMode, SessionRound } from '../types';
import {
  Search,
  Trash2,
  Plus,
  Minus,
  FileText,
  RotateCcw,
  Sparkles,
  Check,
  ShieldAlert,
  Ban,
  X,
  ThumbsUp,
  ThumbsDown,
  History,
  ChevronDown,
  ChevronUp,
  Dices,
} from 'lucide-react';

interface WordListManagerProps {
  words: Record<string, number>;
  onUpdateWordCount: (word: string, count: number) => void;
  onDeleteWord: (word: string) => void;
  onBulkAddWords: (wordsMap: Record<string, number>) => void;
  onResetWords: () => void;
  onSeedSampleWords: () => void;
  customBlockedWords?: string[];
  onUpdateBlockedWords?: (words: string[]) => void;
  moderationMode?: ModerationMode;
  onToggleModerationMode?: (mode: ModerationMode) => void;
  pendingWords?: Record<string, number>;
  onApprovePending?: (word: string) => void;
  onRejectPending?: (word: string) => void;
  history?: SessionRound[];
  onOpenRaffle?: () => void;
}

export const WordListManager: React.FC<WordListManagerProps> = ({
  words,
  onUpdateWordCount,
  onDeleteWord,
  onBulkAddWords,
  onResetWords,
  onSeedSampleWords,
  customBlockedWords = [],
  onUpdateBlockedWords,
  moderationMode = 'auto',
  onToggleModerationMode,
  pendingWords = {},
  onApprovePending,
  onRejectPending,
  history = [],
  onOpenRaffle,
}) => {
  const [newBlockedWord, setNewBlockedWord] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [newSingleWord, setNewSingleWord] = useState('');
  const [newSingleCount, setNewSingleCount] = useState(1);
  const [confirmClear, setConfirmClear] = useState(false);

  const wordEntries = (Object.entries(words) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([word]) => word.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleAddSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSingleWord.trim()) return;
    const clean = newSingleWord.trim();
    const existing = words[clean] || 0;
    onUpdateWordCount(clean, existing + Number(newSingleCount || 1));
    setNewSingleWord('');
    setNewSingleCount(1);
  };

  const handleProcessBulkText = () => {
    if (!bulkText.trim()) return;

    // Tokenize text into words
    const tokens = bulkText
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»[\]\\]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2);

    const freqMap: Record<string, number> = {};
    tokens.forEach((token) => {
      const lower = token.toLowerCase();
      if (STOP_WORDS.has(lower)) return;
      // Capitalize first letter
      const formatted = token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
      freqMap[formatted] = (freqMap[formatted] || 0) + 1;
    });

    onBulkAddWords(freqMap);
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleAddBlockedWord = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newBlockedWord.trim();
    if (!clean || !onUpdateBlockedWords) return;
    if (customBlockedWords.some((w) => w.toLowerCase() === clean.toLowerCase())) {
      setNewBlockedWord('');
      return;
    }
    onUpdateBlockedWords([...customBlockedWords, clean]);
    setNewBlockedWord('');
  };

  const handleRemoveBlockedWord = (word: string) => {
    if (!onUpdateBlockedWords) return;
    onUpdateBlockedWords(customBlockedWords.filter((w) => w !== word));
  };

  const pendingEntries = (Object.entries(pendingWords) as [string, number][]).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div
      id="word-list-manager"
      className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Administrar Palabras y Moderación
          </h4>
          <p className="text-xs text-slate-400">
            {Object.keys(words).length} palabras registradas ·{' '}
            {(Object.values(words) as number[]).reduce((a, b) => a + b, 0)} votos en total
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {onOpenRaffle && (
            <button
              type="button"
              onClick={onOpenRaffle}
              disabled={Object.keys(words).length === 0}
              className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
              title="Sortear una palabra al azar entre las recibidas"
            >
              <Dices className="w-3.5 h-3.5" />
              <span>Sorteo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowBulkModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Importar Texto / Párrafo</span>
          </button>

          <button
            type="button"
            onClick={onSeedSampleWords}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Cargar palabras de ejemplo para talleres y presentaciones"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Ejemplo</span>
          </button>

          {confirmClear ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  onResetWords();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                Confirmar Borrado
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="px-2 py-1 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar Todo</span>
            </button>
          )}
        </div>
      </div>

      {/* Moderation: auto-approve vs. review queue, plus a custom blocklist */}
      {(onToggleModerationMode || onUpdateBlockedWords) && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Moderación de Contenido</span>
            </span>

            {onToggleModerationMode && (
              <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => onToggleModerationMode('auto')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    moderationMode === 'auto'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Automática
                </button>
                <button
                  type="button"
                  onClick={() => onToggleModerationMode('review')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    moderationMode === 'review'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Las palabras nuevas esperan tu aprobación antes de mostrarse"
                >
                  Con aprobación
                </button>
              </div>
            )}
          </div>

          {onUpdateBlockedWords && (
            <div>
              <p className="text-[11px] text-slate-400 mb-1.5">
                Palabras bloqueadas para esta sesión (además del filtro general):
              </p>
              <form onSubmit={handleAddBlockedWord} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newBlockedWord}
                  onChange={(e) => setNewBlockedWord(e.target.value)}
                  placeholder="Añadir palabra a bloquear..."
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newBlockedWord.trim()}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </form>
              {customBlockedWords.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {customBlockedWords.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-1 rounded-lg bg-rose-950/40 border border-rose-800/50 text-rose-300 text-[11px] flex items-center gap-1.5"
                    >
                      <span>{w}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlockedWord(w)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pending words waiting for moderator approval (review mode only) */}
      {pendingEntries.length > 0 && (onApprovePending || onRejectPending) && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Pendientes de Aprobación ({pendingEntries.length})</span>
          </span>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {pendingEntries.map(([word, count]) => (
              <div
                key={word}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
              >
                <span className="font-semibold text-white truncate max-w-[140px]">
                  {word}{' '}
                  <span className="text-amber-400 font-mono text-[10px]">×{count}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {onApprovePending && (
                    <button
                      type="button"
                      onClick={() => onApprovePending(word)}
                      className="p-1 rounded bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 transition-all"
                      title="Aprobar y mostrar en la nube"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {onRejectPending && (
                    <button
                      type="button"
                      onClick={() => onRejectPending(word)}
                      className="p-1 rounded bg-rose-900/50 hover:bg-rose-800/60 text-rose-300 transition-all"
                      title="Rechazar"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Add Single Word */}
      <form onSubmit={handleAddSingle} className="flex items-center gap-2">
        <input
          type="text"
          value={newSingleWord}
          onChange={(e) => setNewSingleWord(e.target.value)}
          placeholder="Añadir palabra directamente..."
          className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="number"
          min="1"
          max="999"
          value={newSingleCount}
          onChange={(e) => setNewSingleCount(Number(e.target.value))}
          className="w-16 px-2 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="Frecuencia / Votos iniciales"
        />
        <button
          type="submit"
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Añadir</span>
        </button>
      </form>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar o filtrar palabras en la lista..."
          className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-slate-700"
        />
      </div>

      {/* Word List Table / Badges */}
      <div className="max-h-60 overflow-y-auto pr-1 space-y-1.5">
        {wordEntries.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No se encontraron palabras coincidentes.
          </div>
        ) : (
          wordEntries.map(([word, count]) => (
            <div
              key={word}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800 transition-all text-xs"
            >
              <span className="font-semibold text-white truncate max-w-[120px] sm:max-w-[240px]">{word}</span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateWordCount(word, Math.max(0, count - 1))}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Restar 1 voto"
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span className="px-2 py-0.5 min-w-[28px] text-center font-mono font-bold text-indigo-300 bg-slate-950 rounded border border-slate-700/60 text-[11px]">
                  {count}
                </span>

                <button
                  type="button"
                  onClick={() => onUpdateWordCount(word, count + 1)}
                  className="p-1 rounded bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Sumar 1 voto"
                >
                  <Plus className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteWord(word)}
                  className="p-1 rounded hover:bg-rose-900/50 text-slate-500 hover:text-rose-300 ml-2 transition-all"
                  title="Eliminar palabra"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Text Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Importar Párrafo, Resumen o Lista</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pega cualquier texto libre (artículos, transcripciones, lluvia de ideas, preguntas
              abiertas). El sistema contará automáticamente las frecuencias y descartará conectores
              comunes.
            </p>

            <textarea
              rows={7}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Pega aquí el texto a analizar..."
              className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleProcessBulkText}
                disabled={!bulkText.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Analizar e Importar a la Nube</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rounds history: snapshots taken automatically each time the
          facilitator starts a new activity with "lienzo limpio" */}
      {history.length > 0 && (
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="w-full flex items-center justify-between px-1 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Historial de Rondas ({history.length})</span>
            </span>
            {showHistory ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showHistory && (
            <div className="mt-2 space-y-2 animate-fadeIn">
              {history.map((round, idx) => {
                const topWords = (Object.entries(round.words) as [string, number][])
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5);
                return (
                  <div
                    key={`${round.closedAt}-${idx}`}
                    className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1.5">
                      <span className="font-bold text-white">{round.title}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(round.closedAt).toLocaleString('es-PE', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-slate-400 mt-0.5 italic">"{round.promptQuestion}"</p>
                    {topWords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {topWords.map(([w, c]) => (
                          <span
                            key={w}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/60 text-slate-300 text-[10px] font-mono"
                          >
                            {w} · {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

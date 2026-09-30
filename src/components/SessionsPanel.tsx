import React, { useCallback, useEffect, useState } from 'react';
import { SessionIndexEntry } from '../types';
import {
  FolderClock,
  Plus,
  ExternalLink,
  RotateCcw,
  Trash2,
  Users,
  Type,
  X,
  Check,
} from 'lucide-react';

interface SessionsPanelProps {
  currentSessionId: string;
  adminHeaders: () => Record<string, string>;
  onSwitchSession: (id: string) => void;
  onCreateSession: (title: string, promptQuestion: string) => Promise<string | null>;
}

export const SessionsPanel: React.FC<SessionsPanelProps> = ({
  currentSessionId,
  adminHeaders,
  onSwitchSession,
  onCreateSession,
}) => {
  const [sessions, setSessions] = useState<SessionIndexEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/sessions', { headers: { ...adminHeaders() } });
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      } else {
        setError(data?.error || 'No se pudo cargar el listado de sesiones.');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }, [adminHeaders]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || isCreating) return;
    setIsCreating(true);
    try {
      const newId = await onCreateSession(newTitle.trim(), newPrompt.trim());
      if (newId) {
        setNewTitle('');
        setNewPrompt('');
        setShowCreateForm(false);
        fetchSessions();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE', headers: { ...adminHeaders() } });
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setConfirmDeleteId(null);
    }
  };

  return (
    <div
      id="sessions-panel"
      className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FolderClock className="w-4 h-4 text-indigo-400" />
            <span>Mis Sesiones</span>
          </h4>
          <p className="text-xs text-slate-400">
            Retoma un evento anterior o crea una sesión nueva con su propio QR.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          {showCreateForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>{showCreateForm ? 'Cancelar' : 'Nueva Sesión'}</span>
        </button>
      </div>

      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 animate-fadeIn"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título de la actividad (opcional)"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="text"
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
            placeholder="Pregunta para la audiencia *"
            required
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!newPrompt.trim() || isCreating}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isCreating ? 'Creando...' : 'Crear y Abrir'}</span>
          </button>
        </form>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <RotateCcw className="w-5 h-5 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-xs text-slate-500">
          Todavía no hay sesiones registradas.
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {sessions.map((s) => {
            const isCurrent = s.id === currentSessionId;
            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-indigo-600/10 border-indigo-500/50'
                    : 'bg-slate-800/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm truncate">{s.title}</span>
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                          Actual
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{s.promptQuestion}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Type className="w-3 h-3" />
                        {s.wordCount} palabras
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {s.participantCount} envíos
                      </span>
                      <span>{new Date(s.updatedAt).toLocaleDateString('es-PE')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => onSwitchSession(s.id)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
                        title="Abrir esta sesión"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir</span>
                      </button>
                    )}
                    {confirmDeleteId === s.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="px-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold"
                        >
                          Sí, borrar
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-1.5 py-1.5 text-slate-400 hover:text-white text-[11px]"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(s.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-900/50 text-slate-500 hover:text-rose-300 transition-all"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

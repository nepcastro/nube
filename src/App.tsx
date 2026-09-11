import React, { useState, useEffect, useCallback } from 'react';
import { CloudConfig, SessionData } from './types';
import { WordCloudCanvas } from './components/WordCloudCanvas';
import { ShapeSelectorBar } from './components/ShapeSelectorBar';
import { CustomizationPanel } from './components/CustomizationPanel';
import { ParticipantForm } from './components/ParticipantForm';
import { WordListManager } from './components/WordListManager';
import { ExportShareModal } from './components/ExportShareModal';
import { PresentationView } from './components/PresentationView';
import { ParticipantMobileView } from './components/ParticipantMobileView';
import { ActivityQuestionModal } from './components/ActivityQuestionModal';
import QRCode from 'qrcode';
import {
  CloudRain,
  Sliders,
  Users,
  ListOrdered,
  Share2,
  Tv,
  Edit3,
  Check,
  Smartphone,
  Sparkles,
  Send,
  QrCode,
  HelpCircle,
  ShieldCheck,
  Copy,
  ExternalLink,
  Globe,
  Settings,
  Info,
} from 'lucide-react';

const DEFAULT_CONFIG: CloudConfig = {
  shape: 'cloud',
  palette: 'cyberpunk',
  customColors: ['#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#fbbf24', '#ec4899'],
  font: 'montserrat',
  rotation: 'mixed90',
  background: '#0f172a',
  isTransparentBg: false,
  scaleFactor: 1.1,
  maxWords: 50,
  textTransform: 'capitalize',
  filterStopWords: true,
  padding: 4,
  minFontSize: 15,
  maxFontSize: 76,
};

const DEFAULT_SESSION: SessionData = {
  id: 'default',
  title: 'Taller de Creatividad & Innovación',
  promptQuestion: '¿Qué concepto define mejor nuestra visión para el futuro?',
  words: {
    Innovación: 22,
    Creatividad: 18,
    Colaboración: 16,
    Tecnología: 14,
    Liderazgo: 12,
    Futuro: 12,
    Impacto: 10,
    Estrategia: 9,
    Transformación: 9,
    Agilidad: 8,
    Comunidad: 8,
    Diseño: 7,
    Éxito: 7,
    Sinergia: 6,
    Empatía: 6,
    Inspiración: 5,
    Resiliencia: 5,
    Sostenibilidad: 4,
    Autonomía: 4,
    Aprendizaje: 4,
    Confianza: 4,
    Diversidad: 3,
    Calidad: 3,
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
  participantCount: 42,
  recentLogs: [],
};

export default function App() {
  const [sessionId, setSessionId] = useState<string>('default');
  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION);
  const [config, setConfig] = useState<CloudConfig>(DEFAULT_CONFIG);
  const [activeSection, setActiveSection] = useState<'cloud' | 'config' | 'participate' | 'words'>('cloud');
  const [showPresentation, setShowPresentation] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showQuestionModal, setShowQuestionModal] = useState<boolean>(false);
  const [isParticipantMode, setIsParticipantMode] = useState<boolean>(false);
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [editTitleInput, setEditTitleInput] = useState<string>('');
  const [editPromptInput, setEditPromptInput] = useState<string>('');
  const [quickWordInput, setQuickWordInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [canvasHeightMode, setCanvasHeightMode] = useState<'standard' | 'tall' | 'extra'>('tall');
  const [customPublicUrl, setCustomPublicUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('wordcloud_public_url') || '') : '';
  });
  const [qrInlineDataUrl, setQrInlineDataUrl] = useState<string>('');
  const [copiedInlineLink, setCopiedInlineLink] = useState<boolean>(false);
  const [showInlineUrlSettings, setShowInlineUrlSettings] = useState<boolean>(false);

  const currentWindowUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isDevHost = currentWindowUrl.includes('ais-dev-');
  const effectiveBaseUrl = customPublicUrl.trim()
    ? customPublicUrl.trim().split('?')[0]
    : currentWindowUrl.split('?')[0];

  const participantJoinUrl = `${effectiveBaseUrl}?session=${sessionId}&mode=participant`;

  useEffect(() => {
    QRCode.toDataURL(participantJoinUrl, {
      width: 240,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrInlineDataUrl(url))
      .catch((err) => console.error('Error generando QR inline:', err));
  }, [participantJoinUrl]);

  const handleSavePublicUrl = (url: string) => {
    setCustomPublicUrl(url);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wordcloud_public_url', url.trim());
    }
  };

  const handleCycleHeight = () => {
    setCanvasHeightMode((prev) => {
      if (prev === 'tall') return 'extra';
      if (prev === 'extra') return 'standard';
      return 'tall';
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Check URL parameters for session ID and participant mode
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session') || 'default';
    const mode = params.get('mode');

    setSessionId(sid);
    if (mode === 'participant') {
      setIsParticipantMode(true);
    }
  }, []);

  // Fetch session data from server API
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      if (res.ok) {
        const data: SessionData = await res.json();
        setSession(data);
      }
    } catch {
      // Offline / fallback to local state gracefully
    }
  }, [sessionId]);

  // Polling every 3.5s for real-time live audience sync
  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3500);
    return () => clearInterval(interval);
  }, [fetchSession]);

  // Submit word(s) from participant form
  const handleSubmitWords = async (wordsToAdd: string[], participantName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/words`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words: wordsToAdd, participantName }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } else {
        // Fallback local state
        const updated = { ...session.words };
        wordsToAdd.forEach((w) => {
          const clean = w.trim();
          if (clean) {
            updated[clean] = (updated[clean] || 0) + 1;
          }
        });
        setSession({ ...session, words: updated });
      }
      showToast('¡Palabra(s) agregadas a la nube con éxito!');
    } catch {
      const updated = { ...session.words };
      wordsToAdd.forEach((w) => {
        const clean = w.trim();
        if (clean) {
          updated[clean] = (updated[clean] || 0) + 1;
        }
      });
      setSession({ ...session, words: updated });
      showToast('Palabras añadidas localmente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick word submission from cloud screen
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickWordInput.trim() || isLoading) return;
    const words = quickWordInput
      .split(/[,;\n]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (words.length > 0) {
      await handleSubmitWords(words, 'Participante');
      setQuickWordInput('');
    }
  };

  // Quick vote (+1 count) on a word
  const handleVoteWord = async (word: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } else {
        setSession({
          ...session,
          words: { ...session.words, [word]: (session.words[word] || 0) + 1 },
        });
      }
    } catch {
      setSession({
        ...session,
        words: { ...session.words, [word]: (session.words[word] || 0) + 1 },
      });
    }
  };

  // Update count of a word from admin manager
  const handleUpdateWordCount = async (word: string, count: number) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/words/${encodeURIComponent(word)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSession(data.session);
      } else {
        setSession({
          ...session,
          words: { ...session.words, [word]: count },
        });
      }
    } catch {
      setSession({
        ...session,
        words: { ...session.words, [word]: count },
      });
    }
  };

  // Delete a word
  const handleDeleteWord = async (word: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/words/${encodeURIComponent(word)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.session) setSession(data.session);
      } else {
        const next = { ...session.words };
        delete next[word];
        setSession({ ...session, words: next });
      }
      showToast(`Palabra "${word}" eliminada.`);
    } catch {
      const next = { ...session.words };
      delete next[word];
      setSession({ ...session, words: next });
    }
  };

  // Bulk add words from text or paste
  const handleBulkAddWords = (wordCounts: Record<string, number>) => {
    const updated = { ...session.words };
    Object.entries(wordCounts).forEach(([w, count]) => {
      updated[w] = (updated[w] || 0) + count;
    });
    setSession({ ...session, words: updated });
    showToast(`${Object.keys(wordCounts).length} palabras procesadas.`);
  };

  // Reset all words
  const handleResetWords = async () => {
    try {
      await fetch(`/api/sessions/${sessionId}/reset`, { method: 'POST' });
    } catch {
      // ignore
    }
    setSession({ ...session, words: {}, participantCount: 0 });
    showToast('Se han limpiado todas las palabras.');
  };

  // Seed with sample words
  const handleSeedSampleWords = () => {
    setSession({
      ...session,
      words: { ...DEFAULT_SESSION.words },
      participantCount: 42,
    });
    showToast('Palabras de ejemplo restauradas.');
  };

  // Save session title, prompt question & optional reset for new activity
  const handleSaveActivitySettings = async (
    title: string,
    promptQuestion: string,
    resetWords: boolean = false
  ) => {
    const cleanTitle = title.trim() || session.title;
    const cleanPrompt = promptQuestion.trim() || session.promptQuestion;

    try {
      const res = await fetch(`/api/sessions/${sessionId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: cleanTitle,
          promptQuestion: cleanPrompt,
          resetWords,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.session) {
          setSession(data.session);
        }
      } else {
        setSession((prev) => ({
          ...prev,
          title: cleanTitle,
          promptQuestion: cleanPrompt,
          words: resetWords ? {} : prev.words,
          participantCount: resetWords ? 0 : prev.participantCount,
          recentLogs: resetWords ? [] : prev.recentLogs,
        }));
      }
    } catch {
      setSession((prev) => ({
        ...prev,
        title: cleanTitle,
        promptQuestion: cleanPrompt,
        words: resetWords ? {} : prev.words,
        participantCount: resetWords ? 0 : prev.participantCount,
        recentLogs: resetWords ? [] : prev.recentLogs,
      }));
    }

    setEditTitleInput(cleanTitle);
    setEditPromptInput(cleanPrompt);
    setIsEditingTitle(false);
    showToast(
      resetWords
        ? '¡Nueva actividad guardada con lienzo limpio!'
        : '¡Pregunta y actividad actualizadas con éxito!'
    );
  };

  const handleSaveTitleAndPrompt = async () => {
    await handleSaveActivitySettings(editTitleInput, editPromptInput, false);
  };

  const topExistingWords = (Object.entries(session.words) as [string, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([text, count]) => ({ text, count }));

  // If user opened with participant mode on a phone
  if (isParticipantMode) {
    return (
      <ParticipantMobileView
        session={session}
        onSubmitWords={handleSubmitWords}
        onVoteWord={handleVoteWord}
        onSwitchToStudio={() => setIsParticipantMode(false)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div
      id="app-root"
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col font-sans"
    >
      {/* 1. Header (Zero Lateral Overflow) */}
      <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo and Session Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <CloudRain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-bold text-indigo-400 uppercase tracking-wider truncate">
                  Nube de Palabras
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="text-[10px] text-emerald-400 font-medium hidden xs:inline shrink-0">En Vivo</span>
              </div>

              {isEditingTitle ? (
                <div className="flex items-center gap-1 mt-0.5 max-w-full">
                  <input
                    type="text"
                    value={editTitleInput}
                    onChange={(e) => setEditTitleInput(e.target.value)}
                    placeholder="Título"
                    className="px-2 py-0.5 bg-slate-950 border border-indigo-500 rounded text-xs text-white min-w-0 flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitleAndPrompt}
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <h1 className="text-xs sm:text-sm md:text-base font-extrabold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-md">
                    {session.title}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(true)}
                    className="text-slate-500 hover:text-indigo-400 transition-colors shrink-0"
                    title="Configurar título y pregunta de la actividad"
                  >
                    <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              id="switch-mobile-view-btn"
              onClick={() => setIsParticipantMode(true)}
              className="hidden lg:flex px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold items-center gap-1.5 transition-all shadow-sm"
              title="Abrir vista simulada para participantes"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vista Móvil</span>
            </button>

            <button
              type="button"
              id="open-presentation-btn"
              onClick={() => setShowPresentation(true)}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 shrink-0"
              title="Proyectar con código QR en pantalla completa"
            >
              <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
              <span className="hidden sm:inline">Presentar</span>
            </button>

            <button
              type="button"
              id="open-export-btn"
              onClick={() => setShowExportModal(true)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95 shrink-0"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Descargar / Compartir</span>
              <span className="sm:hidden">Exportar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn border border-indigo-400/40">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2. Top-Level Section Navigation: Clean segmented tabs */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 pt-3 sm:pt-4">
        <nav
          id="main-navigation-sections"
          className="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-md"
        >
          <button
            type="button"
            id="nav-section-cloud"
            onClick={() => setActiveSection('cloud')}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'cloud'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Lienzo Nube</span>
          </button>

          <button
            type="button"
            id="nav-section-config"
            onClick={() => setActiveSection('config')}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'config'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Configuración</span>
          </button>

          <button
            type="button"
            id="nav-section-participate"
            onClick={() => setActiveSection('participate')}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'participate'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Participantes</span>
          </button>

          <button
            type="button"
            id="nav-section-words"
            onClick={() => setActiveSection('words')}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'words'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-400/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate">Moderación</span>
          </button>
        </nav>
      </div>

      {/* 3. Main Workspace Views */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* VIEW 1: LIENZO DE LA NUBE (Exclusively Cloud + Shape Options Bar) */}
        {activeSection === 'cloud' && (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Prompt Question Banner with Prominent Activity / Question Configuration */}
            <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Pregunta Activa de la Actividad</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold">
                    En vivo para la audiencia
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs sm:text-sm md:text-base font-bold text-white truncate">
                    "{session.promptQuestion}"
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuestionModal(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors shrink-0"
                    title="Editar pregunta de la actividad"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  id="open-question-modal-banner-btn"
                  onClick={() => setShowQuestionModal(true)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 active:scale-95"
                  title="Configurar la pregunta o consigna de la actividad"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Configurar Pregunta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('participate')}
                  className="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Invitar Participantes</span>
                </button>
              </div>
            </div>

            {/* The Word Cloud Canvas Stage (Generous, non-clipping height) */}
            <div
              className={`w-full max-w-full overflow-hidden transition-all duration-300 ${
                canvasHeightMode === 'extra'
                  ? 'h-[800px] sm:h-[900px] md:h-[980px]'
                  : canvasHeightMode === 'standard'
                  ? 'h-[580px] sm:h-[660px] md:h-[720px]'
                  : 'h-[680px] sm:h-[780px] md:h-[840px] lg:h-[880px]'
              }`}
            >
              <WordCloudCanvas
                words={session.words}
                config={config}
                onWordClick={handleVoteWord}
                onToggleFullscreen={() => setShowPresentation(true)}
                onRefresh={() => {
                  setConfig({ ...config, scaleFactor: config.scaleFactor });
                  showToast('Disposición recalculada');
                }}
                isLoading={isLoading}
                heightPreset={canvasHeightMode}
                onCycleHeight={handleCycleHeight}
              />
            </div>

            {/* STRICT REQUIREMENT: Only the Shape Options remain beside/under the cloud */}
            <ShapeSelectorBar
              selectedShape={config.shape}
              onSelectShape={(newShape) => {
                setConfig((prev) => ({ ...prev, shape: newShape }));
                showToast(`Modelo de forma: ${newShape}`);
              }}
              onOpenFullConfig={() => setActiveSection('config')}
            />

            {/* Compact Inline Quick-Submit Input (So participants or moderator can add words right here) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium">¿Deseas sumar una palabra ahora mismo?</span>
              </div>

              <form onSubmit={handleQuickAdd} className="flex items-center gap-2 flex-1 sm:max-w-md">
                <input
                  type="text"
                  value={quickWordInput}
                  onChange={(e) => setQuickWordInput(e.target.value)}
                  placeholder="Escribe una palabra y presiona Enter..."
                  maxLength={50}
                  className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!quickWordInput.trim() || isLoading}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Sumar</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VIEW 2: INDEPENDENT CONFIGURATION SECTION */}
        {activeSection === 'config' && (
          <div className="animate-fadeIn">
            <CustomizationPanel
              config={config}
              onChangeConfig={setConfig}
              onBackToCloud={() => setActiveSection('cloud')}
              session={session}
              onUpdateSessionSettings={handleSaveActivitySettings}
              onOpenQuestionModal={() => setShowQuestionModal(true)}
            />
          </div>
        )}

        {/* VIEW 3: LIVE PARTICIPANT SUBMISSION SECTION */}
        {activeSection === 'participate' && (
          <div className="max-w-3xl mx-auto space-y-5 animate-fadeIn">
            {/* Anonymous & Free Access Guarantee Banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <span>Participación 100% Anónima y Sin Cuentas</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                      Acceso Instantáneo
                    </span>
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                    Nuestra aplicación jamás solicita inicio de sesión con Google, contraseñas ni registros. Tu audiencia solo escribe su palabra y presiona Enviar.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsParticipantMode(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
                title="Probar la pantalla que ven los participantes en su celular"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Probar Vista Móvil</span>
              </button>
            </div>

            {/* In-app Word Submission Form */}
            <ParticipantForm
              promptQuestion={session.promptQuestion}
              onSubmitWords={handleSubmitWords}
              isLoading={isLoading}
              onQuickVote={handleVoteWord}
              existingTopWords={topExistingWords}
              onOpenQuestionModal={() => setShowQuestionModal(true)}
            />

            {/* Complete QR Code & Audience Access Card */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="space-y-0.5">
                  <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span>Código QR & Enlace para la Audiencia</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Proyecta este código o comparte el enlace directo para que cualquier persona participe desde su móvil.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowInlineUrlSettings(!showInlineUrlSettings)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="Configurar URL pública del QR"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{showInlineUrlSettings ? 'Ocultar Ajustes' : 'Ajustes URL'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowPresentation(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-95"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Proyección en Vivo</span>
                  </button>
                </div>
              </div>

              {/* URL Customization Box (Collapsible) */}
              {showInlineUrlSettings && (
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>URL Base para el Código QR:</span>
                    </span>
                    {customPublicUrl && (
                      <button
                        type="button"
                        onClick={() => handleSavePublicUrl('')}
                        className="text-[10px] text-slate-400 hover:text-rose-400 underline"
                      >
                        Restablecer a URL actual
                      </button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={customPublicUrl}
                    onChange={(e) => handleSavePublicUrl(e.target.value)}
                    placeholder={currentWindowUrl.split('?')[0]}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Si has publicado tu aplicación con el botón <strong>"Share"</strong> de AI Studio o la has desplegado en un dominio propio, puedes pegar esa URL aquí para que el QR apunte directamente a ella sin solicitar cuentas de Google.
                  </p>
                </div>
              )}

              {/* QR and Details Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* QR preview box */}
                <div className="flex flex-col items-center justify-center p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  {qrInlineDataUrl ? (
                    <div className="p-2 bg-white rounded-lg shadow-inner">
                      <img
                        src={qrInlineDataUrl}
                        alt="Código QR de participación"
                        className="w-36 h-36 rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-500">
                      Generando QR...
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 mt-2 font-medium">
                    Escanear con la cámara del celular
                  </span>
                </div>

                {/* Information & Action buttons */}
                <div className="sm:col-span-2 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                      Enlace Directo de Participación:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={participantJoinUrl}
                        className="flex-1 min-w-0 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono truncate select-all"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(participantJoinUrl);
                          setCopiedInlineLink(true);
                          setTimeout(() => setCopiedInlineLink(false), 2000);
                        }}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 active:scale-95"
                      >
                        {copiedInlineLink ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedInlineLink ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Clarification about Google Sign-In in dev containers */}
                  {isDevHost && !customPublicUrl && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>¿Por qué Google te pide iniciar sesión al escanear desde el celular?</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-200/80">
                        Esta ventana está en la <strong>URL privada de desarrollo de AI Studio</strong> (<code className="bg-slate-900 px-1 py-0.5 rounded text-[10px]">ais-dev-...</code>), que Google protege para que solo tú puedas editarla.
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-200/80">
                        Para que tu audiencia participe <strong>sin ninguna cuenta de Google</strong>, pulsa el botón <strong>"Share" (Compartir)</strong> en la esquina superior de Google AI Studio y comparte ese enlace público. ¡Así cualquier persona entrará instantáneamente!
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsParticipantMode(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all border border-slate-700"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Probar como Participante</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowPresentation(true)}
                      className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 rounded-lg text-xs font-medium text-indigo-300 hover:text-white flex items-center gap-1.5 transition-all"
                    >
                      <Tv className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Pantalla Completa para Proyector</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: WORD LIST & MODERATION SECTION */}
        {activeSection === 'words' && (
          <div className="animate-fadeIn">
            <WordListManager
              words={session.words}
              onUpdateWordCount={handleUpdateWordCount}
              onDeleteWord={handleDeleteWord}
              onBulkAddWords={handleBulkAddWords}
              onResetWords={handleResetWords}
              onSeedSampleWords={handleSeedSampleWords}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 py-5 border-t border-slate-900 text-center text-[11px] text-slate-500 px-4">
        <p>Generador de Nube de Palabras Colaborativa · Exportación HD & Impresión Profesional</p>
      </footer>

      {/* High Resolution Export & Social Share Modal */}
      <ExportShareModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        words={session.words}
        config={config}
        sessionTitle={session.title}
        sessionId={sessionId}
      />

      {/* Fullscreen Presentation Mode with QR code */}
      {showPresentation && (
        <PresentationView
          session={session}
          config={config}
          onClose={() => setShowPresentation(false)}
          onWordClick={handleVoteWord}
          onOpenQuestionModal={() => setShowQuestionModal(true)}
        />
      )}

      {/* Activity & Prompt Question Configuration Modal */}
      <ActivityQuestionModal
        isOpen={showQuestionModal}
        currentTitle={session.title}
        currentPrompt={session.promptQuestion}
        onClose={() => setShowQuestionModal(false)}
        onSave={handleSaveActivitySettings}
        totalWordsInCloud={Object.keys(session.words).length}
      />
    </div>
  );
}

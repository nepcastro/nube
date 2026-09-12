import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CloudConfig, PositionedWord, SessionData } from '../types';
import { WordCloudCanvas } from './WordCloudCanvas';
import {
  Minimize2,
  QrCode,
  Users,
  Sparkles,
  Copy,
  Check,
  X,
  EyeOff,
  Eye,
  Edit3,
  HelpCircle,
  ShieldCheck,
  Globe,
  Settings,
} from 'lucide-react';

interface PresentationViewProps {
  session: SessionData;
  config: CloudConfig;
  onClose: () => void;
  onWordClick: (word: string) => void;
  onOpenQuestionModal?: () => void;
}

export const PresentationView: React.FC<PresentationViewProps> = ({
  session,
  config,
  onClose,
  onWordClick,
  onOpenQuestionModal,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showQrCard, setShowQrCard] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showUrlConfig, setShowUrlConfig] = useState<boolean>(false);
  const [showLanding, setShowLanding] = useState<boolean>(true);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isDevHost = currentUrl.includes('ais-dev-');

  const [customUrl, setCustomUrl] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('wordcloud_public_url') || '') : '';
  });

  const effectiveBaseUrl = customUrl.trim()
    ? customUrl.trim().split('?')[0]
    : currentUrl.split('?')[0];

  const joinUrl = `${effectiveBaseUrl}?session=${session.id}&mode=participant`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, {
      width: 280,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generando QR:', err));
  }, [joinUrl]);

  const handleSaveCustomUrl = (newUrl: string) => {
    setCustomUrl(newUrl);
    if (typeof window !== 'undefined') {
      localStorage.setItem('wordcloud_public_url', newUrl.trim());
    }
  };

  // ESC key to exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const totalVotes = (Object.values(session.words) as number[]).reduce((a, b) => a + b, 0);

  if (showLanding) {
    return (
      <div
        id="presentation-landing-screen"
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn"
      >
        <button
          type="button"
          onClick={onClose}
          title="Salir (Esc)"
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <div className="w-36 h-36 sm:w-52 sm:h-52 rounded-3xl bg-white/5 border border-slate-700/60 flex items-center justify-center overflow-hidden shadow-2xl mb-8">
          {session.logoUrl ? (
            <img src={session.logoUrl} alt="Logo del cliente" className="w-full h-full object-contain p-4" />
          ) : (
            <Sparkles className="w-14 h-14 sm:w-16 sm:h-16 text-indigo-400" />
          )}
        </div>

        <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-indigo-400 font-bold mb-3">
          Presentación en Vivo
        </p>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white max-w-3xl leading-tight mb-10">
          {session.title}
        </h1>

        <button
          id="landing-ver-nube-btn"
          type="button"
          onClick={() => setShowLanding(false)}
          className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm sm:text-base font-bold shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center gap-2.5"
        >
          <Eye className="w-5 h-5" />
          <span>Ver Nube</span>
        </button>
      </div>
    );
  }

  return (
    <div
      id="presentation-view-fullscreen"
      className="fixed inset-0 z-50 bg-slate-950 flex flex-col select-none overflow-hidden"
    >
      {/* Top Presentation Bar */}
      <header className="px-3 sm:px-6 py-2.5 sm:py-4 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-2 z-20 overflow-x-hidden">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold text-xs sm:text-sm tracking-wide shrink-0">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="hidden xs:inline">PRESENTACIÓN EN VIVO</span>
            <span className="xs:hidden">EN VIVO</span>
          </div>
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <h2 className="text-xs sm:text-base font-bold text-white tracking-tight truncate max-w-[120px] xs:max-w-[180px] sm:max-w-md">
            {session.title}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 items-center gap-2 shadow-inner">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {session.participantCount} participantes · {totalVotes} aportes
            </span>
          </div>

          {onOpenQuestionModal && (
            <button
              id="presentation-edit-prompt-btn"
              type="button"
              onClick={onOpenQuestionModal}
              title="Configurar o cambiar la pregunta de la actividad"
              className="p-2 sm:p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">Cambiar Pregunta</span>
            </button>
          )}

          <button
            id="toggle-qr-topbar-btn"
            type="button"
            onClick={() => setShowQrCard(!showQrCard)}
            title={showQrCard ? 'Ocultar ventana de QR y ver solo la nube' : 'Mostrar ventana de código QR'}
            className={`p-2 sm:p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              showQrCard
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span className="hidden sm:inline">{showQrCard ? 'Ocultar QR' : 'Mostrar QR'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Presiona Esc para salir"
          >
            <Minimize2 className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="flex-1 relative w-full h-full p-2 sm:p-6 overflow-hidden">
        <WordCloudCanvas
          words={session.words}
          config={config}
          onWordClick={onWordClick}
          isPresentation={true}
        />

        {/* Prompt Banner floating at top center */}
        {session.promptQuestion && (
          <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 z-20 px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md max-w-[90%] sm:max-w-2xl text-center flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs uppercase tracking-wider text-indigo-400 font-bold mb-0.5">
                Pregunta para la audiencia:
              </p>
              <h3 className="text-xs sm:text-base font-extrabold text-white truncate">{session.promptQuestion}</h3>
            </div>
            {onOpenQuestionModal && (
              <button
                type="button"
                onClick={onOpenQuestionModal}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                title="Configurar o cambiar la pregunta de la actividad"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Floating QR Code Card for Audience */}
        {showQrCard && qrDataUrl && (
          <div
            id="audience-qr-card"
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-30 bg-slate-900/95 border border-slate-700/90 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-xl w-60 sm:w-68 text-center animate-fadeIn"
          >
            {/* Header with clear Close X Button */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="text-[11px] sm:text-xs font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                <span>Acceso QR</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowUrlConfig(!showUrlConfig)}
                  className={`p-1 rounded-lg transition-colors ${
                    showUrlConfig
                      ? 'bg-indigo-600/30 text-indigo-300'
                      : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title="Configurar URL pública del QR"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
                <button
                  id="close-qr-card-btn"
                  type="button"
                  onClick={() => setShowQrCard(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Cerrar ventana y ver solo la nube"
                  aria-label="Cerrar ventana de QR"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Anonymous Badge */}
            <div className="mb-2 py-0.5 px-2 bg-emerald-950/60 border border-emerald-500/30 rounded-full flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-300">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Acceso libre y 100% anónimo</span>
            </div>

            {/* Optional URL Config Box */}
            {showUrlConfig && (
              <div className="mb-2.5 p-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-left space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-400" />
                    <span>URL del QR:</span>
                  </span>
                  {customUrl && (
                    <button
                      type="button"
                      onClick={() => handleSaveCustomUrl('')}
                      className="text-[9px] text-slate-400 hover:text-rose-400 underline"
                    >
                      Restablecer
                    </button>
                  )}
                </div>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => handleSaveCustomUrl(e.target.value)}
                  placeholder={currentUrl.split('?')[0]}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-[10px] text-slate-200 placeholder:text-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[9px] text-slate-400 leading-tight">
                  {isDevHost
                    ? '⚠️ Estás en la URL privada de desarrollo. Para acceso sin cuenta de Google, pulsa "Share" en AI Studio y pega el enlace público aquí.'
                    : 'Pega aquí una URL personalizada o dominio si lo deseas.'}
                </p>
              </div>
            )}

            <div className="p-2 bg-white rounded-xl shadow-inner mb-2">
              <img
                src={qrDataUrl}
                alt="Escanear para enviar palabras"
                className="w-full h-auto rounded-lg"
              />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">¡Escanea para Participar!</p>
            <p className="text-[10px] sm:text-[11px] text-slate-400 mb-2 leading-tight">
              Sin registros ni contraseñas. Solo escribe tu palabra.
            </p>

            {isDevHost && !customUrl && (
              <div className="mb-2 p-1.5 bg-amber-950/40 border border-amber-500/30 rounded-lg text-[9.5px] text-amber-300 leading-tight text-left flex items-start gap-1">
                <HelpCircle className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tip para la audiencia:</strong> Usa el botón "Share" de AI Studio para obtener el enlace público sin login de Google.
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-[11px] text-slate-300 hover:text-white font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
              </button>

              <button
                id="dismiss-qr-card-btn"
                type="button"
                onClick={() => setShowQrCard(false)}
                className="w-full py-1.5 px-2 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-medium transition-all flex items-center justify-center gap-1.5"
                title="Ocultar esta ventana y dejar solo la vista ampliada de la nube"
              >
                <EyeOff className="w-3 h-3" />
                <span>Ver solo la nube</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Reopen Button if QR Card is closed */}
        {!showQrCard && qrDataUrl && (
          <button
            id="reopen-qr-floating-btn"
            type="button"
            onClick={() => setShowQrCard(true)}
            title="Mostrar ventana de código QR"
            className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-30 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 transition-all active:scale-95 animate-fadeIn"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Mostrar QR</span>
          </button>
        )}

        {/* Recent Activity Ticker at Bottom Left */}
        {session.recentLogs.length > 0 && (
          <div className="absolute bottom-10 left-10 z-20 pointer-events-none flex flex-col gap-1.5 max-w-xs">
            {session.recentLogs.slice(0, 3).map((log, i) => (
              <div
                key={`${log.time}-${i}`}
                className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700/60 text-xs text-slate-200 backdrop-blur-md shadow-lg flex items-center gap-2 animate-fadeIn"
              >
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="truncate">
                  <span className="text-indigo-300 font-semibold">{log.by || 'Alguien'}</span>{' '}
                  sumó <strong className="text-white">"{log.word}"</strong>
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

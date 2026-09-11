import React, { useState } from 'react';
import { CloudConfig, ExportOption } from '../types';
import { computeWordCloud, generateSvgString, renderWordCloudToCanvas } from '../services/wordCloudEngine';
import {
  Download,
  Share2,
  Copy,
  Check,
  Twitter,
  Linkedin,
  Facebook,
  Send,
  FileCode,
  FileSpreadsheet,
  X,
  Printer,
  Monitor,
  Tv,
} from 'lucide-react';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: Record<string, number>;
  config: CloudConfig;
  sessionTitle: string;
  sessionId: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'standard',
    label: 'Web & Redes (1200 × 800)',
    width: 1200,
    height: 800,
    description: 'Resolución estándar ideal para redes sociales, web y correos.',
  },
  {
    id: 'hd',
    label: 'Presentaciones HD (1920 × 1080)',
    width: 1920,
    height: 1080,
    description: 'Proporción 16:9 perfecta para diapositivas PowerPoint, Keynote o Google Slides.',
  },
  {
    id: '4k',
    label: 'Ultra HD 4K (3840 × 2160)',
    width: 3840,
    height: 2160,
    description: 'Máxima fidelidad para pantallas gigantes, proyectores 4K y transmisiones.',
  },
  {
    id: 'print300',
    label: 'Impresión Profesional 300 DPI (3600 × 2700)',
    width: 3600,
    height: 2700,
    dpi: 300,
    description: 'Calidad litográfica de imprenta para pósters, lonas, memorias o revistas.',
  },
];

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  words,
  config,
  sessionTitle,
  sessionId,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<ExportOption>(EXPORT_OPTIONS[1]);
  const [isExporting, setIsExporting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const storedPublicUrl = typeof window !== 'undefined' ? (localStorage.getItem('wordcloud_public_url') || '') : '';
  const isDevHost = currentUrl.includes('ais-dev-');
  const effectiveBaseUrl = storedPublicUrl.trim()
    ? storedPublicUrl.trim().split('?')[0]
    : currentUrl.split('?')[0];
  const shareUrl = `${effectiveBaseUrl}?session=${sessionId}`;

  // Handle PNG export at selected resolution
  const handleDownloadPng = async () => {
    setIsExporting(true);
    try {
      const { width, height } = selectedResolution;
      const offscreenCanvas = document.createElement('canvas');

      // Compute word positions for targeted high-resolution dimensions
      const highResWords = computeWordCloud(words, config, width, height);

      renderWordCloudToCanvas(offscreenCanvas, highResWords, config, width, height);

      offscreenCanvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const sanitizedTitle = sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `nube_palabras_${sanitizedTitle}_${width}x${height}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error al exportar PNG:', err);
      setIsExporting(false);
    }
  };

  // Handle lossless vector SVG export
  const handleDownloadSvg = () => {
    try {
      const width = selectedResolution.width;
      const height = selectedResolution.height;
      const highResWords = computeWordCloud(words, config, width, height);
      const svgString = generateSvgString(highResWords, config, width, height);

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const sanitizedTitle = sessionTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `nube_palabras_vectorial_${sanitizedTitle}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al exportar SVG:', err);
    }
  };

  // Handle JSON export
  const handleDownloadJson = () => {
    const data = {
      title: sessionTitle,
      exportDate: new Date().toISOString(),
      config,
      totalWords: Object.keys(words).length,
      totalVotes: (Object.values(words) as number[]).reduce((a, b) => a + b, 0),
      words,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datos_nube_${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Social sharing links
  const shareText = `¡Mira los resultados de nuestra nube de palabras interactiva sobre "${sessionTitle}"! Participa o descarga el diseño aquí:`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;

  const embedSnippet = `<iframe src="${shareUrl}" width="800" height="500" frameborder="0" allowfullscreen></iframe>`;

  return (
    <div
      id="export-share-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="export-share-modal"
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Exportar y Compartir Nube</h3>
              <p className="text-xs text-slate-400">
                Descarga en alta definición para presentaciones o comparte en redes sociales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 sm:space-y-6 max-h-[75vh] overflow-y-auto overflow-x-hidden">
          {/* 1. Selección de Resolución */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              <span>Resolución de Exportación</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {EXPORT_OPTIONS.map((opt) => {
                const isSelected = selectedResolution.id === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedResolution(opt)}
                    className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        {opt.id === 'print300' ? (
                          <Printer className="w-3.5 h-3.5 text-amber-400" />
                        ) : opt.id === '4k' ? (
                          <Tv className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Monitor className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        {opt.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Botones de Descarga */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Descargas Directas
            </h5>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-2.5">
              <button
                type="button"
                id="download-png-btn"
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full sm:flex-1 min-w-0 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isExporting
                    ? 'Procesando diseño...'
                    : `Descargar PNG (${selectedResolution.width}×${selectedResolution.height})`}
                </span>
              </button>

              <button
                type="button"
                id="download-svg-btn"
                onClick={handleDownloadSvg}
                className="w-full sm:w-auto px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                title="Descargar en formato vectorial escalable sin pérdida de calidad"
              >
                <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Vectorial SVG (Infinito)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadJson}
                className="w-full sm:w-auto px-3.5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                title="Descargar reporte analítico con palabras y votos en JSON"
              >
                <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Datos JSON</span>
              </button>
            </div>
          </div>

          {/* 3. Compartir en Redes Sociales */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">
              Compartir en Redes Sociales
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-center"
              >
                <Twitter className="w-4 h-4 text-sky-400" />
                <span>X / Twitter</span>
              </a>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-center"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp</span>
              </a>

              <a
                href={linkedinUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-center"
              >
                <Linkedin className="w-4 h-4 text-blue-400" />
                <span>LinkedIn</span>
              </a>

              <a
                href={facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-center"
              >
                <Facebook className="w-4 h-4 text-indigo-400" />
                <span>Facebook</span>
              </a>

              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-semibold text-center"
              >
                <Send className="w-4 h-4 text-cyan-400" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* 4. Enlace Descargable y Código Embed */}
          <div className="space-y-3">
            {/* Direct Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Enlace Directo para Participantes y Descargas:
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 font-mono truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(shareUrl, setCopiedLink)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? '¡Copiado!' : 'Copiar Enlace'}</span>
                </button>
              </div>
              {isDevHost && !storedPublicUrl && (
                <p className="text-[10px] text-amber-400/90 mt-1">
                  💡 <strong>Tip de acceso libre:</strong> Para que los participantes accedan sin que se les pida cuenta de Google, pulsa <strong>Share</strong> (Compartir) en la esquina superior de AI Studio y comparte ese enlace público.
                </p>
              )}
            </div>

            {/* Embed Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Código para Incrustar en Diapositivas o Sitios Web (iFrame):
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedSnippet}
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-400 font-mono truncate select-all"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(embedSnippet, setCopiedEmbed)}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-all shrink-0"
                >
                  {copiedEmbed ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedEmbed ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CloudConfig, PositionedWord } from '../types';
import { computeWordCloud } from '../services/wordCloudEngine';
import { FONTS } from '../constants/palettes';
import { ThumbsUp, Maximize2, Sparkles, RefreshCw, ChevronsUpDown } from 'lucide-react';

interface WordCloudCanvasProps {
  words: Record<string, number>;
  config: CloudConfig;
  onWordClick?: (word: string) => void;
  onToggleFullscreen?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  heightPreset?: 'standard' | 'tall' | 'extra';
  onCycleHeight?: () => void;
  isPresentation?: boolean;
}

export const WordCloudCanvas: React.FC<WordCloudCanvasProps> = ({
  words,
  config,
  onWordClick,
  onToggleFullscreen,
  onRefresh,
  isLoading = false,
  heightPreset = 'tall',
  onCycleHeight,
  isPresentation = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredWord, setHoveredWord] = useState<PositionedWord | null>(null);
  const [voteToast, setVoteToast] = useState<{ text: string; x: number; y: number } | null>(null);

  // ResizeObserver for responsive fluid canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 200 && height > 200) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height),
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute positioned words
  const positionedWords = useMemo(() => {
    return computeWordCloud(words, config, dimensions.width, dimensions.height);
  }, [words, config, dimensions.width, dimensions.height]);

  const totalSubmissions = useMemo(() => {
    return (Object.values(words) as number[]).reduce((a, b) => a + b, 0);
  }, [words]);

  const fontDef = useMemo(() => {
    return FONTS.find((f) => f.id === config.font) || FONTS[0];
  }, [config.font]);

  const handleWordClick = (word: PositionedWord, e: React.MouseEvent) => {
    if (onWordClick) {
      onWordClick(word.rawText || word.text);

      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setVoteToast({
          text: `+1 a "${word.text}"`,
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });

        setTimeout(() => setVoteToast(null), 1200);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id="word-cloud-display-container"
      className={`relative w-full h-full max-w-full overflow-hidden rounded-2xl border border-slate-800/80 shadow-2xl transition-colors duration-500 select-none flex items-center justify-center ${
        isPresentation ? 'min-h-0' : 'min-h-[520px] sm:min-h-[660px] md:min-h-[740px]'
      }`}
      style={{
        backgroundColor: config.isTransparentBg ? 'transparent' : config.background,
      }}
    >
      {/* Background pattern grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Floating Canvas Action Controls */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-1.5 sm:gap-2">
        {onCycleHeight && (
          <button
            id="toggle-canvas-height-btn"
            type="button"
            onClick={onCycleHeight}
            title={`Altura actual: ${
              heightPreset === 'extra'
                ? 'Extra Alta (1000px)'
                : heightPreset === 'tall'
                ? 'Amplia (840px)'
                : 'Estándar (720px)'
            }. Clic para alternar altura.`}
            className="px-2.5 py-2 sm:py-2.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
          >
            <ChevronsUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">
              {heightPreset === 'extra'
                ? 'Altura: Extra'
                : heightPreset === 'tall'
                ? 'Altura: Amplia'
                : 'Altura: Estándar'}
            </span>
          </button>
        )}

        {onRefresh && (
          <button
            id="refresh-cloud-btn"
            type="button"
            onClick={onRefresh}
            title="Recalcular disposición aleatoria"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}

        {onToggleFullscreen && (
          <button
            id="toggle-fullscreen-btn"
            type="button"
            onClick={onToggleFullscreen}
            title="Modo Presentación Pantalla Completa"
            className="p-2 sm:p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 shadow-lg backdrop-blur-md transition-all active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>

      {/* Cloud Info Badge */}
      <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-20 flex items-center gap-2 pointer-events-none max-w-[85%]">
        <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-slate-900/85 border border-slate-700/70 text-[11px] sm:text-xs text-slate-300 font-medium backdrop-blur-md flex items-center gap-1.5 sm:gap-2 shadow-lg truncate">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">
            {positionedWords.length} palabras mostradas · {totalSubmissions} votos
          </span>
        </div>
      </div>

      {/* Main SVG Render */}
      {positionedWords.length > 0 ? (
        <svg
          id="word-cloud-svg"
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="w-full h-full cursor-default"
          style={{ fontFamily: fontDef.cssFamily }}
        >
          <g>
            {positionedWords.map((w, index) => {
              const isHovered = hoveredWord?.text === w.text;
              return (
                <g
                  key={`${w.text}-${index}`}
                  transform={`translate(${w.x}, ${w.y}) rotate(${w.rotate})`}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={(e) => handleWordClick(w, e)}
                  onMouseEnter={() => setHoveredWord(w)}
                  onMouseLeave={() => setHoveredWord(null)}
                >
                  <text
                    id={`cloud-word-${index}`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={`${w.size}px`}
                    fontWeight="800"
                    fill={w.color}
                    className="transition-all duration-200"
                    style={{
                      filter: isHovered
                        ? 'drop-shadow(0 0 12px currentColor)'
                        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
                      transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                      transformOrigin: 'center',
                    }}
                  >
                    {w.text}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      ) : (
        <div className="text-center p-8 text-slate-400">
          <p className="text-lg font-medium">Aún no hay palabras suficientes para formar la nube.</p>
          <p className="text-sm text-slate-500 mt-1">
            Usa el formulario a continuación o el panel para agregar palabras clave.
          </p>
        </div>
      )}

      {/* Hover Info Tooltip */}
      <AnimatePresence>
        {hoveredWord && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute z-30 pointer-events-none px-3.5 py-2 rounded-xl bg-slate-950/90 border border-slate-700 text-xs shadow-2xl backdrop-blur-md flex items-center gap-2"
            style={{
              left: Math.min(Math.max(hoveredWord.x - 50, 10), dimensions.width - 130),
              top: Math.max(hoveredWord.y - 45, 10),
            }}
          >
            <span className="font-bold text-white text-sm">{hoveredWord.text}</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-300 font-semibold flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {hoveredWord.count} {hoveredWord.count === 1 ? 'voto' : 'votos'}
            </span>
            {totalSubmissions > 0 && (
              <span className="text-slate-400">
                ({Math.round((hoveredWord.count / totalSubmissions) * 100)}%)
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Click / Vote Toast */}
      <AnimatePresence>
        {voteToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 0.8, y: -40 }}
            className="absolute z-40 pointer-events-none px-3 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-xs shadow-lg"
            style={{ left: voteToast.x - 40, top: voteToast.y - 30 }}
          >
            {voteToast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

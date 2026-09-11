import React from 'react';
import { CloudShape } from '../types';
import { SHAPES } from '../constants/palettes';
import {
  Cloud,
  Circle,
  Heart,
  Star,
  MessageSquare,
  Trophy,
  Lightbulb,
  Square,
  Gem,
  Hexagon,
  Settings,
} from 'lucide-react';

interface ShapeSelectorBarProps {
  selectedShape: CloudShape;
  onSelectShape: (shape: CloudShape) => void;
  onOpenFullConfig?: () => void;
}

export const ShapeSelectorBar: React.FC<ShapeSelectorBarProps> = ({
  selectedShape,
  onSelectShape,
  onOpenFullConfig,
}) => {
  const getShapeIcon = (shapeId: CloudShape) => {
    switch (shapeId) {
      case 'cloud': return <Cloud className="w-4 h-4 shrink-0" />;
      case 'circle': return <Circle className="w-4 h-4 shrink-0" />;
      case 'heart': return <Heart className="w-4 h-4 shrink-0" />;
      case 'star': return <Star className="w-4 h-4 shrink-0" />;
      case 'speech_bubble': return <MessageSquare className="w-4 h-4 shrink-0" />;
      case 'trophy': return <Trophy className="w-4 h-4 shrink-0" />;
      case 'lightbulb': return <Lightbulb className="w-4 h-4 shrink-0" />;
      case 'rectangle': return <Square className="w-4 h-4 shrink-0" />;
      case 'diamond': return <Gem className="w-4 h-4 shrink-0" />;
      case 'hexagon': return <Hexagon className="w-4 h-4 shrink-0" />;
    }
  };

  return (
    <div
      id="cloud-shapes-bar"
      className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xl"
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-200">
            Modelos de Forma de la Nube
          </h3>
        </div>

        {onOpenFullConfig && (
          <button
            type="button"
            onClick={onOpenFullConfig}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 font-semibold transition-colors py-1 px-2 rounded-lg hover:bg-slate-800"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Configuración Completa (Colores, Fuentes)</span>
            <span className="sm:hidden">Más Opciones</span>
          </button>
        )}
      </div>

      {/* Shapes Grid: Fluid, wraps nicely, absolutely no horizontal overflow */}
      <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 md:grid-cols-10 gap-1.5 sm:gap-2">
        {SHAPES.map((shape) => {
          const isSelected = selectedShape === shape.id;
          return (
            <button
              key={shape.id}
              type="button"
              id={`shape-select-${shape.id}`}
              onClick={() => onSelectShape(shape.id)}
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title={shape.description}
            >
              <div className={isSelected ? 'text-indigo-400' : 'text-slate-400'}>
                {getShapeIcon(shape.id)}
              </div>
              <span className="text-[11px] font-semibold truncate max-w-full">
                {shape.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

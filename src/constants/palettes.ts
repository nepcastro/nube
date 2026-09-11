import { CloudShape, FontFamilyId, PaletteId } from '../types';

export interface PaletteDef {
  id: PaletteId;
  name: string;
  colors: string[];
  recommendedBg: string;
}

export const PALETTES: PaletteDef[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    colors: ['#06b6d4', '#f43f5e', '#a855f7', '#10b981', '#fbbf24', '#ec4899'],
    recommendedBg: '#0f172a',
  },
  {
    id: 'sunset',
    name: 'Atardecer Cálido',
    colors: ['#f97316', '#fb7185', '#fbbf24', '#f43f5e', '#c026d3', '#ea580c'],
    recommendedBg: '#18181b',
  },
  {
    id: 'emerald',
    name: 'Bosque Esmeralda',
    colors: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#f59e0b', '#14b8a6'],
    recommendedBg: '#064e3b',
  },
  {
    id: 'ocean',
    name: 'Océano Profundo',
    colors: ['#38bdf8', '#0284c7', '#06b6d4', '#60a5fa', '#818cf8', '#22d3ee'],
    recommendedBg: '#0c4a6e',
  },
  {
    id: 'pastel',
    name: 'Pastel Moderno',
    colors: ['#818cf8', '#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#a78bfa'],
    recommendedBg: '#f8fafc',
  },
  {
    id: 'royalty',
    name: 'Realeza & Oro',
    colors: ['#fbbf24', '#d97706', '#c084fc', '#e879f9', '#fef08a', '#9333ea'],
    recommendedBg: '#1e1b4b',
  },
  {
    id: 'monochrome',
    name: 'Minimal Monocromo',
    colors: ['#ffffff', '#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#38bdf8'],
    recommendedBg: '#090d16',
  },
  {
    id: 'candy',
    name: 'Dulce Caramelo',
    colors: ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'],
    recommendedBg: '#1e1b2e',
  },
  {
    id: 'warm_autumn',
    name: 'Otoño Dorado',
    colors: ['#d97706', '#b45309', '#ea580c', '#ca8a04', '#9a3412', '#78350f'],
    recommendedBg: '#1c1917',
  },
];

export interface ShapeDef {
  id: CloudShape;
  label: string;
  iconName: string;
  description: string;
}

export const SHAPES: ShapeDef[] = [
  { id: 'cloud', label: 'Nube', iconName: 'Cloud', description: 'Forma orgánica de cúmulo' },
  { id: 'circle', label: 'Círculo', iconName: 'Circle', description: 'Distribución radial simétrica' },
  { id: 'heart', label: 'Corazón', iconName: 'Heart', description: 'Silueta emotiva de corazón' },
  { id: 'star', label: 'Estrella', iconName: 'Star', description: 'Estrella de 5 puntas' },
  { id: 'speech_bubble', label: 'Burbuja', iconName: 'MessageSquare', description: 'Burbuja de conversación' },
  { id: 'trophy', label: 'Trofeo', iconName: 'Trophy', description: 'Copa de reconocimiento' },
  { id: 'lightbulb', label: 'Bombilla', iconName: 'Lightbulb', description: 'Símbolo de ideas e innovación' },
  { id: 'rectangle', label: 'Rectángulo', iconName: 'Square', description: 'Proporción áurea clásica' },
  { id: 'diamond', label: 'Diamante', iconName: 'Gem', description: 'Rombo elegante' },
  { id: 'hexagon', label: 'Hexágono', iconName: 'Hexagon', description: 'Estructura geométrica moderna' },
];

export interface FontDef {
  id: FontFamilyId;
  label: string;
  cssFamily: string;
  sample: string;
}

export const FONTS: FontDef[] = [
  {
    id: 'montserrat',
    label: 'Montserrat (Bold)',
    cssFamily: "'Montserrat', sans-serif",
    sample: 'IMPACTO',
  },
  {
    id: 'playfair',
    label: 'Playfair Display (Serif)',
    cssFamily: "'Playfair Display', serif",
    sample: 'Elegancia',
  },
  {
    id: 'inter',
    label: 'Inter (Modern Sans)',
    cssFamily: "'Inter', sans-serif",
    sample: 'Modernidad',
  },
  {
    id: 'fredoka',
    label: 'Fredoka (Lúdica)',
    cssFamily: "'Fredoka', sans-serif",
    sample: 'Diversión',
  },
  {
    id: 'cinzel',
    label: 'Cinzel (Clásica)',
    cssFamily: "'Cinzel', serif",
    sample: 'PRESTIGIO',
  },
  {
    id: 'pacifico',
    label: 'Pacifico (Manuscrita)',
    cssFamily: "'Pacifico', cursive",
    sample: 'Creativo',
  },
  {
    id: 'spacemono',
    label: 'Space Mono (Tech)',
    cssFamily: "'Space Mono', monospace",
    sample: 'DIGITAL',
  },
];

// Comprehensive stop words in Spanish and English for filtering out noise
export const STOP_WORDS = new Set([
  // Spanish
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
  'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene',
  'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos',
  'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí', 'antes',
  'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho',
  'quienes', 'nada', 'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'haber', 'estas', 'estaba',
  'estamos', 'fue', 'fueron', 'ha', 'han',
  // English
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up',
  'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
  'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could',
  'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
  'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even',
  'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us', 'is', 'are', 'was', 'were',
]);

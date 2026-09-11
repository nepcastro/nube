export type CloudShape =
  | 'cloud'
| 'circle'
| 'heart'
| 'star'
| 'speech_bubble'
| 'trophy'
| 'lightbulb'
| 'rectangle'
| 'diamond'
| 'hexagon';

export type PaletteId =
  | 'cyberpunk'
| 'sunset'
| 'emerald'
| 'ocean'
| 'pastel'
| 'royalty'
| 'monochrome'
| 'candy'
| 'warm_autumn'
| 'custom';

export type FontFamilyId =
  | 'montserrat'
| 'playfair'
| 'inter'
| 'fredoka'
| 'cinzel'
| 'pacifico'
| 'spacemono';

export type RotationMode = 'horizontal' | 'mixed90' | 'diagonal45' | 'free';

export type TextTransform = 'none' | 'uppercase' | 'capitalize' | 'lowercase';

export interface CloudConfig {
  shape: CloudShape;
  palette: PaletteId;
  customColors: string[];
  font: FontFamilyId;
  rotation: RotationMode;
  background: string;
  isTransparentBg: boolean;
  scaleFactor: number;
  maxWords: number;
  textTransform: TextTransform;
  filterStopWords: boolean;
  padding: number;
  minFontSize: number;
  maxFontSize: number;
}

export interface PositionedWord {
  text: string;
  rawText: string;
  count: number;
  x: number;
  y: number;
  size: number;
  rotate: number; // degrees
color: string;
  width: number;
  height: number;
}

export interface SessionData {
  id: string;
  title: string;
  promptQuestion: string;
  words: Record<string, number>;
  createdAt: number;
  updatedAt: number;
  participantCount: number;
  recentLogs: Array<{ word: string; time: number; by?: string }>;
  logoUrl?: string;
}

export type ExportResolution = 'standard' | 'hd' | '4k' | 'print300';

export interface ExportOption {
  id: ExportResolution;
  label: string;
  width: number;
  height: number;
  description: string;
  dpi?: number;
}

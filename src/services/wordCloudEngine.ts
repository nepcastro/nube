import { CloudConfig, CloudShape, PositionedWord, RotationMode } from '../types';
import { FONTS, PALETTES, STOP_WORDS } from '../constants/palettes';

// Test if point (normalized to [-1, 1] relative to center) is inside the shape
export function isPointInsideShape(nx: number, ny: number, shape: CloudShape): boolean {
  switch (shape) {
    case 'circle':
      return nx * nx + ny * ny <= 0.85;

    case 'rectangle':
      return Math.abs(nx) <= 0.92 && Math.abs(ny) <= 0.88;

    case 'diamond':
      return Math.abs(nx) + Math.abs(ny) <= 1.05;

    case 'hexagon': {
      // Regular hexagon centered
      const q2x = Math.abs(nx);
      const q2y = Math.abs(ny);
      if (q2x > 0.95 || q2y > 0.85) return false;
      return 2 * 0.85 * 0.95 - 0.85 * q2x - Math.sqrt(3) * 0.95 * q2y >= 0;
    }

    case 'heart': {
      // Invert y because screen Y goes down
      const x = nx * 1.3;
      const y = -ny * 1.3 + 0.2;
      const x2 = x * x;
      const y2 = y * y;
      const a = x2 + y2 - 1;
      return a * a * a - x2 * y * y2 <= 0;
    }

    case 'star': {
      const angle = Math.atan2(ny, nx);
      const r = Math.sqrt(nx * nx + ny * ny);
      // 5-point star formula
      const n = 5;
      const angleStep = Math.PI / n;
      const a = (angle + Math.PI / 2) % (2 * angleStep);
      const positiveA = a < 0 ? a + 2 * angleStep : a;
      const rOuter = 0.95;
      const rInner = 0.42;
      const starR =
        (rInner * rOuter) /
        (rInner * Math.abs(Math.cos(positiveA)) +
          rOuter * Math.abs(Math.sin(positiveA)));
      return r <= starR;
    }

    case 'cloud': {
      // Multi-circle cloud outline
      // Base ellipses
      const inBase = (nx / 0.8) ** 2 + ((ny - 0.15) / 0.45) ** 2 <= 1;
      const inPuff1 = ((nx + 0.35) / 0.45) ** 2 + ((ny + 0.05) / 0.45) ** 2 <= 1;
      const inPuff2 = (nx / 0.5) ** 2 + ((ny + 0.25) / 0.5) ** 2 <= 1;
      const inPuff3 = ((nx - 0.38) / 0.42) ** 2 + ((ny + 0.05) / 0.42) ** 2 <= 1;
      return inBase || inPuff1 || inPuff2 || inPuff3;
    }

    case 'speech_bubble': {
      // Rounded main rect
      const inBody = Math.abs(nx) <= 0.85 && ny >= -0.75 && ny <= 0.55;
      // Tail at bottom left
      const inTail = nx >= -0.65 && nx <= -0.2 && ny > 0.5 && ny <= 0.9 && (nx + 0.65) > (ny - 0.5) * 0.9;
      return inBody || inTail;
    }

    case 'trophy': {
      // Cup bowl
      const inBowl = (nx / 0.6) ** 2 + ((ny + 0.25) / 0.45) ** 2 <= 1 && ny <= 0.1;
      // Stem
      const inStem = Math.abs(nx) <= 0.16 && ny > 0.1 && ny <= 0.55;
      // Base
      const inBase = Math.abs(nx) <= 0.55 && ny > 0.55 && ny <= 0.85;
      // Handles
      const inHandles = Math.abs(nx) <= 0.85 && Math.abs(nx) >= 0.55 && ny >= -0.4 && ny <= 0.0;
      return inBowl || inStem || inBase || inHandles;
    }

    case 'lightbulb': {
      // Upper bulb
      const inBulb = nx * nx + (ny + 0.2) ** 2 <= 0.45;
      // Neck
      const inNeck = Math.abs(nx) <= 0.35 - (ny + 0.1) * 0.15 && ny > 0.1 && ny <= 0.55;
      // Base screw
      const inScrew = Math.abs(nx) <= 0.28 && ny > 0.55 && ny <= 0.88;
      return inBulb || inNeck || inScrew;
    }

    default:
      return nx * nx + ny * ny <= 1;
  }
}

// Bounding box collision test for oriented rectangles
interface OrientedBox {
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  rotate: number; // degrees
}

function getBoxCorners(box: OrientedBox): Array<{ x: number; y: number }> {
  const rad = (box.rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = box.width / 2;
  const hh = box.height / 2;

  return [
    { x: box.x + (-hw * cos - -hh * sin), y: box.y + (-hw * sin + -hh * cos) },
    { x: box.x + (hw * cos - -hh * sin), y: box.y + (hw * sin + -hh * cos) },
    { x: box.x + (hw * cos - hh * sin), y: box.y + (hw * sin + hh * cos) },
    { x: box.x + (-hw * cos - hh * sin), y: box.y + (-hw * sin + hh * cos) },
  ];
}

// Separating Axis Theorem (SAT) for 2D rectangle intersection
function checkBoxesOverlap(a: OrientedBox, b: OrientedBox): boolean {
  // Quick circle rejection
  const maxR_A = Math.hypot(a.width, a.height) / 2;
  const maxR_B = Math.hypot(b.width, b.height) / 2;
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  if (dist > maxR_A + maxR_B) return false;

  const cornersA = getBoxCorners(a);
  const cornersB = getBoxCorners(b);

  const axes = [
    { x: Math.cos((a.rotate * Math.PI) / 180), y: Math.sin((a.rotate * Math.PI) / 180) },
    { x: -Math.sin((a.rotate * Math.PI) / 180), y: Math.cos((a.rotate * Math.PI) / 180) },
    { x: Math.cos((b.rotate * Math.PI) / 180), y: Math.sin((b.rotate * Math.PI) / 180) },
    { x: -Math.sin((b.rotate * Math.PI) / 180), y: Math.cos((b.rotate * Math.PI) / 180) },
  ];

  for (const axis of axes) {
    let minA = Infinity;
    let maxA = -Infinity;
    for (const p of cornersA) {
      const proj = p.x * axis.x + p.y * axis.y;
      if (proj < minA) minA = proj;
      if (proj > maxA) maxA = proj;
    }

    let minB = Infinity;
    let maxB = -Infinity;
    for (const p of cornersB) {
      const proj = p.x * axis.x + p.y * axis.y;
      if (proj < minB) minB = proj;
      if (proj > maxB) maxB = proj;
    }

    if (maxA < minB || maxB < minA) {
      return false; // Found separating axis
    }
  }

  return true;
}

function getWordAngle(rotationMode: RotationMode, index: number): number {
  switch (rotationMode) {
    case 'horizontal':
      return 0;
    case 'mixed90':
      return index % 3 === 1 ? 90 : 0;
    case 'diagonal45': {
      const choices = [0, 45, -45, 90, 0];
      return choices[index % choices.length];
    }
    case 'free': {
      const choices = [0, 30, -30, 45, -45, 90, 0, -15, 15];
      return choices[index % choices.length];
    }
  }
}

export function computeWordCloud(
  rawWords: Record<string, number>,
  config: CloudConfig,
  width: number,
  height: number
): PositionedWord[] {
  if (!rawWords || Object.keys(rawWords).length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  // Filter & process list
  const entries: Array<{ text: string; count: number }> = [];

  for (const [key, val] of Object.entries(rawWords)) {
    if (!key || typeof val !== 'number' || val <= 0) continue;
    const trimmed = key.trim();
    if (!trimmed) continue;

    if (config.filterStopWords && STOP_WORDS.has(trimmed.toLowerCase())) {
      continue;
    }

    let formatted = trimmed;
    if (config.textTransform === 'uppercase') formatted = trimmed.toUpperCase();
    else if (config.textTransform === 'lowercase') formatted = trimmed.toLowerCase();
    else if (config.textTransform === 'capitalize') {
      formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    }

    entries.push({ text: formatted, count: val });
  }

  // Sort descending by count
  entries.sort((a, b) => b.count - a.count);
  const wordsToLayout = entries.slice(0, config.maxWords);

  if (wordsToLayout.length === 0) return [];

  const minCount = wordsToLayout[wordsToLayout.length - 1].count;
  const maxCount = wordsToLayout[0].count;

  // Measure text with a mock canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const fontDef = FONTS.find((f) => f.id === config.font) || FONTS[0];
  const paletteDef = PALETTES.find((p) => p.id === config.palette) || PALETTES[0];
  const colors = config.palette === 'custom' && config.customColors.length > 0
    ? config.customColors
    : paletteDef.colors;

  const placedBoxes: OrientedBox[] = [];
  const result: PositionedWord[] = [];

  const centerX = width / 2;
  const centerY = height / 2;

  // Elliptical boundaries allowing words to occupy the full canvas space
  const boundRadiusX = Math.max(100, (width / 2) * 0.90);
  const boundRadiusY = Math.max(100, (height / 2) * 0.90);
  const maxSearchRadius = Math.hypot(boundRadiusX, boundRadiusY) * 1.08;

  // Margin to ensure no word ever clips outside the SVG boundaries
  const edgeMargin = 18;

  // Identify longest word length to prevent extreme font size overflow
  const longestWordLen = Math.max(4, ...wordsToLayout.map((w) => w.text.length));

  wordsToLayout.forEach((item, idx) => {
    // Dynamic size scaling based on container dimensions
    const containerFactor = Math.min(width, height) / 760;
    const baseMin = (config.minFontSize || 14) * config.scaleFactor * Math.max(0.65, containerFactor);
    const baseMax = (config.maxFontSize || 72) * config.scaleFactor * Math.max(0.65, containerFactor);

    // Limit maximum font size so long words fit comfortably inside bounds
    const safeMax = Math.min(
      baseMax,
      Math.max(26, (Math.min(width, height) * 0.72) / (longestWordLen * 0.62 + 1))
    );

    const countRatio = maxCount === minCount
      ? 0.5
      : Math.sqrt((item.count - minCount) / (maxCount - minCount));

    const initialFontSize = Math.max(12, Math.round(baseMin + countRatio * (safeMax - baseMin)));
    const initialAngle = getWordAngle(config.rotation, idx);

    // Multi-pass placement variants: if initial size doesn't fit, scale down gracefully
    const placementAttempts = [
      { size: initialFontSize, angle: initialAngle },
      { size: Math.max(12, Math.round(initialFontSize * 0.82)), angle: initialAngle },
      { size: Math.max(11, Math.round(initialFontSize * 0.68)), angle: 0 },
      { size: Math.max(10, Math.round(initialFontSize * 0.52)), angle: 0 },
    ];

    let placed = false;

    for (const attempt of placementAttempts) {
      const { size: currentSize, angle: currentAngle } = attempt;

      ctx.font = `bold ${currentSize}px ${fontDef.cssFamily}`;
      const metrics = ctx.measureText(item.text);
      const textWidth = Math.max(10, metrics.width);
      const textHeight = currentSize * 0.9;

      const paddedWidth = textWidth + config.padding * 2;
      const paddedHeight = textHeight + config.padding * 2;

      // Spiral search parameters
      const spiralStep = 3.2;
      const angleStep = 0.24;
      const maxTheta = 180; // Comprehensive spiral search

      const aspectScaleX = Math.max(0.75, Math.min(1.4, Math.sqrt(width / height)));
      const aspectScaleY = Math.max(0.75, Math.min(1.4, Math.sqrt(height / width)));

      for (let theta = 0; theta < maxTheta; theta += angleStep) {
        const r = spiralStep * theta;
        if (r > maxSearchRadius) break;

        const x = centerX + r * Math.cos(theta) * aspectScaleX;
        const y = centerY + r * Math.sin(theta) * aspectScaleY;

        // Check boundary within shape (normalized elliptically to canvas)
        const nx = (x - centerX) / boundRadiusX;
        const ny = (y - centerY) / boundRadiusY;

        if (!isPointInsideShape(nx, ny, config.shape)) {
          continue;
        }

        const candidateBox: OrientedBox = {
          x,
          y,
          width: paddedWidth,
          height: paddedHeight,
          rotate: currentAngle,
        };

        // MATHEMATICALLY EXACT CHECK: test all 4 rotated corners against canvas edges
        const corners = getBoxCorners(candidateBox);
        const isOutOfBounds = corners.some(
          (c) =>
            c.x < edgeMargin ||
            c.x > width - edgeMargin ||
            c.y < edgeMargin ||
            c.y > height - edgeMargin
        );

        if (isOutOfBounds) {
          continue;
        }

        // Check collision with already placed words using SAT
        let hasCollision = false;
        for (const placedBox of placedBoxes) {
          if (checkBoxesOverlap(candidateBox, placedBox)) {
            hasCollision = true;
            break;
          }
        }

        if (!hasCollision) {
          placedBoxes.push(candidateBox);
          const color = colors[idx % colors.length];

          result.push({
            text: item.text,
            rawText: item.text,
            count: item.count,
            x,
            y,
            size: currentSize,
            rotate: currentAngle,
            color,
            width: textWidth,
            height: textHeight,
          });

          placed = true;
          break;
        }
      }

      if (placed) break;
    }
  });

  return result;
}

// Render word cloud onto an HTML5 canvas with ultra-crisp resolution
export function renderWordCloudToCanvas(
  canvas: HTMLCanvasElement,
  words: PositionedWord[],
  config: CloudConfig,
  renderWidth: number,
  renderHeight: number,
  wordsYOffset: number = 0
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = renderWidth;
  canvas.height = renderHeight;

  // Background
  if (!config.isTransparentBg && config.background) {
    ctx.fillStyle = config.background;
    ctx.fillRect(0, 0, renderWidth, renderHeight);
  } else {
    ctx.clearRect(0, 0, renderWidth, renderHeight);
  }

  const fontDef = FONTS.find((f) => f.id === config.font) || FONTS[0];

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const word of words) {
    ctx.save();
    ctx.translate(word.x, word.y + wordsYOffset);
    if (word.rotate !== 0) {
      ctx.rotate((word.rotate * Math.PI) / 180);
    }

    ctx.font = `bold ${word.size}px ${fontDef.cssFamily}`;

    // Soft glow / shadow for premium depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = Math.min(8, word.size * 0.12);
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = word.color;
    ctx.fillText(word.text, 0, 0);

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Export branding header: draws the session question + Gen/client logos atop
// exported files, so a downloaded PNG/SVG is self-explanatory on its own.
// ---------------------------------------------------------------------------

export interface ExportHeaderSource {
  title: string;
  promptQuestion?: string;
  genLogoUrl: string;
  clientLogoUrl?: string;
}

export interface ResolvedExportHeader {
  title: string;
  promptQuestion?: string;
  genLogoDataUri: string;
  clientLogoDataUri?: string;
}

// Reserve a header band proportional to canvas height, with sane min/max.
export function computeExportHeaderHeight(canvasHeight: number): number {
  return Math.max(90, Math.min(200, Math.round(canvasHeight * 0.13)));
}

// Fetches any same-origin (or data:) image URL and inlines it as a data URI,
// so exported files stay self-contained and portable.
async function urlToDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('No se pudo leer la imagen'));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function loadImageElement(dataUri: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = dataUri;
  });
}

// Resolves logos to inline data URIs ahead of rendering. Returns null only
// if the Gen logo (always present) can't be loaded — in that case callers
// should fall back to exporting without a header rather than failing.
export async function resolveExportHeader(source: ExportHeaderSource): Promise<ResolvedExportHeader | null> {
  const genLogoDataUri = await urlToDataUri(source.genLogoUrl);
  if (!genLogoDataUri) return null;

  const clientLogoDataUri = source.clientLogoUrl
    ? (await urlToDataUri(source.clientLogoUrl)) || undefined
    : undefined;

  return {
    title: source.title,
    promptQuestion: source.promptQuestion?.trim() || undefined,
    genLogoDataUri,
    clientLogoDataUri,
  };
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

// Draws the branding header (logos + question) onto an already-sized canvas.
export async function drawExportHeaderOnCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  headerHeight: number,
  header: ResolvedExportHeader
): Promise<void> {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(width, headerHeight);
  ctx.stroke();
  ctx.restore();

  const padding = headerHeight * 0.18;
  const logoSize = headerHeight - padding * 2;

  const [genImg, clientImg] = await Promise.all([
    loadImageElement(header.genLogoDataUri),
    header.clientLogoDataUri ? loadImageElement(header.clientLogoDataUri) : Promise.resolve(null),
  ]);

  let cursorX = padding;

  const drawLogoBox = (img: HTMLImageElement | null) => {
    if (!img) return;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, cursorX, padding, logoSize, logoSize, logoSize * 0.18);
    ctx.fill();

    const innerPad = logoSize * 0.14;
    const boxSize = logoSize - innerPad * 2;
    const naturalW = img.naturalWidth || boxSize;
    const naturalH = img.naturalHeight || boxSize;
    const scale = Math.min(boxSize / naturalW, boxSize / naturalH);
    const drawW = naturalW * scale;
    const drawH = naturalH * scale;
    const dx = cursorX + (logoSize - drawW) / 2;
    const dy = padding + (logoSize - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();
    cursorX += logoSize + padding * 0.6;
  };

  drawLogoBox(genImg);
  if (clientImg) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `${Math.round(logoSize * 0.4)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×', cursorX + logoSize * 0.22, padding + logoSize / 2);
    ctx.restore();
    cursorX += logoSize * 0.44;
    drawLogoBox(clientImg);
  }

  const textX = cursorX + padding * 0.5;
  const textMaxWidth = Math.max(40, width - textX - padding);

  ctx.save();
  ctx.textAlign = 'left';

  if (header.promptQuestion) {
    const smallSize = Math.max(11, Math.round(headerHeight * 0.13));
    const titleSize = Math.max(15, Math.round(headerHeight * 0.23));

    ctx.font = `700 ${smallSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(
      truncateToWidth(ctx, header.title.toUpperCase(), textMaxWidth),
      textX,
      padding + logoSize * 0.34
    );

    ctx.font = `800 ${titleSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
      truncateToWidth(ctx, header.promptQuestion, textMaxWidth),
      textX,
      padding + logoSize * 0.72
    );
  } else {
    const titleSize = Math.max(15, Math.round(headerHeight * 0.25));
    ctx.font = `800 ${titleSize}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(truncateToWidth(ctx, header.title, textMaxWidth), textX, padding + logoSize / 2);
  }

  ctx.restore();
}

// Builds the SVG markup for the same branding header, using inline data URIs
// so the exported .svg file stays self-contained.
function buildSvgHeaderMarkup(
  width: number,
  headerHeight: number,
  header: ResolvedExportHeader,
  genSize: { w: number; h: number },
  clientSize: { w: number; h: number } | null
): string {
  const padding = headerHeight * 0.18;
  const logoSize = headerHeight - padding * 2;
  const parts: string[] = [
    `<line x1="0" y1="${headerHeight}" x2="${width}" y2="${headerHeight}" stroke="rgba(255,255,255,0.10)" stroke-width="1" />`,
  ];

  let cursorX = padding;
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const addLogo = (dataUri: string, natural: { w: number; h: number }) => {
    parts.push(
      `<rect x="${cursorX}" y="${padding}" width="${logoSize}" height="${logoSize}" rx="${logoSize * 0.18}" fill="#ffffff" />`
    );
    const innerPad = logoSize * 0.14;
    const boxSize = logoSize - innerPad * 2;
    const scale = Math.min(boxSize / natural.w, boxSize / natural.h);
    const drawW = natural.w * scale;
    const drawH = natural.h * scale;
    const dx = cursorX + (logoSize - drawW) / 2;
    const dy = padding + (logoSize - drawH) / 2;
    parts.push(
      `<image href="${dataUri}" x="${dx}" y="${dy}" width="${drawW}" height="${drawH}" preserveAspectRatio="xMidYMid meet" />`
    );
    cursorX += logoSize + padding * 0.6;
  };

  addLogo(header.genLogoDataUri, genSize);
  if (header.clientLogoDataUri && clientSize) {
    parts.push(
      `<text x="${cursorX + logoSize * 0.22}" y="${padding + logoSize / 2}" font-size="${Math.round(
        logoSize * 0.4
      )}" fill="rgba(255,255,255,0.4)" text-anchor="middle" dominant-baseline="middle">×</text>`
    );
    cursorX += logoSize * 0.44;
    addLogo(header.clientLogoDataUri, clientSize);
  }

  const textX = cursorX + padding * 0.5;
  const textMaxWidth = Math.max(40, width - textX - padding);
  const approxCharWidth = (fontSize: number) => fontSize * 0.56;
  const truncate = (text: string, fontSize: number) => {
    const maxChars = Math.max(4, Math.floor(textMaxWidth / approxCharWidth(fontSize)));
    return text.length > maxChars ? `${text.slice(0, maxChars - 1)}…` : text;
  };

  if (header.promptQuestion) {
    const smallSize = Math.max(11, Math.round(headerHeight * 0.13));
    const titleSize = Math.max(15, Math.round(headerHeight * 0.23));
    parts.push(
      `<text x="${textX}" y="${padding + logoSize * 0.34}" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="${smallSize}px" fill="rgba(255,255,255,0.6)" letter-spacing="1">${escape(
        truncate(header.title.toUpperCase(), smallSize)
      )}</text>`
    );
    parts.push(
      `<text x="${textX}" y="${padding + logoSize * 0.72}" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${titleSize}px" fill="#ffffff">${escape(
        truncate(header.promptQuestion, titleSize)
      )}</text>`
    );
  } else {
    const titleSize = Math.max(15, Math.round(headerHeight * 0.25));
    parts.push(
      `<text x="${textX}" y="${padding + logoSize / 2}" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="${titleSize}px" fill="#ffffff" dominant-baseline="middle">${escape(
        truncate(header.title, titleSize)
      )}</text>`
    );
  }

  return parts.join('\n  ');
}

// Generate vector SVG string for lossless high-resolution export & print.
// wordsYOffset shifts the word group down to make room for an optional
// branding header (see resolveExportHeader / buildSvgHeaderMarkup above).
export async function generateSvgString(
  words: PositionedWord[],
  config: CloudConfig,
  width: number,
  height: number,
  header?: ResolvedExportHeader | null,
  wordsYOffset: number = 0
): Promise<string> {
  const fontDef = FONTS.find((f) => f.id === config.font) || FONTS[0];
  const bgRect = !config.isTransparentBg && config.background
    ? `<rect width="${width}" height="${height}" fill="${config.background}" />`
    : '';

  const textElements = words
    .map((word) => {
      const transform =
        word.rotate !== 0
          ? `transform="translate(${word.x}, ${word.y + wordsYOffset}) rotate(${word.rotate})"`
          : `transform="translate(${word.x}, ${word.y + wordsYOffset})"`;

      // Escape XML characters
      const escapedText = word.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      return `  <text ${transform} text-anchor="middle" dominant-baseline="central" font-family="${fontDef.cssFamily.replace(/"/g, "'")}" font-size="${word.size}px" font-weight="bold" fill="${word.color}">
    <title>${escapedText}: ${word.count}</title>
    ${escapedText}
  </text>`;
    })
    .join('\n');

  let headerMarkup = '';
  if (header) {
    const headerHeight = wordsYOffset;
    const [genSize, clientSize] = await Promise.all([
      getDataUriSize(header.genLogoDataUri),
      header.clientLogoDataUri ? getDataUriSize(header.clientLogoDataUri) : Promise.resolve(null),
    ]);
    if (genSize) {
      headerMarkup = `<g id="export-header-group">\n  ${buildSvgHeaderMarkup(
        width,
        headerHeight,
        header,
        genSize,
        clientSize
      )}\n  </g>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&amp;family=Fredoka:wght@600;700&amp;family=Inter:wght@600;700;800&amp;family=Montserrat:wght@700;800;900&amp;family=Pacifico&amp;family=Playfair+Display:ital,wght@0,700&amp;family=Space+Mono:wght@700&amp;display=swap');
    text { user-select: none; }
  </style>
  ${bgRect}
  ${headerMarkup}
  <g id="word-cloud-group">
${textElements}
  </g>
</svg>`;
}

function getDataUriSize(dataUri: string): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
    img.onerror = () => resolve(null);
    img.src = dataUri;
  });
}

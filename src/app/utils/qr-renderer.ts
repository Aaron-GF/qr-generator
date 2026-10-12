import * as QRCode from 'qrcode';
import { QrDesign } from '../services/qr.service';

/**
 * Determina si una coordenada (r, c) pertenece a uno de los tres patrones de posición (finder patterns)
 */
function isFinderPattern(row: number, col: number, matrixSize: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= matrixSize - 7) return true;
  // Bottom-left
  if (row >= matrixSize - 7 && col < 7) return true;
  return false;
}

/**
 * Dibuja un finder pattern estilizado y 100% escaneable
 */
function drawFinderPattern(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  colorDark: string,
  colorLight: string,
  pixelShape: 'squares' | 'rounded' | 'dots'
) {
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;
  const size = cellSize * 7;
  const radius = pixelShape === 'dots' || pixelShape === 'rounded' ? cellSize * 1.5 : 0;
  const innerRadius = pixelShape === 'dots' || pixelShape === 'rounded' ? cellSize * 0.8 : 0;

  // Cuadro exterior (7x7)
  ctx.fillStyle = colorDark;
  ctx.beginPath();
  if (radius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, size, size, radius);
  } else {
    ctx.rect(x, y, size, size);
  }
  ctx.fill();

  // Marco interior claro (5x5)
  ctx.fillStyle = colorLight;
  ctx.beginPath();
  const innerOffset = cellSize;
  const innerSize = cellSize * 5;
  if (radius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x + innerOffset, y + innerOffset, innerSize, innerSize, radius * 0.7);
  } else {
    ctx.rect(x + innerOffset, y + innerOffset, innerSize, innerSize);
  }
  ctx.fill();

  // Núcleo central oscuro (3x3)
  ctx.fillStyle = colorDark;
  ctx.beginPath();
  const coreOffset = cellSize * 2;
  const coreSize = cellSize * 3;
  if (innerRadius > 0 && typeof ctx.roundRect === 'function') {
    ctx.roundRect(x + coreOffset, y + coreOffset, coreSize, coreSize, innerRadius);
  } else {
    ctx.rect(x + coreOffset, y + coreOffset, coreSize, coreSize);
  }
  ctx.fill();
}

/**
 * Renderiza el código QR en un elemento canvas con soporte de formas, colores, logo y nitidez Retina
 */
export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  text: string,
  design: QrDesign,
  displaySize: number = 256,
  renderScale: number = 2 // Factor de escala para nitidez Retina / exportación
): Promise<void> {
  const safeText = text.trim() || 'https://qrakin.dev';
  const qr = QRCode.create(safeText, {
    errorCorrectionLevel: design.logo ? 'H' : 'M',
  });

  const modules = qr.modules;
  const matrixSize = modules.size;
  const margin = Math.max(0, design.margin);
  const totalModules = matrixSize + margin * 2;

  const actualSize = displaySize * renderScale;
  canvas.width = actualSize;
  canvas.height = actualSize;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Fondo
  ctx.fillStyle = design.colorLight;
  ctx.fillRect(0, 0, actualSize, actualSize);

  const cellSize = actualSize / totalModules;
  const offsetX = margin * cellSize;
  const offsetY = margin * cellSize;

  // Dibujar patrones de posicionamiento
  drawFinderPattern(ctx, 0, 0, cellSize, offsetX, offsetY, design.colorDark, design.colorLight, design.pixelShape);
  drawFinderPattern(ctx, 0, matrixSize - 7, cellSize, offsetX, offsetY, design.colorDark, design.colorLight, design.pixelShape);
  drawFinderPattern(ctx, matrixSize - 7, 0, cellSize, offsetX, offsetY, design.colorDark, design.colorLight, design.pixelShape);

  // Dibujar módulos de datos
  ctx.fillStyle = design.colorDark;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      // Ignorar las áreas de finder patterns ya dibujadas
      if (isFinderPattern(r, c, matrixSize)) continue;

      const isDark = modules.get(r, c);
      if (!isDark) continue;

      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      if (design.pixelShape === 'dots') {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const radius = cellSize * 0.44;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (design.pixelShape === 'rounded') {
        const rad = cellSize * 0.35;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(x, y, cellSize, cellSize, rad);
        } else {
          ctx.rect(x, y, cellSize, cellSize);
        }
        ctx.fill();
      } else {
        // Cuadrados clásicos
        ctx.fillRect(x, y, cellSize + 0.1, cellSize + 0.1);
      }
    }
  }

  // Dibujar logo central si existe
  if (design.logo) {
    try {
      const img = await loadImage(design.logo);
      const logoBoxSize = actualSize * 0.24;
      const logoCenter = actualSize / 2;
      const logoBoxX = logoCenter - logoBoxSize / 2;
      const logoBoxY = logoCenter - logoBoxSize / 2;

      // Base contenedor con fondo y borde sutil
      ctx.save();
      ctx.fillStyle = design.colorLight;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 12 * renderScale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4 * renderScale;

      const boxRadius = logoBoxSize * 0.24;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, boxRadius);
      } else {
        ctx.rect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize);
      }
      ctx.fill();
      ctx.restore();

      // Borde suave en el contenedor del logo
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1.5 * renderScale;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize, boxRadius);
      } else {
        ctx.rect(logoBoxX, logoBoxY, logoBoxSize, logoBoxSize);
      }
      ctx.stroke();

      // Dibujar imagen centrada con padding
      const padding = logoBoxSize * 0.15;
      const imgW = logoBoxSize - padding * 2;
      const imgH = logoBoxSize - padding * 2;
      const imgX = logoBoxX + padding;
      const imgY = logoBoxY + padding;

      // Mantener proporción de la imagen
      const aspect = img.width / img.height;
      let drawW = imgW;
      let drawH = imgH;
      let drawX = imgX;
      let drawY = imgY;

      if (aspect > 1) {
        drawH = imgW / aspect;
        drawY = imgY + (imgH - drawH) / 2;
      } else {
        drawW = imgH * aspect;
        drawX = imgX + (imgW - drawW) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    } catch (e) {
      console.warn('Error al renderizar el logo en el QR', e);
    }
  }
}

/**
 * Genera código SVG vectorial para exportación
 */
export async function generateQrSvg(
  text: string,
  design: QrDesign,
  size: number = 512
): Promise<string> {
  const safeText = text.trim() || 'https://qrakin.dev';
  const qr = QRCode.create(safeText, {
    errorCorrectionLevel: design.logo ? 'H' : 'M',
  });

  const modules = qr.modules;
  const matrixSize = modules.size;
  const margin = Math.max(0, design.margin);
  const totalModules = matrixSize + margin * 2;
  const cellSize = size / totalModules;
  const offsetX = margin * cellSize;
  const offsetY = margin * cellSize;

  let elements = '';

  // Fondo
  elements += `<rect width="${size}" height="${size}" fill="${design.colorLight}" />\n`;

  // Finder patterns SVG
  const appendFinderPatternSvg = (row: number, col: number) => {
    const x = offsetX + col * cellSize;
    const y = offsetY + row * cellSize;
    const s = cellSize * 7;
    const r = design.pixelShape === 'dots' || design.pixelShape === 'rounded' ? cellSize * 1.5 : 0;
    const innerR = design.pixelShape === 'dots' || design.pixelShape === 'rounded' ? cellSize * 0.8 : 0;

    // Marco exterior
    elements += `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${design.colorDark}" />\n`;
    // Hueco claro
    elements += `<rect x="${x + cellSize}" y="${y + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" rx="${r * 0.7}" fill="${design.colorLight}" />\n`;
    // Núcleo
    elements += `<rect x="${x + cellSize * 2}" y="${y + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" rx="${innerR}" fill="${design.colorDark}" />\n`;
  };

  appendFinderPatternSvg(0, 0);
  appendFinderPatternSvg(0, matrixSize - 7);
  appendFinderPatternSvg(matrixSize - 7, 0);

  // Módulos de datos
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (!modules.get(r, c)) continue;

      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      if (design.pixelShape === 'dots') {
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        const radius = cellSize * 0.44;
        elements += `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="${design.colorDark}" />\n`;
      } else if (design.pixelShape === 'rounded') {
        const rad = cellSize * 0.35;
        elements += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${rad}" fill="${design.colorDark}" />\n`;
      } else {
        elements += `<rect x="${x}" y="${y}" width="${cellSize + 0.1}" height="${cellSize + 0.1}" fill="${design.colorDark}" />\n`;
      }
    }
  }

  // Logo central en SVG
  if (design.logo) {
    const logoBoxSize = size * 0.24;
    const logoCenter = size / 2;
    const logoBoxX = logoCenter - logoBoxSize / 2;
    const logoBoxY = logoCenter - logoBoxSize / 2;
    const boxRadius = logoBoxSize * 0.24;

    elements += `<rect x="${logoBoxX}" y="${logoBoxY}" width="${logoBoxSize}" height="${logoBoxSize}" rx="${boxRadius}" fill="${design.colorLight}" stroke="rgba(0,0,0,0.1)" stroke-width="2" />\n`;

    const padding = logoBoxSize * 0.15;
    const imgSize = logoBoxSize - padding * 2;
    const imgX = logoBoxX + padding;
    const imgY = logoBoxY + padding;

    elements += `<image href="${design.logo}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" preserveAspectRatio="xMidYMid meet" />\n`;
  }

  return `<?xml version="1.0" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
${elements}
</svg>`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

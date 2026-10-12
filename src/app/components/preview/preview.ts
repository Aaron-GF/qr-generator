import {
  Component,
  ElementRef,
  ViewChild,
  inject,
  effect,
  AfterViewInit,
} from '@angular/core';
import { QrService } from '../../services/qr.service';
import { renderQrToCanvas, generateQrSvg } from '../../utils/qr-renderer';

@Component({
  selector: 'app-preview',
  standalone: true,
  imports: [],
  templateUrl: './preview.html',
})
export class Preview implements AfterViewInit {
  @ViewChild('qrCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  qrService = inject(QrService);
  isRendering = false;
  isCopied = false;

  constructor() {
    // Escucha cambios en contenido o diseño para redibujar
    effect(() => {
      // Registrar dependencias reactivas
      this.qrService.qrContent();
      this.qrService.design();

      if (this.canvasRef?.nativeElement) {
        this.renderQr();
      }
    });
  }

  ngAfterViewInit() {
    this.renderQr();
  }

  async renderQr() {
    if (!this.canvasRef?.nativeElement) return;
    this.isRendering = true;
    try {
      await renderQrToCanvas(
        this.canvasRef.nativeElement,
        this.qrService.qrContent(),
        this.qrService.design(),
        256,
        2 // Escala 2x para retina display
      );
    } catch (e) {
      console.error('Error al renderizar código QR:', e);
    } finally {
      this.isRendering = false;
    }
  }

  // Descarga como archivo PNG de alta resolución (1024x1024)
  async downloadPng() {
    try {
      const exportCanvas = document.createElement('canvas');
      await renderQrToCanvas(
        exportCanvas,
        this.qrService.qrContent(),
        this.qrService.design(),
        1024,
        1
      );

      const dataUrl = exportCanvas.toDataURL('image/png');
      const filename = this.generateFilename('png');
      this.triggerDownload(dataUrl, filename);
      this.qrService.showToast('¡Código QR descargado en PNG alta calidad!', 'success');
    } catch (e) {
      console.error('Error al descargar PNG:', e);
      this.qrService.showToast('Error al generar la descarga PNG', 'error');
    }
  }

  // Descarga como archivo vectorial SVG
  async downloadSvg() {
    try {
      const svgString = await generateQrSvg(
        this.qrService.qrContent(),
        this.qrService.design(),
        512
      );

      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const filename = this.generateFilename('svg');
      this.triggerDownload(url, filename);
      URL.revokeObjectURL(url);
      this.qrService.showToast('¡Código QR vectorial SVG descargado!', 'success');
    } catch (e) {
      console.error('Error al descargar SVG:', e);
      this.qrService.showToast('Error al generar la descarga SVG', 'error');
    }
  }

  // Copia la imagen al portapapeles
  async copyToClipboard() {
    if (!this.canvasRef?.nativeElement) return;
    try {
      const canvas = this.canvasRef.nativeElement;
      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        canvas.toBlob(async (blob) => {
          if (!blob) {
            this.fallbackCopyText();
            return;
          }
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            this.isCopied = true;
            setTimeout(() => (this.isCopied = false), 2000);
            this.qrService.showToast('¡Imagen QR copiada al portapapeles!', 'success');
          } catch {
            this.fallbackCopyText();
          }
        }, 'image/png');
      } else {
        this.fallbackCopyText();
      }
    } catch {
      this.fallbackCopyText();
    }
  }

  private async fallbackCopyText() {
    try {
      await navigator.clipboard.writeText(this.qrService.qrContent());
      this.isCopied = true;
      setTimeout(() => (this.isCopied = false), 2000);
      this.qrService.showToast('Contenido copiado como texto al portapapeles', 'info');
    } catch {
      this.qrService.showToast('No se pudo acceder al portapapeles', 'error');
    }
  }

  // Compartir rápido (Web Share API)
  async quickShare() {
    const title = `QR ${this.qrService.qrTitle()}`;
    const content = this.qrService.qrContent();

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Escanea este código QR (${title})`,
          url: content.startsWith('http') ? content : undefined,
        });
        this.qrService.showToast('Compartido con éxito', 'success');
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return; // Cancelado por el usuario
      }
    }

    // Fallback si no está soportado
    await this.copyToClipboard();
  }

  saveToHistory() {
    this.qrService.saveToHistory();
  }

  private generateFilename(extension: string): string {
    const raw = this.qrService.qrTitle().toLowerCase();
    const clean = raw.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `qrakin-${clean || 'qr'}.${extension}`;
  }

  private triggerDownload(url: string, filename: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

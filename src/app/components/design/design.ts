import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QrService, PixelShape } from '../../services/qr.service';

@Component({
  selector: 'app-design',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './design.html',
})
export class Design {
  qrService = inject(QrService);

  get design() {
    return this.qrService.design();
  }

  setPixelShape(shape: PixelShape) {
    this.qrService.updateDesign({ pixelShape: shape });
  }

  setColorDark(color: string) {
    this.qrService.updateDesign({ colorDark: color });
  }

  setColorLight(color: string) {
    this.qrService.updateDesign({ colorLight: color });
  }

  setMargin(event: Event) {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.qrService.updateDesign({ margin: isNaN(value) ? 2 : value });
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  private handleFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.qrService.showToast('Por favor sube un archivo de imagen (PNG, JPG, SVG, WebP)', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.qrService.showToast('La imagen supera el límite de 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.qrService.setLogo(dataUrl);
      this.qrService.showToast('Logo añadido con éxito', 'success');
    };
    reader.onerror = () => {
      this.qrService.showToast('Error al leer la imagen', 'error');
    };
    reader.readAsDataURL(file);
  }

  removeLogo(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.qrService.setLogo(null);
    this.qrService.showToast('Logo eliminado', 'info');
  }

  applyPreset(dark: string, light: string) {
    this.qrService.updateDesign({ colorDark: dark, colorLight: light });
  }
}

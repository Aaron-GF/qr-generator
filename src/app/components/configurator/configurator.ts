import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { QrService, QrType, WifiData, ContactData, EmailData } from '../../services/qr.service';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configurator.html',
})
export class Configurator {
  qrService = inject(QrService);

  get config() {
    return this.qrService.config();
  }

  setQrType(type: QrType) {
    this.qrService.setQrType(type);
  }

  updateUrl(urlData: string) {
    this.qrService.updateConfig({ urlData });
  }

  updateText(textData: string) {
    this.qrService.updateConfig({ textData });
  }

  updateWifi<K extends keyof WifiData>(field: K, value: WifiData[K]) {
    const wifiData = { ...this.qrService.config().wifiData, [field]: value };
    this.qrService.updateConfig({ wifiData });
  }

  updateContact<K extends keyof ContactData>(field: K, value: ContactData[K]) {
    const contactData = { ...this.qrService.config().contactData, [field]: value };
    this.qrService.updateConfig({ contactData });
  }

  updateEmail<K extends keyof EmailData>(field: K, value: EmailData[K]) {
    const emailData = { ...this.qrService.config().emailData, [field]: value };
    this.qrService.updateConfig({ emailData });
  }
}

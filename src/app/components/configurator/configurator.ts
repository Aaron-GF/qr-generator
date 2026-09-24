import { Component, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export type QrType = 'url' | 'text' | 'wifi' | 'contact' | 'email';

@Component({
  selector: 'app-configurator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './configurator.html',
})
export class Configurator {
  qrType = signal<QrType>('url');
  
  // Modelos de datos
  urlData = '';
  textData = '';
  wifiData = { ssid: '', password: '', encryption: 'WPA', hidden: false };
  contactData = { firstName: '', lastName: '', phone: '', email: '', company: '' };
  emailData = { address: '', subject: '', body: '' };

  // Evento que emitirá el texto final estructurado para generar el QR
  qrContentChange = output<string>();

  setQrType(type: QrType) {
    this.qrType.set(type);
    this.generateQrContent();
  }

  generateQrContent() {
    let content = '';
    const type = this.qrType();
    
    if (type === 'url') {
      content = this.urlData;
    } else if (type === 'text') {
      content = this.textData;
    } else if (type === 'wifi') {
      const { ssid, password, encryption, hidden } = this.wifiData;
      content = `WIFI:T:${encryption};S:${ssid};P:${password};H:${hidden ? 'true' : 'false'};;`;
    } else if (type === 'contact') {
      const { firstName, lastName, phone, email, company } = this.contactData;
      content = `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${firstName} ${lastName}\nORG:${company}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
    } else if (type === 'email') {
      const { address, subject, body } = this.emailData;
      content = `MATMSG:TO:${address};SUB:${subject};BODY:${body};;`;
    }

    this.qrContentChange.emit(content);
  }
}

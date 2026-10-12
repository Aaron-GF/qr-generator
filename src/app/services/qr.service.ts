import { Injectable, signal, computed, effect } from '@angular/core';
import * as QRCode from 'qrcode';

export type QrType = 'url' | 'text' | 'wifi' | 'contact' | 'email';
export type PixelShape = 'squares' | 'rounded' | 'dots';

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
}

export interface EmailData {
  address: string;
  subject: string;
  body: string;
}

export interface QrConfig {
  type: QrType;
  urlData: string;
  textData: string;
  wifiData: WifiData;
  contactData: ContactData;
  emailData: EmailData;
}

export interface QrDesign {
  colorDark: string;
  colorLight: string;
  pixelShape: PixelShape;
  margin: number;
  logo: string | null;
}

export interface QrHistoryItem {
  id: string;
  title: string;
  type: QrType;
  content: string;
  config: QrConfig;
  design: QrDesign;
  createdAt: number;
  favorite: boolean;
}

export interface ToastMessage {
  message: string;
  type: 'success' | 'info' | 'error';
}

const STORAGE_KEY_HISTORY = 'qrakin_history_v1';
const STORAGE_KEY_DESIGN = 'qrakin_design_v1';

@Injectable({
  providedIn: 'root',
})
export class QrService {
  readonly config = signal<QrConfig>({
    type: 'url',
    urlData: 'https://github.com',
    textData: '',
    wifiData: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    contactData: { firstName: '', lastName: '', phone: '', email: '', company: '' },
    emailData: { address: '', subject: '', body: '' },
  });

  readonly design = signal<QrDesign>(this.loadSavedDesign());

  readonly history = signal<QrHistoryItem[]>(this.loadSavedHistory());

  readonly toast = signal<ToastMessage | null>(null);

  private toastTimeout: any = null;

  constructor() {
    // Sincronizar historial con localStorage
    effect(() => {
      const items = this.history();
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(items));
      } catch (e) {
        console.warn('No se pudo guardar el historial en localStorage', e);
      }
    });

    // Sincronizar diseño con localStorage
    effect(() => {
      const d = this.design();
      try {
        localStorage.setItem(STORAGE_KEY_DESIGN, JSON.stringify(d));
      } catch (e) {
        console.warn('No se pudo guardar el diseño en localStorage', e);
      }
    });
  }

  // Contenido formateado según el tipo seleccionado
  readonly qrContent = computed(() => {
    const c = this.config();
    switch (c.type) {
      case 'url':
        return c.urlData.trim() || 'https://qrakin.dev';
      case 'text':
        return c.textData || ' ';
      case 'wifi': {
        const { ssid, password, encryption, hidden } = c.wifiData;
        const safeSsid = ssid || 'MiRedWiFi';
        const enc = encryption === 'nopass' ? 'nopass' : encryption;
        return `WIFI:T:${enc};S:${safeSsid};P:${password};H:${hidden ? 'true' : 'false'};;`;
      }
      case 'contact': {
        const { firstName, lastName, phone, email, company } = c.contactData;
        const fn = `${firstName} ${lastName}`.trim() || 'Contacto';
        return `BEGIN:VCARD\nVERSION:3.0\nN:${lastName};${firstName};;;\nFN:${fn}\nORG:${company}\nTEL;TYPE=CELL:${phone}\nEMAIL:${email}\nEND:VCARD`;
      }
      case 'email': {
        const { address, subject, body } = c.emailData;
        return `MATMSG:TO:${address};SUB:${subject};BODY:${body};;`;
      }
      default:
        return 'https://qrakin.dev';
    }
  });

  // Título amigable calculado para previsualización e historial
  readonly qrTitle = computed(() => {
    const c = this.config();
    switch (c.type) {
      case 'url': {
        if (!c.urlData) return 'Enlace web';
        try {
          const url = new URL(c.urlData.startsWith('http') ? c.urlData : `https://${c.urlData}`);
          return url.hostname.replace('www.', '') || c.urlData;
        } catch {
          return c.urlData.substring(0, 30);
        }
      }
      case 'text':
        return c.textData ? c.textData.substring(0, 24) : 'Texto plano';
      case 'wifi':
        return c.wifiData.ssid || 'Red Wi-Fi';
      case 'contact': {
        const fullName = `${c.contactData.firstName} ${c.contactData.lastName}`.trim();
        return fullName || 'Contacto vCard';
      }
      case 'email':
        return c.emailData.address || c.emailData.subject || 'Correo electrónico';
      default:
        return 'Código QR';
    }
  });

  setQrType(type: QrType) {
    this.config.update((current) => ({ ...current, type }));
  }

  updateConfig(partial: Partial<QrConfig>) {
    this.config.update((current) => ({ ...current, ...partial }));
  }

  updateDesign(partial: Partial<QrDesign>) {
    this.design.update((current) => ({ ...current, ...partial }));
  }

  setLogo(dataUrl: string | null) {
    this.design.update((current) => ({ ...current, logo: dataUrl }));
  }

  // Guardar en Historial
  saveToHistory() {
    const currentConfig = { ...this.config() };
    const currentDesign = { ...this.design() };
    const content = this.qrContent();
    const title = this.qrTitle();
    const type = currentConfig.type;

    const newItem: QrHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      type,
      content,
      config: JSON.parse(JSON.stringify(currentConfig)),
      design: JSON.parse(JSON.stringify(currentDesign)),
      createdAt: Date.now(),
      favorite: false,
    };

    // Evitar duplicados inmediatos si el contenido es idéntico al último
    const existing = this.history();
    const isDuplicate = existing.length > 0 && existing[0].content === content;

    if (!isDuplicate) {
      this.history.update((list) => [newItem, ...list]);
      this.showToast('¡Guardado en el historial!', 'success');
    } else {
      this.showToast('Ya está guardado en el historial', 'info');
    }
  }

  deleteHistoryItem(id: string) {
    this.history.update((list) => list.filter((item) => item.id !== id));
    this.showToast('Elemento eliminado del historial', 'info');
  }

  toggleFavoriteHistory(id: string) {
    this.history.update((list) =>
      list.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  }

  clearHistory() {
    this.history.set([]);
    this.showToast('Historial vaciado', 'info');
  }

  loadHistoryItem(item: QrHistoryItem) {
    this.config.set(JSON.parse(JSON.stringify(item.config)));
    this.design.set(JSON.parse(JSON.stringify(item.design)));
    this.showToast(`Cargado: "${item.title}"`, 'success');
  }

  showToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toast.set({ message, type });
    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 3200);
  }

  private loadSavedHistory(): QrHistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error leyendo historial de localStorage', e);
    }
    // Items de bienvenida iniciales si está vacío
    return [
      {
        id: 'default-1',
        title: 'Mi Portfolio',
        type: 'url',
        content: 'https://aarongarcia.dev',
        config: {
          type: 'url',
          urlData: 'https://aarongarcia.dev',
          textData: '',
          wifiData: { ssid: '', password: '', encryption: 'WPA', hidden: false },
          contactData: { firstName: '', lastName: '', phone: '', email: '', company: '' },
          emailData: { address: '', subject: '', body: '' },
        },
        design: {
          colorDark: '#05241e',
          colorLight: '#ffffff',
          pixelShape: 'rounded',
          margin: 2,
          logo: null,
        },
        createdAt: Date.now() - 3600000,
        favorite: true,
      },
      {
        id: 'default-2',
        title: 'Wi-Fi Casa',
        type: 'wifi',
        content: 'WIFI:T:WPA;S:Wi-Fi Casa;P:SuperSecret123;H:false;;',
        config: {
          type: 'wifi',
          urlData: '',
          textData: '',
          wifiData: { ssid: 'Wi-Fi Casa', password: 'SuperSecret123', encryption: 'WPA', hidden: false },
          contactData: { firstName: '', lastName: '', phone: '', email: '', company: '' },
          emailData: { address: '', subject: '', body: '' },
        },
        design: {
          colorDark: '#113783',
          colorLight: '#ffffff',
          pixelShape: 'dots',
          margin: 2,
          logo: null,
        },
        createdAt: Date.now() - 7200000,
        favorite: false,
      },
    ];
  }

  private loadSavedDesign(): QrDesign {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DESIGN);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Error leyendo diseño de localStorage', e);
    }
    return {
      colorDark: '#05241e',
      colorLight: '#ffffff',
      pixelShape: 'squares',
      margin: 2,
      logo: null,
    };
  }
}

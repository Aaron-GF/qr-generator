import { Component, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { QrService } from './services/qr.service';

/* Componentes */
import { Header } from './components/header/header';
import { Configurator } from './components/configurator/configurator';
import { Design } from './components/design/design';
import { Preview } from './components/preview/preview';
import { History } from './components/history/history';

const THEME_KEY = 'qrakin_theme_pref';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Configurator, Design, Preview, History],
  templateUrl: './app.html',
})
export class App {
  qrService = inject(QrService);
  isDarkMode = signal(this.getInitialTheme());
  private document = inject(DOCUMENT);

  constructor() {
    // Sincroniza el signal con el atributo HTML y localStorage
    effect(() => {
      const isDark = this.isDarkMode();
      const theme = isDark ? 'dark' : 'light';
      this.document.documentElement.setAttribute('data-theme', theme);
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch (e) {
        console.warn('No se pudo guardar la preferencia de tema', e);
      }
    });
  }

  toggleTheme() {
    this.isDarkMode.update((value) => !value);
  }

  private getInitialTheme(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved) return saved === 'dark';
    } catch {}
    return true; // Default dark
  }
}

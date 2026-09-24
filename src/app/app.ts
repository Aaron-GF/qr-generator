import { Component, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/* Componentes */
import { Header } from './components/header/header';
import { Configurator } from './components/configurator/configurator';
import { Design } from './components/design/design';
import { Preview } from './components/preview/preview';
import { History } from './components/history/history';

@Component({
  selector: 'app-root',
  imports: [Header, Configurator, Design, Preview, History],
  templateUrl: './app.html',
})
export class App {
  isDarkMode = signal(true);
  private document = inject(DOCUMENT);

  constructor() {
    // Sincroniza el signal con el atributo HTML
    effect(() => {
      const theme = this.isDarkMode() ? 'dark' : 'light';
      this.document.documentElement.setAttribute('data-theme', theme);
    });
  }

  toggleTheme() {
    this.isDarkMode.update((value) => !value);
  }
}

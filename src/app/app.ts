import { Component, signal } from '@angular/core';
import { Header } from './components/header/header';
import { Configurator } from './components/configurator/configurator';
import { Design } from './components/design/design';
import { Preview } from './components/preview/preview';
import { History } from './components/history/history';

@Component({
  selector: 'app-root',
  imports: [Header, Configurator, Design, Preview, History],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('qrakin');
}

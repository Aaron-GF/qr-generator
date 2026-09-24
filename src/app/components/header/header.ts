import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.html',
})
export class Header {
  isDarkMode = input.required<boolean>();
  themeToggle = output<void>();

  toggleTheme() {
    this.themeToggle.emit();
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { QrService, QrHistoryItem, QrType } from '../../services/qr.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './history.html',
})
export class History {
  qrService = inject(QrService);
  filterMode = signal<'all' | 'favorites'>('all');
  showAllModal = signal(false);

  readonly filteredHistory = computed(() => {
    const list = this.qrService.history();
    if (this.filterMode() === 'favorites') {
      return list.filter((item) => item.favorite);
    }
    return list;
  });

  selectItem(item: QrHistoryItem) {
    this.qrService.loadHistoryItem(item);
  }

  toggleFavorite(event: Event, id: string) {
    event.stopPropagation();
    this.qrService.toggleFavoriteHistory(id);
  }

  deleteItem(event: Event, id: string) {
    event.stopPropagation();
    this.qrService.deleteHistoryItem(id);
  }

  clearHistory() {
    if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
      this.qrService.clearHistory();
    }
  }

  getTypeLabel(type: QrType): string {
    switch (type) {
      case 'url':
        return 'Enlace URL';
      case 'wifi':
        return 'Red Wi-Fi';
      case 'contact':
        return 'Contacto';
      case 'email':
        return 'Correo';
      case 'text':
        return 'Texto plano';
    }
  }
}

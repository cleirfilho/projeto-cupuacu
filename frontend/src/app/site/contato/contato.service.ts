import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ContatoService {
  private readonly http = inject(HttpClient);

  send(contact: {
    nome: string;
    email: string;
    telefone: string;
    mensagem: string;
  }) {
    return this.http.post<void>('/api/contact', contact);
  }
}

import { Component } from '@angular/core';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.css',
})
export class ClientesComponent {
  protected readonly clients = [
    'Norte Tech',
    'Amazônia Foods',
    'Verde Log',
    'Nova Gestão',
    'Raiz Comércio',
  ];
}

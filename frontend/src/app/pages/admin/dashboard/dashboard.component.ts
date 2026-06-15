import { Component } from '@angular/core';

interface DashboardMetric {
  label: string;
  value: number;
  detail: string;
  tone: 'primary' | 'success' | 'secondary' | 'warning';
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  protected readonly metrics: DashboardMetric[] = [
    {
      label: 'Usuários',
      value: 18,
      detail: '3 acessos hoje',
      tone: 'primary',
      icon: 'U',
    },
    {
      label: 'Clientes',
      value: 126,
      detail: '8 novos neste mês',
      tone: 'success',
      icon: 'C',
    },
    {
      label: 'Empresas',
      value: 74,
      detail: '68 em situação regular',
      tone: 'secondary',
      icon: 'E',
    },
    {
      label: 'Pendências',
      value: 9,
      detail: '4 com prazo nesta semana',
      tone: 'warning',
      icon: 'P',
    },
  ];
}

import { Component } from '@angular/core';

interface Service {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-servicos',
  templateUrl: './servicos.component.html',
  styleUrl: './servicos.component.css',
})
export class ServicosComponent {
  protected readonly services: Service[] = [
    {
      icon: 'bi-building',
      title: 'Contabilidade Empresarial',
      description:
        'Gestão contábil completa para apoiar decisões e manter sua empresa em conformidade.',
    },
    {
      icon: 'bi-rocket-takeoff',
      title: 'Abertura de Empresas',
      description:
        'Orientação em todas as etapas para começar seu negócio com a estrutura ideal.',
    },
    {
      icon: 'bi-calculator',
      title: 'Planejamento Tributário',
      description:
        'Estratégias legais para otimizar tributos e melhorar a rentabilidade.',
    },
    {
      icon: 'bi-people',
      title: 'Departamento Pessoal',
      description:
        'Rotinas trabalhistas, folha de pagamento e obrigações conduzidas com precisão.',
    },
    {
      icon: 'bi-bar-chart-line',
      title: 'Consultoria Financeira',
      description:
        'Indicadores claros e acompanhamento para uma gestão financeira mais segura.',
    },
    {
      icon: 'bi-file-earmark-check',
      title: 'Regularização Fiscal',
      description:
        'Diagnóstico e solução de pendências para recuperar a tranquilidade fiscal.',
    },
  ];
}

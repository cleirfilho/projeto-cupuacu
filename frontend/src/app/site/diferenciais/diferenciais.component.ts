import { Component } from '@angular/core';

@Component({
  selector: 'app-diferenciais',
  templateUrl: './diferenciais.component.html',
})
export class DiferenciaisComponent {
  protected readonly items = [
    [
      'bi-heart',
      'Atendimento Humanizado',
      'Relacionamento próximo e orientação sem complicação.',
    ],
    [
      'bi-cpu',
      'Tecnologia e Automação',
      'Processos digitais que trazem agilidade e reduzem erros.',
    ],
    [
      'bi-award',
      'Especialistas Tributários',
      'Conhecimento técnico para decisões fiscais mais inteligentes.',
    ],
    [
      'bi-eye',
      'Transparência Total',
      'Informações claras sobre prazos, números e responsabilidades.',
    ],
    [
      'bi-lock',
      'Segurança das Informações',
      'Boas práticas para proteger os dados da sua empresa.',
    ],
    [
      'bi-chat-dots',
      'Suporte Ágil',
      'Respostas rápidas para manter a operação em movimento.',
    ],
  ];
}

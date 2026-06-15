import { Component } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import { RouterLink } from '@angular/router';
import { ClientesComponent } from './clientes/clientes.component';
import { ContatoComponent } from './contato/contato.component';
import { DiferenciaisComponent } from './diferenciais/diferenciais.component';
import { FooterComponent } from './footer/footer.component';
import { HeroComponent } from './hero/hero.component';
import { ServicosComponent } from './servicos/servicos.component';
import { SobreComponent } from './sobre/sobre.component';

@Component({
  selector: 'app-site',
  imports: [
    NgbCollapse,
    RouterLink,
    HeroComponent,
    SobreComponent,
    ServicosComponent,
    DiferenciaisComponent,
    ClientesComponent,
    ContatoComponent,
    FooterComponent,
  ],
  templateUrl: './site.component.html',
  styleUrl: './site.component.css',
})
export class SiteComponent {
  protected menuCollapsed = true;

  protected closeMenu(): void {
    this.menuCollapsed = true;
  }
}

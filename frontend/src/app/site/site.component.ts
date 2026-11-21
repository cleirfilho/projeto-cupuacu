import { Component } from '@angular/core';
import { SiteHeaderComponent } from './header/header.component';
import { BlogHomeComponent } from './blog/blog-home.component';
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
    SiteHeaderComponent,
    BlogHomeComponent,
    HeroComponent,
    SobreComponent,
    ServicosComponent,
    DiferenciaisComponent,
    ClientesComponent,
    ContatoComponent,
    FooterComponent,
  ],
  templateUrl: './site.component.html',
})
export class SiteComponent {}

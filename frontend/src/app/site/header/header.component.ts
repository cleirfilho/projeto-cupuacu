import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-site-header',
  imports: [NgbCollapse, RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  host: { class: 'd-block sticky-top' },
})
export class SiteHeaderComponent {
  protected menuCollapsed = true;

  protected closeMenu() {
    this.menuCollapsed = true;
  }
}

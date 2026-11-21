import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { SiteHeaderComponent } from '../header/header.component';

@Component({
  imports: [RouterOutlet, FooterComponent, SiteHeaderComponent],
  template: '<app-site-header /><main><router-outlet /></main><app-footer />',
})
export class BlogLayoutComponent {}

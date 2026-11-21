import { Component, inject } from '@angular/core';
import { NgbCollapse } from '@ng-bootstrap/ng-bootstrap';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AdminBlogService } from '../../pages/admin/blog/admin-blog.service';
import { AuthService } from '../../core/auth/auth.service';
import { ThemePickerComponent } from '../../core/theme/theme-picker.component';

@Component({
  selector: 'app-admin-layout',
  imports: [
    ThemePickerComponent,
    NgbCollapse,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly blog = inject(AdminBlogService);

  protected menuCollapsed = true;

  protected toggleMenu(): void {
    this.menuCollapsed = !this.menuCollapsed;
  }

  protected closeMenu(): void {
    this.menuCollapsed = true;
  }

  protected logout(): void {
    this.blog.closeMediaSession().subscribe({ error: () => undefined });
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}

import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ThemePickerComponent } from '../../core/theme/theme-picker.component';

@Component({
  selector: 'app-login',
  imports: [ThemePickerComponent, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(HotToastService);

  protected submitted = false;
  protected loading = false;
  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected onSubmit(): void {
    this.submitted = true;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.showValidationError();
      return;
    }

    const { email, senha } = this.loginForm.getRawValue();
    this.loading = true;

    this.authService
      .login(email, senha)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: () => void this.router.navigate(['/admin']),
        error: (error: unknown) => {
          this.toast.error(this.getLoginError(error));
        },
      });
  }

  protected isInvalid(controlName: 'email' | 'senha'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || this.submitted);
  }

  private showValidationError(): void {
    const { email, senha } = this.loginForm.controls;

    if (senha.hasError('required')) {
      this.toast.error('Informe sua senha.');
      return;
    }

    if (senha.hasError('minlength')) {
      this.toast.error('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (email.invalid) {
      this.toast.error('Informe um e-mail válido.');
    }
  }

  private getLoginError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'E-mail ou senha inválidos.';
    }

    return 'Não foi possível acessar o servidor. Tente novamente em instantes.';
  }
}

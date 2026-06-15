import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contato',
  imports: [ReactiveFormsModule],
  templateUrl: './contato.component.html',
  styleUrl: './contato.component.css',
})
export class ContatoComponent {
  private readonly formBuilder = inject(FormBuilder);
  protected submitted = false;
  protected success = false;
  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.required],
    mensagem: ['', [Validators.required, Validators.minLength(10)]],
  });

  protected submit(): void {
    this.submitted = true;
    this.success = false;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.success = true;
    this.submitted = false;
    this.form.reset();
  }

  protected invalid(name: 'nome' | 'email' | 'telefone' | 'mensagem'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted);
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HotToastService } from '@ngxpert/hot-toast';
import { finalize } from 'rxjs';
import { ContatoService } from './contato.service';

@Component({
  selector: 'app-contato',
  imports: [ReactiveFormsModule],
  templateUrl: './contato.component.html',
  styleUrl: './contato.component.css',
})
export class ContatoComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly contatoService = inject(ContatoService);
  private readonly toast = inject(HotToastService);
  protected submitted = false;
  protected readonly sending = signal(false);
  protected readonly form = this.formBuilder.nonNullable.group({
    nome: ['', [Validators.required, Validators.maxLength(120)]],
    email: [
      '',
      [Validators.required, Validators.email, Validators.maxLength(254)],
    ],
    telefone: ['', [Validators.required, Validators.maxLength(40)]],
    mensagem: [
      '',
      [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(5000),
      ],
    ],
  });

  protected submit(): void {
    if (this.sending()) return;

    this.submitted = true;
    const { nome, email, telefone, mensagem } = this.form.getRawValue();
    this.form.setValue({
      nome: nome.trim(),
      email: email.trim(),
      telefone: telefone.trim(),
      mensagem: mensagem.trim(),
    });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.contatoService
      .send(this.form.getRawValue())
      .pipe(finalize(() => this.sending.set(false)))
      .subscribe({
        next: () => {
          this.submitted = false;
          this.form.reset();
          this.toast.success(
            'Mensagem enviada com sucesso. Em breve entraremos em contato.',
          );
        },
        error: () =>
          this.toast.error(
            'Não foi possível enviar sua mensagem. Tente novamente.',
          ),
      });
  }

  protected invalid(name: 'nome' | 'email' | 'telefone' | 'mensagem'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted);
  }
}

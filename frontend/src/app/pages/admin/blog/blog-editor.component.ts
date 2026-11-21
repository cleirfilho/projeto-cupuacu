import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HotToastService } from '@ngxpert/hot-toast';
import type Quill from 'quill';
import { finalize } from 'rxjs';
import { AdminBlogService, blogError } from './admin-blog.service';

@Component({
  selector: 'app-blog-editor',
  templateUrl: './blog-editor.component.html',
  styleUrl: './blog-editor.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class BlogEditorComponent {
  readonly initial = input('');
  readonly contentChange = output<string>();
  readonly busyChange = output<boolean>();
  private readonly api = inject(AdminBlogService);
  private readonly toast = inject(HotToastService);
  private readonly destroy = inject(DestroyRef);
  private readonly editor =
    viewChild.required<ElementRef<HTMLElement>>('editor');
  private readonly toolbar =
    viewChild.required<ElementRef<HTMLElement>>('toolbar');
  private quill?: Quill;
  private insertionIndex?: number;
  protected readonly ready = signal(false);
  protected readonly failed = signal(false);
  protected readonly uploading = signal(false);

  constructor() {
    afterNextRender(() => void this.initialize());
  }

  private async initialize() {
    try {
      const { default: Editor, Delta } = await import('quill');
      if (this.destroy.destroyed) return;
      const quill = new Editor(this.editor().nativeElement, {
        theme: 'snow',
        placeholder: 'Escreva a publicação…',
        formats: [
          'header',
          'bold',
          'italic',
          'underline',
          'list',
          'link',
          'image',
          'blockquote',
          'align',
        ],
        modules: {
          toolbar: this.toolbar().nativeElement,
          uploader: { handler: () => undefined },
        },
      });
      quill.root.setAttribute('aria-label', 'Conteúdo da publicação');
      quill.root.setAttribute('role', 'textbox');
      quill.root.setAttribute('aria-multiline', 'true');
      quill.clipboard.addMatcher('IMG', (node, delta) =>
        /^\/api\/blog\/media\/[0-9a-f-]{36}\.webp$/.test(
          (node as Element).getAttribute('src') ?? '',
        )
          ? delta
          : new Delta(),
      );
      quill.setContents(
        quill.clipboard.convert({ html: this.initial() }),
        'silent',
      );
      quill.on('selection-change', (range) => {
        if (range) this.insertionIndex = range.index;
      });
      quill.on('text-change', () =>
        this.contentChange.emit(quill.getSemanticHTML()),
      );
      this.quill = quill;
      this.ready.set(true);
    } catch {
      this.failed.set(true);
    }
  }

  protected upload(event: Event, alt: HTMLInputElement) {
    const field = event.target as HTMLInputElement;
    const file = field.files?.[0];
    field.value = '';
    const quill = this.quill;
    const description = alt.value.trim();
    if (!file || !quill || this.uploading()) return;
    if (!description) {
      this.toast.error('Descreva a imagem antes de selecionar o arquivo.');
      alt.focus();
      return;
    }

    const index = this.insertionIndex ?? Math.max(0, quill.getLength() - 1);
    this.uploading.set(true);
    this.busyChange.emit(true);
    this.api
      .upload(file)
      .pipe(
        takeUntilDestroyed(this.destroy),
        finalize(() => {
          this.uploading.set(false);
          if (!this.destroy.destroyed) this.busyChange.emit(false);
        }),
      )
      .subscribe({
        next: ({ url }) => {
          const insertion = Math.min(index, quill.getLength() - 1);
          quill.insertEmbed(insertion, 'image', url, 'user');
          quill.formatText(insertion, 1, 'alt', description, 'user');
          quill.setSelection(insertion + 1, 0);
          this.contentChange.emit(quill.getSemanticHTML());
          alt.value = '';
        },
        error: (error) =>
          this.toast.error(
            blogError(error, 'Não foi possível enviar a imagem.'),
          ),
      });
  }
}

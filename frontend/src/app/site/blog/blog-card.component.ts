import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogCard } from './blog.types';

@Component({
  selector: 'app-blog-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './blog-card.component.html',
  styleUrl: './blog-card.component.css',
  host: { class: 'd-block h-100' },
})
export class BlogCardComponent {
  readonly post = input.required<BlogCard>();
  readonly featured = input(false);
  readonly home = input(false);
}

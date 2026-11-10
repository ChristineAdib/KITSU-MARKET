import { Component } from '@angular/core';

@Component({
  selector: 'app-announcement-bar',
  standalone: true,
  template: `
    <aside class="announcement-bar" aria-label="Announcement">
      <div class="announcement-content">
        <span class="jp-glyph" aria-hidden="true">狐</span>
        <span class="text">Discover your next favorite anime collectible.</span>
        <span class="divider" aria-hidden="true">•</span>
        <span class="tag">Authentic Japanese Retail</span>
      </div>
    </aside>
  `,
  styles: [`
    .announcement-bar {
      background-color: var(--cocoa-brown);
      color: var(--sakura-blush);
      padding: 8px 16px;
      font-size: 0.78125rem;
      font-weight: 500;
      letter-spacing: 0.04em;
      text-align: center;
      border-bottom: 1px solid rgba(240, 178, 154, 0.2);
    }
    .announcement-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .jp-glyph {
      font-family: 'Noto Sans JP', sans-serif;
      color: var(--vermilion);
      font-weight: 700;
      font-size: 0.875rem;
    }
    .divider {
      color: var(--warm-taupe);
      opacity: 0.6;
    }
    .tag {
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--butter-yellow);
    }
  `]
})
export class AnnouncementBarComponent {}

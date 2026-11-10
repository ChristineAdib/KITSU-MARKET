import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Category, Product } from '../../core/models/product.models';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    <main class="home-page">
      
      <!-- HERO SECTION -->
      <section class="hero-section">
        <div class="container hero-container">
          
          <!-- Left Column: Editorial Headline & Actions -->
          <div class="hero-text-col fade-in">
            <div class="hero-eyebrow">
              <span class="jp-badge">東京エディトリアル</span>
              <span class="eyebrow-text">Authentic Japanese Anime Store</span>
            </div>

            <h1 class="hero-headline">
              Your Anime World, <br/>
              <span class="accent-text">Your Collection.</span>
            </h1>

            <p class="hero-subtext">
              Discover unique collectibles, stylish anime apparel, and the little things every anime lover deserves. Curated directly for passionate fans.
            </p>

            <div class="hero-actions">
              <a routerLink="/shop" class="btn btn-primary btn-lg">
                <span>Explore Collection</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </a>
              <a routerLink="/shop" [queryParams]="{ sortBy: 'newest' }" class="btn btn-secondary btn-lg">
                Shop New Arrivals
              </a>
            </div>

            <div class="hero-stats">
              <div class="stat-item">
                <span class="stat-num">100%</span>
                <span class="stat-label">Licensed & Original</span>
              </div>
              <div class="stat-sep">•</div>
              <div class="stat-item">
                <span class="stat-num">EGP</span>
                <span class="stat-label">Local Currency Pricing</span>
              </div>
              <div class="stat-sep">•</div>
              <div class="stat-item">
                <span class="stat-num">5★</span>
                <span class="stat-label">Collector Grade</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Editorial Visual Collage -->
          <div class="hero-visual-col">
            <div class="collage-grid">
              
              <div class="collage-card main-visual">
                <img 
                  src="https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80" 
                  alt="Kitsu Guardian Masterpiece Figure"
                />
                <div class="visual-tag">
                  <span class="tag-title">Featured Scale Figure</span>
                  <span class="tag-price">2,850.00 EGP</span>
                </div>
              </div>

              <div class="collage-card secondary-visual top-right">
                <img 
                  src="https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80" 
                  alt="Streetwear Anime Hoodie"
                />
                <span class="mini-tag">Cyber Shinobi Apparel</span>
              </div>

              <div class="collage-card secondary-visual bottom-right">
                <img 
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80" 
                  alt="Inari Spirit Fox Keychain Charm"
                />
                <span class="mini-tag">Spirit Fox Enamel</span>
              </div>

            </div>
          </div>

        </div>
      </section>

      <!-- CATEGORIES SECTION -->
      <section class="section categories-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="jp-tag">カテゴリー</span>
              <h2 class="section-title">Explore Collections</h2>
            </div>
            <a routerLink="/shop" class="view-all-link">
              <span>View All</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>

          <div class="categories-grid">
            @for (cat of categories(); track cat.id) {
              <a [routerLink]="['/shop']" [queryParams]="{ categoryId: cat.id }" class="category-card">
                <div class="cat-image-wrap">
                  <img [src]="cat.imageUrl" [alt]="cat.name" loading="lazy" />
                  <div class="cat-overlay"></div>
                </div>
                <div class="cat-content">
                  <span class="cat-count">{{ cat.productCount }} Items</span>
                  <h3 class="cat-name">{{ cat.name }}</h3>
                </div>
              </a>
            }
          </div>
        </div>
      </section>

      <!-- FEATURED PRODUCTS -->
      <section class="section featured-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="jp-tag">注目のアイテム</span>
              <h2 class="section-title">Curated Highlights</h2>
            </div>
            <a routerLink="/shop" [queryParams]="{ isFeatured: true }" class="view-all-link">
              <span>See Highlights</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>

          @if (isLoadingFeatured()) {
            <div class="product-grid">
              @for (item of [1,2,3,4]; track item) {
                <div class="skeleton" style="height: 380px;"></div>
              }
            </div>
          } @else {
            <div class="product-grid">
              @for (prod of featuredProducts(); track prod.id) {
                <app-product-card [product]="prod" />
              }
            </div>
          }
        </div>
      </section>

      <!-- NEW ARRIVALS -->
      <section class="section new-arrivals-section">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="jp-tag">新着商品</span>
              <h2 class="section-title">New Arrivals</h2>
            </div>
            <a routerLink="/shop" [queryParams]="{ sortBy: 'newest' }" class="view-all-link">
              <span>View Latest</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 18 15 12 9 6"/></svg>
            </a>
          </div>

          @if (isLoadingNewArrivals()) {
            <div class="product-grid">
              @for (item of [1,2,3,4]; track item) {
                <div class="skeleton" style="height: 380px;"></div>
              }
            </div>
          } @else {
            <div class="product-grid">
              @for (prod of newArrivals(); track prod.id) {
                <app-product-card [product]="prod" />
              }
            </div>
          }
        </div>
      </section>

      <!-- BRAND PHILOSOPHY / EXPERIENCE -->
      <section class="section brand-experience-section">
        <div class="container">
          <div class="experience-card">
            <div class="experience-content">
              <span class="jp-tag">キツ・マーケット哲学</span>
              <h2 class="experience-title">The Tokyo Pop Editorial Standard</h2>
              <p class="experience-text">
                KITSU MARKET bridges Japanese design aesthetics with accessible, premium merchandise. 
                From hand-painted resin statues to heavyweight streetwear apparel and foil art prints, 
                every item is cataloged with authentic specs, transparent pricing in EGP, and real-time inventory.
              </p>
              <div class="experience-badges">
                <div class="exp-badge">
                  <span class="badge-dot"></span>
                  <span>Real-Time Inventory</span>
                </div>
                <div class="exp-badge">
                  <span class="badge-dot"></span>
                  <span>Atomic Stock Protection</span>
                </div>
                <div class="exp-badge">
                  <span class="badge-dot"></span>
                  <span>EGP Currency Transparency</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  `,
  styles: [`
    .home-page {
      overflow-x: hidden;
    }
    .section {
      padding: 60px 0;
    }
    .section-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      letter-spacing: -0.02em;
      line-height: 1.2;
    }
    .view-all-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--vermilion);
    }
    .view-all-link:hover {
      color: var(--deep-cherry);
      gap: 10px;
    }

    /* HERO STYLES */
    .hero-section {
      background-color: var(--porcelain);
      padding: 50px 0 70px;
      border-bottom: 1px solid var(--rose-mist);
      position: relative;
    }
    .hero-container {
      display: grid;
      grid-template-columns: 1.15fr 0.85fr;
      align-items: center;
      gap: 48px;
    }
    .hero-eyebrow {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .jp-badge {
      background-color: var(--sakura-blush);
      color: var(--vermilion);
      font-family: 'Noto Sans JP', sans-serif;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: var(--radius-full);
      letter-spacing: 0.05em;
    }
    .eyebrow-text {
      font-size: 0.8125rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--warm-taupe);
    }
    .hero-headline {
      font-size: 3.25rem;
      font-weight: 800;
      line-height: 1.08;
      letter-spacing: -0.03em;
      color: var(--cocoa-brown);
      margin-bottom: 20px;
    }
    .accent-text {
      color: var(--vermilion);
    }
    .hero-subtext {
      font-size: 1.125rem;
      line-height: 1.6;
      color: var(--warm-taupe);
      max-width: 520px;
      margin-bottom: 32px;
    }
    .hero-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 36px;
    }
    .hero-stats {
      display: flex;
      align-items: center;
      gap: 16px;
      padding-top: 24px;
      border-top: 1px solid rgba(233, 215, 209, 0.7);
    }
    .stat-item {
      display: flex;
      flex-direction: column;
    }
    .stat-num {
      font-size: 1.125rem;
      font-weight: 800;
      color: var(--cocoa-brown);
    }
    .stat-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--warm-taupe);
    }
    .stat-sep {
      color: var(--rose-mist);
    }

    /* Collage Grid */
    .collage-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      grid-template-rows: 1fr 1fr;
      gap: 14px;
      height: 440px;
    }
    .collage-card {
      border-radius: var(--radius-md);
      overflow: hidden;
      position: relative;
      border: 1px solid var(--rose-mist);
      box-shadow: var(--shadow-md);
      background-color: var(--pure-white);
    }
    .collage-card img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.5s ease;
    }
    .collage-card:hover img {
      transform: scale(1.05);
    }
    .main-visual {
      grid-row: span 2;
    }
    .visual-tag {
      position: absolute;
      bottom: 12px;
      left: 12px;
      right: 12px;
      background-color: rgba(255, 248, 244, 0.95);
      backdrop-filter: blur(4px);
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      border: 1px solid var(--rose-mist);
    }
    .tag-title {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--cocoa-brown);
    }
    .tag-price {
      font-size: 0.8125rem;
      font-weight: 800;
      color: var(--vermilion);
    }
    .mini-tag {
      position: absolute;
      bottom: 8px;
      left: 8px;
      background-color: rgba(91, 68, 59, 0.85);
      color: var(--pure-white);
      font-size: 0.6875rem;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: var(--radius-xs);
    }

    /* Category Cards */
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
    }
    .category-card {
      border-radius: var(--radius-md);
      overflow: hidden;
      background-color: var(--pure-white);
      border: 1px solid var(--rose-mist);
      position: relative;
      display: block;
      transition: transform var(--transition-fast), box-shadow var(--transition-fast), border-color var(--transition-fast);
    }
    .category-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
      border-color: var(--soft-peach);
    }
    .cat-image-wrap {
      aspect-ratio: 16 / 10;
      position: relative;
      overflow: hidden;
      background-color: var(--porcelain);
    }
    .cat-image-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
    }
    .category-card:hover .cat-image-wrap img {
      transform: scale(1.06);
    }
    .cat-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(91, 68, 59, 0.4) 0%, transparent 60%);
    }
    .cat-content {
      padding: 16px;
      background-color: var(--pure-white);
    }
    .cat-count {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--warm-taupe);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cat-name {
      font-size: 1.0625rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin-top: 2px;
    }

    /* Product Grid */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
    }

    /* Brand Experience */
    .experience-card {
      background-color: var(--sakura-blush);
      border: 1px solid var(--soft-peach);
      border-radius: var(--radius-lg);
      padding: 48px;
      position: relative;
    }
    .experience-content {
      max-width: 680px;
    }
    .experience-title {
      font-size: 2rem;
      font-weight: 800;
      color: var(--cocoa-brown);
      margin: 8px 0 16px;
      line-height: 1.2;
    }
    .experience-text {
      font-size: 1rem;
      line-height: 1.65;
      color: var(--cocoa-brown);
      margin-bottom: 24px;
      opacity: 0.9;
    }
    .experience-badges {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .exp-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: var(--pure-white);
      padding: 8px 14px;
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--cocoa-brown);
      border: 1px solid var(--soft-peach);
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      background-color: var(--vermilion);
      border-radius: 50%;
    }

    @media (max-width: 992px) {
      .hero-container {
        grid-template-columns: 1fr;
      }
      .hero-headline {
        font-size: 2.75rem;
      }
      .collage-grid {
        height: 360px;
      }
      .experience-card {
        padding: 32px;
      }
    }
    @media (max-width: 640px) {
      .hero-headline {
        font-size: 2.125rem;
      }
      .hero-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .collage-grid {
        height: 280px;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  private readonly productService = inject(ProductService);

  readonly categories = signal<Category[]>([]);
  readonly featuredProducts = signal<Product[]>([]);
  readonly newArrivals = signal<Product[]>([]);

  readonly isLoadingFeatured = signal<boolean>(true);
  readonly isLoadingNewArrivals = signal<boolean>(true);

  ngOnInit(): void {
    // 1. Fetch categories
    this.productService.getCategories().subscribe({
      next: cats => this.categories.set(cats)
    });

    // 2. Fetch featured products
    this.productService.getProducts({ isFeatured: true, pageSize: 4 }).subscribe({
      next: result => {
        this.featuredProducts.set(result.items);
        this.isLoadingFeatured.set(false);
      },
      error: () => this.isLoadingFeatured.set(false)
    });

    // 3. Fetch new arrivals
    this.productService.getProducts({ sortBy: 'newest', pageSize: 4 }).subscribe({
      next: result => {
        this.newArrivals.set(result.items);
        this.isLoadingNewArrivals.set(false);
      },
      error: () => this.isLoadingNewArrivals.set(false)
    });
  }
}

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnnouncementBarComponent } from './shared/components/announcement-bar/announcement-bar.component';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { InitialLoaderComponent } from './shared/components/initial-loader/initial-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    AnnouncementBarComponent,
    NavbarComponent,
    FooterComponent,
    ToastContainerComponent,
    InitialLoaderComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}

import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CameraFeedComponent } from './components/camera-feed/camera-feed.component';
import { DetectionViewerComponent } from './components/detection-viewer/detection-viewer.component';
import { ArrivalLogViewerComponent } from './components/arrival-log-viewer/arrival-log-viewer.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GreetingService } from './services/greeting.service';
import { LoggingService } from './services/logging.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    CameraFeedComponent,
    DetectionViewerComponent,
    ArrivalLogViewerComponent,
    SettingsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('sentry-bot');
  protected currentView = signal<'dashboard' | 'settings'>('dashboard');
  protected greetingMessage = signal('');

  constructor(
    private greetingService: GreetingService,
    private loggingService: LoggingService
  ) {
    this.loggingService.info('App component initialized');
  }

  ngOnInit(): void {
    // Subscribe to greeting events
    this.greetingService.greeting$.subscribe(greeting => {
      if (greeting) {
        this.greetingMessage.set(greeting.message);
        this.loggingService.info('Greeting triggered', 'GREETING', { message: greeting.message });

        // Auto-hide greeting after 5 seconds
        setTimeout(() => {
          this.greetingMessage.set('');
        }, 5000);
      }
    });

    // Setup periodic greeting check (every minute)
    setInterval(() => {
      this.greetingService.checkAndGreet();
    }, 60000);

    this.loggingService.info('Application ready', 'APP');
  }

  switchView(view: 'dashboard' | 'settings'): void {
    this.currentView.set(view);
  }
}

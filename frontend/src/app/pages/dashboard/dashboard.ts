import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="dashboard-bar">
      <div class="dashboard-content">
        <a class="dashboard-left" routerLink="/">URL Shortener</a>
        <div class="dashboard-right">
          <ng-container *ngIf="username; else guestLinks">
            <span class="welcome">Welcome, {{ username }}!</span>
            <button class="logout" (click)="logout.emit()">Logout</button>
          </ng-container>
          <ng-template #guestLinks>
            <a routerLink="/login" class="btn">Login</a>
          </ng-template>
        </div>
      </div>
    </header>
  `,
  styleUrl: './dashboard.css'
})
export class Dashboard {
  @Input() username = '';
  @Output() logout = new EventEmitter<void>();
} 
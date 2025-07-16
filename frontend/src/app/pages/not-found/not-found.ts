import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Dashboard } from '../dashboard/dashboard';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule, Dashboard, MatCardModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.css'
})
export class NotFound {
  username = '';

  constructor() {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username;
      } catch {}
    }
  }

  handleLogout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  }
} 
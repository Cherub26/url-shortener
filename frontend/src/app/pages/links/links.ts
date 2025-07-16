import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Dashboard } from '../dashboard/dashboard';
import { ApiService } from '../../services/api';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-links',
  standalone: true,
  imports: [CommonModule, RouterModule, Dashboard, MatCardModule],
  templateUrl: './links.html',
  styleUrl: './links.css'
})
export class Links {
  username = '';
  links: { shortUrl: string; longUrl: string; clickCount: number }[] = [];
  loading = true;
  error = '';

  constructor(private api: ApiService) {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username;
      } catch {}
    }
    this.fetchLinks();
  }

  async fetchLinks() {
    this.loading = true;
    this.error = '';
    try {
      const token = localStorage.getItem('jwt') || undefined;
      this.links = (await this.api.getUserLinks(token)) || [];
    } catch (err: any) {
      this.error = err.error?.message || 'Failed to fetch links';
    } finally {
      this.loading = false;
    }
  }

  handleLogout() {
    localStorage.removeItem('jwt');
    window.location.href = '/';
  }
} 
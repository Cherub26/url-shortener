import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HttpClientModule, Dashboard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  username = '';
  longUrl = '';
  shortUrl = '';
  error = '';

  constructor(private api: ApiService) {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username;
      } catch {}
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  async shortenUrl() {
    this.error = '';
    this.shortUrl = '';
    if (!this.longUrl) return;
    if (!this.isValidUrl(this.longUrl)) {
      this.error = 'Please enter a valid URL (e.g. https://example.com)';
      return;
    }
    try {
      const token = localStorage.getItem('jwt') || undefined;
      const res: any = await this.api.shortenUrl(this.longUrl, token);
      this.shortUrl = res.shortUrl;
      this.longUrl = '';
    } catch (err: any) {
      this.error = err.error?.message || 'Failed to shorten URL';
    }
  }

  copyShortUrl() {
    if (this.shortUrl) {
      navigator.clipboard.writeText(this.shortUrl);
    }
  }

  handleLogout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  }
}

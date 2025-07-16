import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, Dashboard],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  loginUsername = '';
  password = '';
  error = '';

  constructor(private api: ApiService, private router: Router) {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username;
      } catch {}
    }
  }

  async onSubmit() {
    this.error = '';
    try {
      const res = await this.api.login(this.loginUsername, this.password);
      if (!res) {
        throw new Error('Login failed');
      }
      localStorage.setItem('jwt', res.token);
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.error?.error || 'Login failed';
    }
  }

  handleLogout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { Dashboard } from '../dashboard/dashboard';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, Dashboard, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  username = '';
  loginUsername = '';
  password = '';
  error = '';
  showPassword = false;

  constructor(private api: ApiService, private router: Router) {
    const token = localStorage.getItem('jwt');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        this.username = payload.username;
      } catch {}
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
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

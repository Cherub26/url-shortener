import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api';
import { Dashboard } from '../dashboard/dashboard';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, Dashboard],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  username = '';
  registerUsername = '';
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
      await this.api.register(this.registerUsername, this.password);
      this.router.navigate(['/login']);
    } catch (err: any) {
      this.error = err.error?.error || 'Registration failed';
    }
  }

  handleLogout() {
    localStorage.removeItem('jwt');
    window.location.reload();
  }
}

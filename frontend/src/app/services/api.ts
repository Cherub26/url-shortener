import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return this.http.post<{ token: string }>(`${this.baseUrl}/user/login`, { username, password }).toPromise();
  }

  register(username: string, password: string) {
    return this.http.post(`${this.baseUrl}/user/register`, { username, password }).toPromise();
  }

  shortenUrl(longUrl: string, token?: string) {
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.post<{ shortUrl: string }>(`${this.baseUrl}/shorten`, { url: longUrl }, { headers }).toPromise();
  }

  getUserLinks(token?: string) {
    const headers = token ? new HttpHeaders({ 'Authorization': `Bearer ${token}` }) : undefined;
    return this.http.get<any[]>(`${this.baseUrl}/user/links`, { headers }).toPromise();
  }
}

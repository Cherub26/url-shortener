import { Component, Input, Output, EventEmitter, Inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatDialogModule
  ],
  template: `
    <mat-toolbar color="primary" class="dashboard-toolbar">
      <a class="dashboard-title" routerLink="/">URL Shortener</a>
      <span class="spacer"></span>
      <ng-container *ngIf="username; else guestLinks">
        <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu">
          <span class="user-name">{{ username }}</span>
          <mat-icon>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <button mat-menu-item (click)="goToProfile($event)">
            <mat-icon>person</mat-icon>
            <span>Profile</span>
          </button>
          <button mat-menu-item [routerLink]="'/links'">
            <mat-icon>link</mat-icon>
            <span>Links</span>
          </button>
          <button mat-menu-item color="warn" (click)="openLogoutDialog()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </ng-container>
      <ng-template #guestLinks>
        <a routerLink="/login" mat-raised-button color="primary">Login</a>
      </ng-template>
    </mat-toolbar>
  `,
  styleUrl: './dashboard.css'
})
export class Dashboard {
  @Input() username = '';
  @Output() logout = new EventEmitter<void>();

  constructor(private dialog: MatDialog) {}

  goToProfile(event: Event) {
    event.stopPropagation();
    window.location.href = '/profile';
  }

  openLogoutDialog() {
    const dialogRef = this.dialog.open(LogoutConfirmDialog, {
      width: '320px',
      data: {}
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.logout.emit();
      }
    });
  }
}

@Component({
  selector: 'logout-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Logout</h2>
    <mat-dialog-content>
      <p>Are you sure you want to logout?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="warn" (click)="onConfirm()">Yes</button>
      <button mat-button (click)="onCancel()">Cancel</button>
    </mat-dialog-actions>
  `
})
export class LogoutConfirmDialog {
  constructor(
    public dialogRef: MatDialogRef<LogoutConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onConfirm() {
    this.dialogRef.close(true);
  }
  onCancel() {
    this.dialogRef.close(false);
  }
} 
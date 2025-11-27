import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
  IonIcon, IonButton, IonAvatar, IonList, IonGrid, IonRow, IonCol,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  personOutline, mailOutline, settingsOutline, logOutOutline,
  statsChartOutline, trophyOutline, cameraOutline, createOutline
} from 'ionicons/icons';

import { AuthService, User } from '../../services/auth.service';
import { ActivityService, ActivityStats } from '../../services/activity.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonLabel,
    IonIcon, IonButton, IonAvatar, IonList, IonGrid, IonRow, IonCol
  ]
})
export class ProfilePage implements OnInit {
  currentUser: User | null = null;
  activityStats: ActivityStats | null = null;

  constructor(
    private router: Router,
    private authService: AuthService,
    private activityService: ActivityService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      personOutline, mailOutline, settingsOutline, logOutOutline,
      statsChartOutline, trophyOutline, cameraOutline, createOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadStats();
  }

  private loadUserData() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  private loadStats() {
    this.activityStats = this.activityService.getActivityStats();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Sair',
      message: 'Deseja realmente sair do aplicativo?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sair',
          handler: async () => {
            await this.authService.logout();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  editProfile() {
    // Implementar edição de perfil
    this.showToast('Funcionalidade em desenvolvimento', 'warning');
  }

  changeAvatar() {
    // Implementar mudança de avatar
    this.showToast('Funcionalidade em desenvolvimento', 'warning');
  }

  openSettings() {
    this.router.navigate(['/settings']);
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }

  get formattedTotalDistance(): string {
    if (!this.activityStats) return '0 km';
    const totalKm = this.activityStats.totalDistance / 1000;
    return `${totalKm.toFixed(1)} km`;
  }

  get formattedTotalDuration(): string {
    if (!this.activityStats) return '0h';
    const totalHours = this.activityStats.totalDuration / 3600000;
    return `${totalHours.toFixed(1)}h`;
  }

  get averageSpeedKmh(): string {
    if (!this.activityStats || this.activityStats.averageSpeed === 0) return '0.0';
    const speedKmh = this.activityStats.averageSpeed * 3.6;
    return speedKmh.toFixed(1);
  }
}

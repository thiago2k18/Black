import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem,
  IonLabel, IonIcon, IonChip, IonButton, AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walkOutline, timeOutline, speedometerOutline, footstepsOutline,
  calendarOutline, trophyOutline, trendingUpOutline, trashOutline
} from 'ionicons/icons';

import { ActivityService, ActivityData } from '../../services/activity.service';

@Component({
  selector: 'app-history',
  templateUrl: './history.page.html',
  styleUrls: ['./history.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonList, IonItem,
    IonLabel, IonIcon, IonChip, IonButton
  ]
})
export class HistoryPage implements OnInit {
  activities: ActivityData[] = [];

  constructor(
    private activityService: ActivityService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      walkOutline, timeOutline, speedometerOutline, footstepsOutline,
      calendarOutline, trophyOutline, trendingUpOutline, trashOutline
    });
  }

  ngOnInit() {
    this.loadActivities();
  }

  private loadActivities() {
    this.activityService.activities$.subscribe(activities => {
      this.activities = activities.filter(a => a.status === 'completed')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    });
  }

  formatDistance(distance: number): string {
    return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance.toFixed(0)} m`;
  }

  formatDuration(duration: number): string {
    const minutes = Math.floor(duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }

  hasAltitude(activity: ActivityData): boolean {
    return activity.route && activity.route.length > 0 && 
           activity.route.some(point => point.altitude !== undefined && point.altitude > 0);
  }

  formatAltitude(activity: ActivityData): string {
    // Sempre retorna um texto natural, nunca vazio
    
    // Verificar se tem dados de rota e altitude
    if (!activity.route || activity.route.length === 0) {
      return 'Caminhada no plano';
    }
    
    // Pegar altitudes válidas (> 0)
    const altitudes = activity.route
      .filter(point => point.altitude !== undefined && point.altitude > 0)
      .map(point => point.altitude!);
    
    // Se não tem altitudes válidas, é uma caminhada no plano
    if (altitudes.length === 0) {
      return 'Caminhada no plano';
    }
    
    const avgAltitude = altitudes.reduce((sum, alt) => sum + alt, 0) / altitudes.length;
    
    // Formatação mais empolgante e natural
    if (avgAltitude < 50) {
      return `Bem pertinho do chão`;
    } else if (avgAltitude < 100) {
      return `${Math.round(avgAltitude)}m de altura`;
    } else if (avgAltitude < 300) {
      return `Subiu ${Math.round(avgAltitude)}m!`;
    } else if (avgAltitude < 500) {
      return `Que subida! ${Math.round(avgAltitude)}m`;
    } else if (avgAltitude < 1000) {
      return `Lá no alto! ${Math.round(avgAltitude)}m`;
    } else if (avgAltitude < 2000) {
      return `Nas alturas! ${(avgAltitude / 1000).toFixed(1)}km`;
    } else {
      return `Que aventura! ${(avgAltitude / 1000).toFixed(1)}km de altura`;
    }
  }

  async deleteActivity(activity: ActivityData) {
    const alert = await this.alertController.create({
      header: 'Remover Atividade',
      message: `Tem certeza que deseja remover a caminhada de ${this.formatDate(activity.createdAt)}?`,
      buttons: [
        {
          text: 'CANCELAR',
          role: 'cancel'
        },
        {
          text: 'REMOVER',
          role: 'destructive',
          handler: async () => {
            const success = await this.activityService.deleteActivity(activity.id);
            if (success) {
              this.showToast('Atividade removida com sucesso', 'success');
            } else {
              this.showToast('Erro ao remover atividade', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async clearAllHistory() {
    if (this.activities.length === 0) {
      this.showToast('Não há atividades para remover', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Limpar Histórico',
      message: `Tem certeza que deseja remover todas as ${this.activities.length} atividades? Esta ação não pode ser desfeita.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Remover Todas',
          role: 'destructive',
          handler: async () => {
            let removedCount = 0;
            for (const activity of this.activities) {
              const success = await this.activityService.deleteActivity(activity.id);
              if (success) removedCount++;
            }
            
            if (removedCount === this.activities.length) {
              this.showToast('Histórico limpo com sucesso', 'success');
            } else {
              this.showToast(`${removedCount} de ${this.activities.length} atividades removidas`, 'warning');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }
}

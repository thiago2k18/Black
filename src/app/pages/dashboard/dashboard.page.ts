import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent, 
  IonCardHeader, IonCardTitle, IonButton, IonIcon, IonGrid, IonRow, 
  IonCol, IonLabel, IonProgressBar, IonChip, IonMenuButton,
  IonButtons, IonRefresher, IonRefresherContent, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walkOutline, statsChartOutline, trophyOutline, mapOutline,
  timeOutline, speedometerOutline, footstepsOutline, flameOutline,
  refreshOutline, playOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';

import { AuthService, User } from '../../services/auth.service';
import { ActivityService, ActivityStats } from '../../services/activity.service';
import { StorageService } from '../../services/storage.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, IonButton, IonIcon, IonGrid, IonRow,
    IonCol, IonLabel, IonProgressBar, IonChip, IonMenuButton,
    IonButtons, IonRefresher, IonRefresherContent
  ]
})
export class DashboardPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  activityStats: ActivityStats | null = null;
  isOnline: boolean = true;
  pendingSyncCount: number = 0;
  
  // Metas diárias
  dailyGoals = {
    steps: 10000,
    distance: 5000, // metros
    duration: 3600000 // 1 hora em ms
  };

  // Progresso atual
  todayProgress = {
    steps: 0,
    distance: 0,
    duration: 0,
    calories: 0
  };

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private authService: AuthService,
    private activityService: ActivityService,
    private storageService: StorageService,
    private notificationService: NotificationService,
    private toastController: ToastController
  ) {
    addIcons({
      walkOutline, statsChartOutline, trophyOutline, mapOutline,
      timeOutline, speedometerOutline, footstepsOutline, flameOutline,
      refreshOutline, playOutline
    });
  }

  ngOnInit() {
    this.loadUserData();
    this.loadActivityStats();
    this.setupSubscriptions();
    this.loadTodayProgress();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSubscriptions() {
    // Monitorar usuário atual
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Monitorar status de conectividade
    const onlineSub = this.storageService.isOnline$.subscribe(isOnline => {
      this.isOnline = isOnline;
    });

    // Monitorar dados pendentes de sincronização
    const syncSub = this.storageService.pendingSync$.subscribe(pendingItems => {
      this.pendingSyncCount = pendingItems.length;
    });

    this.subscriptions.push(userSub, onlineSub, syncSub);
  }

  private loadUserData() {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadActivityStats() {
    this.activityStats = this.activityService.getActivityStats();
  }

  private async loadTodayProgress() {
    // Carregar progresso do dia atual
    const today = new Date().toDateString();
    const savedProgress = await this.storageService.get(`dailyProgress_${today}`);
    
    if (savedProgress) {
      this.todayProgress = savedProgress;
    }
  }

  async doRefresh(event: any) {
    try {
      // Recarregar dados
      this.loadActivityStats();
      await this.loadTodayProgress();
      
      // Tentar sincronizar se online
      if (this.isOnline) {
        await this.storageService.forcSync();
      }
      
      event.target.complete();
    } catch (error) {
      console.error('Erro ao atualizar dashboard:', error);
      event.target.complete();
    }
  }

  startNewActivity() {
    this.router.navigate(['/activity']);
  }

  viewHistory() {
    this.router.navigate(['/history']);
  }

  viewAchievements() {
    this.router.navigate(['/achievements']);
  }

  viewMaps() {
    this.router.navigate(['/maps']);
  }

  // Getters para cálculos de progresso
  get stepsProgress(): number {
    return Math.min((this.todayProgress.steps / this.dailyGoals.steps) * 100, 100);
  }

  get distanceProgress(): number {
    return Math.min((this.todayProgress.distance / this.dailyGoals.distance) * 100, 100);
  }

  get durationProgress(): number {
    return Math.min((this.todayProgress.duration / this.dailyGoals.duration) * 100, 100);
  }

  get formattedDistance(): string {
    if (this.todayProgress.distance >= 1000) {
      return `${(this.todayProgress.distance / 1000).toFixed(1)} km`;
    }
    return `${this.todayProgress.distance.toFixed(0)} m`;
  }

  get formattedDuration(): string {
    const minutes = Math.floor(this.todayProgress.duration / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes}min`;
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

  get syncStatusText(): string {
    if (this.isOnline) {
      return this.pendingSyncCount > 0 ? 
        `${this.pendingSyncCount} itens para sincronizar` : 
        'Sincronizado';
    }
    return 'Offline';
  }

  get syncStatusColor(): string {
    if (this.isOnline) {
      return this.pendingSyncCount > 0 ? 'warning' : 'success';
    }
    return 'medium';
  }

  // Verificar se completou alguma meta
  get completedGoals(): string[] {
    const completed = [];
    
    if (this.stepsProgress >= 100) completed.push('Passos');
    if (this.distanceProgress >= 100) completed.push('Distância');
    if (this.durationProgress >= 100) completed.push('Tempo');
    
    return completed;
  }

  // Motivação baseada no progresso
  get motivationalMessage(): string {
    const totalProgress = (this.stepsProgress + this.distanceProgress + this.durationProgress) / 3;
    
    if (totalProgress >= 100) {
      return '🎉 Parabéns! Você atingiu todas as metas de hoje!';
    } else if (totalProgress >= 75) {
      return '💪 Quase lá! Você está muito perto das suas metas!';
    } else if (totalProgress >= 50) {
      return '🚀 Bom progresso! Continue assim!';
    } else if (totalProgress >= 25) {
      return '👟 Vamos lá! Que tal uma caminhada?';
    } else {
      return '🌟 Novo dia, novas oportunidades! Comece sua jornada!';
    }
  }

  async scheduleActivityReminder() {
    await this.notificationService.scheduleActivityReminder(
      'Hora de se movimentar!',
      'Que tal uma caminhada para atingir suas metas?',
      60 // 1 hora
    );
  }

  async forcSync() {
    try {
      if (!this.isOnline) {
        this.showToast('Você está offline. Conecte-se à internet para sincronizar.', 'warning');
        return;
      }

      if (this.pendingSyncCount === 0) {
        this.showToast('Todos os dados já estão sincronizados!', 'success');
        return;
      }

      const success = await this.storageService.forcSync();
      if (success) {
        this.showToast('Sincronização realizada com sucesso!', 'success');
        console.log('✅ Sincronização manual realizada com sucesso');
      } else {
        this.showToast('Erro na sincronização. Tente novamente.', 'danger');
        console.log('⚠️ Não foi possível sincronizar - verifique sua conexão');
      }
    } catch (error) {
      this.showToast('Erro na sincronização. Tente novamente.', 'danger');
      console.error('❌ Erro na sincronização manual:', error);
    }
  }

  private async showToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top'
    });
    toast.present();
  }
}

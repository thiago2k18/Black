import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon, 
  IonCard, IonCardContent, IonFab, IonFabButton,
  IonButtons, IonChip, IonLabel,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  playOutline, pauseOutline, stopOutline, cameraOutline, flashlightOutline,
  walkOutline, timeOutline, speedometerOutline, footstepsOutline,
  locationOutline, arrowBackOutline, flashOutline
} from 'ionicons/icons';
import { Subscription, interval } from 'rxjs';
import * as mapboxgl from 'mapbox-gl';

import { GeolocationService, LocationPoint } from '../../services/geolocation.service';
import { ActivityService, ActivityData } from '../../services/activity.service';
import { PedometerService } from '../../services/pedometer.service';
import { AuthService } from '../../services/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorFlash } from '@capgo/capacitor-flash';
import { ConnectivityService } from '../../services/connectivity.service';
import { OfflineMapComponent } from '../../components/offline-map/offline-map.component';
import { AccelerometerService } from '../../services/accelerometer.service';
import { VoiceGuideService } from '../../services/voice-guide.service';
import { GeoSyncService } from '../../services/geo-sync.service';

@Component({
  selector: 'app-activity',
  templateUrl: './activity.page.html',
  styleUrls: ['./activity.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonIcon,
    IonCard, IonCardContent, IonFab, IonFabButton,
    IonButtons, IonChip, IonLabel,
    OfflineMapComponent
  ]
})
export class ActivityPage implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  // Estado da atividade
  currentActivity: ActivityData | null = null;
  isTracking = false;
  isPaused = false;
  isFlashlightOn = false;
  
  // Contagem regressiva
  isCountingDown = false;
  countdownNumber = 0;

  // Métricas em tempo real
  currentMetrics = {
    duration: 0,
    distance: 0,
    steps: 0,
    speed: 0,
    calories: 0,
    altitude: 0
  };

  // Timer para atualizar duração
  private durationTimer: Subscription | null = null;
  private subscriptions: Subscription[] = [];
  private pausedTime: number = 0;
  private totalPausedDuration: number = 0;
  
  // Mapbox
  private map: mapboxgl.Map | null = null;
  private userMarker: mapboxgl.Marker | null = null;
  
  // Modo offline
  isOfflineMode: boolean = false;
  canUseOnlineMap: boolean = true;
  @ViewChild(OfflineMapComponent) offlineMapComponent!: OfflineMapComponent;

  constructor(
    private router: Router,
    private geolocationService: GeolocationService,
    private activityService: ActivityService,
    private pedometerService: PedometerService,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private connectivityService: ConnectivityService,
    private accelerometerService: AccelerometerService,
    private voiceGuideService: VoiceGuideService,
    private geoSyncService: GeoSyncService
  ) {
    addIcons({
      playOutline, pauseOutline, stopOutline, cameraOutline, flashlightOutline,
      walkOutline, timeOutline, speedometerOutline, footstepsOutline,
      locationOutline, arrowBackOutline, flashOutline
    });
  }

  async ngOnInit() {
    await this.checkConnectivity();
    this.setupSubscriptions();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  private async checkConnectivity() {
    // Verificar se pode usar mapas online
    this.canUseOnlineMap = await this.connectivityService.canUseOnlineMaps();
    this.isOfflineMode = !this.canUseOnlineMap;
    
    console.log('Modo offline:', this.isOfflineMode);
    
    if (this.isOfflineMode) {
      this.showToast('Sem internet, mas tudo bem! Vou funcionar offline 📱', 'warning');
    }
  }

  ngOnDestroy() {
    this.cleanup();
  }

  private setupSubscriptions() {
    // Monitorar atividade atual
    const activitySub = this.activityService.currentActivity$.subscribe(activity => {
      this.currentActivity = activity;
      if (activity) {
        this.updateMetricsFromActivity(activity);
      }
    });

    // Monitorar status de tracking
    const trackingSub = this.geolocationService.isTracking$.subscribe(isTracking => {
      this.isTracking = isTracking;
    });

    // Monitorar contagem de passos (pedômetro)
    const stepsSub = this.pedometerService.steps$.subscribe(steps => {
      this.currentMetrics.steps = steps;
      this.activityService.updateStepCount(steps);
    });

    // Monitorar acelerômetro (fallback para contagem de passos)
    const accelStepsSub = this.accelerometerService.stepCount$.subscribe(steps => {
      // Usar acelerômetro se pedômetro não estiver funcionando OU se acelerômetro detectar mais passos
      const currentPedometerSteps = this.pedometerService.getCurrentSteps();
      
      // Se pedômetro não funciona (0 passos) ou acelerômetro detectou mais passos
      if (currentPedometerSteps === 0 || steps > currentPedometerSteps) {
        console.log(`📱 Usando acelerômetro: ${steps} passos (pedômetro: ${currentPedometerSteps})`);
        this.currentMetrics.steps = steps;
        this.activityService.updateStepCount(steps);
      }
    });

    // Monitorar pontos da rota
    const routeSub = this.geolocationService.routePoints$.subscribe(points => {
      if (points.length > 0) {
        const routeData = this.geolocationService.calculateRouteData();
        
        // Atualizar distância em tempo real
        this.currentMetrics.distance = routeData.distance;
        this.activityService.updateDistance(routeData.distance);
        
        // Atualizar rota completa
        this.activityService.updateActivityRoute(routeData);
        this.updateMapRoute(points);
        
        console.log(`🗺️ Rota atualizada - Pontos: ${points.length}, Distância: ${routeData.distance.toFixed(1)}m`);
      }
    });

    // Monitorar posição atual
    const positionSub = this.geolocationService.currentPosition$.subscribe(position => {
      if (position) {
        if (this.map && !this.isOfflineMode) {
          this.updateUserPosition(position);
        } else if (this.isOfflineMode && this.offlineMapComponent) {
          this.offlineMapComponent.updatePosition(position);
        }
      }
    });

    this.subscriptions.push(activitySub, trackingSub, stepsSub, accelStepsSub, routeSub, positionSub);
  }

  private initializeMap() {
    if (this.mapContainer) {
      this.map = this.geolocationService.createMapboxMap(
        this.mapContainer.nativeElement,
        [-46.6333, -23.5505] // São Paulo como padrão
      );

      // Adicionar controles de navegação
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Obter posição atual e centralizar mapa
      this.getCurrentLocationAndCenter();
    }
  }

  private async getCurrentLocationAndCenter() {
    const position = await this.geolocationService.getCurrentPosition();
    if (position && this.map) {
      this.map.setCenter([position.longitude, position.latitude]);
      this.updateUserPosition(position);
    }
  }

  private updateUserPosition(position: LocationPoint) {
    if (!this.map) return;

    const lngLat: [number, number] = [position.longitude, position.latitude];

    if (this.userMarker) {
      this.userMarker.setLngLat(lngLat);
    } else {
      // Criar marcador do usuário
      const el = document.createElement('div');
      el.className = 'user-marker';
      el.style.backgroundImage = 'url(data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMTAiIGZpbGw9IiM0Q0FGNTASCZ8L3N2Zz4K)';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      this.userMarker = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .addTo(this.map);
    }

    // Centralizar mapa na posição do usuário se estiver rastreando
    if (this.isTracking) {
      this.map.easeTo({
        center: lngLat,
        duration: 1000
      });
    }
  }

  private updateMapRoute(points: LocationPoint[]) {
    if (points.length < 2) return;
    
    if (this.map && !this.isOfflineMode) {
      this.geolocationService.addRouteToMap(this.map, points);
    } else if (this.isOfflineMode && this.offlineMapComponent) {
      this.offlineMapComponent.updateRoute(points);
    }
  }

  private updateMetricsFromActivity(activity: ActivityData) {
    this.currentMetrics.distance = activity.distance;
    this.currentMetrics.steps = activity.steps;
    this.currentMetrics.calories = activity.calories;
    this.currentMetrics.duration = activity.duration;
    
    // Calcular velocidade atual em km/h
    if (activity.duration > 0 && activity.distance > 0) {
      const speedMs = activity.distance / (activity.duration / 1000); // m/s
      this.currentMetrics.speed = speedMs * 3.6; // km/h
    }
    
    // Atualizar altitude se disponível
    if (activity.route.length > 0) {
      const lastPoint = activity.route[activity.route.length - 1];
      if (lastPoint.altitude !== undefined) {
        this.currentMetrics.altitude = lastPoint.altitude;
      }
    }
    
    console.log(`📊 Métricas atualizadas - Passos: ${activity.steps}, Distância: ${activity.distance.toFixed(1)}m, Velocidade: ${this.currentMetrics.speed.toFixed(1)}km/h`);
  }

  private startDurationTimer() {
    // Parar timer anterior se existir
    this.stopDurationTimer();
    
    // Atualizar imediatamente
    if (this.currentActivity) {
      const now = new Date().getTime();
      this.currentMetrics.duration = now - this.currentActivity.startTime.getTime();
    }
    
    // Depois continuar atualizando a cada segundo
    this.durationTimer = interval(1000).subscribe(() => {
      if (this.currentActivity && !this.isPaused) {
        const now = new Date().getTime();
        const totalElapsed = now - this.currentActivity.startTime.getTime();
        const realDuration = totalElapsed - this.totalPausedDuration;
        
        this.currentMetrics.duration = realDuration;
        
        // Atualizar duração no serviço
        this.activityService.updateDuration(realDuration);
        
        // Calcular velocidade se há distância
        if (this.currentMetrics.distance > 0 && realDuration > 0) {
          const speedMs = this.currentMetrics.distance / (realDuration / 1000); // m/s
          const speedKmh = speedMs * 3.6; // km/h
          this.currentMetrics.speed = speedKmh;
          
          this.activityService.updateSpeed(speedMs, speedMs);
        }
      }
    });
  }

  private stopDurationTimer() {
    if (this.durationTimer) {
      this.durationTimer.unsubscribe();
      this.durationTimer = null;
    }
  }

  private async startCountdown(): Promise<void> {
    return new Promise((resolve) => {
      this.isCountingDown = true;
      this.countdownNumber = 3;
      
      // Anunciar início da contagem regressiva
      this.voiceGuideService.onCountdownStart();
      
      const countdown = setInterval(() => {
        if (this.countdownNumber > 1) {
          this.countdownNumber--;
        } else {
          clearInterval(countdown);
          this.isCountingDown = false;
          this.countdownNumber = 0;
          resolve();
        }
      }, 1000);
    });
  }

  async startActivity() {
    try {
      // Iniciar contagem regressiva
      await this.startCountdown();
      
      console.log('🚀 Iniciando atividade...');
      
      // 1. Garantir que temos um usuário
      const user = this.authService.getCurrentUser();
      if (!user || !user.id) {
        throw new Error('Usuário não disponível');
      }
      console.log('✅ Usuário:', user.name);

      // 2. Criar atividade no serviço
      let activityId: string;
      try {
        activityId = await this.activityService.startActivity(user.id);
        console.log('✅ Atividade criada:', activityId);
        
        // 2.1. Sincronizar localização de início da atividade
        await this.geoSyncService.syncOnActivityStart(activityId);
      } catch (error) {
        console.error('❌ Erro ao criar atividade:', error);
        throw new Error('Falha ao criar atividade');
      }

      // 3. Iniciar serviços (com fallbacks)
      let servicesStarted = 0;
      
      // GPS (opcional)
      try {
        const gpsStarted = await this.geolocationService.startTracking();
        if (gpsStarted) {
          console.log('✅ GPS iniciado');
          servicesStarted++;
        } else {
          console.log('⚠️ GPS não disponível');
        }
      } catch (error) {
        console.log('⚠️ GPS falhou:', error);
      }

      // Pedômetro e Acelerômetro (ambos para máxima precisão)
      try {
        // Resetar e iniciar pedômetro
        this.pedometerService.resetStepCount();
        const pedometerStarted = await this.pedometerService.startTracking();
        if (pedometerStarted) {
          console.log('✅ Pedômetro iniciado');
          servicesStarted++;
        }
        
        // Sempre tentar iniciar acelerômetro como backup/complemento
        try {
          // Resetar contador antes de iniciar
          this.accelerometerService.resetStepCount();
          
          const accelStarted = await this.accelerometerService.startTracking();
          if (accelStarted) {
            console.log('✅ Acelerômetro iniciado como backup');
            servicesStarted++;
          }
        } catch (accelError) {
          console.log('⚠️ Acelerômetro falhou:', accelError);
        }
        
        if (!pedometerStarted) {
          console.log('⚠️ Pedômetro não disponível, usando apenas acelerômetro');
        }
      } catch (error) {
        console.log('⚠️ Erro nos sensores de movimento:', error);
      }

      // 4. Iniciar timer (sempre funciona)
      this.startDurationTimer();
      console.log('✅ Timer iniciado');
      
      // 5. Atualizar estado
      this.isPaused = false;
      this.isTracking = true;
      
      // 6. Feedback para usuário
      if (servicesStarted > 0) {
        this.showToast('🚶‍♀️ Boa! Vamos caminhar juntos!', 'success');
      } else {
        this.showToast('⏱️ Vou cronometrar seu tempo (sensores não disponíveis)', 'warning');
      }
      
      // 7. Anunciar início da atividade por voz
      await this.voiceGuideService.onActivityStart();
      
      console.log('🎉 Atividade iniciada com sucesso!');
      
    } catch (error) {
      console.error('💥 Erro crítico:', error);
      this.showToast('Ops! Algo deu errado. Tenta de novo? 🤔', 'danger');
    }
  }

  async pauseActivity() {
    if (this.currentActivity) {
      // Salvar o tempo pausado
      this.pausedTime = new Date().getTime();
      
      this.activityService.pauseActivity();
      this.isPaused = true;
      
      // Anunciar pausa por voz
      await this.voiceGuideService.onActivityPause();
      
      this.showToast('Descanse um pouco! Estarei aqui quando quiser continuar 😊', 'warning');
    }
  }

  async resumeActivity() {
    if (this.currentActivity && this.isPaused) {
      // Calcular tempo pausado
      const resumeTime = new Date().getTime();
      this.totalPausedDuration += (resumeTime - this.pausedTime);
      
      this.activityService.resumeActivity();
      this.isPaused = false;
      
      // Anunciar retomada por voz
      await this.voiceGuideService.onActivityResume();
      
      this.showToast('Que bom que voltou! Vamos continuar! 💪', 'success');
    }
  }

  async stopActivity() {
    const alert = await this.alertController.create({
      header: 'Terminar por hoje?',
      message: 'Tem certeza que quer finalizar sua caminhada?',
      buttons: [
        {
          text: 'Não, vou continuar',
          role: 'cancel'
        },
        {
          text: 'Sim, terminei!',
          handler: () => {
            this.finishActivity();
          }
        }
      ]
    });

    await alert.present();
  }

  private async finishActivity() {
    try {
      console.log('🏁 Finalizando atividade...');
      
      // Parar todos os serviços
      await this.geolocationService.stopTracking();
      await this.pedometerService.stopTracking();
      await this.accelerometerService.stopTracking();
      this.stopDurationTimer();

      // Finalizar atividade no serviço
      const completedActivity = await this.activityService.finishActivity();
      
      if (completedActivity) {
        console.log('✅ Atividade finalizada:', completedActivity);
        
        // Sincronizar localização de fim da atividade
        await this.geoSyncService.syncOnActivityEnd(completedActivity.id);
        
        // Anunciar finalização por voz
        await this.voiceGuideService.onActivityEnd(completedActivity);
        
        // Mostrar resumo da atividade
        await this.showActivitySummary(completedActivity);
        
        // Resetar estado
        this.currentActivity = null;
        this.isTracking = false;
        this.isPaused = false;
        this.resetMetrics();
        
        this.showToast('Parabéns! Você arrasou na caminhada! 🎉', 'success');
      } else {
        this.showToast('Ops! Não consegui salvar sua caminhada 😕', 'danger');
      }
    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      this.showToast('Algo deu errado ao finalizar. Tenta de novo? 🤔', 'danger');
    }
  }

  private async showActivitySummary(activity: ActivityData) {
    // Criar uma mensagem mais fluida e natural
    let message = `Você caminhou ${this.formatDistance(activity.distance)} em ${this.formatDuration(activity.duration)}! `;
    message += `Deu ${activity.steps.toLocaleString()} passos e queimou ${activity.calories} calorias. `;
    
    if (activity.averageSpeed > 0) {
      message += `Seu ritmo foi de ${this.formatSpeed(activity.averageSpeed)}. `;
    }
    
    if (activity.route && activity.route.length > 0) {
      message += `Registrei ${activity.route.length} pontos do seu percurso.`;
    }

    const alert = await this.alertController.create({
      header: '🎉 Parabéns!',
      subHeader: 'Caminhada concluída com sucesso!',
      message: message,
      buttons: [
        {
          text: 'Ver Histórico',
          handler: () => {
            this.router.navigate(['/history']);
          }
        },
        {
          text: 'Nova Caminhada',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  private resetMetrics() {
    this.currentMetrics = {
      duration: 0,
      distance: 0,
      steps: 0,
      speed: 0,
      calories: 0,
      altitude: 0
    };
    
    // Resetar variáveis de pausa
    this.pausedTime = 0;
    this.totalPausedDuration = 0;
  }

  private formatDistance(distance: number): string {
    return distance >= 1000 ? 
      `${(distance / 1000).toFixed(2)} km` : 
      `${distance.toFixed(0)} m`;
  }

  private formatDuration(duration: number): string {
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  private formatSpeed(speed: number): string {
    const kmh = speed * 3.6;
    return `${kmh.toFixed(1)} km/h`;
  }

  async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (image.webPath) {
        this.activityService.addPhoto(image.webPath);
        this.showToast('Que foto linda! Momento registrado! 📸', 'success');
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      this.showToast('Não consegui tirar a foto. Tenta de novo? 📷', 'danger');
    }
  }

  async toggleFlashlight() {
    try {
      if (this.isFlashlightOn) {
        await CapacitorFlash.switchOff();
        this.isFlashlightOn = false;
        this.showToast('Luz apagada! 💡', 'medium');
      } else {
        await CapacitorFlash.switchOn({ intensity: 1 });
        this.isFlashlightOn = true;
        this.showToast('Agora você pode ver melhor! 🔦', 'light');
      }
    } catch (error) {
      console.error('Erro ao controlar lanterna:', error);
      this.showToast('Ops! Não consegui controlar a lanterna 🔦', 'danger');
    }
  }

  getLastRoutePoint(): LocationPoint | null {
    if (this.currentActivity?.route && this.currentActivity.route.length > 0) {
      return this.currentActivity.route[this.currentActivity.route.length - 1];
    }
    return null;
  }

  private cleanup() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopDurationTimer();
    
    if (this.map) {
      this.map.remove();
    }
  }

  // Getters para formatação
  get formattedDuration(): string {
    const totalSeconds = Math.floor(this.currentMetrics.duration / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  get formattedDistance(): string {
    // FORÇAR: Nunca mostrar informações de altitude, sempre distância percorrida
    let distance = Number(this.currentMetrics.distance) || 0;
    
    // Garantir que é sempre um número positivo (distância percorrida)
    distance = Math.abs(distance);
    
    // Retornar texto natural e legível - SEMPRE controlado por nós
    let result = '';
    if (distance === 0) {
      result = '0 m';
    } else if (distance >= 1000) {
      result = `${(distance / 1000).toFixed(2)} km`;
    } else {
      result = `${distance.toFixed(0)} m`;
    }
    
    // Log para debug
    console.log('formattedDistance retornando:', result);
    return result;
  }

  get formattedSpeed(): string {
    const speedKmh = this.currentMetrics.speed || 0;
    if (speedKmh < 0.1) {
      return '0.0 km/h';
    }
    return `${speedKmh.toFixed(1)} km/h`;
  }

  get formattedAltitude(): string {
    const altitude = this.currentMetrics.altitude;
    
    // Se não tem altitude válida, retorna texto natural
    if (!altitude || altitude <= 0) {
      return 'Caminhada no plano';
    }
    
    // Formatação natural baseada na altitude
    if (altitude < 50) {
      return 'Bem pertinho do chão';
    } else if (altitude < 100) {
      return `${Math.round(altitude)}m de altura`;
    } else if (altitude < 300) {
      return `Subindo ${Math.round(altitude)}m`;
    } else if (altitude < 500) {
      return `Que subida! ${Math.round(altitude)}m`;
    } else if (altitude < 1000) {
      return `Lá no alto! ${Math.round(altitude)}m`;
    } else {
      return `Nas alturas! ${(altitude / 1000).toFixed(1)}km`;
    }
  }

  get activityStatus(): string {
    if (!this.currentActivity) return 'Não iniciada';
    if (this.isPaused) return 'Pausada';
    if (this.isTracking) return 'Ativa';
    return 'Preparando...';
  }

  get statusColor(): string {
    if (!this.currentActivity) return 'medium';
    if (this.isPaused) return 'warning';
    if (this.isTracking) return 'success';
    return 'primary';
  }

  goBack() {
    if (this.currentActivity) {
      this.stopActivity();
    } else {
      this.router.navigate(['/dashboard']);
    }
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
}

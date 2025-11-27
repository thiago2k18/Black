import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem,
  IonLabel, IonToggle, IonSelect, IonSelectOption, IonButton, IonIcon,
  IonRange, IonNote, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  settingsOutline, notificationsOutline, colorPaletteOutline, 
  speedometerOutline, saveOutline, refreshOutline, optionsOutline,
  brushOutline, lockClosedOutline, trophyOutline, informationCircleOutline,
  trashOutline
} from 'ionicons/icons';

import { NotificationService, NotificationSettings } from '../../services/notification.service';
import { StorageService } from '../../services/storage.service';
import { VoiceGuideService } from '../../services/voice-guide.service';
import { GeoSyncService } from '../../services/geo-sync.service';

interface AppSettings {
  notifications: NotificationSettings;
  units: {
    distance: 'km' | 'mi';
    speed: 'kmh' | 'mph';
  };
  goals: {
    dailySteps: number;
    dailyDistance: number; // em metros
    dailyDuration: number; // em minutos
  };
  privacy: {
    shareLocation: boolean;
    shareActivities: boolean;
  };
  appearance: {
    theme: 'auto' | 'light' | 'dark';
    mapStyle: 'streets' | 'satellite' | 'outdoors';
  };
  voice: {
    enabled: boolean;
    rate: number;
    pitch: number;
    volume: number;
  };
  location: {
    syncEnabled: boolean;
  };
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonList, IonItem,
    IonLabel, IonToggle, IonSelect, IonSelectOption, IonButton, IonIcon,
    IonRange
  ]
})
export class SettingsPage implements OnInit {
  settings: AppSettings = {
    notifications: {
      enabled: true,
      activityReminders: true,
      goalAchievements: true,
      weeklyReports: true,
      soundEnabled: true,
      vibrationEnabled: true
    },
    units: {
      distance: 'km',
      speed: 'kmh'
    },
    goals: {
      dailySteps: 10000,
      dailyDistance: 5000, // 5km
      dailyDuration: 60 // 60 minutos
    },
    privacy: {
      shareLocation: false,
      shareActivities: false
    },
    appearance: {
      theme: 'auto',
      mapStyle: 'streets'
    },
    voice: {
      enabled: true,
      rate: 0.8,
      pitch: 1.0,
      volume: 0.8
    },
    location: {
      syncEnabled: true
    }
  };

  constructor(
    private notificationService: NotificationService,
    private storageService: StorageService,
    private toastController: ToastController,
    private voiceGuideService: VoiceGuideService,
    private geoSyncService: GeoSyncService
  ) {
    addIcons({
      settingsOutline, notificationsOutline, colorPaletteOutline,
      speedometerOutline, saveOutline, refreshOutline, optionsOutline,
      brushOutline, lockClosedOutline, trophyOutline, informationCircleOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadSettings();
  }

  private async loadSettings() {
    try {
      // Carregar configurações de notificação
      this.settings.notifications = this.notificationService.getSettings();

      // Carregar configurações de voz
      const voiceSettings = this.voiceGuideService.getSettings();
      this.settings.voice = {
        enabled: voiceSettings.enabled,
        rate: voiceSettings.rate,
        pitch: voiceSettings.pitch,
        volume: voiceSettings.volume
      };

      // Carregar configurações de localização
      this.settings.location = {
        syncEnabled: this.geoSyncService.isLocationSyncEnabled()
      };

      // Carregar outras configurações do storage
      const savedSettings = await this.storageService.getSettings();
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  }

  async saveSettings() {
    try {
      // Salvar configurações de notificação
      await this.notificationService.saveSettings(this.settings.notifications);

      // Salvar configurações de voz
      this.voiceGuideService.updateSettings({
        enabled: this.settings.voice.enabled,
        language: 'pt-BR',
        rate: this.settings.voice.rate,
        pitch: this.settings.voice.pitch,
        volume: this.settings.voice.volume
      });

      // Salvar configurações de localização
      this.geoSyncService.setLocationSyncEnabled(this.settings.location.syncEnabled);

      // Salvar outras configurações
      await this.storageService.setSettings(this.settings);

      // Aplicar configurações de tema
      this.applyTheme();

      this.showToast('Configurações salvas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      this.showToast('Erro ao salvar configurações', 'danger');
    }
  }

  async resetSettings() {
    try {
      // Resetar para configurações padrão
      this.settings = {
        notifications: {
          enabled: true,
          activityReminders: true,
          goalAchievements: true,
          weeklyReports: true,
          soundEnabled: true,
          vibrationEnabled: true
        },
        units: {
          distance: 'km',
          speed: 'kmh'
        },
        goals: {
          dailySteps: 10000,
          dailyDistance: 5000,
          dailyDuration: 60
        },
        privacy: {
          shareLocation: false,
          shareActivities: false
        },
        appearance: {
          theme: 'auto',
          mapStyle: 'streets'
        },
        voice: {
          enabled: true,
          rate: 0.8,
          pitch: 1.0,
          volume: 0.8
        },
        location: {
          syncEnabled: true
        }
      };

      await this.saveSettings();
      this.showToast('Configurações resetadas!', 'warning');
    } catch (error) {
      console.error('Erro ao resetar configurações:', error);
      this.showToast('Erro ao resetar configurações', 'danger');
    }
  }

  private applyTheme() {
    const theme = this.settings.appearance.theme;
    
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else if (theme === 'light') {
      document.body.classList.remove('dark');
    } else {
      // Auto - usar preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      document.body.classList.toggle('dark', prefersDark.matches);
    }
  }

  onNotificationToggle() {
    if (!this.settings.notifications.enabled) {
      // Se desabilitar notificações, desabilitar todas as sub-opções
      this.settings.notifications.activityReminders = false;
      this.settings.notifications.goalAchievements = false;
      this.settings.notifications.weeklyReports = false;
    }
  }

  onThemeChange() {
    this.applyTheme();
  }

  formatStepsValue(value: number): string {
    return `${value.toLocaleString()} passos`;
  }

  formatDistanceValue(value: number): string {
    const km = value / 1000;
    return `${km.toFixed(1)} km`;
  }

  formatDurationValue(value: number): string {
    const hours = Math.floor(value / 60);
    const minutes = value % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
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

  async clearAppData() {
    try {
      await this.storageService.clear();
      this.showToast('Dados do aplicativo limpos!', 'warning');
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      this.showToast('Erro ao limpar dados', 'danger');
    }
  }

  async getStorageInfo() {
    try {
      const info = await this.storageService.getStorageInfo();
      this.showToast(
        `${info.totalItems} itens salvos, ${info.pendingSync} pendentes`,
        'medium'
      );
    } catch (error) {
      console.error('Erro ao obter informações de storage:', error);
    }
  }

  // Métodos para configurações de voz
  async testVoice() {
    await this.voiceGuideService.testVoice();
  }

  onVoiceToggle() {
    if (!this.settings.voice.enabled) {
      // Parar qualquer fala em andamento
      this.voiceGuideService.stop();
    }
  }

  // Métodos para configurações de localização
  onLocationSyncToggle() {
    if (this.settings.location.syncEnabled) {
      this.showToast('Sincronização de localização ativada', 'success');
    } else {
      this.showToast('Sincronização de localização desativada', 'warning');
    }
  }

  getSyncInfo() {
    const pendingCount = this.geoSyncService.getPendingSyncCount();
    const lastSync = this.geoSyncService.getLastSyncTime();
    
    let message = `${pendingCount} localizações pendentes`;
    if (lastSync) {
      const timeAgo = Math.floor((Date.now() - lastSync.getTime()) / 60000);
      message += `, última sync há ${timeAgo} min`;
    }
    
    this.showToast(message, 'medium');
  }
}

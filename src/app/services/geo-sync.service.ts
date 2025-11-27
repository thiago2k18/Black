import { Injectable } from '@angular/core';
import { GeolocationService, LocationPoint } from './geolocation.service';
import { ConnectivityService } from './connectivity.service';
import { AuthService } from './auth.service';
import { ActivityService } from './activity.service';

export interface UserLocation {
  lat: number;
  lng: number;
  city?: string;
  state?: string;
  country?: string;
  accuracy?: number;
  timestamp: Date;
}

export interface LocationSyncData {
  userId: string;
  location: UserLocation;
  syncType: 'profile_update' | 'activity_start' | 'activity_end';
  activityId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GeoSyncService {
  private syncQueue: LocationSyncData[] = [];
  private isEnabled = true;
  private lastSyncTime = 0;
  private readonly SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutos

  constructor(
    private geolocationService: GeolocationService,
    private connectivityService: ConnectivityService,
    private authService: AuthService,
    private activityService: ActivityService
  ) {
    this.loadSyncQueue();
    this.setupConnectivityListener();
  }

  // Configurações
  isLocationSyncEnabled(): boolean {
    return this.isEnabled;
  }

  setLocationSyncEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.clearSyncQueue();
    }
  }

  // Sincronização principal
  async syncUserLocation(syncType: 'profile_update' | 'activity_start' | 'activity_end', activityId?: string): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('🌍 Sync de localização desabilitado');
      return false;
    }

    // Cooldown para evitar muitas requisições
    const now = Date.now();
    if (syncType === 'profile_update' && (now - this.lastSyncTime) < this.SYNC_COOLDOWN) {
      console.log('🌍 Sync em cooldown, aguardando...');
      return false;
    }

    try {
      console.log(`🌍 Iniciando sync de localização: ${syncType}`);
      
      // Obter localização atual
      const location = await this.getCurrentUserLocation();
      if (!location) {
        console.log('🌍 Não foi possível obter localização');
        return false;
      }

      const user = this.authService.getCurrentUser();
      if (!user?.id) {
        console.log('🌍 Usuário não disponível para sync');
        return false;
      }

      const syncData: LocationSyncData = {
        userId: user.id,
        location,
        syncType,
        activityId
      };

      // Tentar sincronizar imediatamente se online
      const isOnline = this.connectivityService.isOnline;
      if (isOnline) {
        const success = await this.performSync(syncData);
        if (success) {
          this.lastSyncTime = now;
          console.log('🌍 Sync realizado com sucesso');
          return true;
        }
      }

      // Se offline ou falhou, adicionar à fila
      this.addToSyncQueue(syncData);
      console.log('🌍 Adicionado à fila de sync offline');
      return false;

    } catch (error) {
      console.error('🌍 Erro no sync de localização:', error);
      return false;
    }
  }

  // Obter localização atual com geocoding
  private async getCurrentUserLocation(): Promise<UserLocation | null> {
    try {
      const position = await this.geolocationService.getCurrentPosition();
      if (!position) {
        return null;
      }

      const location: UserLocation = {
        lat: position.latitude,
        lng: position.longitude,
        accuracy: position.accuracy,
        timestamp: new Date()
      };

      // Tentar resolver cidade/estado (opcional)
      try {
        const geocoded = await this.reverseGeocode(position.latitude, position.longitude);
        if (geocoded) {
          location.city = geocoded.city;
          location.state = geocoded.state;
          location.country = geocoded.country;
        }
      } catch (geocodeError) {
        console.log('🌍 Geocoding falhou, continuando sem cidade/estado');
      }

      return location;

    } catch (error) {
      console.error('🌍 Erro ao obter localização:', error);
      return null;
    }
  }

  // Geocoding reverso (opcional - requer API key do Mapbox)
  private async reverseGeocode(lat: number, lng: number): Promise<{city?: string, state?: string, country?: string} | null> {
    // Por enquanto, retorna null - pode ser implementado com Mapbox Geocoding API
    // Requer configuração de API key e endpoint
    return null;
  }

  // Sincronização com servidor
  private async performSync(syncData: LocationSyncData): Promise<boolean> {
    try {
      // Aqui você integraria com Supabase ou seu backend
      // Por enquanto, simula o sync salvando localmente
      
      console.log('🌍 Simulando sync com servidor:', {
        userId: syncData.userId,
        lat: syncData.location.lat,
        lng: syncData.location.lng,
        city: syncData.location.city,
        type: syncData.syncType
      });

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));

      // Aqui seria algo como:
      // await this.supabaseService.updateUserLocation(syncData);
      
      return true;

    } catch (error) {
      console.error('🌍 Erro ao sincronizar com servidor:', error);
      return false;
    }
  }

  // Gerenciamento da fila offline
  private addToSyncQueue(syncData: LocationSyncData): void {
    // Evitar duplicatas recentes
    const existing = this.syncQueue.find(item => 
      item.userId === syncData.userId && 
      item.syncType === syncData.syncType &&
      (Date.now() - new Date(item.location.timestamp).getTime()) < 60000 // 1 minuto
    );

    if (!existing) {
      this.syncQueue.push(syncData);
      this.saveSyncQueue();
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (this.syncQueue.length === 0) {
      return;
    }

    console.log(`🌍 Processando fila de sync: ${this.syncQueue.length} itens`);

    const itemsToRemove: number[] = [];
    
    for (let i = 0; i < this.syncQueue.length; i++) {
      const item = this.syncQueue[i];
      
      try {
        const success = await this.performSync(item);
        if (success) {
          itemsToRemove.push(i);
        }
      } catch (error) {
        console.error('🌍 Erro ao processar item da fila:', error);
      }
    }

    // Remover itens sincronizados (em ordem reversa para não afetar índices)
    itemsToRemove.reverse().forEach(index => {
      this.syncQueue.splice(index, 1);
    });

    if (itemsToRemove.length > 0) {
      this.saveSyncQueue();
      console.log(`🌍 ${itemsToRemove.length} itens sincronizados da fila`);
    }
  }

  private clearSyncQueue(): void {
    this.syncQueue = [];
    this.saveSyncQueue();
  }

  // Listener de conectividade
  private setupConnectivityListener(): void {
    // Processar fila quando voltar online
    // Nota: Implementação simplificada - em produção usaria Network plugin
    setInterval(async () => {
      const isOnline = this.connectivityService.isOnline;
      if (isOnline && this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, 30000); // Verificar a cada 30 segundos
  }

  // Métodos de conveniência para diferentes tipos de sync
  async syncOnAppStart(): Promise<void> {
    console.log('🌍 Sync na abertura do app');
    await this.syncUserLocation('profile_update');
  }

  async syncOnActivityStart(activityId: string): Promise<void> {
    console.log('🌍 Sync no início da atividade');
    await this.syncUserLocation('activity_start', activityId);
  }

  async syncOnActivityEnd(activityId: string): Promise<void> {
    console.log('🌍 Sync no fim da atividade');
    await this.syncUserLocation('activity_end', activityId);
  }

  // Informações para UI
  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  getLastSyncTime(): Date | null {
    return this.lastSyncTime > 0 ? new Date(this.lastSyncTime) : null;
  }

  // Persistência
  private saveSyncQueue(): void {
    try {
      localStorage.setItem('geo-sync-queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('🌍 Erro ao salvar fila de sync:', error);
    }
  }

  private loadSyncQueue(): void {
    try {
      const saved = localStorage.getItem('geo-sync-queue');
      if (saved) {
        this.syncQueue = JSON.parse(saved);
      }
    } catch (error) {
      console.error('🌍 Erro ao carregar fila de sync:', error);
      this.syncQueue = [];
    }
  }

  private saveSettings(): void {
    try {
      const settings = {
        enabled: this.isEnabled,
        lastSyncTime: this.lastSyncTime
      };
      localStorage.setItem('geo-sync-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('🌍 Erro ao salvar configurações:', error);
    }
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('geo-sync-settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.isEnabled = settings.enabled ?? true;
        this.lastSyncTime = settings.lastSyncTime ?? 0;
      }
    } catch (error) {
      console.error('🌍 Erro ao carregar configurações:', error);
    }
  }
}

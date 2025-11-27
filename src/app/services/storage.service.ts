import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

export interface StorageItem {
  key: string;
  value: any;
  timestamp: number;
  synced: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$ = this.isOnlineSubject.asObservable();

  private pendingSyncSubject = new BehaviorSubject<StorageItem[]>([]);
  public pendingSync$ = this.pendingSyncSubject.asObservable();

  constructor() {
    this.initializeNetworkListener();
    this.loadPendingSync();
  }

  private async initializeNetworkListener(): Promise<void> {
    // Verificar status inicial da rede
    const status = await Network.getStatus();
    this.isOnlineSubject.next(status.connected);

    // Escutar mudanças na conectividade
    Network.addListener('networkStatusChange', (status) => {
      this.isOnlineSubject.next(status.connected);
      
      // Se voltou online, tentar sincronizar dados pendentes
      if (status.connected) {
        this.syncPendingData();
      }
    });
  }

  private async loadPendingSync(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'pendingSync' });
      if (value) {
        const pendingItems = JSON.parse(value);
        this.pendingSyncSubject.next(pendingItems);
      }
    } catch (error) {
      console.error('Erro ao carregar dados pendentes:', error);
    }
  }

  private async savePendingSync(): Promise<void> {
    try {
      const pendingItems = this.pendingSyncSubject.value;
      await Preferences.set({
        key: 'pendingSync',
        value: JSON.stringify(pendingItems)
      });
    } catch (error) {
      console.error('Erro ao salvar dados pendentes:', error);
    }
  }

  async set(key: string, value: any, requiresSync: boolean = false): Promise<void> {
    try {
      const timestamp = Date.now();
      const isOnline = this.isOnlineSubject.value;

      // Salvar localmente
      await Preferences.set({
        key: key,
        value: JSON.stringify({
          data: value,
          timestamp: timestamp,
          synced: isOnline && !requiresSync
        })
      });

      // Se offline ou requer sincronização, adicionar à fila
      if (!isOnline || requiresSync) {
        const storageItem: StorageItem = {
          key: key,
          value: value,
          timestamp: timestamp,
          synced: false
        };

        const pendingItems = this.pendingSyncSubject.value;
        const existingIndex = pendingItems.findIndex(item => item.key === key);
        
        if (existingIndex >= 0) {
          pendingItems[existingIndex] = storageItem;
        } else {
          pendingItems.push(storageItem);
        }

        this.pendingSyncSubject.next([...pendingItems]);
        await this.savePendingSync();
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }
  }

  async get(key: string): Promise<any> {
    try {
      const { value } = await Preferences.get({ key: key });
      if (value) {
        const parsed = JSON.parse(value);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar dados:', error);
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await Preferences.remove({ key: key });
      
      // Remover da fila de sincronização se existir
      const pendingItems = this.pendingSyncSubject.value;
      const updatedItems = pendingItems.filter(item => item.key !== key);
      this.pendingSyncSubject.next(updatedItems);
      await this.savePendingSync();
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await Preferences.clear();
      this.pendingSyncSubject.next([]);
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }

  async keys(): Promise<string[]> {
    try {
      const { keys } = await Preferences.keys();
      return keys;
    } catch (error) {
      console.error('Erro ao obter chaves:', error);
      return [];
    }
  }

  private async syncPendingData(): Promise<void> {
    try {
      const pendingItems = this.pendingSyncSubject.value;
      const syncedItems: string[] = [];

      for (const item of pendingItems) {
        try {
          // Aqui você implementaria a sincronização com o servidor (Supabase)
          // Por enquanto, apenas marcamos como sincronizado
          await this.markAsSynced(item.key);
          syncedItems.push(item.key);
        } catch (error) {
          console.error(`Erro ao sincronizar item ${item.key}:`, error);
        }
      }

      // Remover itens sincronizados da fila
      const remainingItems = pendingItems.filter(item => !syncedItems.includes(item.key));
      this.pendingSyncSubject.next(remainingItems);
      await this.savePendingSync();

      console.log(`Sincronizados ${syncedItems.length} itens`);
    } catch (error) {
      console.error('Erro na sincronização:', error);
    }
  }

  private async markAsSynced(key: string): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: key });
      if (value) {
        const parsed = JSON.parse(value);
        parsed.synced = true;
        
        await Preferences.set({
          key: key,
          value: JSON.stringify(parsed)
        });
      }
    } catch (error) {
      console.error('Erro ao marcar como sincronizado:', error);
    }
  }

  async getStorageInfo(): Promise<{
    totalItems: number;
    pendingSync: number;
    isOnline: boolean;
  }> {
    try {
      const keys = await this.keys();
      const pendingItems = this.pendingSyncSubject.value;
      
      return {
        totalItems: keys.length,
        pendingSync: pendingItems.length,
        isOnline: this.isOnlineSubject.value
      };
    } catch (error) {
      console.error('Erro ao obter informações de storage:', error);
      return {
        totalItems: 0,
        pendingSync: 0,
        isOnline: false
      };
    }
  }

  // Métodos específicos para diferentes tipos de dados
  async setActivity(activityId: string, activityData: any): Promise<void> {
    await this.set(`activity_${activityId}`, activityData, true);
  }

  async getActivity(activityId: string): Promise<any> {
    return await this.get(`activity_${activityId}`);
  }

  async setUserProfile(userId: string, profileData: any): Promise<void> {
    await this.set(`profile_${userId}`, profileData, true);
  }

  async getUserProfile(userId: string): Promise<any> {
    return await this.get(`profile_${userId}`);
  }

  async setSettings(settings: any): Promise<void> {
    await this.set('app_settings', settings, false);
  }

  async getSettings(): Promise<any> {
    return await this.get('app_settings');
  }

  // Método para forçar sincronização manual
  async forcSync(): Promise<boolean> {
    try {
      if (this.isOnlineSubject.value) {
        await this.syncPendingData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro na sincronização forçada:', error);
      return false;
    }
  }

  isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  getPendingSyncCount(): number {
    return this.pendingSyncSubject.value.length;
  }
}

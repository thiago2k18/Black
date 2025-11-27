import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Network } from '@capacitor/network';

@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  private isOnlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$: Observable<boolean> = this.isOnlineSubject.asObservable();

  constructor() {
    this.initializeNetworkListener();
  }

  private async initializeNetworkListener() {
    // Verificar status inicial
    const status = await Network.getStatus();
    this.isOnlineSubject.next(status.connected);

    // Escutar mudanças de conectividade
    Network.addListener('networkStatusChange', status => {
      console.log('Network status changed:', status);
      this.isOnlineSubject.next(status.connected);
    });
  }

  get isOnline(): boolean {
    return this.isOnlineSubject.value;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      this.isOnlineSubject.next(status.connected);
      return status.connected;
    } catch (error) {
      console.error('Erro ao verificar conectividade:', error);
      // Em caso de erro, assumir offline
      this.isOnlineSubject.next(false);
      return false;
    }
  }

  // Método para testar conectividade real (não apenas WiFi/dados)
  async testInternetConnection(): Promise<boolean> {
    if (!this.isOnline) {
      return false;
    }

    try {
      // Tentar fazer uma requisição simples
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch (error) {
      console.log('Internet não disponível, mesmo com conexão ativa');
      return false;
    }
  }

  // Método para verificar se pode usar mapas online
  async canUseOnlineMaps(): Promise<boolean> {
    const hasConnection = await this.checkConnection();
    if (!hasConnection) {
      return false;
    }

    // Testar se consegue acessar tiles do Mapbox
    try {
      const testUrl = 'https://api.mapbox.com/styles/v1/mapbox/streets-v11/tiles/256/0/0/0?access_token=test';
      const response = await fetch(testUrl, {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch (error) {
      console.log('Mapbox não acessível, usando modo offline');
      return false;
    }
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Geolocation, Position } from '@capacitor/geolocation';
import { environment } from '../../environments/environment';
import * as mapboxgl from 'mapbox-gl';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  altitude?: number;
  speed?: number;
}

export interface RouteData {
  points: LocationPoint[];
  distance: number;
  duration: number;
  averageSpeed: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {
  private currentPositionSubject = new BehaviorSubject<LocationPoint | null>(null);
  public currentPosition$ = this.currentPositionSubject.asObservable();

  private isTrackingSubject = new BehaviorSubject<boolean>(false);
  public isTracking$ = this.isTrackingSubject.asObservable();

  private routePointsSubject = new BehaviorSubject<LocationPoint[]>([]);
  public routePoints$ = this.routePointsSubject.asObservable();

  private watchId: string | null = null;
  private mapboxAccessToken = environment.mapbox.accessToken;

  constructor() {
    // Configurar Mapbox - será configurado quando necessário
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissões de localização:', error);
      return false;
    }
  }

  async getCurrentPosition(): Promise<LocationPoint | null> {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000 // Reduzir para GPS mais atualizado
      });

      const locationPoint: LocationPoint = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
        altitude: position.coords.altitude || undefined,
        speed: position.coords.speed || undefined
      };

      this.currentPositionSubject.next(locationPoint);
      return locationPoint;
    } catch (error) {
      console.error('Erro ao obter posição atual:', error);
      return null;
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      console.log('🛰️ Iniciando GPS tracking...');
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.error('❌ Permissão de GPS negada');
        throw new Error('Permissão de localização negada');
      }
      console.log('✅ Permissão de GPS concedida');

      this.watchId = await Geolocation.watchPosition(
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 3000 // Atualização mais frequente para caminhadas
        },
        (position, err) => {
          if (err) {
            console.error('Erro no tracking:', err);
            return;
          }

          if (position) {
            const locationPoint: LocationPoint = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp,
              altitude: position.coords.altitude || undefined,
              speed: position.coords.speed || undefined
            };

            console.log(`📍 GPS: ${locationPoint.latitude.toFixed(6)}, ${locationPoint.longitude.toFixed(6)} (±${locationPoint.accuracy.toFixed(1)}m)`);

            // Filtrar pontos com baixa precisão (> 25 metros)
            if (locationPoint.accuracy <= 25) {
              this.addRoutePoint(locationPoint);
              this.currentPositionSubject.next(locationPoint);
              console.log('✅ Posição GPS aceita e adicionada à rota');
            } else {
              console.log(`⚠️ GPS com baixa precisão (${locationPoint.accuracy.toFixed(1)}m) - ignorado`);
            }
          }
        }
      );

      this.isTrackingSubject.next(true);
      console.log('🎉 GPS tracking iniciado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao iniciar tracking:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      if (this.watchId) {
        await Geolocation.clearWatch({ id: this.watchId });
        this.watchId = null;
      }
      this.isTrackingSubject.next(false);
    } catch (error) {
      console.error('Erro ao parar tracking:', error);
    }
  }

  private addRoutePoint(point: LocationPoint): void {
    const currentPoints = this.routePointsSubject.value;
    const lastPoint = currentPoints[currentPoints.length - 1];

    // Filtrar movimentos muito pequenos (< 3 metros)
    if (lastPoint) {
      const distance = this.calculateDistance(
        lastPoint.latitude, lastPoint.longitude,
        point.latitude, point.longitude
      );
      if (distance < 3) {
        return; // Ignorar movimento muito pequeno
      }
    }

    const updatedPoints = [...currentPoints, point];
    this.routePointsSubject.next(updatedPoints);
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  calculateRouteData(): RouteData {
    const points = this.routePointsSubject.value;
    
    if (points.length < 2) {
      return {
        points: points,
        distance: 0,
        duration: 0,
        averageSpeed: 0
      };
    }

    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const distance = this.calculateDistance(
        points[i-1].latitude, points[i-1].longitude,
        points[i].latitude, points[i].longitude
      );
      totalDistance += distance;
    }

    const duration = points[points.length - 1].timestamp - points[0].timestamp;
    const averageSpeed = duration > 0 ? (totalDistance / (duration / 1000)) : 0;

    return {
      points: points,
      distance: totalDistance,
      duration: duration,
      averageSpeed: averageSpeed
    };
  }

  clearRoute(): void {
    this.routePointsSubject.next([]);
  }

  createMapboxMap(container: string, center?: [number, number]): mapboxgl.Map {
    return new mapboxgl.Map({
      container: container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: center || [-46.6333, -23.5505], // São Paulo como padrão
      zoom: 15,
      attributionControl: false,
      accessToken: this.mapboxAccessToken
    });
  }

  addRouteToMap(map: mapboxgl.Map, points: LocationPoint[]): void {
    if (points.length < 2) return;

    const coordinates = points.map(point => [point.longitude, point.latitude]);

    // Remover rota anterior se existir
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }

    // Adicionar nova rota
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#4CAF50',
        'line-width': 4
      }
    });

    // Ajustar zoom para mostrar toda a rota
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
    map.fitBounds(bounds, { padding: 50 });
  }
}

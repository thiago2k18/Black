import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonLabel, IonList, IonItem
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mapOutline, layersOutline, locationOutline, navigateOutline,
  walkOutline, refreshOutline, analyticsOutline, footstepsOutline,
  timeOutline, speedometerOutline, chevronForwardOutline
} from 'ionicons/icons';
import * as mapboxgl from 'mapbox-gl';

import { GeolocationService, LocationPoint } from '../../services/geolocation.service';
import { ActivityService, ActivityData } from '../../services/activity.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-maps',
  templateUrl: './maps.page.html',
  styleUrls: ['./maps.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonItem
  ]
})
export class MapsPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private map: mapboxgl.Map | null = null;
  selectedSegment: string = 'current';
  activities: ActivityData[] = [];
  currentPosition: LocationPoint | null = null;
  selectedActivityId: string | null = null;

  constructor(
    private geolocationService: GeolocationService,
    private activityService: ActivityService
  ) {
    addIcons({
      mapOutline, layersOutline, locationOutline, navigateOutline,
      walkOutline, refreshOutline, analyticsOutline, footstepsOutline,
      timeOutline, speedometerOutline, chevronForwardOutline
    });
  }

  ngOnInit() {
    this.loadActivities();
    this.getCurrentPosition();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.initializeMap();
    }, 100);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private initializeMap() {
    if (this.mapContainer) {
      this.map = new mapboxgl.Map({
        container: this.mapContainer.nativeElement,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-46.6333, -23.5505], // São Paulo como padrão
        zoom: 12,
        accessToken: environment.mapbox.accessToken
      });

      // Adicionar controles
      this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      this.map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }), 'top-right');

      // Carregar dados baseado no segmento selecionado
      this.map.on('load', () => {
        this.loadMapData();
      });
    }
  }

  private async getCurrentPosition() {
    this.currentPosition = await this.geolocationService.getCurrentPosition();
    if (this.currentPosition && this.map) {
      this.map.setCenter([this.currentPosition.longitude, this.currentPosition.latitude]);
    }
  }

  private loadActivities() {
    this.activityService.activities$.subscribe(activities => {
      this.activities = activities.filter(a => a.status === 'completed' && a.route.length > 0);
    });
  }

  onSegmentChange(event: any) {
    this.selectedSegment = event.detail.value;
    this.loadMapData();
  }

  private loadMapData() {
    if (!this.map) return;

    // Limpar dados anteriores
    this.clearMapData();

    switch (this.selectedSegment) {
      case 'current':
        this.showCurrentLocation();
        break;
      case 'routes':
        this.showAllRoutes();
        break;
      case 'heatmap':
        this.showHeatmap();
        break;
    }
  }

  private clearMapData() {
    if (!this.map) return;

    // Remover todas as camadas e fontes personalizadas
    const layers = ['routes', 'heatmap', 'current-location'];
    const sources = ['routes', 'heatmap', 'current-location'];

    layers.forEach(layerId => {
      if (this.map!.getLayer(layerId)) {
        this.map!.removeLayer(layerId);
      }
    });

    sources.forEach(sourceId => {
      if (this.map!.getSource(sourceId)) {
        this.map!.removeSource(sourceId);
      }
    });
  }

  private showCurrentLocation() {
    if (!this.map || !this.currentPosition) return;

    const coordinates: [number, number] = [this.currentPosition.longitude, this.currentPosition.latitude];

    // Adicionar marcador da posição atual
    new mapboxgl.Marker({
      color: '#4CAF50'
    })
    .setLngLat(coordinates)
    .addTo(this.map);

    // Centralizar no usuário
    this.map.easeTo({
      center: coordinates,
      zoom: 15,
      duration: 1000
    });
  }

  private showAllRoutes() {
    if (!this.map || this.activities.length === 0) return;

    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    let colorIndex = 0;

    this.activities.forEach((activity, index) => {
      if (activity.route.length < 2) return;

      const coordinates = activity.route.map(point => [point.longitude, point.latitude]);
      const color = colors[colorIndex % colors.length];
      colorIndex++;

      // Adicionar rota
      this.map!.addSource(`route-${activity.id}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            activityId: activity.id,
            distance: activity.distance,
            duration: activity.duration
          },
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      this.map!.addLayer({
        id: `route-${activity.id}`,
        type: 'line',
        source: `route-${activity.id}`,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': color,
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Adicionar marcadores de início e fim
      const startPoint = coordinates[0];
      const endPoint = coordinates[coordinates.length - 1];

      // Marcador de início
      new mapboxgl.Marker({
        color: color,
        scale: 0.8
      })
      .setLngLat(startPoint as [number, number])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div>
          <strong>Início da Atividade</strong><br>
          Data: ${new Date(activity.createdAt).toLocaleDateString('pt-BR')}<br>
          Distância: ${(activity.distance / 1000).toFixed(2)} km
        </div>
      `))
      .addTo(this.map!);

      // Marcador de fim
      new mapboxgl.Marker({
        color: '#FF5722',
        scale: 0.6
      })
      .setLngLat(endPoint as [number, number])
      .addTo(this.map!);
    });

    // Ajustar zoom para mostrar todas as rotas
    this.fitMapToRoutes();
  }

  private showHeatmap() {
    if (!this.map || this.activities.length === 0) return;

    // Coletar todos os pontos de todas as atividades
    const allPoints: number[][] = [];
    
    this.activities.forEach(activity => {
      activity.route.forEach(point => {
        allPoints.push([point.longitude, point.latitude, 1]); // [lng, lat, weight]
      });
    });

    if (allPoints.length === 0) return;

    // Criar fonte de dados para heatmap
    this.map.addSource('heatmap', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: allPoints.map(point => ({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [point[0], point[1]]
          }
        }))
      }
    });

    // Adicionar camada de heatmap
    this.map.addLayer({
      id: 'heatmap',
      type: 'heatmap',
      source: 'heatmap',
      maxzoom: 15,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'mag'],
          0, 0,
          6, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          7, 1,
          15, 0.8
        ]
      }
    });

    this.fitMapToRoutes();
  }

  private fitMapToRoutes() {
    if (!this.map || this.activities.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    
    this.activities.forEach(activity => {
      activity.route.forEach(point => {
        bounds.extend([point.longitude, point.latitude]);
      });
    });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }

  centerOnUser() {
    if (this.currentPosition && this.map) {
      this.map.easeTo({
        center: [this.currentPosition.longitude, this.currentPosition.latitude],
        zoom: 15,
        duration: 1000
      });
    }
  }

  refreshMap() {
    this.getCurrentPosition();
    this.loadActivities();
    this.loadMapData();
  }

  selectActivity(activity: ActivityData) {
    if (!this.map || activity.route.length < 2) return;

    this.selectedActivityId = activity.id;

    // Limpar mapa e mostrar apenas esta atividade
    this.clearMapData();
    
    const coordinates = activity.route.map(point => [point.longitude, point.latitude]);

    this.map.addSource('selected-route', {
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

    this.map.addLayer({
      id: 'selected-route',
      type: 'line',
      source: 'selected-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#4CAF50',
        'line-width': 4
      }
    });

    // Ajustar zoom para esta rota
    const bounds = new mapboxgl.LngLatBounds();
    coordinates.forEach(coord => bounds.extend(coord as [number, number]));
    
    this.map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 16
    });
  }

  formatDistance(distance: number): string {
    return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km` : `${distance.toFixed(0)} m`;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
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

  formatSpeed(speed: number): string {
    return `${speed.toFixed(1)} km/h`;
  }

  getRouteColor(index: number): string {
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    return colors[index % colors.length];
  }

  // Métodos para estatísticas do mapa de calor
  getTotalDistance(): string {
    const total = this.activities.reduce((sum, activity) => sum + activity.distance, 0);
    return this.formatDistance(total);
  }

  getTotalActivities(): string {
    return this.activities.length.toString();
  }

  getAverageDistance(): string {
    if (this.activities.length === 0) return '0 km';
    const average = this.activities.reduce((sum, activity) => sum + activity.distance, 0) / this.activities.length;
    return this.formatDistance(average);
  }

  getMostActiveArea(): string {
    // Simplificado - retorna uma área genérica
    // Em uma implementação real, analisaria as coordenadas mais frequentes
    return 'Centro da Cidade';
  }
}

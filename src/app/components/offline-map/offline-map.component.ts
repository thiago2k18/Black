import { Component, ElementRef, Input, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  wifiOutline, addOutline, removeOutline, locateOutline 
} from 'ionicons/icons';
import { LocationPoint } from '../../services/geolocation.service';

@Component({
  selector: 'app-offline-map',
  templateUrl: './offline-map.component.html',
  styleUrls: ['./offline-map.component.scss'],
  imports: [CommonModule, IonIcon],
  standalone: true
})
export class OfflineMapComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('canvasMap', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() currentPosition: LocationPoint | null = null;
  @Input() route: LocationPoint[] = [];
  @Input() isTracking: boolean = false;

  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private scale = 1;
  private centerLat = 0;
  private centerLng = 0;
  private pixelsPerDegree = 10000; // Escala inicial

  constructor() {
    addIcons({
      wifiOutline, addOutline, removeOutline, locateOutline
    });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.initializeCanvas();
    this.drawMap();
  }

  ngOnDestroy() {}

  private initializeCanvas() {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    
    // Configurar tamanho do canvas
    this.resizeCanvas();
    
    // Centralizar no primeiro ponto ou posição atual
    if (this.currentPosition) {
      this.centerLat = this.currentPosition.latitude;
      this.centerLng = this.currentPosition.longitude;
    } else if (this.route.length > 0) {
      this.centerLat = this.route[0].latitude;
      this.centerLng = this.route[0].longitude;
    }
  }

  private resizeCanvas() {
    const container = this.canvas.parentElement!;
    this.canvas.width = container.clientWidth;
    this.canvas.height = container.clientHeight;
  }

  private drawMap() {
    if (!this.ctx) return;

    // Limpar canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Desenhar fundo
    this.drawBackground();
    
    // Desenhar grade
    this.drawGrid();
    
    // Desenhar rota
    this.drawRoute();
    
    // Desenhar posição atual
    this.drawCurrentPosition();
    
    // Desenhar informações
    this.drawInfo();
  }

  private drawBackground() {
    // Fundo estilo mapa
    this.ctx.fillStyle = '#f0f8ff';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Padrão de fundo sutil
    this.ctx.strokeStyle = '#e6f3ff';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.canvas.width; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
  }

  private drawGrid() {
    this.ctx.strokeStyle = '#d0e7ff';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 2]);
    
    const gridSize = 50;
    for (let i = 0; i < this.canvas.width; i += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.canvas.height);
      this.ctx.stroke();
    }
    for (let i = 0; i < this.canvas.height; i += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.canvas.width, i);
      this.ctx.stroke();
    }
    this.ctx.setLineDash([]);
  }

  private drawRoute() {
    if (this.route.length < 2) return;

    this.ctx.strokeStyle = '#3498db';
    this.ctx.lineWidth = 4;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    this.ctx.beginPath();
    for (let i = 0; i < this.route.length; i++) {
      const point = this.latLngToPixel(this.route[i].latitude, this.route[i].longitude);
      if (i === 0) {
        this.ctx.moveTo(point.x, point.y);
      } else {
        this.ctx.lineTo(point.x, point.y);
      }
    }
    this.ctx.stroke();

    // Desenhar pontos da rota
    this.ctx.fillStyle = '#2980b9';
    this.route.forEach((point, index) => {
      const pixel = this.latLngToPixel(point.latitude, point.longitude);
      this.ctx.beginPath();
      this.ctx.arc(pixel.x, pixel.y, index === 0 ? 6 : 3, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  private drawCurrentPosition() {
    if (!this.currentPosition) return;

    const pixel = this.latLngToPixel(this.currentPosition.latitude, this.currentPosition.longitude);
    
    // Círculo externo (pulsante se estiver rastreando)
    this.ctx.fillStyle = this.isTracking ? 'rgba(52, 152, 219, 0.3)' : 'rgba(52, 152, 219, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(pixel.x, pixel.y, this.isTracking ? 20 : 15, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Círculo interno
    this.ctx.fillStyle = '#3498db';
    this.ctx.beginPath();
    this.ctx.arc(pixel.x, pixel.y, 8, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Ponto central
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(pixel.x, pixel.y, 3, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private drawInfo() {
    // Desenhar informações no canto
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 80);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI"';
    this.ctx.fillText('📍 Modo Offline', 20, 30);
    this.ctx.fillText(`Pontos: ${this.route.length}`, 20, 50);
    
    if (this.currentPosition) {
      this.ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI"';
      this.ctx.fillText(`GPS: ${this.currentPosition.latitude.toFixed(4)}, ${this.currentPosition.longitude.toFixed(4)}`, 20, 70);
    }
  }

  private latLngToPixel(lat: number, lng: number): { x: number, y: number } {
    const x = (lng - this.centerLng) * this.pixelsPerDegree + this.canvas.width / 2;
    const y = (this.centerLat - lat) * this.pixelsPerDegree + this.canvas.height / 2;
    return { x, y };
  }

  // Métodos públicos para atualizar o mapa
  updatePosition(position: LocationPoint) {
    this.currentPosition = position;
    
    // Auto-centralizar se estiver rastreando
    if (this.isTracking) {
      this.centerLat = position.latitude;
      this.centerLng = position.longitude;
    }
    
    this.drawMap();
  }

  updateRoute(route: LocationPoint[]) {
    this.route = route;
    
    // Ajustar escala baseada na rota
    if (route.length > 1) {
      this.adjustScale();
    }
    
    this.drawMap();
  }

  private adjustScale() {
    if (this.route.length < 2) return;
    
    let minLat = this.route[0].latitude;
    let maxLat = this.route[0].latitude;
    let minLng = this.route[0].longitude;
    let maxLng = this.route[0].longitude;
    
    this.route.forEach(point => {
      minLat = Math.min(minLat, point.latitude);
      maxLat = Math.max(maxLat, point.latitude);
      minLng = Math.min(minLng, point.longitude);
      maxLng = Math.max(maxLng, point.longitude);
    });
    
    const latRange = maxLat - minLat;
    const lngRange = maxLng - minLng;
    
    if (latRange > 0 && lngRange > 0) {
      const scaleX = (this.canvas.width * 0.8) / lngRange;
      const scaleY = (this.canvas.height * 0.8) / latRange;
      this.pixelsPerDegree = Math.min(scaleX, scaleY, 50000);
      
      // Centralizar na rota
      this.centerLat = (minLat + maxLat) / 2;
      this.centerLng = (minLng + maxLng) / 2;
    }
  }

  setTracking(isTracking: boolean) {
    this.isTracking = isTracking;
    this.drawMap();
  }

  zoomIn() {
    this.pixelsPerDegree *= 1.5;
    this.drawMap();
  }

  zoomOut() {
    this.pixelsPerDegree /= 1.5;
    this.drawMap();
  }

  centerOnUser() {
    if (this.currentPosition) {
      this.centerLat = this.currentPosition.latitude;
      this.centerLng = this.currentPosition.longitude;
      this.drawMap();
    }
  }
}

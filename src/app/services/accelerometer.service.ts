import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Motion } from '@capacitor/motion';

export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

export interface MovementData {
  isMoving: boolean;
  intensity: number; // 0-1 (baixo a alto)
  stepDetected: boolean;
  movementType: 'still' | 'walking' | 'running' | 'unknown';
}

@Injectable({
  providedIn: 'root'
})
export class AccelerometerService {
  private isTrackingSubject = new BehaviorSubject<boolean>(false);
  public isTracking$ = this.isTrackingSubject.asObservable();

  private movementDataSubject = new BehaviorSubject<MovementData>({
    isMoving: false,
    intensity: 0,
    stepDetected: false,
    movementType: 'still'
  });
  public movementData$ = this.movementDataSubject.asObservable();

  private stepCountSubject = new BehaviorSubject<number>(0);
  public stepCount$ = this.stepCountSubject.asObservable();

  private accelerometerData: AccelerometerData[] = [];
  private lastStepTime = 0;
  private stepCount = 0;
  private movingAverage: number[] = [];
  private readonly WINDOW_SIZE = 10;
  private readonly STEP_THRESHOLD = 1.8; // Limiar otimizado para caminhada normal
  private readonly MOVEMENT_THRESHOLD = 1.2; // Limiar para detectar movimento
  private readonly MIN_STEP_INTERVAL = 200; // Mínimo 200ms entre passos
  private readonly MAX_STEP_INTERVAL = 2000; // Máximo 2s entre passos (parou de caminhar)

  constructor() {}

  async startTracking(): Promise<boolean> {
    try {
      // Iniciar monitoramento do acelerômetro (Motion não precisa de permissões explícitas)
      await Motion.addListener('accel', (event) => {
        this.processAccelerometerData({
          x: event.acceleration.x,
          y: event.acceleration.y,
          z: event.acceleration.z,
          timestamp: Date.now()
        });
      });

      this.isTrackingSubject.next(true);
      console.log('Acelerômetro iniciado com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao iniciar acelerômetro:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      await Motion.removeAllListeners();
      this.isTrackingSubject.next(false);
      this.resetData();
      console.log('Acelerômetro parado');
    } catch (error) {
      console.error('Erro ao parar acelerômetro:', error);
    }
  }

  private processAccelerometerData(data: AccelerometerData) {
    // Adicionar dados ao buffer
    this.accelerometerData.push(data);
    
    // Manter apenas os últimos 50 pontos (aprox. 1 segundo a 50Hz)
    if (this.accelerometerData.length > 50) {
      this.accelerometerData.shift();
    }

    // Calcular magnitude da aceleração
    const magnitude = Math.sqrt(data.x * data.x + data.y * data.y + data.z * data.z);
    
    // Adicionar à média móvel
    this.movingAverage.push(magnitude);
    if (this.movingAverage.length > this.WINDOW_SIZE) {
      this.movingAverage.shift();
    }

    // Calcular média e variação
    const average = this.movingAverage.reduce((a, b) => a + b, 0) / this.movingAverage.length;
    const variance = this.movingAverage.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / this.movingAverage.length;
    const standardDeviation = Math.sqrt(variance);

    // Detectar movimento
    const isMoving = standardDeviation > this.MOVEMENT_THRESHOLD;
    const intensity = Math.min(standardDeviation / 10, 1); // Normalizar 0-1

    // Detectar passos
    const stepDetected = this.detectStep(magnitude, data.timestamp);
    
    // Determinar tipo de movimento
    const movementType = this.classifyMovement(standardDeviation, intensity);

    // Atualizar estado
    const movementData: MovementData = {
      isMoving,
      intensity,
      stepDetected,
      movementType
    };

    this.movementDataSubject.next(movementData);

    if (stepDetected) {
      this.stepCount++;
      this.stepCountSubject.next(this.stepCount);
    }
  }

  private detectStep(magnitude: number, timestamp: number): boolean {
    // Algoritmo otimizado de detecção de passos
    const timeSinceLastStep = timestamp - this.lastStepTime;
    
    if (timeSinceLastStep > this.MIN_STEP_INTERVAL) {
      
      // Calcular diferença da magnitude com a média móvel
      if (this.movingAverage.length >= 5) {
        const average = this.movingAverage.reduce((a, b) => a + b, 0) / this.movingAverage.length;
        const magnitudeDiff = magnitude - average;
        
        // Detectar pico significativo
        if (magnitudeDiff > this.STEP_THRESHOLD) {
          
          // Verificar padrão de pico (subida e descida)
          const recentData = this.accelerometerData.slice(-4);
          if (recentData.length >= 3) {
            const magnitudes = recentData.map(d => 
              Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z)
            );
            
            // Verificar se é um pico real (valor atual maior que anteriores)
            const currentIdx = magnitudes.length - 1;
            const isPeak = magnitudes[currentIdx] > magnitudes[currentIdx - 1] && 
                          magnitudes[currentIdx] > magnitudes[currentIdx - 2];
            
            if (isPeak) {
              this.lastStepTime = timestamp;
              console.log(`🚶 Passo #${this.stepCount + 1}! Mag: ${magnitude.toFixed(2)}, Diff: ${magnitudeDiff.toFixed(2)}, Intervalo: ${timeSinceLastStep}ms`);
              return true;
            }
          }
        }
      }
    }
    
    // Reset se passou muito tempo sem passos (parou de caminhar)
    if (timeSinceLastStep > this.MAX_STEP_INTERVAL) {
      this.lastStepTime = 0;
    }
    
    return false;
  }

  private classifyMovement(standardDeviation: number, intensity: number): MovementData['movementType'] {
    if (standardDeviation < this.MOVEMENT_THRESHOLD) {
      return 'still';
    } else if (intensity < 0.3) {
      return 'walking';
    } else if (intensity < 0.7) {
      return 'walking';
    } else {
      return 'running';
    }
  }

  resetStepCount(): void {
    this.stepCount = 0;
    this.lastStepTime = 0;
    this.stepCountSubject.next(0);
    console.log('🔄 Contador de passos resetado');
  }

  private resetData() {
    this.accelerometerData = [];
    this.movingAverage = [];
    this.lastStepTime = 0;
    this.stepCount = 0;
    this.stepCountSubject.next(0);
    this.movementDataSubject.next({
      isMoving: false,
      intensity: 0,
      stepDetected: false,
      movementType: 'still'
    });
  }

  // Métodos públicos para obter dados
  getCurrentStepCount(): number {
    return this.stepCount;
  }

  getCurrentMovementData(): MovementData {
    return this.movementDataSubject.value;
  }

  isCurrentlyMoving(): boolean {
    return this.movementDataSubject.value.isMoving;
  }

  // Calibrar sensibilidade (opcional)
  setStepThreshold(threshold: number) {
    // Permitir ajustar sensibilidade baseado no usuário
    // threshold entre 8-20 (mais baixo = mais sensível)
  }

  setMovementThreshold(threshold: number) {
    // threshold entre 1-5 (mais baixo = mais sensível)
  }
}

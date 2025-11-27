import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Motion, MotionEventResult } from '@capacitor/motion';

export interface StepData {
  steps: number;
  timestamp: number;
  confidence: number;
}

@Injectable({
  providedIn: 'root'
})
export class PedometerService {
  private stepsSubject = new BehaviorSubject<number>(0);
  public steps$ = this.stepsSubject.asObservable();

  private isTrackingSubject = new BehaviorSubject<boolean>(false);
  public isTracking$ = this.isTrackingSubject.asObservable();

  private stepHistorySubject = new BehaviorSubject<StepData[]>([]);
  public stepHistory$ = this.stepHistorySubject.asObservable();

  // Variáveis para detecção de passos
  private lastAcceleration = { x: 0, y: 0, z: 0 };
  private stepThreshold = 1.2; // Limiar para detectar um passo
  private stepCooldown = 300; // Tempo mínimo entre passos (ms)
  private lastStepTime = 0;
  private stepBuffer: number[] = [];
  private bufferSize = 10;
  
  // Filtros para melhorar a precisão
  private accelerationHistory: { x: number, y: number, z: number, timestamp: number }[] = [];
  private historySize = 20;

  constructor() {}

  async requestPermissions(): Promise<boolean> {
    try {
      // Motion plugin não requer permissões explícitas no web
      return true;
    } catch (error) {
      console.error('Erro ao solicitar permissões de movimento:', error);
      return false;
    }
  }

  async startTracking(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Permissão de movimento negada');
      }

      // Resetar contadores
      this.resetStepCount();
      this.accelerationHistory = [];
      this.stepBuffer = [];
      this.lastStepTime = 0;

      // Iniciar monitoramento do acelerômetro
      await Motion.addListener('accel', (event: MotionEventResult) => {
        this.processAccelerometerData(event);
      });

      this.isTrackingSubject.next(true);
      console.log('Rastreamento de passos iniciado');
      return true;
    } catch (error) {
      console.error('Erro ao iniciar rastreamento de passos:', error);
      return false;
    }
  }

  async stopTracking(): Promise<void> {
    try {
      await Motion.removeAllListeners();
      this.isTrackingSubject.next(false);
      console.log('Rastreamento de passos parado');
    } catch (error) {
      console.error('Erro ao parar rastreamento de passos:', error);
    }
  }

  private processAccelerometerData(event: MotionEventResult): void {
    const { x, y, z } = event.acceleration;
    const timestamp = Date.now();

    // Adicionar à história de aceleração
    this.accelerationHistory.push({ x, y, z, timestamp });
    if (this.accelerationHistory.length > this.historySize) {
      this.accelerationHistory.shift();
    }

    // Calcular magnitude da aceleração
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Aplicar filtro de média móvel para suavizar os dados
    this.stepBuffer.push(magnitude);
    if (this.stepBuffer.length > this.bufferSize) {
      this.stepBuffer.shift();
    }

    // Calcular média da magnitude
    const averageMagnitude = this.stepBuffer.reduce((sum, val) => sum + val, 0) / this.stepBuffer.length;
    
    // Detectar pico (possível passo)
    if (this.stepBuffer.length >= this.bufferSize) {
      const isPeak = this.detectPeak(magnitude, averageMagnitude);
      
      if (isPeak && this.isValidStep(timestamp)) {
        this.recordStep(timestamp);
      }
    }

    this.lastAcceleration = { x, y, z };
  }

  private detectPeak(currentMagnitude: number, averageMagnitude: number): boolean {
    // Verificar se a magnitude atual está acima do limiar
    const threshold = averageMagnitude + this.stepThreshold;
    
    if (currentMagnitude > threshold) {
      // Verificar se é realmente um pico comparando com valores anteriores e posteriores
      const bufferLength = this.stepBuffer.length;
      if (bufferLength >= 3) {
        const prevValue = this.stepBuffer[bufferLength - 2];
        const prevPrevValue = this.stepBuffer[bufferLength - 3];
        
        // É um pico se o valor atual é maior que os anteriores
        return currentMagnitude > prevValue && prevValue > prevPrevValue;
      }
    }
    
    return false;
  }

  private isValidStep(timestamp: number): boolean {
    // Verificar cooldown entre passos
    if (timestamp - this.lastStepTime < this.stepCooldown) {
      return false;
    }

    // Verificar padrão de movimento (opcional - para melhorar precisão)
    if (this.accelerationHistory.length >= 5) {
      const recentHistory = this.accelerationHistory.slice(-5);
      const varianceX = this.calculateVariance(recentHistory.map(h => h.x));
      const varianceY = this.calculateVariance(recentHistory.map(h => h.y));
      const varianceZ = this.calculateVariance(recentHistory.map(h => h.z));
      
      // Se há muito pouca variação, provavelmente não é um passo real
      const totalVariance = varianceX + varianceY + varianceZ;
      if (totalVariance < 0.1) {
        return false;
      }
    }

    return true;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private recordStep(timestamp: number): void {
    const currentSteps = this.stepsSubject.value + 1;
    this.stepsSubject.next(currentSteps);
    this.lastStepTime = timestamp;

    // Adicionar ao histórico
    const stepData: StepData = {
      steps: currentSteps,
      timestamp: timestamp,
      confidence: this.calculateConfidence()
    };

    const history = this.stepHistorySubject.value;
    history.push(stepData);
    this.stepHistorySubject.next([...history]);

    console.log(`Passo detectado! Total: ${currentSteps}`);
  }

  private calculateConfidence(): number {
    // Calcular confiança baseada na consistência dos dados
    if (this.accelerationHistory.length < 5) {
      return 0.5;
    }

    const recentHistory = this.accelerationHistory.slice(-5);
    const magnitudes = recentHistory.map(h => Math.sqrt(h.x * h.x + h.y * h.y + h.z * h.z));
    
    const mean = magnitudes.reduce((sum, val) => sum + val, 0) / magnitudes.length;
    const variance = this.calculateVariance(magnitudes);
    
    // Confiança maior para variações moderadas (indicam movimento natural)
    const normalizedVariance = Math.min(variance / 2, 1);
    return Math.max(0.3, 1 - Math.abs(0.5 - normalizedVariance));
  }

  resetStepCount(): void {
    this.stepsSubject.next(0);
    this.stepHistorySubject.next([]);
    this.stepBuffer = [];
    this.lastStepTime = 0;
    console.log('🔄 Pedômetro resetado');
  }

  getCurrentSteps(): number {
    return this.stepsSubject.value;
  }

  getStepHistory(): StepData[] {
    return this.stepHistorySubject.value;
  }

  // Métodos para calibração e configuração
  setStepThreshold(threshold: number): void {
    this.stepThreshold = Math.max(0.5, Math.min(3.0, threshold));
  }

  getStepThreshold(): number {
    return this.stepThreshold;
  }

  setStepCooldown(cooldown: number): void {
    this.stepCooldown = Math.max(100, Math.min(1000, cooldown));
  }

  getStepCooldown(): number {
    return this.stepCooldown;
  }

  // Estatísticas de passos
  getStepRate(): number {
    const history = this.stepHistorySubject.value;
    if (history.length < 2) {
      return 0;
    }

    const recentSteps = history.slice(-10); // Últimos 10 passos
    if (recentSteps.length < 2) {
      return 0;
    }

    const timeSpan = recentSteps[recentSteps.length - 1].timestamp - recentSteps[0].timestamp;
    const stepCount = recentSteps.length - 1;
    
    // Passos por minuto
    return timeSpan > 0 ? (stepCount / timeSpan) * 60000 : 0;
  }

  getAverageConfidence(): number {
    const history = this.stepHistorySubject.value;
    if (history.length === 0) {
      return 0;
    }

    const totalConfidence = history.reduce((sum, step) => sum + step.confidence, 0);
    return totalConfidence / history.length;
  }

  // Calibração automática baseada no padrão do usuário
  async calibrate(durationSeconds: number = 30): Promise<void> {
    console.log(`Iniciando calibração por ${durationSeconds} segundos...`);
    
    const initialSteps = this.getCurrentSteps();
    const startTime = Date.now();
    
    // Coletar dados por um período
    setTimeout(() => {
      const finalSteps = this.getCurrentSteps();
      const stepsTaken = finalSteps - initialSteps;
      const actualDuration = (Date.now() - startTime) / 1000;
      
      // Ajustar limiar baseado na atividade detectada
      if (stepsTaken > 0) {
        const stepsPerSecond = stepsTaken / actualDuration;
        
        // Ajustar limiar baseado na frequência de passos
        if (stepsPerSecond > 2) {
          // Muitos passos detectados, aumentar limiar
          this.stepThreshold = Math.min(this.stepThreshold * 1.1, 2.0);
        } else if (stepsPerSecond < 0.5) {
          // Poucos passos detectados, diminuir limiar
          this.stepThreshold = Math.max(this.stepThreshold * 0.9, 0.8);
        }
        
        console.log(`Calibração concluída. Novo limiar: ${this.stepThreshold.toFixed(2)}`);
      }
    }, durationSeconds * 1000);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';
import { LocationPoint, RouteData } from './geolocation.service';

export interface ActivityData {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // em milissegundos
  distance: number; // em metros
  steps: number;
  calories: number;
  averageSpeed: number; // m/s
  maxSpeed: number; // m/s
  route: LocationPoint[];
  photos: string[];
  status: 'active' | 'paused' | 'completed';
  createdAt: Date;
}

export interface ActivityStats {
  totalActivities: number;
  totalDistance: number;
  totalDuration: number;
  totalSteps: number;
  totalCalories: number;
  averageSpeed: number;
  longestDistance: number;
  longestDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private currentActivitySubject = new BehaviorSubject<ActivityData | null>(null);
  public currentActivity$ = this.currentActivitySubject.asObservable();

  private activitiesSubject = new BehaviorSubject<ActivityData[]>([]);
  public activities$ = this.activitiesSubject.asObservable();

  private stepCountSubject = new BehaviorSubject<number>(0);
  public stepCount$ = this.stepCountSubject.asObservable();

  constructor() {
    this.loadActivities();
  }

  private async loadActivities(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'activities' });
      if (value) {
        const activities = JSON.parse(value).map((activity: any) => ({
          ...activity,
          startTime: new Date(activity.startTime),
          endTime: activity.endTime ? new Date(activity.endTime) : undefined,
          createdAt: new Date(activity.createdAt)
        }));
        this.activitiesSubject.next(activities);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    }
  }

  private async saveActivities(): Promise<void> {
    try {
      const activities = this.activitiesSubject.value;
      await Preferences.set({
        key: 'activities',
        value: JSON.stringify(activities)
      });
    } catch (error) {
      console.error('Erro ao salvar atividades:', error);
    }
  }

  async startActivity(userId: string): Promise<string> {
    try {
      const activityId = Date.now().toString();
      const newActivity: ActivityData = {
        id: activityId,
        userId: userId,
        startTime: new Date(),
        duration: 0,
        distance: 0,
        steps: 0,
        calories: 0,
        averageSpeed: 0,
        maxSpeed: 0,
        route: [],
        photos: [],
        status: 'active',
        createdAt: new Date()
      };

      this.currentActivitySubject.next(newActivity);
      this.stepCountSubject.next(0);
      
      return activityId;
    } catch (error) {
      console.error('Erro ao iniciar atividade:', error);
      throw error;
    }
  }

  pauseActivity(): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity && currentActivity.status === 'active') {
      currentActivity.status = 'paused';
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  resumeActivity(): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity && currentActivity.status === 'paused') {
      currentActivity.status = 'active';
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  async finishActivity(): Promise<ActivityData | null> {
    try {
      const currentActivity = this.currentActivitySubject.value;
      if (!currentActivity) return null;

      currentActivity.endTime = new Date();
      currentActivity.status = 'completed';
      currentActivity.duration = currentActivity.endTime.getTime() - currentActivity.startTime.getTime();

      // Calcular estatísticas finais
      this.calculateFinalStats(currentActivity);

      // Salvar atividade
      const activities = this.activitiesSubject.value;
      const updatedActivities = [...activities, currentActivity];
      this.activitiesSubject.next(updatedActivities);
      await this.saveActivities();

      // Limpar atividade atual
      this.currentActivitySubject.next(null);
      this.stepCountSubject.next(0);

      return currentActivity;
    } catch (error) {
      console.error('Erro ao finalizar atividade:', error);
      return null;
    }
  }

  updateActivityRoute(routeData: RouteData): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity && currentActivity.status === 'active') {
      currentActivity.route = routeData.points;
      currentActivity.distance = routeData.distance;
      currentActivity.averageSpeed = routeData.averageSpeed;
      
      // Atualizar velocidade máxima
      const currentSpeed = routeData.averageSpeed;
      if (currentSpeed > currentActivity.maxSpeed) {
        currentActivity.maxSpeed = currentSpeed;
      }

      // Calcular calorias (aproximação: 0.04 cal/metro para caminhada)
      currentActivity.calories = Math.round(currentActivity.distance * 0.04);

      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  updateStepCount(steps: number): void {
    this.stepCountSubject.next(steps);
    
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity) {
      currentActivity.steps = steps;
      
      // Calcular calorias baseado nos passos
      currentActivity.calories = this.calculateCaloriesFromSteps(steps);
      
      this.currentActivitySubject.next({ ...currentActivity });
      console.log(`📊 Passos atualizados: ${steps}, Calorias: ${currentActivity.calories.toFixed(1)}`);
    }
  }

  updateDuration(duration: number): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity) {
      currentActivity.duration = duration;
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  updateDistance(distance: number): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity) {
      currentActivity.distance = distance;
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  updateSpeed(averageSpeed: number, maxSpeed: number): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity) {
      currentActivity.averageSpeed = averageSpeed;
      currentActivity.maxSpeed = Math.max(currentActivity.maxSpeed, maxSpeed);
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  private calculateCaloriesFromSteps(steps: number): number {
    // Fórmula aproximada: 1 passo = 0.04 calorias para pessoa de 70kg
    const caloriesPerStep = 0.04;
    return steps * caloriesPerStep;
  }

  addPhoto(photoPath: string): void {
    const currentActivity = this.currentActivitySubject.value;
    if (currentActivity) {
      currentActivity.photos.push(photoPath);
      this.currentActivitySubject.next({ ...currentActivity });
    }
  }

  private calculateFinalStats(activity: ActivityData): void {
    // Calcular estatísticas finais baseadas na rota
    if (activity.route.length > 1) {
      let totalDistance = 0;
      let maxSpeed = 0;

      for (let i = 1; i < activity.route.length; i++) {
        const prev = activity.route[i - 1];
        const curr = activity.route[i];
        
        // Calcular distância entre pontos
        const distance = this.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        totalDistance += distance;

        // Calcular velocidade instantânea
        const timeDiff = (curr.timestamp - prev.timestamp) / 1000; // segundos
        if (timeDiff > 0) {
          const speed = distance / timeDiff;
          if (speed > maxSpeed) {
            maxSpeed = speed;
          }
        }
      }

      activity.distance = totalDistance;
      activity.maxSpeed = maxSpeed;
      
      // Velocidade média
      const durationInSeconds = activity.duration / 1000;
      activity.averageSpeed = durationInSeconds > 0 ? totalDistance / durationInSeconds : 0;
      
      // Calorias
      activity.calories = Math.round(totalDistance * 0.04);
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

  getActivityStats(): ActivityStats {
    const activities = this.activitiesSubject.value.filter(a => a.status === 'completed');
    
    if (activities.length === 0) {
      return {
        totalActivities: 0,
        totalDistance: 0,
        totalDuration: 0,
        totalSteps: 0,
        totalCalories: 0,
        averageSpeed: 0,
        longestDistance: 0,
        longestDuration: 0
      };
    }

    const totalDistance = activities.reduce((sum, a) => sum + a.distance, 0);
    const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0);
    const totalSteps = activities.reduce((sum, a) => sum + a.steps, 0);
    const totalCalories = activities.reduce((sum, a) => sum + a.calories, 0);
    const longestDistance = Math.max(...activities.map(a => a.distance));
    const longestDuration = Math.max(...activities.map(a => a.duration));
    
    const averageSpeed = totalDuration > 0 ? totalDistance / (totalDuration / 1000) : 0;

    return {
      totalActivities: activities.length,
      totalDistance,
      totalDuration,
      totalSteps,
      totalCalories,
      averageSpeed,
      longestDistance,
      longestDuration
    };
  }

  async deleteActivity(activityId: string): Promise<boolean> {
    try {
      const activities = this.activitiesSubject.value;
      const updatedActivities = activities.filter(a => a.id !== activityId);
      this.activitiesSubject.next(updatedActivities);
      await this.saveActivities();
      return true;
    } catch (error) {
      console.error('Erro ao deletar atividade:', error);
      return false;
    }
  }

  getActivityById(activityId: string): ActivityData | undefined {
    return this.activitiesSubject.value.find(a => a.id === activityId);
  }

  getCurrentActivity(): ActivityData | null {
    return this.currentActivitySubject.value;
  }
}

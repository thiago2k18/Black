import { Injectable } from '@angular/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { PushNotifications, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Preferences } from '@capacitor/preferences';

export interface NotificationSettings {
  enabled: boolean;
  activityReminders: boolean;
  goalAchievements: boolean;
  weeklyReports: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private defaultSettings: NotificationSettings = {
    enabled: true,
    activityReminders: true,
    goalAchievements: true,
    weeklyReports: true,
    soundEnabled: true,
    vibrationEnabled: true
  };

  constructor() {
    this.initializeNotifications();
  }

  private async initializeNotifications(): Promise<void> {
    try {
      // Solicitar permissões para notificações locais
      await LocalNotifications.requestPermissions();

      // Configurar listeners para notificações push
      await this.setupPushNotifications();

      // Carregar configurações salvas
      await this.loadSettings();
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  }

  private async setupPushNotifications(): Promise<void> {
    try {
      // Solicitar permissões para push notifications
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('Permissões de push notification negadas');
        return;
      }

      // Registrar para push notifications
      await PushNotifications.register();

      // Listeners para push notifications
      PushNotifications.addListener('registration', (token) => {
        console.log('Push registration success, token: ' + token.value);
        this.savePushToken(token.value);
      });

      PushNotifications.addListener('registrationError', (error) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push received: ' + JSON.stringify(notification));
        this.handlePushNotification(notification);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (notification: ActionPerformed) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
        this.handleNotificationAction(notification);
      });

    } catch (error) {
      console.error('Erro ao configurar push notifications:', error);
    }
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      await Preferences.set({
        key: 'pushToken',
        value: token
      });
    } catch (error) {
      console.error('Erro ao salvar token push:', error);
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const { value } = await Preferences.get({ key: 'notificationSettings' });
      if (value) {
        const settings = JSON.parse(value);
        // Mesclar com configurações padrão para garantir compatibilidade
        this.defaultSettings = { ...this.defaultSettings, ...settings };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de notificação:', error);
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await Preferences.set({
        key: 'notificationSettings',
        value: JSON.stringify(settings)
      });
      this.defaultSettings = settings;
    } catch (error) {
      console.error('Erro ao salvar configurações de notificação:', error);
    }
  }

  getSettings(): NotificationSettings {
    return { ...this.defaultSettings };
  }

  async scheduleActivityReminder(title: string, body: string, delayMinutes: number = 60): Promise<void> {
    if (!this.defaultSettings.enabled || !this.defaultSettings.activityReminders) {
      return;
    }

    try {
      const scheduleTime = new Date();
      scheduleTime.setMinutes(scheduleTime.getMinutes() + delayMinutes);

      const options: ScheduleOptions = {
        notifications: [{
          title: title,
          body: body,
          id: Date.now(),
          schedule: { at: scheduleTime },
          sound: this.defaultSettings.soundEnabled ? 'default' : undefined,
          attachments: undefined,
          actionTypeId: 'ACTIVITY_REMINDER',
          extra: {
            type: 'activity_reminder'
          }
        }]
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Erro ao agendar lembrete de atividade:', error);
    }
  }

  async showGoalAchievement(title: string, body: string, goalType: string): Promise<void> {
    if (!this.defaultSettings.enabled || !this.defaultSettings.goalAchievements) {
      return;
    }

    try {
      const options: ScheduleOptions = {
        notifications: [{
          title: title,
          body: body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) }, // 1 segundo
          sound: this.defaultSettings.soundEnabled ? 'default' : undefined,
          attachments: undefined,
          actionTypeId: 'GOAL_ACHIEVEMENT',
          extra: {
            type: 'goal_achievement',
            goalType: goalType
          }
        }]
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Erro ao mostrar conquista:', error);
    }
  }

  async scheduleWeeklyReport(): Promise<void> {
    if (!this.defaultSettings.enabled || !this.defaultSettings.weeklyReports) {
      return;
    }

    try {
      // Agendar para toda segunda-feira às 9h
      const nextMonday = new Date();
      const daysUntilMonday = (1 + 7 - nextMonday.getDay()) % 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);

      const options: ScheduleOptions = {
        notifications: [{
          title: 'Relatório Semanal - AndarBem',
          body: 'Veja seu progresso da semana e defina novas metas!',
          id: 999999, // ID fixo para poder cancelar/reagendar
          schedule: { 
            at: nextMonday,
            repeats: true,
            every: 'week'
          },
          sound: this.defaultSettings.soundEnabled ? 'default' : undefined,
          attachments: undefined,
          actionTypeId: 'WEEKLY_REPORT',
          extra: {
            type: 'weekly_report'
          }
        }]
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Erro ao agendar relatório semanal:', error);
    }
  }

  async showActivityProgress(distance: number, steps: number, duration: number): Promise<void> {
    if (!this.defaultSettings.enabled) {
      return;
    }

    try {
      const distanceKm = (distance / 1000).toFixed(1);
      const durationMin = Math.floor(duration / 60000);

      const options: ScheduleOptions = {
        notifications: [{
          title: 'Atividade em Progresso',
          body: `${distanceKm}km • ${steps} passos • ${durationMin}min`,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: undefined, // Sem som para não incomodar
          attachments: undefined,
          actionTypeId: 'ACTIVITY_PROGRESS',
          extra: {
            type: 'activity_progress',
            distance: distance,
            steps: steps,
            duration: duration
          }
        }]
      };

      await LocalNotifications.schedule(options);
    } catch (error) {
      console.error('Erro ao mostrar progresso da atividade:', error);
    }
  }

  private handlePushNotification(notification: PushNotificationSchema): void {
    // Processar notificação push recebida
    console.log('Notificação push recebida:', notification);
    
    // Aqui você pode implementar lógica específica baseada no tipo de notificação
    if (notification.data && notification.data.type) {
      switch (notification.data.type) {
        case 'friend_challenge':
          this.handleFriendChallenge(notification.data);
          break;
        case 'achievement_unlock':
          this.handleAchievementUnlock(notification.data);
          break;
        default:
          console.log('Tipo de notificação push desconhecido:', notification.data.type);
      }
    }
  }

  private handleNotificationAction(action: ActionPerformed): void {
    // Processar ação da notificação (quando usuário toca na notificação)
    console.log('Ação de notificação:', action);
    
    if ((action.notification as any).extra) {
      const extra = (action.notification as any).extra;
      
      switch (extra.type) {
        case 'activity_reminder':
          // Navegar para tela de nova atividade
          console.log('Abrir nova atividade');
          break;
        case 'goal_achievement':
          // Navegar para tela de conquistas
          console.log('Abrir conquistas');
          break;
        case 'weekly_report':
          // Navegar para relatório semanal
          console.log('Abrir relatório semanal');
          break;
        default:
          console.log('Tipo de ação desconhecido:', extra.type);
      }
    }
  }

  private handleFriendChallenge(data: any): void {
    // Implementar lógica para desafio de amigos
    console.log('Desafio de amigo recebido:', data);
  }

  private handleAchievementUnlock(data: any): void {
    // Implementar lógica para conquista desbloqueada
    console.log('Conquista desbloqueada:', data);
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [] });
    } catch (error) {
      console.error('Erro ao cancelar notificações:', error);
    }
  }

  async cancelNotification(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: id }] });
    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  }

  async getPendingNotifications(): Promise<any[]> {
    try {
      const result = await LocalNotifications.getPending();
      return result.notifications;
    } catch (error) {
      console.error('Erro ao obter notificações pendentes:', error);
      return [];
    }
  }

}

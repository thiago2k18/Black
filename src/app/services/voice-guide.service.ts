import { Injectable } from '@angular/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { ActivityData } from './activity.service';

export interface VoiceGuideSettings {
  enabled: boolean;
  language: string;
  rate: number;
  pitch: number;
  volume: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceGuideService {
  private settings: VoiceGuideSettings = {
    enabled: true,
    language: 'pt-BR',
    rate: 0.8,
    pitch: 1.0,
    volume: 0.8
  };

  private isSpeaking = false;

  constructor() {
    this.loadSettings();
  }

  // Configurações
  isEnabled(): boolean {
    return this.settings.enabled;
  }

  setEnabled(enabled: boolean): void {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  getSettings(): VoiceGuideSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<VoiceGuideSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Método principal para falar
  async speak(text: string): Promise<void> {
    if (!this.settings.enabled || this.isSpeaking) {
      return;
    }

    try {
      this.isSpeaking = true;
      console.log('🗣️ Falando:', text);

      await TextToSpeech.speak({
        text: text,
        lang: this.settings.language,
        rate: this.settings.rate,
        pitch: this.settings.pitch,
        volume: this.settings.volume,
        category: 'ambient'
      });

    } catch (error) {
      console.error('Erro ao falar:', error);
    } finally {
      this.isSpeaking = false;
    }
  }

  // Parar fala atual
  async stop(): Promise<void> {
    try {
      await TextToSpeech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.error('Erro ao parar fala:', error);
    }
  }

  // Eventos da atividade
  async onActivityStart(): Promise<void> {
    const messages = [
      'Caminhada iniciada. Boa caminhada!',
      'Vamos começar! Boa caminhada!',
      'Atividade iniciada. Vamos caminhar juntos!'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.speak(message);
  }

  async onCountdownStart(): Promise<void> {
    await this.speak('Vamos começar. Três, dois, um, começou!');
  }

  async onActivityPause(): Promise<void> {
    const messages = [
      'Atividade pausada. Quando quiser, é só continuar.',
      'Descanse um pouco. Estarei aqui quando quiser retomar.',
      'Pausa feita. Respire e relaxe um pouco.'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.speak(message);
  }

  async onActivityResume(): Promise<void> {
    const messages = [
      'Atividade retomada. Vamos em frente!',
      'Que bom que voltou! Vamos continuar!',
      'Retomando a caminhada. Vamos lá!'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.speak(message);
  }

  async onActivityEnd(activity: ActivityData): Promise<void> {
    let message = 'Caminhada finalizada. ';
    
    // Distância
    if (activity.distance >= 1000) {
      const km = (activity.distance / 1000).toFixed(1);
      message += `Você caminhou ${km} quilômetros `;
    } else if (activity.distance > 0) {
      message += `Você caminhou ${Math.round(activity.distance)} metros `;
    }
    
    // Tempo
    const minutes = Math.floor(activity.duration / 60000);
    if (minutes > 0) {
      message += `em ${minutes} minutos `;
    }
    
    // Passos
    if (activity.steps > 0) {
      if (activity.steps >= 1000) {
        const stepsK = Math.floor(activity.steps / 1000);
        const stepsRemainder = activity.steps % 1000;
        if (stepsRemainder > 0) {
          message += `e deu ${stepsK} mil e ${stepsRemainder} passos. `;
        } else {
          message += `e deu ${stepsK} mil passos. `;
        }
      } else {
        message += `e deu ${activity.steps} passos. `;
      }
    }
    
    // Calorias
    if (activity.calories > 0) {
      message += `Queimou ${activity.calories} calorias. `;
    }
    
    message += 'Parabéns pela caminhada!';
    
    await this.speak(message);
  }

  // Avisos durante a caminhada
  async onDistanceMilestone(distance: number): Promise<void> {
    let message = '';
    
    if (distance >= 1000) {
      const km = Math.floor(distance / 1000);
      if (km === 1) {
        message = 'Você já caminhou um quilômetro!';
      } else {
        message = `Você já caminhou ${km} quilômetros!`;
      }
    } else if (distance >= 500) {
      message = `Você já caminhou ${Math.round(distance)} metros.`;
    }
    
    if (message) {
      await this.speak(message);
    }
  }

  async onTimeMilestone(minutes: number): Promise<void> {
    let message = '';
    
    if (minutes === 5) {
      message = 'Você está caminhando há cinco minutos.';
    } else if (minutes === 10) {
      message = 'Dez minutos de caminhada. Continue assim!';
    } else if (minutes === 15) {
      message = 'Quinze minutos! Você está indo muito bem!';
    } else if (minutes === 30) {
      message = 'Meia hora de caminhada! Excelente!';
    } else if (minutes % 15 === 0 && minutes > 30) {
      message = `${minutes} minutos de caminhada. Que resistência!`;
    }
    
    if (message) {
      await this.speak(message);
    }
  }

  async onSpeedUpdate(speedKmh: number): Promise<void> {
    if (speedKmh >= 6) {
      await this.speak(`Seu ritmo está em ${speedKmh.toFixed(1)} quilômetros por hora. Que velocidade!`);
    } else if (speedKmh >= 4) {
      await this.speak(`Ritmo constante de ${speedKmh.toFixed(1)} quilômetros por hora.`);
    }
  }

  // Mensagens motivacionais
  async speakMotivationalMessage(): Promise<void> {
    const messages = [
      'Continue assim! Você está indo muito bem!',
      'Que caminhada incrível! Continue firme!',
      'Você está arrasando! Vamos continuar!',
      'Excelente ritmo! Mantenha o foco!',
      'Que determinação! Continue caminhando!'
    ];
    
    const message = messages[Math.floor(Math.random() * messages.length)];
    await this.speak(message);
  }

  // Persistência das configurações
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('voice-guide-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar configurações de voz:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('voice-guide-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erro ao salvar configurações de voz:', error);
    }
  }

  // Teste de voz
  async testVoice(): Promise<void> {
    await this.speak('Olá! Este é o seu guia de voz do AndarBem. Estou funcionando perfeitamente!');
  }
}

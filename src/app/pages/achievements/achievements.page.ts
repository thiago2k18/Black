import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonLabel,
  IonProgressBar, IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  trophyOutline, medalOutline, ribbonOutline, starOutline,
  walkOutline, timeOutline, speedometerOutline, footstepsOutline
} from 'ionicons/icons';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonLabel,
    IonProgressBar, IonChip
  ]
})
export class AchievementsPage implements OnInit {
  achievements: Achievement[] = [
    {
      id: '1',
      title: 'Primeira vez!',
      description: 'Você fez sua primeira caminhada',
      icon: 'walk-outline',
      color: 'success',
      progress: 1,
      maxProgress: 1,
      unlocked: true,
      unlockedAt: new Date()
    },
    {
      id: '2',
      title: 'Que resistência!',
      description: 'Caminhou 5 km de uma vez só',
      icon: 'trophy-outline',
      color: 'warning',
      progress: 2.3,
      maxProgress: 5,
      unlocked: false
    },
    {
      id: '3',
      title: 'Andou pra caramba!',
      description: 'Deu 10.000 passos em um dia',
      icon: 'footsteps-outline',
      color: 'primary',
      progress: 7500,
      maxProgress: 10000,
      unlocked: false
    },
    {
      id: '4',
      title: 'Que rapidez!',
      description: 'Manteve o ritmo acima de 6 km/h',
      icon: 'speedometer-outline',
      color: 'danger',
      progress: 0,
      maxProgress: 1,
      unlocked: false
    }
  ];

  constructor() {
    addIcons({
      trophyOutline, medalOutline, ribbonOutline, starOutline,
      walkOutline, timeOutline, speedometerOutline, footstepsOutline
    });
  }

  ngOnInit() {}

  get unlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  get lockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.unlocked);
  }

  getProgressPercentage(achievement: Achievement): number {
    return Math.min((achievement.progress / achievement.maxProgress) * 100, 100);
  }

  formatProgress(achievement: Achievement): string {
    if (achievement.maxProgress === 1) {
      return achievement.unlocked ? 'Conseguiu!' : 'Ainda não';
    }
    return `${achievement.progress.toLocaleString()} / ${achievement.maxProgress.toLocaleString()}`;
  }
}

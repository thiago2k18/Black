import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
  IonChip, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walkOutline, heartOutline, wifiOutline, happyOutline, flashOutline,
  shieldCheckmarkOutline, playCircleOutline, starOutline, footstepsOutline,
  locationOutline, timeOutline, speedometerOutline, fitnessOutline,
  cameraOutline, libraryOutline, trophyOutline, thumbsUpOutline,
  shareOutline, chatbubbleOutline, personOutline, logoLinkedin, 
  logoInstagram, logoGithub
} from 'ionicons/icons';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  styleUrls: ['./about.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonIcon,
    IonChip, IonLabel
  ]
})
export class AboutPage implements OnInit {

  constructor() {
    addIcons({
      walkOutline, heartOutline, wifiOutline, happyOutline, flashOutline,
      shieldCheckmarkOutline, playCircleOutline, starOutline, footstepsOutline,
      locationOutline, timeOutline, speedometerOutline, fitnessOutline,
      cameraOutline, libraryOutline, trophyOutline, thumbsUpOutline,
      shareOutline, chatbubbleOutline, personOutline, logoLinkedin, 
      logoInstagram, logoGithub
    });
  }

  ngOnInit() {}

  openLink(url: string) {
    window.open(url, '_blank');
  }

  rateApp() {
    // Implementar avaliação do app na loja
    console.log('Avaliar aplicativo na loja');
  }

  shareApp() {
    // Implementar compartilhamento do app
    if (navigator.share) {
      navigator.share({
        title: 'AndarBem',
        text: 'Descobri um app incrível para caminhadas! Funciona até sem internet 🚶‍♀️',
        url: window.location.origin
      });
    } else {
      // Fallback para dispositivos que não suportam Web Share API
      console.log('Compartilhar app');
    }
  }

  sendFeedback() {
    // Implementar envio de feedback
    const subject = 'Sugestão para o AndarBem';
    const body = 'Olá! Tenho uma sugestão para o app:\n\n';
    window.open(`mailto:feedback@andarbem.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  }
}


import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink, IonAvatar, ActionSheetController, AlertController } from '@ionic/angular/standalone';
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorFlash } from '@capgo/capacitor-flash';
import { addIcons } from 'ionicons';
import { 
  homeOutline, homeSharp, 
  walkOutline, walkSharp, 
  statsChartOutline, statsChartSharp, 
  personOutline, personSharp,
  settingsOutline, settingsSharp,
  informationCircleOutline, informationCircleSharp,
  logOutOutline, logOutSharp,
  trophyOutline, trophySharp,
  mapOutline, mapSharp,
  libraryOutline, librarySharp,
  analyticsOutline, analyticsSharp,
  fitnessOutline, fitnessSharp,
  starOutline, starSharp,
  trendingUpOutline, trendingUpSharp,
  optionsOutline, optionsSharp,
  brushOutline, brushSharp,
  lockClosedOutline, lockClosedSharp,
  footstepsOutline, footstepsSharp,
  cameraOutline, cameraSharp,
  flashlightOutline, flashlightSharp,
  imagesOutline, imagesSharp,
  closeOutline, closeSharp,
  trashOutline, trashSharp,
  addOutline, addSharp
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [CommonModule, RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonListHeader, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet, IonAvatar, SplashScreenComponent],
})
export class AppComponent implements OnInit {
  public appPages = [
    { title: 'Início', url: '/dashboard', icon: 'home' },
    { title: 'Nova Caminhada', url: '/activity', icon: 'walk' },
    { title: 'Histórico', url: '/history', icon: 'library' },
    { title: 'Metas', url: '/achievements', icon: 'trophy' },
    { title: 'Mapas', url: '/maps', icon: 'map' },
    { title: 'Perfil', url: '/profile', icon: 'person' },
  ];
  
  public menuOptions = [
    { title: 'Configurações', url: '/settings', icon: 'settings' },
    { title: 'Sobre', url: '/about', icon: 'information-circle' },
  ];

  public userInfo = {
    name: '',
    email: '',
    avatar: 'assets/images/avatar-placeholder.svg'
  };

  public showSplash = true;
  private isFlashlightOn = false;

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController
  ) {
    addIcons({ 
      homeOutline, homeSharp, 
      walkOutline, walkSharp, 
      statsChartOutline, statsChartSharp, 
      personOutline, personSharp,
      settingsOutline, settingsSharp,
      informationCircleOutline, informationCircleSharp,
      logOutOutline, logOutSharp,
      trophyOutline, trophySharp,
      mapOutline, mapSharp,
      libraryOutline, librarySharp,
      analyticsOutline, analyticsSharp,
      fitnessOutline, fitnessSharp,
      starOutline, starSharp,
      trendingUpOutline, trendingUpSharp,
      optionsOutline, optionsSharp,
      brushOutline, brushSharp,
      lockClosedOutline, lockClosedSharp,
      footstepsOutline, footstepsSharp,
      cameraOutline, cameraSharp,
      flashlightOutline, flashlightSharp,
      imagesOutline, imagesSharp,
      closeOutline, closeSharp,
      trashOutline, trashSharp,
      addOutline, addSharp
    });
  }

  ngOnInit() {
    // Inicialização do app
  }

  logout() {
    // Implementar logout
    console.log('Logout');
  }

  async changeAvatar() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Alterar Avatar',
      buttons: [
        {
          text: 'Câmera',
          icon: 'camera-outline',
          handler: () => {
            this.selectImageSource(CameraSource.Camera);
          }
        },
        {
          text: 'Câmera com Flash',
          icon: 'flashlight-outline',
          handler: () => {
            this.selectImageSourceWithFlash(CameraSource.Camera);
          }
        },
        {
          text: 'Galeria',
          icon: 'images-outline',
          handler: () => {
            this.selectImageSource(CameraSource.Photos);
          }
        },
        {
          text: 'Remover Foto',
          icon: 'trash-outline',
          role: 'destructive',
          handler: () => {
            this.removeAvatar();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close-outline',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  private async selectImageSource(source: CameraSource) {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 300,
        height: 300
      });

      if (image.dataUrl) {
        this.userInfo.avatar = image.dataUrl;
        this.showSuccessMessage('Foto atualizada!');
      }
    } catch (error) {
      console.error('Erro ao capturar imagem:', error);
      this.showErrorMessage('Não consegui tirar a foto. Tenta de novo?');
    }
  }

  private async selectImageSourceWithFlash(source: CameraSource) {
    try {
      // Ativar flash antes de tirar a foto
      await this.toggleFlashlight(true);
      
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.DataUrl,
        source: source,
        width: 300,
        height: 300
      });

      // Desativar flash após tirar a foto
      await this.toggleFlashlight(false);

      if (image.dataUrl) {
        this.userInfo.avatar = image.dataUrl;
        this.showSuccessMessage('Foto atualizada!');
      }
    } catch (error) {
      console.error('Erro ao capturar imagem:', error);
      // Garantir que o flash seja desligado em caso de erro
      await this.toggleFlashlight(false);
      this.showErrorMessage('Não consegui tirar a foto. Tenta de novo?');
    }
  }

  private async toggleFlashlight(turnOn: boolean) {
    try {
      if (turnOn && !this.isFlashlightOn) {
        await CapacitorFlash.switchOn({ intensity: 1 });
        this.isFlashlightOn = true;
      } else if (!turnOn && this.isFlashlightOn) {
        await CapacitorFlash.switchOff();
        this.isFlashlightOn = false;
      }
    } catch (error) {
      console.error('Erro ao controlar flash:', error);
    }
  }

  private async showSuccessMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Sucesso',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async showErrorMessage(message: string) {
    const alert = await this.alertController.create({
      header: 'Erro',
      message: message,
      buttons: ['OK']
    });
    await alert.present();
  }

  async removeAvatar() {
    const alert = await this.alertController.create({
      header: 'Remover foto',
      message: 'Tem certeza que quer apagar sua foto?',
      buttons: [
        {
          text: 'Não',
          role: 'cancel'
        },
        {
          text: 'Sim',
          role: 'destructive',
          handler: () => {
            this.userInfo.avatar = 'assets/images/avatar-placeholder.svg';
            this.showSuccessMessage('Foto removida!');
          }
        }
      ]
    });
    await alert.present();
  }

  onSplashComplete() {
    this.showSplash = false;
  }
}

import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SplashScreenComponent implements OnInit {
  @Output() splashComplete = new EventEmitter<void>();

  showSplash = true;

  ngOnInit() {
    // Splash screen dura 5 segundos
    setTimeout(() => {
      this.hideSplash();
    }, 5000);
  }

  private hideSplash() {
    this.showSplash = false;
    setTimeout(() => {
      this.splashComplete.emit();
    }, 500); // Aguarda animação de saída
  }
}

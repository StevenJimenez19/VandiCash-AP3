import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  correo = 'equipo@vandicash.edu';
  clave = 'demo123';
  recordar = true;
  mostrarClave = false;

  constructor(private router: Router, private toastCtrl: ToastController) {}

  async entrar(): Promise<void> {
    if (!this.correo.trim() || !this.clave.trim()) {
      const toast = await this.toastCtrl.create({
        message: 'Completa el correo y la contraseña.',
        duration: 1500,
        position: 'bottom',
      });
      await toast.present();
      return;
    }
    await this.router.navigateByUrl('/simulador');
  }

  async ayuda(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'Acceso de demostración para fines académicos.',
      duration: 1700,
      position: 'bottom',
    });
    await toast.present();
  }
}

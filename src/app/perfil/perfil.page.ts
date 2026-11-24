import { Component } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage {
  ultimaActualizacion = 'Actualizado ahora';

  constructor(private toastCtrl: ToastController) {}

  refrescar(event: RefresherCustomEvent): void {
    setTimeout(() => {
      this.ultimaActualizacion = 'Perfil actualizado correctamente';
      event.target.complete();
    }, 650);
  }

  async editar(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: 'Edición de perfil disponible en la versión de demostración.',
      duration: 1700,
      position: 'bottom',
    });
    await toast.present();
  }
}

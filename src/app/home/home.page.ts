import { Component } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  monto = 20000;
  plazo = 6;
  frecuencia: 'Quincenal' | 'Mensual' = 'Quincenal';

  constructor(private toastCtrl: ToastController) {}

  get total(): number {
    return this.monto * 1.1;
  }

  get cuota(): number {
    const pagos = this.frecuencia === 'Quincenal' ? this.plazo * 2 : this.plazo;
    return this.total / pagos;
  }

  seleccionarPlazo(plazo: number): void {
    this.plazo = plazo;
  }

  seleccionarFrecuencia(frecuencia: 'Quincenal' | 'Mensual'): void {
    this.frecuencia = frecuencia;
  }

  refrescar(event: RefresherCustomEvent): void {
    setTimeout(() => {
      this.restablecer(false);
      event.target.complete();
    }, 650);
  }

  async restablecer(mostrarMensaje = true): Promise<void> {
    this.monto = 20000;
    this.plazo = 6;
    this.frecuencia = 'Quincenal';

    if (mostrarMensaje) {
      const toast = await this.toastCtrl.create({
        message: 'Simulación restablecida',
        duration: 1200,
        position: 'bottom',
      });
      await toast.present();
    }
  }

  async continuar(): Promise<void> {
    const toast = await this.toastCtrl.create({
      message: `Plan ilustrativo: RD$ ${this.cuota.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por cuota`,
      duration: 1800,
      position: 'bottom',
    });
    await toast.present();
  }

}

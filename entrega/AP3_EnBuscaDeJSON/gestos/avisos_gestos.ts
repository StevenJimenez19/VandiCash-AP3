import { Component } from '@angular/core';
import { RefresherCustomEvent, ToastController } from '@ionic/angular';
import { IonItemSliding } from '@ionic/angular/lazy';

interface Aviso {
  id: number;
  titulo: string;
  detalle: string;
  icono: string;
  tono: 'success' | 'primary' | 'warning';
  grupo: 'Hoy' | 'Anteriores';
}

const AVISOS_INICIALES: Aviso[] = [
  { id: 1, titulo: 'Recibimos tu comprobante', detalle: 'Tu pago está pendiente de validación.', icono: 'cloud-upload-outline', tono: 'primary', grupo: 'Hoy' },
  { id: 2, titulo: 'Tu próxima cuota se acerca', detalle: 'Consulta el monto y la fecha en tu préstamo.', icono: 'time-outline', tono: 'warning', grupo: 'Hoy' },
  { id: 3, titulo: 'Tu préstamo ya está activo', detalle: 'Revisa tu calendario de pagos.', icono: 'checkmark-outline', tono: 'success', grupo: 'Anteriores' },
];

@Component({
  selector: 'app-avisos',
  templateUrl: './avisos.page.html',
  styleUrls: ['./avisos.page.scss'],
  standalone: false,
})
export class AvisosPage {
  avisos: Aviso[] = AVISOS_INICIALES.map(aviso => ({ ...aviso }));

  constructor(private toastCtrl: ToastController) {}

  porGrupo(grupo: Aviso['grupo']): Aviso[] {
    return this.avisos.filter(aviso => aviso.grupo === grupo);
  }

  refrescar(event: RefresherCustomEvent): void {
    setTimeout(() => {
      this.avisos = AVISOS_INICIALES.map(aviso => ({ ...aviso }));
      event.target.complete();
    }, 700);
  }

  async eliminar(id: number, sliding?: IonItemSliding): Promise<void> {
    this.avisos = this.avisos.filter(aviso => aviso.id !== id);
    await sliding?.close();
    const toast = await this.toastCtrl.create({
      message: 'Aviso eliminado. Desliza hacia abajo para restaurarlo.',
      duration: 1700,
      position: 'bottom',
    });
    await toast.present();
  }

  onSwipe(id: number, sliding: IonItemSliding): void {
    void this.eliminar(id, sliding);
  }
}

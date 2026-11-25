import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActionSheetController, Gesture, GestureController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';

interface Cuota {
  numero: string;
  fecha: string;
  detalle: string;
  estado: 'Pagada' | 'Próxima' | 'Pendiente';
  icono: string;
}

@Component({
  selector: 'app-prestamo',
  templateUrl: './prestamo.page.html',
  styleUrls: ['./prestamo.page.scss'],
  standalone: false,
})
export class PrestamoPage implements AfterViewInit, OnDestroy {
  @ViewChildren('longPressTarget', { read: ElementRef }) longPressTargets!: QueryList<ElementRef<HTMLElement>>;
  @ViewChild('receiptImage', { read: ElementRef }) receiptImage!: ElementRef<HTMLImageElement>;

  cuotas: Cuota[] = [
    { numero: 'Cuota 04', fecha: '15 nov', detalle: 'Pago validado', estado: 'Pagada', icono: 'checkmark-outline' },
    { numero: 'Cuota 05', fecha: '30 nov', detalle: 'RD$ 1,833.33', estado: 'Próxima', icono: 'time-outline' },
    { numero: 'Cuota 06', fecha: '15 dic', detalle: 'RD$ 1,833.33', estado: 'Pendiente', icono: 'time-outline' },
  ];
  escala = 1;
  mostrarComprobante = true;

  private longPressGestures: Gesture[] = [];
  private longPressChanges?: Subscription;
  private pressTimers = new Set<ReturnType<typeof setTimeout>>();
  private cuotaSeleccionada?: Cuota;
  private pinchGesture?: Gesture;
  private pointers = new Map<number, PointerEvent>();
  private distanciaInicial = 0;
  private escalaInicial = 1;

  constructor(
    private gestureCtrl: GestureController,
    private actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
  ) {}

  ngAfterViewInit(): void {
    this.configurarLongPress();
    this.longPressChanges = this.longPressTargets.changes.subscribe(() => this.configurarLongPress());
    this.configurarPinchSegunGuia();
  }

  ngOnDestroy(): void {
    this.longPressChanges?.unsubscribe();
    this.limpiarLongPress();
    this.pinchGesture?.destroy();
  }

  private configurarLongPress(): void {
    this.limpiarLongPress();
    this.longPressGestures = this.longPressTargets.map((target, index) => {
      let pressTimer: ReturnType<typeof setTimeout> | undefined;
      const cancelar = () => {
        if (pressTimer !== undefined) {
          clearTimeout(pressTimer);
          this.pressTimers.delete(pressTimer);
          pressTimer = undefined;
        }
      };
      const gesture = this.gestureCtrl.create({
        el: target.nativeElement,
        threshold: 0,
        gestureName: 'long-press-cuota',
        onStart: () => {
          cancelar();
          const cuota = this.cuotas[index];
          pressTimer = setTimeout(() => {
            cancelar();
            void this.mostrarMenuContextual(cuota);
          }, 800);
          this.pressTimers.add(pressTimer);
        },
        onMove: ev => {
          if (Math.abs(ev.deltaX) > 10 || Math.abs(ev.deltaY) > 10) {
            cancelar();
          }
        },
        onEnd: cancelar,
      });
      gesture.enable();
      return gesture;
    });
  }

  private limpiarLongPress(): void {
    this.pressTimers.forEach(timer => clearTimeout(timer));
    this.pressTimers.clear();
    this.longPressGestures.forEach(gesture => gesture.destroy());
    this.longPressGestures = [];
  }

  private configurarPinchSegunGuia(): void {
    this.pinchGesture = this.gestureCtrl.create({
      el: this.receiptImage.nativeElement,
      threshold: 0,
      gestureName: 'pinch-zoom-comprobante',
      onMove: (ev: any) => {
        if (typeof ev.scale === 'number') {
          this.aplicarEscala(ev.scale);
        }
      },
    });
    this.pinchGesture.enable();
  }

  onPointerDown(event: PointerEvent): void {
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.pointers.set(event.pointerId, event);
    if (this.pointers.size === 2) {
      this.distanciaInicial = this.distanciaEntrePunteros();
      this.escalaInicial = this.escala;
    }
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.set(event.pointerId, event);
    if (this.pointers.size === 2 && this.distanciaInicial > 0) {
      const factor = this.distanciaEntrePunteros() / this.distanciaInicial;
      this.aplicarEscala(this.escalaInicial * factor);
    }
  }

  onPointerUp(event: PointerEvent): void {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.distanciaInicial = 0;
  }

  private distanciaEntrePunteros(): number {
    const [a, b] = Array.from(this.pointers.values());
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  private aplicarEscala(valor: number): void {
    this.escala = Math.max(1, Math.min(valor, 5));
    this.receiptImage.nativeElement.style.transform = `scale(${this.escala})`;
  }

  restablecerZoom(): void {
    this.aplicarEscala(1);
  }

  async mostrarMenuContextual(cuota = this.cuotaSeleccionada): Promise<void> {
    this.cuotaSeleccionada = cuota;
    const menu = await this.actionSheetCtrl.create({
      header: cuota ? `Opciones de ${cuota.numero}` : 'Opciones de la cuota',
      subHeader: cuota ? `${cuota.fecha} · ${cuota.estado}` : 'Menú abierto mediante long-press',
      buttons: [
        { text: 'Ver detalles', icon: 'eye-outline', handler: () => void this.mensaje(cuota ? `${cuota.numero} · ${cuota.fecha} · ${cuota.detalle} · ${cuota.estado}` : 'Detalle de cuota consultado') },
        { text: 'Recordarme después', icon: 'alarm-outline', handler: () => void this.mensaje(cuota ? `Recordatorio ilustrativo creado para ${cuota.numero}` : 'Recordatorio ilustrativo creado') },
        { text: 'Cancelar', role: 'cancel', icon: 'close-outline' },
      ],
    });
    await menu.present();
  }

  private async mensaje(texto: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message: texto, duration: 1300, position: 'bottom' });
    await toast.present();
  }
}

import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { ActionSheetController, Gesture, GestureController, ToastController } from '@ionic/angular';

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
  @ViewChild('longPressTarget', { read: ElementRef }) longPressTarget!: ElementRef<HTMLElement>;
  @ViewChild('receiptImage', { read: ElementRef }) receiptImage!: ElementRef<HTMLImageElement>;

  cuotas: Cuota[] = [
    { numero: 'Cuota 04', fecha: '15 nov', detalle: 'Pago validado', estado: 'Pagada', icono: 'checkmark-outline' },
    { numero: 'Cuota 05', fecha: '30 nov', detalle: 'RD$ 1,833.33', estado: 'Próxima', icono: 'time-outline' },
    { numero: 'Cuota 06', fecha: '15 dic', detalle: 'RD$ 1,833.33', estado: 'Pendiente', icono: 'time-outline' },
  ];
  escala = 1;
  mostrarComprobante = true;

  private longPressGesture?: Gesture;
  private pinchGesture?: Gesture;
  private pressTimer?: ReturnType<typeof setTimeout>;
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
    this.configurarPinchSegunGuia();
  }

  ngOnDestroy(): void {
    clearTimeout(this.pressTimer);
    this.longPressGesture?.destroy();
    this.pinchGesture?.destroy();
  }

  private configurarLongPress(): void {
    this.longPressGesture = this.gestureCtrl.create({
      el: this.longPressTarget.nativeElement,
      threshold: 0,
      gestureName: 'long-press-cuota',
      onStart: () => {
        this.pressTimer = setTimeout(() => void this.mostrarMenuContextual(), 800);
      },
      onMove: ev => {
        if (Math.abs(ev.deltaX) > 10 || Math.abs(ev.deltaY) > 10) {
          clearTimeout(this.pressTimer);
        }
      },
      onEnd: () => clearTimeout(this.pressTimer),
    });
    this.longPressGesture.enable();
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

  async mostrarMenuContextual(): Promise<void> {
    const menu = await this.actionSheetCtrl.create({
      header: 'Opciones de la cuota',
      subHeader: 'Menú abierto mediante long-press',
      buttons: [
        { text: 'Ver detalles', icon: 'eye-outline', handler: () => void this.mensaje('Detalle de cuota consultado') },
        { text: 'Recordarme después', icon: 'alarm-outline', handler: () => void this.mensaje('Recordatorio ilustrativo creado') },
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

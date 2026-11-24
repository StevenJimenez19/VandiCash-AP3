import { ElementRef, QueryList } from '@angular/core';
import { ActionSheetController, GestureConfig, GestureController, ToastController } from '@ionic/angular';
import { vi } from 'vitest';
import { PrestamoPage } from './prestamo.page';

describe('Long-press de las cuotas', () => {
  let page: PrestamoPage;
  let configs: GestureConfig[];
  let destroyers: ReturnType<typeof vi.fn>[];
  const createMenu = vi.fn();
  const createToast = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    configs = [];
    destroyers = [];
    createMenu.mockReset().mockResolvedValue({ present: vi.fn() });
    createToast.mockReset().mockResolvedValue({ present: vi.fn() });
    const gestures = {
      create: (config: GestureConfig) => {
        configs.push(config);
        const destroy = vi.fn();
        destroyers.push(destroy);
        return { enable: vi.fn(), destroy };
      },
    };
    page = new PrestamoPage(
      gestures as unknown as GestureController,
      { create: createMenu } as unknown as ActionSheetController,
      { create: createToast } as unknown as ToastController,
    );
    page.longPressTargets = new QueryList<ElementRef<HTMLElement>>();
    page.longPressTargets.reset(page.cuotas.map(() => new ElementRef(document.createElement('ion-item'))));
    page.receiptImage = new ElementRef(document.createElement('img'));
    page.ngAfterViewInit();
  });

  afterEach(() => {
    page.ngOnDestroy();
    vi.useRealTimers();
  });

  it.each([0, 1, 2])('abre el menú y las acciones de la cuota %i', async index => {
    configs[index].onStart!({} as never);
    await vi.advanceTimersByTimeAsync(799);
    expect(createMenu).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    const menu = createMenu.mock.calls[0][0];
    const cuota = page.cuotas[index];
    expect(menu.header).toContain(cuota.numero);
    expect(menu.subHeader).toBe(`${cuota.fecha} · ${cuota.estado}`);
    menu.buttons[0].handler();
    expect(createToast.mock.calls[0][0].message).toContain(cuota.detalle);
    menu.buttons[1].handler();
    expect(createToast.mock.calls[1][0].message).toContain(cuota.numero);
    await page.mostrarMenuContextual();
    expect(createMenu.mock.calls[1][0].header).toContain(cuota.numero);
  });

  it('cancela al soltar antes de 800 ms o mover más de 10 px', async () => {
    configs[1].onStart!({} as never);
    configs[1].onEnd!({} as never);
    configs[2].onStart!({} as never);
    configs[2].onMove!({ deltaX: 11, deltaY: 0 } as never);
    await vi.advanceTimersByTimeAsync(1000);
    expect(createMenu).not.toHaveBeenCalled();
  });

  it('reconfigura las filas y limpia gestos y temporizadores al destruir', async () => {
    configs[0].onStart!({} as never);
    page.longPressTargets.reset([new ElementRef(document.createElement('ion-item'))]);
    page.longPressTargets.notifyOnChanges();
    expect(destroyers.slice(0, 3).every(destroy => destroy.mock.calls.length === 1)).toBe(true);
    configs[4].onStart!({} as never);
    page.ngOnDestroy();
    await vi.advanceTimersByTimeAsync(1000);
    expect(createMenu).not.toHaveBeenCalled();
    expect(destroyers.every(destroy => destroy.mock.calls.length >= 1)).toBe(true);
  });
});

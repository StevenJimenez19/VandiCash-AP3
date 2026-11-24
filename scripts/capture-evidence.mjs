import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const output = path.join(root, 'entrega', 'AP3_EnBuscaDeJSON');
await mkdir(path.join(output, 'interfaces'), { recursive: true });
await mkdir(path.join(output, 'gestos'), { recursive: true });
await mkdir(path.join(output, 'menu'), { recursive: true });

const pages = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
const target = pages.find(page => page.type === 'page');
if (!target) throw new Error('No se encontró una página en Chrome remoto.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let id = 0;
const pending = new Map();
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const item = pending.get(message.id);
  if (!item) return;
  pending.delete(message.id);
  if (message.error) item.reject(new Error(message.error.message));
  else item.resolve(message.result);
};

function call(method, params = {}) {
  const requestId = ++id;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
await call('Emulation.setDeviceMetricsOverride', {
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  screenWidth: 390, screenHeight: 844,
});
await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await call('Page.enable');

async function navigate(route) {
  await call('Page.navigate', { url: `http://127.0.0.1:8100/${route}` });
  await wait(1500);
}

async function evaluate(expression) {
  return call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
}

async function screenshot(relativePath) {
  const { data } = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
  await writeFile(path.join(output, relativePath), Buffer.from(data, 'base64'));
}

await navigate('login');
await screenshot('interfaces/00_inicio_sesion.png');
await evaluate(`(() => { const host=document.querySelector('.primary-action'); const button=host?.shadowRoot?.querySelector('button'); (button || host)?.click(); })()`);
await wait(700);
const loginRoute = await evaluate(`location.pathname`);
if (loginRoute.result.value !== '/simulador') {
  throw new Error(`El botón de acceso no navegó al simulador: ${loginRoute.result.value}`);
}

await navigate('simulador');
await screenshot('interfaces/01_hagamos_numeros.png');

await navigate('avisos');
await screenshot('interfaces/02_tus_avisos.png');
await evaluate(`document.querySelector('ion-item-sliding')?.open('end')`);
await wait(500);
await screenshot('gestos/01_swipe_eliminar.png');

await navigate('avisos');
await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 115, id: 1, radiusX: 2, radiusY: 2 }] });
for (const y of [135, 165, 205, 250, 295]) {
  await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y, id: 1, radiusX: 2, radiusY: 2 }] });
  await wait(80);
}
await screenshot('gestos/02_pull_to_refresh.png');
await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await wait(900);

await navigate('prestamo');
await screenshot('interfaces/03_mi_prestamo.png');

await navigate('perfil');
await screenshot('interfaces/04_mi_perfil.png');
const profileComponents = await evaluate(`({cards: document.querySelectorAll('ion-card').length, lists: document.querySelectorAll('ion-list').length, refreshers: document.querySelectorAll('ion-refresher').length, fabs: document.querySelectorAll('ion-fab').length})`);
if (Object.values(profileComponents.result.value).some(value => value < 1)) {
  throw new Error('La pantalla de perfil no contiene todos los componentes Ionic previstos.');
}

await navigate('prestamo');
await evaluate(`document.querySelector('.receipt-card')?.scrollIntoView({block:'center'})`);
await wait(300);
const receipt = await evaluate(`(() => { const r=document.querySelector('.receipt-viewport img')?.getBoundingClientRect(); return r ? {x:r.x,y:r.y,w:r.width,h:r.height} : null; })()`);
const box = receipt.result.value;
if (box) {
  const cy = Math.min(700, Math.max(180, box.y + box.h / 2));
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { x: 165, y: cy, id: 1, radiusX: 2, radiusY: 2 },
    { x: 225, y: cy, id: 2, radiusX: 2, radiusY: 2 },
  ]});
  await call('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { x: 105, y: cy, id: 1, radiusX: 2, radiusY: 2 },
    { x: 285, y: cy, id: 2, radiusX: 2, radiusY: 2 },
  ]});
  await wait(400);
  await screenshot('gestos/03_pinch_zoom.png');
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

await navigate('prestamo');
await evaluate(`document.querySelector('.payment-item')?.scrollIntoView({block:'center'})`);
await wait(300);
const press = await evaluate(`(() => { const r=document.querySelector('.payment-item')?.getBoundingClientRect(); return r ? {x:r.x+r.width/2,y:r.y+r.height/2} : null; })()`);
const point = press.result.value;
if (point) {
  await call('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: point.x, y: point.y, id: 1, radiusX: 2, radiusY: 2 }] });
  await wait(950);
  await call('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(400);
  await screenshot('gestos/04_long_press.png');
}

await navigate('simulador');
await evaluate(`document.querySelector('ion-menu-button')?.click()`);
await wait(700);
await screenshot('menu/menu_lateral.png');

ws.close();
console.log(`Capturas guardadas en ${output}`);

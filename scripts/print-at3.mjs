import { pathToFileURL } from 'node:url';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const html = path.join(root, 'entrega', 'AT3_Winston_Jimenez.html');
const pdf = path.join(root, 'entrega', 'AT3_Jimenez_Winston.pdf');
const preview = path.join(root, 'entrega', 'AT3_Jimenez_Winston_preview.png');
const pages = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
const target = pages.find(page => page.type === 'page');
if (!target) throw new Error('No se encontró una página en Chrome remoto.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  const item = pending.get(message.id);
  if (!item) return;
  pending.delete(message.id);
  message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
};
const call = (method, params = {}) => {
  const requestId = ++id;
  ws.send(JSON.stringify({ id: requestId, method, params }));
  return new Promise((resolve, reject) => pending.set(requestId, { resolve, reject }));
};

await call('Page.enable');
await call('Emulation.setDeviceMetricsOverride', {
  width: 1123, height: 794, deviceScaleFactor: 1, mobile: false,
});
await call('Page.navigate', { url: pathToFileURL(html).href });
await new Promise(resolve => setTimeout(resolve, 800));
const shot = await call('Page.captureScreenshot', { format: 'png', fromSurface: true });
await writeFile(preview, Buffer.from(shot.data, 'base64'));
const result = await call('Page.printToPDF', {
  landscape: true,
  printBackground: true,
  paperWidth: 11.6929,
  paperHeight: 8.2677,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  preferCSSPageSize: true,
});
await writeFile(pdf, Buffer.from(result.data, 'base64'));
ws.close();
console.log(`PDF guardado en ${pdf}`);

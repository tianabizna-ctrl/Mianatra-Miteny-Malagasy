// Optional real-Chromium checks; Node 22+, installed Chrome, no npm dependencies.
// Run with the app served at 8790. Screenshots and profile live in OS temp only.
import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const base = process.argv[2] || 'http://127.0.0.1:8790';
const parent = process.env.OPENCODE_TMP || os.tmpdir();
const output = await mkdtemp(path.join(parent, 'bako-browser-'));
// Captures are optional: headless macOS Chrome can stall its compositor despite
// a healthy page. Layout assertions and learning-flow checks always run.
const captureEnabled = process.env.BAKO_CAPTURE === '1';
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const child = spawn(chrome, ['--headless', '--disable-gpu', '--remote-debugging-port=0', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + path.join(output, 'profile'), 'about:blank']);
let socket;
const limit = (promise, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Timed out: ' + label)), 20000);
  })]).finally(() => clearTimeout(timer));
};
try {
  const endpoint = await limit(new Promise((resolve, reject) => {
    let stderr = '';
    child.stderr.on('data', chunk => {
      stderr += chunk;
      const found = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (found) resolve(found[1]);
    });
    child.once('error', reject);
    child.once('exit', code => reject(new Error('Chrome exited before DevTools: ' + code)));
  }), 'Chrome startup');
  socket = new WebSocket(endpoint);
  await limit(new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; }), 'DevTools connection');
  console.log('Chrome connected.');
  let sequence = 0;
  const pending = new Map();
  const events = new Map();
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else if (message.method) {
      const key = message.sessionId + ':' + message.method;
      if (events.has(key)) { events.get(key)(message.params); events.delete(key); }
    }
  };
  const call = (method, params = {}, sessionId) => limit(new Promise((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  }), method);
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => call(method, params, sessionId);
  await page('Page.enable');
  await page('Runtime.enable');
  await page('Page.bringToFront');
  const evaluate = async expression => {
    const result = await page('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const navigate = async route => {
    console.log('Checking ' + route);
    const loaded = new Promise(resolve => events.set(sessionId + ':Page.loadEventFired', resolve));
    // A unique query forces a real reload, even between hash routes.
    await page('Page.navigate', { url: base + '/?browserCheck=' + (++sequence) + route });
    await limit(loaded, 'page load: ' + route);
    // Worker activation can issue a second reload. Wait for the requested view's
    // DOM, not just the first load event (and never use a fixed delay).
    await evaluate(`new Promise(resolve => {
      const route = ${JSON.stringify(route)};
      const parts = route.replace(/^#\\//, '').split('/');
      const ready = () => {
        if (location.hash !== route || !window.Salama) return false;
        const main = document.querySelector('main');
        if (!main) return false;
        if (parts[0] === 'learn') return Boolean(main.querySelector('#studyResults'));
        if (parts[0] === 'study') {
          const lesson = Salama.study && Salama.study.lesson(parts[1]);
          const heading = main.querySelector('.study-lesson-header h1');
          const selector = {read:'.study-examples',words:'.study-word-grid',write:'#studyDraft',drills:'#studyDrills'}[parts[2]];
          return Boolean(lesson && heading && heading.textContent === lesson.title && main.querySelector(selector));
        }
        if (parts[0] === 'progress') return Boolean(main.querySelector('.study-progress-list'));
        if (parts[0] === 'dictionary') return Boolean(main.querySelector('[data-word-theme]'));
        return Boolean(main.firstElementChild);
      };
      if (ready()) return resolve(true);
      const observer = new MutationObserver(() => { if (ready()) { observer.disconnect(); resolve(true); } });
      observer.observe(document.documentElement, {childList:true,subtree:true});
    })`);
    await evaluate('document.fonts.ready.then(() => true)');
  };
  // Use real emulated CSS viewports, not a clipped screenshot of Chrome's
  // minimum native window width on macOS.
  await page('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('#/study/gram_16b/read');
  // Finish the first-install activation reload before starting other journeys.
  // Otherwise an old document's queued reload can cancel a CDP navigation.
  await evaluate('navigator.serviceWorker.ready.then(() => true)');
  const activated = new Promise(resolve => events.set(sessionId + ':Page.loadEventFired', resolve));
  await page('Page.reload');
  await limit(activated, 'reload after first worker activation');
  await evaluate('document.fonts.ready.then(() => true)');
  const mobile = await evaluate(`({ width: innerWidth, document: document.documentElement.scrollWidth,
    content: document.querySelector('.study-content').getBoundingClientRect().right,
    sidebar: document.querySelector('.study-sidebar').getBoundingClientRect().right,
    heading: document.querySelector('main h1').textContent })`);
  assert.equal(mobile.width, 390);
  assert(mobile.document <= 390, JSON.stringify(mobile));
  assert(mobile.content <= 390 && mobile.sidebar <= 390, JSON.stringify(mobile));
  console.log('Mobile layout: ' + JSON.stringify(mobile));
  if (captureEnabled) {
    const capture = await page('Page.captureScreenshot', { captureBeyondViewport: false });
    await writeFile(path.join(output, 'mobile.png'), Buffer.from(capture.data, 'base64'));
  }

  await page('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate('#/learn');
  assert.equal(await evaluate("document.querySelectorAll('.study-lesson-card').length"), 61);
  assert.equal(await evaluate("/\\bbako\\b|adapted|inspired|source pages|source material/i.test(document.body.textContent)"), false);
  assert.equal(await evaluate("document.querySelector('.study-hero-meta').textContent.includes('61 lessons')"), true);
  const desktop = await evaluate('({ width: innerWidth, document: document.documentElement.scrollWidth })');
  assert(desktop.document <= desktop.width, JSON.stringify(desktop));
  if (captureEnabled) {
    const capture = await page('Page.captureScreenshot', { captureBeyondViewport: false });
    await writeFile(path.join(output, 'desktop.png'), Buffer.from(capture.data, 'base64'));
  }

  // A real input event exercises filtering, not just the renderer.
  await evaluate(`document.querySelector('#studySearch').value = 'dadabe';
    document.querySelector('#studySearch').dispatchEvent(new Event('input', { bubbles: true }));`);
  assert.equal(await evaluate("document.querySelectorAll('.study-lesson-card').length"), 1);
  await navigate('#/study/theme_1/read');
  assert.equal(await evaluate("/\\bbako\\b|adapted|inspired|source pages/i.test(document.querySelector('main').textContent)"), false);
  assert(await evaluate("document.querySelector('.study-family-tree').textContent.includes('Dadabe')"));
  assert.equal(await evaluate("/dadilahy|\\bino\\b|akory/i.test(document.querySelector('main').textContent)"), false);
  await evaluate("document.querySelector('#studyComplete').click()");
  assert.equal(await evaluate("Salama.study.count('beginner')"), 1);
  assert.equal(await evaluate('Salama.core.sessionDoneCount()'), 0);
  await navigate('#/study/theme_1/write');
  const draft = 'Ity ny dadabeko. Manana zanaka roa aho.';
  await evaluate(`document.querySelector('#studyDraft').value = ${JSON.stringify(draft)};
    document.querySelector('#studyDraft').dispatchEvent(new Event('input', { bubbles: true }));`);
  await navigate('#/study/theme_1/write');
  assert.equal(await evaluate("document.querySelector('#studyDraft').value"), draft);
  await navigate('#/study/gram_16d/drills');
  await evaluate(`Salama.study.lesson('gram_16d').drills.forEach((d,i) => document.querySelector('#studyAnswer'+i).value = d.answers[0]);
    document.querySelector('#studyDrills').requestSubmit();`);
  assert.equal(await evaluate('Salama.core.state.study.checks.gram_16d.correct'), 6);
  await navigate('#/progress');
  assert(await evaluate("document.querySelector('main').textContent.includes('6/6 sample matches')"));
  await navigate('#/dictionary/people_family');
  assert(await evaluate("document.querySelector('[data-word-theme=people_family]').getAttribute('aria-pressed') === 'true'"));
  await navigate('#/study/theme_1/words');
  await evaluate(`window.audioDispatches = 0;
    window.originalSpeakWord = Salama.speech.speakWordId;
    Salama.speech.speakWordId = () => { window.audioDispatches++; return true; };
    document.querySelector('[data-speak][data-word-id]').click();`);
  assert.equal(await evaluate('window.audioDispatches'), 1);
  // Navigate through the real hash router without reloading persistent main.
  for (const route of ['#/study/theme_1/read', '#/study/theme_1/words']) {
    await evaluate(`new Promise(resolve => {
      window.addEventListener('hashchange', () => resolve(true), {once:true});
      location.hash = ${JSON.stringify(route)};
    })`);
  }
  await evaluate("document.querySelector('[data-speak][data-word-id]').click()");
  assert.equal(await evaluate('window.audioDispatches'), 2, 'No duplicate speech handlers after hash navigation');
  await evaluate('Salama.speech.speakWordId = window.originalSpeakWord');
  await navigate('#/learn/advanced');
  await evaluate("Salama.core.setPref('mode', 'dark')");
  assert.equal(await evaluate("document.documentElement.getAttribute('data-mode')"), 'dark');
  if (captureEnabled) {
    const capture = await page('Page.captureScreenshot', { captureBeyondViewport: false });
    await writeFile(path.join(output, 'dark.png'), Buffer.from(capture.data, 'base64'));
  }
  await evaluate('navigator.serviceWorker.ready.then(() => true)');
  assert(await evaluate('Boolean(navigator.serviceWorker.controller)'));
  // Service-worker requests belong to its own DevTools target. Throttling only
  // the page would still let the worker fetch from the server (a false offline test).
  const workerTargets = (await call('Target.getTargets')).targetInfos.filter(t => t.type === 'service_worker' && t.url.startsWith(base));
  assert(workerTargets.length > 0, 'Expected this app\'s service-worker target');
  const workerSessions = [];
  for (const target of workerTargets) {
    const attached = await call('Target.attachToTarget', { targetId: target.targetId, flatten: true });
    workerSessions.push(attached.sessionId);
    await call('Network.enable', {}, attached.sessionId);
    await call('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }, attached.sessionId);
  }
  await page('Network.enable');
  await page('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await navigate('#/study/gram_16b/read');
  assert.equal(await evaluate('STUDY_CONTENT.lessons.length'), 61);
  assert(await evaluate("document.querySelector('main').textContent.includes('Asiana sira ny lasopy.')"));
  assert.equal(await evaluate("Salama.study.draft('theme_1')"), draft);
  const missing = await evaluate("fetch('media/missing-bako-recording.mp3').then(async r => ({status:r.status, text:await r.text()}))");
  assert.equal(missing.status, 503);
  assert(!missing.text.includes('<html'));
  await page('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });
  for (const worker of workerSessions) {
    await call('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 }, worker);
  }
  const freshLoaded = new Promise(resolve => events.set(sessionId + ':Page.loadEventFired', resolve));
  await page('Page.navigate', {url:base + '/fresh.html#/learn'});
  await limit(freshLoaded, 'alternate entry page');
  assert.equal(await evaluate('STUDY_CONTENT.lessons.length'), 61);
  assert.equal(await evaluate("/\\bbako\\b|adapted|inspired/i.test(document.body.textContent)"), false);
  console.log('PASS: real mobile/desktop viewports, filters, Official family diagram, completion, drafts after reload, drills, progress, dictionary cross-link, dark rendering and an offline lesson reload.');
  console.log(JSON.stringify({ mobile, desktop, screenshots: captureEnabled ? output : 'disabled; set BAKO_CAPTURE=1 to capture' }, null, 2));
} finally {
  if (socket) socket.close();
  child.kill('SIGTERM');
}

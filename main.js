/* =========================================================
   Ra.Ma. Piscine — Demo 1 · Il cantiere (fotorealistica)
   Le 6 foto delle fasi (cartella "fasi") si susseguono con lo scroll.
   Il passaggio da una fase all'altra non è una semplice dissolvenza:
   la novità "cresce" a macchie irregolari, come un lavoro che avanza.
   In più: avvicinamento lento della camera e parallasse 3D morbida col mouse.
   ========================================================= */
import * as THREE from 'three';
import Lenis from 'lenis';

const SETTINGS = {
  scrollSmoothing: 3.2,  // più alto = l'immagine segue lo scroll più rapidamente
  mouseSmoothing: 1.1,   // più basso = movimento col mouse più lento e morbido
  parallax: 0.012,       // quanto si sposta l'immagine col mouse
  tilt: 1.8,             // gradi di inclinazione 3D col mouse
  zoom: 0.045,           // quanto la camera si avvicina dall'inizio alla fine
  hold: [0.06, 0.94],    // in ogni tratto il passaggio alla fase dopo occupa quasi tutto lo scroll (da 0.06 a 0.94)
  lenisLerp: 0.08,
  videoSharpen: 0.7,     // nitidezza del video (0 = nessuna, 1.2 = molta)
};

// Le fasi: immagine + testi (stesso ordine dei titoli nell'HTML)
const PHASES = [
  { img: 'fasi/01.jpg', label: 'Fase 01 — Il tuo giardino' },
  { img: 'fasi/02.jpg', label: 'Fase 02 — Scavo' },
  { img: 'fasi/03.jpg', label: 'Fase 03 — Armatura' },
  { img: 'fasi/04.jpg', label: 'Fase 04 — Getto in cemento' },
  { img: 'fasi/05.jpg', label: 'Fase 05 — Rivestimento' },
  { img: 'fasi/06.jpg', label: 'Fase 06 — Acqua' },
];
// Punto della foto da cui parte il cambiamento e verso cui si avvicina la camera (0-1, dall'alto a sinistra)
const FOCUS = { x: 0.5, y: 0.66 };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/* ---------- WebGL ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  tA: { value: null }, tB: { value: null },
  uMix: { value: 0 },
  uRes: { value: new THREE.Vector2(1, 1) },
  uImg: { value: new THREE.Vector2(1672, 941) },
  uZoom: { value: 1 },
  uOffset: { value: new THREE.Vector2() },
  uFocus: { value: new THREE.Vector2(FOCUS.x, 1 - FOCUS.y) },
  uSeed: { value: 0 },
  uFade: { value: 0 },
  uSharpen: { value: 0 },                // nitidezza extra, solo per il video
  uVidTexel: { value: new THREE.Vector2(1 / 1916, 1 / 1080) }, // solo nel tratto video: dissolvenza morbida verso la foto vicina
};
const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tA, tB;
    uniform float uMix, uZoom, uSeed, uFade, uSharpen;
    uniform vec2 uVidTexel;
    uniform vec2 uRes, uImg, uOffset, uFocus;
    varying vec2 vUv;
    float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
      return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
    float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= .5; } return v; }
    void main(){
      // "cover": l'immagine riempie lo schermo senza deformarsi
      float sr = uRes.x / uRes.y, ir = uImg.x / uImg.y;
      vec2 uv = vUv;
      if (sr > ir) uv.y = (uv.y - .5) * ir / sr + .5; else uv.x = (uv.x - .5) * sr / ir + .5;
      // avvicinamento verso la piscina + spostamento col mouse
      uv = uFocus + (uv - uFocus) / uZoom + uOffset;
      uv = clamp(uv, .001, .999);

      vec3 a = texture2D(tA, uv).rgb;
      if (uSharpen > 0.) {
        // maschera di contrasto leggera: recupera il dettaglio perso nella compressione del video
        vec3 blur = (texture2D(tA, uv + vec2(uVidTexel.x, 0.)).rgb + texture2D(tA, uv - vec2(uVidTexel.x, 0.)).rgb
                   + texture2D(tA, uv + vec2(0., uVidTexel.y)).rgb + texture2D(tA, uv - vec2(0., uVidTexel.y)).rgb) * .25;
        a = clamp(a + (a - blur) * uSharpen, 0., 1.);
      }
      vec3 b = texture2D(tB, uv).rgb;

      // la fase nuova cresce a macchie irregolari, partendo dalla piscina e allargandosi
      vec2 q = uv * vec2(ir, 1.);
      float n = fbm(q * 5.5 + uSeed * 7.31) * .75 + fbm(q * 22. + uSeed * 3.1) * .25;
      float d = length((uv - uFocus) * vec2(ir, 1.) * vec2(.55, 1.3));
      float t = n * .3 + d * 1.1;          // cresce dal centro della piscina verso i bordi
      float edge = .1;                       // bordo morbido: la nuova fase "si materializza" piano
      float m = smoothstep(t - edge, t + edge, uMix * .62 - .08);
      m = max(m, smoothstep(.82, 1., uMix));  // alla fine del tratto tutto è completato
      vec3 col = mix(a, b, m);
      // leggera "polvere di cantiere" sul bordo che avanza
      float rim = smoothstep(edge, 0., abs(uMix * .62 - .08 - t)) * step(.001, uMix) * step(uMix, .999);
      col = mix(col, col * .92 + vec3(.04, .03, .02), rim * .5);
      col = mix(col, b, uFade);
      gl_FragColor = vec4(col, 1.);
      #include <colorspace_fragment>
    }`,
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

/* ---------- Caricamento foto ---------- */
const loader = document.getElementById('loader');
const textures = [];
const texLoader = new THREE.TextureLoader();
Promise.all(PHASES.map((p) => new Promise((res, rej) => texLoader.load(p.img, res, undefined, rej))))
  .then((list) => {
    list.forEach((t) => { t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; textures.push(t); });
    uniforms.uImg.value.set(list[0].image.width, list[0].image.height);
    loader.classList.add('is-hidden');
  })
  .catch(() => { loader.querySelector('.loader-label').textContent = 'Foto non trovate nella cartella "fasi"'; });

/* ---------- Video del primo passaggio (prato → scavo), guidato dallo scroll ----------
   Tra la foto 01 e la foto 02 non c'è la dissolvenza a macchie: si vede il video,
   e il fotogramma mostrato dipende da quanto hai scorso. Se il video non è pronto,
   resta la transizione originale. */
const VIDEO_SEGMENT = 0; // il tratto tra fase 01 e fase 02
const video = document.createElement('video');
const VIDEO_URL = 'video/video-1.mp4';
video.muted = true; video.playsInline = true; video.preload = 'auto';
video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
// nel documento ma invisibile: alcuni browser non decodificano i video fuori dalla pagina
video.setAttribute('aria-hidden', 'true');
video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1';
document.body.appendChild(video);
// Il fotogramma passa da un canvas 2D: più affidabile del caricare il <video> direttamente in WebGL
const frameCanvas = document.createElement('canvas');
frameCanvas.width = 1916; frameCanvas.height = 1080; // risoluzione piena: niente perdita di qualità
const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: false });
const videoTex = new THREE.CanvasTexture(frameCanvas);
videoTex.colorSpace = THREE.SRGBColorSpace; videoTex.minFilter = THREE.LinearFilter; videoTex.generateMipmaps = false;
let videoReady = false;   // diventa vero solo quando un fotogramma vero è stato disegnato
let videoTarget = 0;
const probe = document.createElement('canvas'); probe.width = 8; probe.height = 8;
const probeCtx = probe.getContext('2d', { willReadFrequently: true });
// Copre la scritta "KlingAI" in basso a destra: ci disegna sopra il prato che sta subito sopra,
// specchiato in verticale (così il bordo combacia) e sfumato sul lato sinistro.
const WM = { x: 0.82, y: 0.9 }; // da dove parte la zona coperta (frazioni del fotogramma)
const patch = document.createElement('canvas');
const patchCtx = patch.getContext('2d');
function coverWatermark() {
  const W = frameCanvas.width, H = frameCanvas.height;
  const px = Math.round(W * WM.x), py = Math.round(H * WM.y), pw = W - px, ph = H - py;
  patch.width = pw; patch.height = ph;
  patchCtx.globalCompositeOperation = 'source-over';
  patchCtx.save();
  patchCtx.translate(0, ph); patchCtx.scale(1, -1);          // specchio verticale
  patchCtx.drawImage(frameCanvas, px, py - ph, pw, ph, 0, 0, pw, ph);
  patchCtx.restore();
  const feather = Math.round(pw * 0.25);                      // sfumatura sul bordo sinistro
  const mask = patchCtx.createLinearGradient(0, 0, feather, 0);
  mask.addColorStop(0, 'rgba(0,0,0,0)'); mask.addColorStop(1, 'rgba(0,0,0,1)');
  patchCtx.globalCompositeOperation = 'destination-in';
  patchCtx.fillStyle = mask; patchCtx.fillRect(0, 0, pw, ph);
  frameCtx.drawImage(patch, px, py);
}
function grabFrame() {
  if (video.readyState < 2) return;
  frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
  coverWatermark();
  if (!videoReady) {
    // controlla che il fotogramma non sia nero prima di usarlo
    probeCtx.drawImage(frameCanvas, 0, 0, 8, 8);
    const d = probeCtx.getImageData(0, 0, 8, 8).data;
    let sum = 0; for (let k = 0; k < d.length; k += 4) sum += d[k] + d[k + 1] + d[k + 2];
    if (sum / (d.length / 4) < 30) return;
    videoReady = true;
  }
  videoTex.needsUpdate = true;
}
let seekStarted = 0;
function goTo(t) { seekStarted = performance.now(); video.currentTime = t; }
video.addEventListener('loadedmetadata', () => {
  frameCanvas.width = video.videoWidth || 1916; frameCanvas.height = video.videoHeight || 1080;
  uniforms.uVidTexel.value.set(1 / frameCanvas.width, 1 / frameCanvas.height);
});
video.addEventListener('loadeddata', () => {
  grabFrame();
  // Safari su iPhone decodifica i fotogrammi solo dopo un primo play
  if (/iP(hone|ad|od)/.test(navigator.userAgent)) {
    const p = video.play(); if (p) p.then(() => { video.pause(); goTo(videoTarget); }).catch(() => {});
  }
});
video.addEventListener('seeked', () => {
  seekStarted = 0;
  grabFrame();
  if (Math.abs(video.currentTime - videoTarget) > 1 / 50) goTo(videoTarget); // insegue lo scroll
});
function seekVideo(f) {
  if (!video.duration) return;
  videoTarget = Math.min(video.duration - 0.04, f * video.duration);
  // se un seek è rimasto appeso più di 400ms lo rilanciamo
  const stuck = seekStarted && performance.now() - seekStarted > 400;
  if ((!seekStarted || stuck) && Math.abs(video.currentTime - videoTarget) > 1 / 50) goTo(videoTarget);
}
// Il video viene scaricato intero e servito da memoria (blob): così si può riavvolgere
// con lo scroll anche se il server non supporta le richieste "a pezzi".
fetch(VIDEO_URL)
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
  .then((b) => { video.src = URL.createObjectURL(b); video.load(); })
  .catch(() => { video.src = VIDEO_URL; video.load(); });
window.__heroVideo = video; window.__heroFrame = frameCanvas; // utili per il debug dalla console

/* ---------- Interfaccia ---------- */
const headings = [...document.querySelectorAll('.heading')];
const phaseLabel = document.getElementById('phaseLabel');
const counter = document.getElementById('counter');
const progressBar = document.getElementById('progressBar');
let activeIdx = 0;
function setActive(i) {
  if (i === activeIdx) return; activeIdx = i;
  headings.forEach((h, k) => {
    h.classList.toggle('is-active', k === i); h.classList.toggle('is-before', k < i); h.classList.toggle('is-after', k > i);
    h.setAttribute('aria-hidden', k !== i);
  });
  phaseLabel.textContent = PHASES[i].label;
  counter.textContent = `0${i + 1} / 0${PHASES.length}`;
}

/* ---------- Scroll + mouse ---------- */
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const lenis = reduceMotion ? null : new Lenis({ lerp: SETTINGS.lenisLerp, wheelMultiplier: 1, smoothWheel: true });
window.__lenis = lenis;
const hero = document.getElementById('hero');
const scrollProgress = () => { const r = hero.getBoundingClientRect(); return clamp(-r.top / Math.max(r.height - window.innerHeight, 1)); };
const mouse = { tx: 0, ty: 0, x: 0, y: 0 };
window.addEventListener('pointermove', (e) => { mouse.tx = (e.clientX / window.innerWidth) * 2 - 1; mouse.ty = (e.clientY / window.innerHeight) * 2 - 1; });
document.addEventListener('pointerleave', () => { mouse.tx = 0; mouse.ty = 0; });

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  uniforms.uRes.value.set(w, h);
}
window.addEventListener('resize', resize); resize();

let pS = scrollProgress(), last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1); last = now;
  if (lenis) lenis.raf(now);
  pS += (scrollProgress() - pS) * (1 - Math.exp(-dt * SETTINGS.scrollSmoothing));
  mouse.x += (mouse.tx - mouse.x) * (1 - Math.exp(-dt * SETTINGS.mouseSmoothing));
  mouse.y += (mouse.ty - mouse.y) * (1 - Math.exp(-dt * SETTINGS.mouseSmoothing));

  if (textures.length === PHASES.length) {
    const segs = PHASES.length - 1;
    const x = pS * segs;
    const i = Math.min(Math.floor(x), segs - 1);
    const f = clamp((x - i - SETTINGS.hold[0]) / (SETTINGS.hold[1] - SETTINGS.hold[0])); // avanza in modo uniforme con lo scroll
    if (i === VIDEO_SEGMENT) seekVideo(f);
    if (i === VIDEO_SEGMENT && videoReady) {
      // tratto video: il fotogramma segue lo scroll; ai due capi si fonde con la foto 01 e la foto 02
      uniforms.tA.value = videoTex;
      const atEnd = f > 0.5;
      uniforms.tB.value = textures[atEnd ? i + 1 : i];
      uniforms.uFade.value = atEnd ? smooth(0.9, 1, f) : 1 - smooth(0, 0.06, f);
      uniforms.uMix.value = 0;
      uniforms.uSharpen.value = SETTINGS.videoSharpen;
    } else {
      uniforms.uSharpen.value = 0;
      uniforms.tA.value = textures[i];
      uniforms.tB.value = textures[i + 1];
      uniforms.uMix.value = f;
      uniforms.uFade.value = 0;
    }
    uniforms.uSeed.value = i;
    uniforms.uZoom.value = 1.0 + SETTINGS.zoom * smooth(0, 1, pS);
    uniforms.uOffset.value.set(-mouse.x * SETTINGS.parallax, mouse.y * SETTINGS.parallax * 0.6);
    // titolo: cambia quando la fase nuova è quasi completa
    setActive(Math.min(segs, i + (f > 0.45 ? 1 : 0)));
  }
  canvas.style.transform = `rotateY(${mouse.x * SETTINGS.tilt}deg) rotateX(${-mouse.y * SETTINGS.tilt * 0.6}deg) scale(1.035)`;
  progressBar.style.transform = `scaleX(${pS})`;
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

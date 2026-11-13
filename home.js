/* =========================================================
   Ra.Ma. Piscine — Homepage: animazioni dopo la hero
   GSAP + ScrollTrigger, sincronizzati con lo scroll morbido (Lenis).
   Con "riduci movimento" attivo: niente animazioni, tutto visibile.
   ========================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const motion = hasGsap && !reduce;
const lenis = window.__lenis;

/* ---------- Barra flottante + barra di avanzamento ---------- */
const dock = $('#dock');
const hero = $('#hero');
const bar = $('#scrollBar');
let lastY = window.scrollY;
function onScroll() {
  const y = window.scrollY;
  const pastHero = hero.getBoundingClientRect().bottom < 90;
  dock.classList.toggle('is-on', pastHero);
  if (pastHero && Math.abs(y - lastY) > 6) dock.classList.toggle('is-hidden', y > lastY && y > hero.offsetHeight + 500);
  lastY = y;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.transform = `scaleX(${pastHero ? Math.min(1, y / max) : 0})`;
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Menu a schermo intero ---------- */
const menu = $('#menu');
let lastOpener = null;
function openMenu(e) {
  lastOpener = e.currentTarget;
  menu.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  lenis?.stop();
  $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'true'));
  if (motion) {
    gsap.fromTo(menu, { clipPath: 'circle(0% at 94% 5%)' }, { clipPath: 'circle(150% at 94% 5%)', duration: .9, ease: 'expo.out' });
    gsap.fromTo('.menu-nav a', { yPercent: 120, rotate: 4 }, { yPercent: 0, rotate: 0, duration: .9, stagger: .06, ease: 'expo.out', delay: .1 });
  }
  $('[data-menu-close]', menu).focus();
}
function closeMenu() {
  if (menu.hidden) return;
  menu.hidden = true;
  document.documentElement.style.overflow = '';
  lenis?.start();
  $$('[data-menu-open]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  lastOpener?.focus();
}
$$('[data-menu-open]').forEach((b) => b.addEventListener('click', openMenu));
$$('[data-menu-close]').forEach((b) => b.addEventListener('click', closeMenu));
$$('.menu-nav a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
window.addEventListener('resize', () => { if (window.innerWidth > 860) closeMenu(); });

/* ---------- Scritte che rotolano al passaggio (bottoni e menu) ---------- */
$$('[data-roll]').forEach((el) => {
  const t = el.textContent;
  el.innerHTML = `<span class="r1">${t}</span><span class="r2" aria-hidden="true">${t}</span>`;
});

/* ---------- Titoli e testi spezzati per l'animazione ---------- */
if (motion) {
  // titoli: una riga per ogni <br>, come i titoli della hero
  $$('[data-lines]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    const lines = el.innerHTML.split(/<br\s*\/?>/i).map((l) => l.trim()).filter(Boolean);
    el.innerHTML = lines.map((l) => `<span class="ln" aria-hidden="true"><span>${l}</span></span>`).join('');
  });
  // frasi: parola per parola
  $$('[data-words]').forEach((el) => {
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  });
}

/* ---------- Rivenditori: nastro che scorre all'infinito ---------- */
const belt = $('[data-belt]');
if (belt && !reduce) {
  const list = $('.logo-row', belt);
  [...list.children].forEach((li) => { const c = li.cloneNode(true); c.setAttribute('aria-hidden', 'true'); list.appendChild(c); });
  belt.classList.add('is-running');
}

/* ---------- Bottoni magnetici ---------- */
if (motion && finePointer) {
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * .25);
      yTo((e.clientY - r.top - r.height / 2) * .35);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
  // carte 3D che seguono il mouse
  $$('[data-tilt], .rv, .stat, .sc').forEach((card) => {
    const k = card.matches('[data-tilt]') ? 16 : 6;
    const rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' });
    const ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' });
    gsap.set(card, { transformPerspective: 900 });
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - .5) * k);
      rx(-((e.clientY - r.top) / r.height - .5) * k);
    });
    card.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

/* =========================================================
   Animazioni legate allo scorrimento
   ========================================================= */
if (motion) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) lenis.on('scroll', ScrollTrigger.update);
  const once = (trigger, start = 'top 86%') => ({ trigger, start, toggleActions: 'play none none none' });

  // titoli: ogni riga sale da una maschera (lo stesso effetto dei titoli della hero)
  $$('[data-lines]').forEach((el) => {
    gsap.from($$('.ln > span', el), { yPercent: 125, duration: 1.3, ease: 'expo.out', stagger: .1, scrollTrigger: once(el, 'top 88%') });
  });
  // frasi: le parole arrivano una dopo l'altra
  $$('[data-words]').forEach((el) => {
    gsap.from($$('.w', el), { y: 22, opacity: 0, rotate: 3, duration: .9, ease: 'expo.out', stagger: .03, scrollTrigger: once(el) });
  });
  // elementi che salgono dal basso, a gruppi
  gsap.set('[data-up]', { y: 46, opacity: 0 });
  ScrollTrigger.batch('[data-up]', {
    start: 'top 90%',
    onEnter: (els) => gsap.to(els, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: .1, overwrite: true }),
  });
  // foto che si aprono come una tendina, con zoom
  $$('[data-reveal]').forEach((el, i) => {
    const img = $('img', el);
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 40px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1.4, ease: 'expo.inOut', delay: (i % 6) * .08, scrollTrigger: once(el, 'top 92%'),
      onComplete: () => gsap.set(el, { clearProps: 'clipPath' }) });
    if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out', delay: (i % 6) * .08, scrollTrigger: once(el, 'top 92%') });
  });
  // profondità: le foto dell'introduzione scorrono a velocità diverse
  $$('[data-speed]').forEach((el) => {
    gsap.to(el, { yPercent: parseFloat(el.dataset.speed) * 100, ease: 'none',
      scrollTrigger: { trigger: '.intro', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // contatori
  $$('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count); const o = { v: 0 };
    gsap.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); }, scrollTrigger: once(el, 'top 92%') });
  });

  // finestra: la foto si apre fino a riempire lo schermo, poi sale il titolo
  if ($('.window-frame')) {
    const isPhone = window.innerWidth <= 860;
    gsap.fromTo('.window-frame', { '--wy': isPhone ? '22%' : '16%', '--wx': isPhone ? '8%' : '24%', '--wr': '44px', '--ws': 1.1 },
      { '--wy': '0%', '--wx': '0%', '--wr': '0px', '--ws': 1, ease: 'none', scrollTrigger: { trigger: '.window', start: 'top top', end: '60% bottom', scrub: true } });
    gsap.fromTo('.window-title .ln > span', { yPercent: 120 }, { yPercent: 0, stagger: .15, ease: 'none', scrollTrigger: { trigger: '.window', start: '30% top', end: '75% bottom', scrub: true } });
    gsap.fromTo('.window-copy .tag', { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.window', start: '25% top', end: '50% bottom', scrub: true } });
  }

  // configuratore: le quattro carte arrivano a ventaglio, come una mano di carte, e si aprono in fila
  gsap.fromTo('.card3d', {
    x: (i, el) => { const g = el.parentElement.getBoundingClientRect(); const r = el.getBoundingClientRect(); return g.left + g.width / 2 - (r.left + r.width / 2); },
    y: (i) => 120 + Math.abs(i - 1.5) * 40, rotation: (i) => (i - 1.5) * 14, rotationY: (i) => (i - 1.5) * -20, transformPerspective: 1200, transformOrigin: '50% 120%',
  }, { x: 0, y: 0, rotation: 0, rotationY: 0, ease: 'power2.out', scrollTrigger: { trigger: '.cards3d', start: 'top 95%', end: 'top 40%', scrub: 1 } });

  $$('.card3d .draw').forEach((p, i) => {
    const len = p.getTotalLength ? p.getTotalLength() : 300;
    gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', delay: .15 * i, scrollTrigger: once('.cards3d', 'top 60%') });
  });

  // lavori: galleria orizzontale (schermi larghi), scorrimento a dito sui telefoni
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = $('#workTrack');
    const dist = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.work', start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1,
        onUpdate: (st) => gsap.set('#workBar', { scaleX: st.progress }) },
    });
    $$('.shot').forEach((s) => {
      const img = $('img', s);
      gsap.fromTo(img, { xPercent: -10 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.fromTo(s, { rotationY: -34, z: -140, y: 40, transformPerspective: 1400 }, { rotationY: 28, z: -40, y: -10, ease: 'none', scrollTrigger: { trigger: s, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
    });
    gsap.from('.work-end', { scale: .4, rotate: -90, ease: 'none', scrollTrigger: { trigger: '.work-end', containerAnimation: tween, start: 'left right', end: 'left 70%', scrub: true } });
  });
  mm.add('(max-width: 860px)', () => {
    const pin = $('.work-pin');
    const upd = () => { const max = pin.scrollWidth - pin.clientWidth; gsap.set('#workBar', { scaleX: max > 0 ? pin.scrollLeft / max : 1 }); };
    pin.addEventListener('scroll', upd, { passive: true }); upd();
    return () => pin.removeEventListener('scroll', upd);
  });

  // recensioni: il riepilogo Google si accende, le carte entrano a ventaglio e le stelle si illuminano
  gsap.from('.g-stars i', { scale: 0, rotate: -90, stagger: .08, duration: .7, ease: 'back.out(3)', scrollTrigger: once('.g-summary', 'top 90%') });
  const rvs = $$('.rv');
  gsap.from(rvs, { y: 90, opacity: 0, rotate: (i) => (i % 2 ? 3 : -3), duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: once('.rv-grid', 'top 85%') });
  gsap.from($$('.rv-stars i'), { scale: 0, duration: .5, ease: 'back.out(3)', stagger: .02, delay: .5, scrollTrigger: once('.rv-grid', 'top 85%') });

  // social: icone che girano, griglia di foto a onda
  gsap.from('.sc svg', { rotate: -180, scale: 0, duration: 1.2, ease: 'expo.out', stagger: .1, scrollTrigger: once('.social-grid', 'top 88%') });

  // partner: le carte salgono una dopo l'altra (già con data-up)

  // footer: la scritta gigante sale lettera per lettera
  const word = $('.foot-word');
  if (word) {
    word.innerHTML = [...word.textContent].map((c) => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`)).join('');
    gsap.from('.foot-word .ch', { yPercent: 110, rotate: 8, stagger: .045, ease: 'expo.out', duration: 1.3, scrollTrigger: once(word, 'top 98%') });
  }

  // ricalcola le posizioni quando le immagini sono caricate
  window.addEventListener('load', () => ScrollTrigger.refresh());
  let t; const refresh = () => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 200); };
  $$('img').forEach((img) => { if (!img.complete) img.addEventListener('load', refresh, { once: true }); });
}

/* =========================================================
   Riflessi d'acqua animati (WebGL) dietro al configuratore:
   la stessa acqua turchese della piscina finita nella hero
   ========================================================= */
(function caustics() {
  const cv = $('#caustics');
  if (!cv) return;
  const gl = cv.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return;
  const vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const fs = `precision mediump float; uniform float t; uniform vec2 r;
    void main(){
      vec2 uv = gl_FragCoord.xy / r.y * 1.3;
      vec2 p = mod(uv * 6.28318, 6.28318) - 250.;
      vec2 i = p; float c = 1.; float inten = .005;
      for (int n = 0; n < 5; n++) {
        float tt = t * (1. - (3.5 / float(n + 1)));
        i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
        c += 1. / length(vec2(p.x / (sin(i.x + tt) / inten), p.y / (cos(i.y + tt) / inten)));
      }
      c /= 5.; c = 1.17 - pow(c, 1.4);
      float v = pow(abs(c), 8.);
      vec3 deep = vec3(.09, .58, .74), shallow = vec3(.27, .76, .88);
      vec3 col = mix(deep, shallow, gl_FragCoord.y / r.y) + vec3(.9, .98, 1.) * v * .55;
      gl_FragColor = vec4(min(col, vec3(1.)), 1.);
    }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
  gl.useProgram(pr);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uT = gl.getUniformLocation(pr, 't'), uR = gl.getUniformLocation(pr, 'r');
  const scale = 0.5;
  function size() { cv.width = Math.max(2, cv.clientWidth * scale); cv.height = Math.max(2, cv.clientHeight * scale); gl.viewport(0, 0, cv.width, cv.height); }
  size(); window.addEventListener('resize', size);
  let visible = false, raf = 0; const t0 = performance.now();
  const draw = (now) => { gl.uniform1f(uT, (now - t0) / 1000 * .5 + 23.); gl.uniform2f(uR, cv.width, cv.height); gl.drawArrays(gl.TRIANGLES, 0, 3); if (visible && !reduce) raf = requestAnimationFrame(draw); };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; cancelAnimationFrame(raf); if (visible) raf = requestAnimationFrame(draw); }).observe(cv);
  draw(t0 + 4000);
})();

/* =========================================================
   Form "Consulenza gratuita"
   Il sito non ha ancora un server per i moduli: la richiesta
   si apre già scritta nell'app di posta, verso info@ramapiscine.it.
   ========================================================= */
const form = $('#consultForm');
if (form) {
  const tel = $('#f-tel'); const errTel = $('#err-tel');
  const privacy = form.elements.privacy; const errPrivacy = $('#err-privacy');
  const show = (input, err, bad) => { err.hidden = !bad; input.setAttribute('aria-invalid', bad ? 'true' : 'false'); };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const badTel = tel.value.replace(/\D/g, '').length < 6;
    const badPrivacy = !privacy.checked;
    show(tel, errTel, badTel); show(privacy, errPrivacy, badPrivacy);
    if (badTel) { tel.focus(); if (motion) gsap.fromTo(tel, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' }); return; }
    if (badPrivacy) { privacy.focus(); return; }
    const f = Object.fromEntries(new FormData(form));
    const lines = [`Nome: ${`${f.nome || ''} ${f.cognome || ''}`.trim()}`, `Telefono: ${f.telefono}`];
    if (f.email) lines.push(`Email: ${f.email}`);
    if (f.messaggio) lines.push('', f.messaggio);
    window.location.href = `mailto:info@ramapiscine.it?subject=${encodeURIComponent('Richiesta consulenza gratuita')}&body=${encodeURIComponent(lines.join('\n'))}`;
    $('#formDone').hidden = false;
  });
}

/* =========================================================
   Scena "servizi": come la hero, lo scroll decide quale fase si vede.
   La foto nuova si apre con un cerchio che si allarga dal centro della piscina.
   ========================================================= */
(function scene() {
  const sc = $('#scene3');
  if (!sc) return;
  const imgs = $$('.sw-img', sc);
  const texts = $$('.st', sc);
  const barEl = $('#sceneBar'); const count = $('#sceneCount');
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * (3 - 2 * t);
  let active = 0, ticking = false;
  function update() {
    ticking = false;
    const r = sc.getBoundingClientRect();
    const p = clamp(-r.top / Math.max(1, r.height - window.innerHeight));
    const x = p * imgs.length;
    imgs.forEach((im, i) => {
      const t = i === 0 ? 1 : ease(clamp((x - (i - .25)) / .55));
      im.style.setProperty('--r', `${(t * 150).toFixed(2)}%`);
      im.style.setProperty('--s', (1.12 - .1 * clamp(x - i + .3)).toFixed(3));
    });
    const idx = Math.min(imgs.length - 1, Math.floor(x + .05));
    if (idx !== active) {
      active = idx;
      texts.forEach((t, i) => { t.classList.toggle('is-active', i === idx); t.classList.toggle('is-before', i < idx); });
      count.textContent = `0${idx + 1} / 0${imgs.length}`;
    }
    barEl.style.transform = `scaleX(${p})`;
  }
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', req);
  update();
})();

/* =========================================================
   Prima e dopo: trascina la maniglia (o usa le frecce) per passare dal prato alla piscina
   ========================================================= */
(function beforeAfter() {
  const ba = $('#ba');
  if (!ba) return;
  const range = $('input', ba);
  const set = (v) => { ba.style.setProperty('--pos', `${v}%`); };
  range.addEventListener('input', () => set(range.value));
  set(range.value);
  if (motion) {
    // all'arrivo la tendina fa un piccolo giro da sola, per far capire che si può trascinare
    const o = { v: 50 };
    const step = () => { range.value = o.v; set(o.v); };
    gsap.timeline({ scrollTrigger: { trigger: ba, start: 'top 70%' } })
      .to(o, { v: 18, duration: 1.1, ease: 'power3.inOut', onUpdate: step })
      .to(o, { v: 82, duration: 1.4, ease: 'power3.inOut', onUpdate: step })
      .to(o, { v: 50, duration: 1, ease: 'power3.inOut', onUpdate: step });
  }
})();

/* ---------- Scritta gigante del footer: sempre intera, su qualsiasi schermo ---------- */
(function fitFootWord() {
  const el = document.querySelector('.foot-word');
  if (!el) return;
  const fit = () => {
    el.style.fontSize = '100px';
    const w = el.scrollWidth || 1;
    const avail = el.clientWidth;
    el.style.fontSize = `${Math.floor((100 * avail) / w * 0.99)}px`;
  };
  (document.fonts?.ready || Promise.resolve()).then(fit);
  window.addEventListener('resize', fit);
})();

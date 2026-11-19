import {
  TIPOS, GRUPOS, CATEGORIAS, generarCompras, PROTOCOLOS, NUMEROS, ROLES_PLAN,
  TIPOS_MARCADOR, BUSQUEDAS_CERCA, CURSO, TUTORIALES
} from './datos.js';

const CLAVE = 'barrio-listo-v1';
const vista = document.getElementById('vista');
const dialogo = document.getElementById('dialogo');
const linterna = document.getElementById('linterna');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   Estado: todo se guarda en este teléfono (localStorage)
   ========================================================= */
function base() {
  return {
    version: 1,
    hogar: { configurado: false, meta: 3, zona: { inundable: false, sismica: false, calor: false, incendios: false }, mascotas: false },
    integrantes: [],
    checks: {},
    compras: {},
    plan: { encuentro: '', encuentroAlt: '', rutas: '', roles: {}, contactos: [] },
    zona: { marcadores: [], centro: null },
    revision: { ultima: null }
  };
}
function normalizar(d) {
  const b = base();
  if (!d || typeof d !== 'object') return b;
  for (const k of Object.keys(b)) {
    if (d[k] === undefined || d[k] === null) d[k] = b[k];
    else if (typeof b[k] === 'object' && !Array.isArray(b[k])) d[k] = Object.assign(b[k], d[k]);
  }
  d.hogar.zona = Object.assign(base().hogar.zona, d.hogar.zona || {});
  if (!Array.isArray(d.integrantes)) d.integrantes = [];
  if (!Array.isArray(d.plan.contactos)) d.plan.contactos = [];
  if (!d.plan.roles || typeof d.plan.roles !== 'object') d.plan.roles = {};
  if (!Array.isArray(d.zona.marcadores)) d.zona.marcadores = [];
  return d;
}
function cargar() {
  try {
    const t = localStorage.getItem(CLAVE);
    return t ? normalizar(JSON.parse(t)) : base();
  } catch (e) {
    return base();
  }
}
let estado = cargar();
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
  catch (e) { aviso('No se pudo guardar en este teléfono'); }
}

/* =========================================================
   Utilidades
   ========================================================= */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const dos = (n) => String(n).padStart(2, '0');
function hoy() { const d = new Date(); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; }
function sumarMeses(iso, m) {
  const [a, me, d] = iso.split('-').map(Number);
  const f = new Date(a, me - 1 + m, d);
  return `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
}
const fechaCorta = (iso) => { const [a, m, d] = iso.split('-'); return `${d}/${m}/${a}`; };
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
const pesos = (n) => '$' + Math.round(n).toLocaleString('es-AR');
function setRuta(obj, ruta, valor) {
  const ks = ruta.split('.');
  let o = obj;
  for (let i = 0; i < ks.length - 1; i++) o = o[ks[i]];
  o[ks[ks.length - 1]] = valor;
}
function aviso(texto) {
  const a = document.getElementById('aviso');
  a.textContent = texto;
  a.hidden = false;
  clearTimeout(aviso.t);
  aviso.t = setTimeout(() => { a.hidden = true; }, 2600);
}
function monedas(r) {
  const n = r >= 1 ? 3 : Math.floor(r * 3);
  return `<span class="monedas" role="img" aria-label="${n} de 3 monedas">${[0, 1, 2].map((i) => `<i class="moneda${i < n ? '' : ' apagada'}"></i>`).join('')}</span>`;
}
function barraSeg(r) {
  const n = Math.round(r * 20);
  return `<div class="barra-seg" aria-hidden="true">${Array.from({ length: 20 }, (_, i) => `<i class="${i < n ? 'lleno' : ''}"></i>`).join('')}</div>`;
}
// Botón de dos toques para acciones que borran algo.
function confirmar(b, accion) {
  if (b.dataset.armado) { accion(); return; }
  const original = b.textContent;
  b.dataset.armado = '1';
  b.textContent = '¿Seguro? Tocá de nuevo';
  setTimeout(() => { if (b.isConnected) { delete b.dataset.armado; b.textContent = original; } }, 3500);
}

/* =========================================================
   Cálculos
   ========================================================= */
const personas = () => estado.integrantes.length;
function condiciones() {
  const z = estado.hogar.zona;
  return {
    electro: estado.integrantes.some((i) => i.electro),
    medicacion: estado.integrantes.some((i) => (i.medicacion || '').trim()),
    bebes: estado.integrantes.some((i) => i.tipo === 'bebe'),
    mascotas: !!estado.hogar.mascotas,
    sismica: !!z.sismica, inundable: !!z.inundable, calor: !!z.calor, incendios: !!z.incendios
  };
}
function itemsDe(cat) { const c = condiciones(); return cat.items.filter((it) => !it.soloSi || c[it.soloSi]); }
const cuenta = (it) => estado.hogar.meta === 14 || it.etapa !== '14d';
function progresoCat(cat) {
  const its = itemsDe(cat).filter(cuenta);
  const n = its.filter((it) => estado.checks[it.id]?.hecho).length;
  return { n, total: its.length, r: its.length ? n / its.length : 0 };
}
function progresoListas() {
  let n = 0, total = 0;
  for (const c of CATEGORIAS) { const p = progresoCat(c); n += p.n; total += p.total; }
  return { n, total, r: total ? n / total : 0 };
}
function vencidos() {
  const h = hoy(), out = [];
  for (const cat of CATEGORIAS) {
    for (const it of itemsDe(cat)) {
      const ch = estado.checks[it.id];
      if (it.rotar && ch?.hecho && ch.fecha) {
        const vence = sumarMeses(ch.fecha, it.rotar);
        if (vence <= h) out.push({ it, cat, vence });
      }
    }
  }
  return out;
}
function listaCompras() {
  return generarCompras(personas(), condiciones()).filter((it) => estado.hogar.meta === 14 || it.etapa === '72h');
}
function progresoModulos() {
  const p = personas();
  const compras = listaCompras();
  const comprados = compras.filter((c) => estado.compras[c.id]?.comprado).length;
  const pl = estado.plan;
  const roles = Object.values(pl.roles).filter(Boolean).length;
  const ms = estado.zona.marcadores;
  return {
    necesidades: estado.hogar.configurado && p ? 1 : 0,
    familia: p ? estado.integrantes.filter((i) => i.grupo && i.contacto).length / p : 0,
    checklists: progresoListas().r,
    compras: compras.length ? comprados / compras.length : 0,
    plan: [pl.encuentro, pl.encuentroAlt, pl.rutas, roles >= 2, pl.contactos.length >= 1].filter(Boolean).length / 5,
    zona: [ms.some((m) => m.tipo === 'casa'), ms.some((m) => m.tipo === 'encuentro'), ms.some((m) => m.tipo === 'riesgo' || m.tipo === 'servicio')].filter(Boolean).length / 3
  };
}

/* =========================================================
   Pixel art: íconos, integrantes y la escena del barrio
   ========================================================= */
const PAL = { R: '#ff9f43', W: '#efe9da', Y: '#ffd447', D: '#352d6b', T: '#b0a9cc', A: '#4cc9d6', G: '#7bd04a', L: '#ff5c7a', H: '#b0a9cc', S: '#e0a87a', C: '#ff9f43', P: '#5a4c99', B: '#4cc9d6' };
const ICONOS = {
  casa: ['.....RR.....', '....RRRR....', '...RRRRRR...', '..RRRRRRRR..', '.RRRRRRRRRR.', 'RRRRRRRRRRRR', '.WWWWWWWWWW.', '.WYYWWWWDDW.', '.WYYWWWWDDW.', '.WWWWWWWDDW.', '.WWWWWWWDDW.', '............'],
  familia: ['..HH....HH..', '..SS....SS..', '.CCCC..AAAA.', '.CCCC..AAAA.', '.CCCC..AAAA.', '..PP....PP..', '..PP.HH.PP..', '..PP.SS.PP..', '..PP.GG.PP..', '.....GG.....', '.....PP.....', '............'],
  barrio: ['..GGG.......', '.GGGGG..AA..', '.GGGGG..AA..', '..GGG..R.R..', '...T..RRRRR.', '...T..WWWWW.', '...T..WYWDW.', '...T..WWWDW.', 'TTTTTTTTTTTT', '............', '.B..B..B..B.', '............'],
  cruz: ['............', '....LLLL....', '....LLLL....', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '....LLLL....', '....LLLL....', '............', 'TTTTTTTTTTTT', '............'],
  lupa: ['..TTTT......', '.T....T.....', 'T......T....', 'T......T....', 'T......T....', 'T......T....', '.T....T.....', '..TTTTRR....', '.......RR...', '........RR..', '.........RR.', '..........R.'],
  check: ['............', 'TTTTTTTT....', 'T......T..G.', 'T......T.GG.', 'T......TGG..', 'T.G...GGG...', 'T.GG.GGT....', 'T..GGG.T....', 'T...G..T....', 'TTTTTTTT....', '............', '............'],
  carro: ['............', 'RR..........', '.R..........', '.RTTTTTTTTT.', '.RT.T.T.T.T.', '.RTTTTTTTTT.', '..T.T.T.T.T.', '..TTTTTTTTT.', '..R.......R.', '..RRRRRRRRR.', '...WW....WW.', '...WW....WW.'],
  hoja: ['.WWWWWWW....', '.W.....WW...', '.W.YYY.WWW..', '.W.......W..', '.W.TTTTT.W..', '.W.......W..', '.W.TTTTT.W..', '.W.......W..', '.W.TTT...W..', '.W.......W..', '.WWWWWWWWW..', '............'],
  tele: ['............', 'TTTTTTTTTTTT', 'T..........T', 'T....R.....T', 'T....RR....T', 'T....RRR...T', 'T....RR....T', 'T....R.....T', 'T..........T', 'TTTTTTTTTTTT', '....TTTT....', '..TTTTTTTT..'],
  gota: ['.....A......', '.....A......', '....AAA.....', '....AAA.....', '...AAAAA....', '..AAAAAAA...', '..AAWAAAA...', '.AAWAAAAAA..', '.AAWAAAAAA..', '.AAAAAAAAA..', '..AAAAAAA...', '...AAAAA....'],
  lata: ['............', '..TTTTTTT...', '.TWWWWWWWT..', '.TTTTTTTTT..', '.TRRRRRRRT..', '.TRYYYYYRT..', '.TRYYYYYRT..', '.TRRRRRRRT..', '.TRRRRRRRT..', '.TTTTTTTTT..', '..TTTTTTT...', '............'],
  rayo: ['......YYY...', '.....YYY....', '....YYY.....', '...YYY......', '..YYYYYYY...', '.....YYY....', '....YYY.....', '...YYY......', '..YY........', '.YY.........', 'Y...........', '............'],
  radio: ['.........T..', '........T...', '.......T....', 'TTTTTTTTTTTT', 'T..........T', 'T.AAA..W.W.T', 'T.AAA......T', 'T.AAA..W.W.T', 'T..........T', 'TTTTTTTTTTTT', '.T........T.', '............'],
  mochila: ['....TTTT....', '...T....T...', '..GGGGGGGG..', '.GGGGGGGGGG.', '.GGRRRRRRGG.', '.GGR....RGG.', '.GGRRRRRRGG.', '.GGGGGGGGGG.', '.GGGGGGGGGG.', '.GGGRRRRGGG.', '.GGGGGGGGGG.', '..GGGGGGGG..']
};
const SPRITES = {
  adulto: ['..HHH..', '.HHHHH.', '..SSS..', '..SSS..', '.CCCCC.', 'CCCCCCC', 'S.CCC.S', 'S.CCC.S', '..PPP..', '..P.P..', '..P.P..', '..P.P..', '.BB.BB.'],
  nino: ['.......', '.......', '.......', '..HHH..', '.HHHHH.', '..SSS..', '..SSS..', '.CCCCC.', 'S.CCC.S', '..CCC..', '..P.P..', '..P.P..', '.BB.BB.'],
  bebe: ['.......', '.......', '.......', '.......', '.......', '.......', '..HHH..', '.SSSSS.', '.SSSSS.', '.CCCCC.', 'CCCCCCC', '.CCCCC.', '.S...S.']
};
SPRITES.mayor = SPRITES.adulto;
const PIELES = ['#f1c7a5', '#e0a87a', '#c98a5e', '#8f5b3d', '#6b4228'];
const PELOS = ['#2a1e52', '#5a2a1a', '#08071a', '#8a5a3c', '#c7742a'];
const ROPAS = ['#ff9f43', '#4cc9d6', '#ffd447', '#7bd04a', '#ff5c7a', '#9b7bff'];
function hash(s) { let h = 0; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; }
function paletaDe(i) {
  const h = hash(i.id);
  return { H: i.tipo === 'mayor' ? '#d9d2ee' : PELOS[h % PELOS.length], S: PIELES[(h >>> 3) % PIELES.length], C: ROPAS[(h >>> 6) % ROPAS.length], P: '#352d6b', B: '#08071a' };
}
function sprite(ctx, filas, x, y, pal) {
  for (let j = 0; j < filas.length; j++) {
    const f = filas[j];
    for (let i = 0; i < f.length; i++) {
      const k = f[i];
      if (k === '.' || !pal[k]) continue;
      ctx.fillStyle = pal[k];
      ctx.fillRect(x + i, y + j, 1, 1);
    }
  }
}
function pintarSprites(raiz) {
  raiz.querySelectorAll('canvas[data-icono]').forEach((c) => {
    const m = ICONOS[c.dataset.icono];
    if (m && c.getContext) sprite(c.getContext('2d'), m, 0, 0, PAL);
  });
  raiz.querySelectorAll('canvas[data-avatar]').forEach((c) => {
    const i = estado.integrantes.find((x) => x.id === c.dataset.avatar);
    if (i && c.getContext) sprite(c.getContext('2d'), SPRITES[i.tipo] || SPRITES.adulto, 0, 0, paletaDe(i));
  });
}
function azar(semilla) {
  let s = semilla >>> 0;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}
function dibujarBarrio(cv) {
  if (!cv || !cv.getContext) return () => {};
  const W = 384, H = 144;
  const ctx = cv.getContext('2d');
  const base = document.createElement('canvas');
  base.width = W; base.height = H;
  const b = base.getContext('2d');
  const r = azar(29102026);
  const cielo = ['#08071a', '#0e0b26', '#161033', '#211640', '#331c4c', '#52264f', '#7f384a'];
  const cortes = [0, 16, 32, 48, 62, 74, 88, 106];
  for (let k = 0; k < cielo.length; k++) { b.fillStyle = cielo[k]; b.fillRect(0, cortes[k], W, cortes[k + 1] - cortes[k]); }
  for (let k = 0; k < cielo.length - 1; k++) {
    b.fillStyle = cielo[k + 1];
    for (let y = cortes[k + 1] - 2; y < cortes[k + 1]; y++) for (let x = y % 2; x < W; x += 2) b.fillRect(x, y, 1, 1);
  }
  for (let y = 0; y < 118; y++) {
    b.fillStyle = `rgba(175,190,255,${(0.10 - y * 0.0006).toFixed(4)})`;
    b.fillRect((40 + y * 0.55) | 0, y, (18 + y * 0.62) | 0, 1);
  }
  for (let k = 0; k < 60; k++) {
    const sx = (r() * W) | 0, sy = (r() * 58) | 0;
    b.fillStyle = r() > 0.7 ? '#efe9da' : '#8f86b8';
    b.fillRect(sx, sy, 1, 1);
    if (r() > 0.93) { b.fillRect(sx - 1, sy, 3, 1); b.fillRect(sx, sy - 1, 1, 3); }
  }
  b.fillStyle = '#efe9da';
  for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) if (dx * dx + dy * dy <= 100) b.fillRect(330 + dx, 26 + dy, 1, 1);
  b.fillStyle = '#d9cca9'; b.fillRect(326, 23, 3, 2); b.fillRect(332, 28, 2, 2);
  let x = 0;
  while (x < W) {
    const w = 6 + ((r() * 14) | 0), h = 10 + ((r() * 30) | 0);
    b.fillStyle = '#231a4a'; b.fillRect(x, 106 - h, w, h);
    b.fillStyle = '#43377e';
    for (let wy = 106 - h + 3; wy < 102; wy += 4) for (let wx = x + 2; wx < x + w - 1; wx += 3) if (r() > 0.75) b.fillRect(wx, wy, 1, 1);
    x += w + ((r() * 3) | 0);
  }
  const paredes = ['#5b3f8c', '#7a4b6e', '#3f5f8a', '#8a5a3c', '#6a7a3c', '#4f4a96'];
  x = -4;
  while (x < W) {
    const cw = 22 + ((r() * 22) | 0), ch = 14 + ((r() * 12) | 0), top = 118 - ch;
    b.fillStyle = paredes[(r() * paredes.length) | 0]; b.fillRect(x, top, cw, ch);
    if (r() > 0.45) {
      b.fillStyle = '#8e96aa'; b.fillRect(x - 1, top - 3, cw + 2, 3);
      b.fillStyle = '#5f6679'; for (let tx = x; tx < x + cw + 1; tx += 3) b.fillRect(tx, top - 3, 1, 3);
    } else {
      b.fillStyle = '#b4553a'; for (let t = 0; t < 5; t++) b.fillRect(x - 1 + t * 2, top - 1 - t, cw + 2 - t * 4, 1);
    }
    for (let vx = x + 3; vx + 5 < x + cw - 6; vx += 9) {
      b.fillStyle = '#1a1433'; b.fillRect(vx, top + 4, 5, 5);
      b.fillStyle = r() > 0.45 ? '#ffd447' : '#2c2552'; b.fillRect(vx + 1, top + 5, 3, 3);
    }
    b.fillStyle = '#1a1433'; b.fillRect(x + cw - 6, 110, 4, 8);
    if (r() > 0.5) {
      const tqx = x + 3 + ((r() * Math.max(1, cw - 10)) | 0), tqy = top - 11;
      b.fillStyle = '#6b7286'; b.fillRect(tqx, tqy + 6, 1, 4); b.fillRect(tqx + 5, tqy + 6, 1, 4);
      b.fillStyle = '#4cc9d6'; b.fillRect(tqx, tqy + 1, 6, 5);
      b.fillStyle = '#2b8f99'; b.fillRect(tqx, tqy, 6, 1); b.fillRect(tqx, tqy + 5, 6, 1);
    }
    x += cw + 2 + ((r() * 5) | 0);
  }
  b.fillStyle = '#5a4c99'; b.fillRect(0, 118, W, 1);
  b.fillStyle = '#352d6b'; b.fillRect(0, 119, W, 4);
  b.fillStyle = '#120e26'; b.fillRect(0, 123, W, H - 123);
  b.fillStyle = '#352d6b'; for (x = 4; x < W; x += 16) b.fillRect(x, 134, 8, 1);
  [[20, 128, 30], [96, 138, 24], [214, 129, 34], [300, 139, 28], [352, 127, 20]].forEach((c) => {
    b.fillStyle = '#1f4f6b'; b.fillRect(c[0] + 2, c[1], c[2] - 4, 1); b.fillRect(c[0], c[1] + 1, c[2], 2); b.fillRect(c[0] + 2, c[1] + 3, c[2] - 4, 1);
    b.fillStyle = '#4cc9d6'; b.fillRect(c[0] + 4, c[1] + 1, 3, 1); b.fillRect(c[0] + c[2] - 9, c[1] + 2, 2, 1);
  });
  const vecinos = [
    { x: 150, pal: { H: '#2a1e52', S: '#e0a87a', C: '#ff9f43', P: '#352d6b', B: '#08071a' } },
    { x: 160, pal: { H: '#5a2a1a', S: '#c98a5e', C: '#4cc9d6', P: '#231a4a', B: '#08071a' } },
    { x: 170, pal: { H: '#08071a', S: '#8f5b3d', C: '#ffd447', P: '#352d6b', B: '#08071a' } },
    { x: 180, pal: { H: '#d9d2ee', S: '#e8b48c', C: '#7bd04a', P: '#231a4a', B: '#08071a' } }
  ];
  for (let i = 0; i < 46; i++) {
    const media = (i * 0.32) | 0;
    b.fillStyle = `rgba(255,212,71,${(0.22 - i * 0.004).toFixed(3)})`;
    b.fillRect(188 + i, 113 - media, 1, media * 2 + 1);
  }
  vecinos.forEach((v) => sprite(b, SPRITES.adulto, v.x, 107, v.pal));
  b.fillStyle = '#efe9da'; b.fillRect(186, 113, 2, 2);
  b.fillStyle = '#1a1433'; b.fillRect(158, 113, 2, 3);
  b.fillStyle = '#ff5c7a'; b.fillRect(158, 109, 1, 4);

  const rr = azar(611);
  const gotas = Array.from({ length: 90 }, () => ({ x: rr() * (W + 40), y: rr() * H, v: 2.2 + rr() * 1.4 }));
  const pintar = () => {
    ctx.drawImage(base, 0, 0);
    ctx.fillStyle = 'rgba(170,215,255,0.5)';
    for (const d of gotas) { ctx.fillRect(d.x | 0, d.y | 0, 1, 3); ctx.fillRect((d.x - 1) | 0, (d.y + 3) | 0, 1, 1); }
  };
  pintar();
  let vivo = true, ultimo = 0;
  if (!reduce) {
    const bucle = (t) => {
      if (!vivo) return;
      if (!document.hidden && t - ultimo > 40) {
        for (const d of gotas) { d.y += d.v; d.x -= d.v * 0.35; if (d.y > H) { d.y = -4; d.x = rr() * (W + 40); } }
        pintar();
        ultimo = t;
      }
      requestAnimationFrame(bucle);
    };
    requestAnimationFrame(bucle);
  }
  return () => { vivo = false; };
}

/* =========================================================
   Vistas
   ========================================================= */
const MODULOS = [
  { id: 'necesidades', nombre: 'Mis necesidades', desc: 'Qué falta y en qué orden', icono: 'lupa' },
  { id: 'familia', nombre: 'Familia y yo', desc: 'Una ficha por integrante', icono: 'familia' },
  { id: 'checklists', nombre: 'Checklists', desc: 'Los pasos para tildar', icono: 'check' },
  { id: 'compras', nombre: 'Compras', desc: 'De la lista al carrito', icono: 'carro' },
  { id: 'plan', nombre: 'Mi plan', desc: 'Quién hace qué', icono: 'hoja' },
  { id: 'zona', nombre: 'Mi zona', desc: 'Mapa de riesgos y ayuda', icono: 'barrio' },
  { id: 'tutoriales', nombre: 'Tutoriales', desc: 'Aprender haciendo', icono: 'tele', sinProgreso: true },
  { id: 'emergencia', nombre: 'Modo emergencia', desc: 'Linterna, silbato, números', icono: 'cruz', sinProgreso: true, sos: true }
];

function cabeza(numero, titulo, intro) {
  return `<section class="cabeza"><p class="rotulo">${numero}</p><h2 class="aberracion">${titulo}</h2>${intro ? `<p class="intro">${intro}</p>` : ''}</section>`;
}

/* ---------- inicio ---------- */
function verInicio() {
  const p = progresoModulos();
  const valores = Object.values(p);
  const total = valores.reduce((a, b) => a + b, 0) / valores.length;
  const venc = vencidos();
  const ultima = estado.revision.ultima;
  const proxima = ultima ? sumarMeses(ultima, 3) : null;
  const toca = !proxima || proxima <= hoy();
  return `
  <div class="escena-caja crt"><canvas id="barrio" class="escena" width="384" height="144" role="img" aria-label="Escena pixel: un barrio de casas bajas de noche, bajo la lluvia, con cuatro vecinos en la vereda bajo un foco de luz."></canvas></div>
  <section class="titulo foco">
    <p class="rotulo">Preparación comunitaria · meta ${estado.hogar.meta === 14 ? '2 semanas' : '72 horas'}</p>
    <h1 class="aberracion">BARRIO<br>LISTO</h1>
    <p class="lema"><span>▶ NADIE SE SALVA SOLO</span></p>
  </section>
  ${!estado.hogar.configurado ? `<a class="panel cta" href="#necesidades"><span class="rotulo">Press start</span><h3>Contá quiénes son y dónde viven</h3><p>Tarda dos minutos. Con eso la app calcula qué les falta y en qué orden conseguirlo.</p></a>` : ''}
  ${venc.length ? `<a class="panel alerta-panel" href="#checklists"><span class="rotulo">Para revisar</span><h3>${venc.length === 1 ? '1 cosa venció o hay que rotarla' : `${venc.length} cosas vencieron o hay que rotarlas`}</h3></a>` : ''}
  <div class="energia"><div class="energia-cabeza"><span>Energía comunitaria</span><output>${Math.round(total * 100)}%</output></div>${barraSeg(total)}</div>
  <p class="rotulo">Elegí tu módulo</p>
  <div class="modulos">
    ${MODULOS.map((m) => `<a class="modulo${m.sos ? ' sos' : ''}" href="#${m.id}"><canvas width="12" height="12" data-icono="${m.icono}" aria-hidden="true"></canvas><span class="m-nombre">${m.nombre}</span><span class="m-desc">${m.desc}</span>${m.sinProgreso ? '' : monedas(p[m.id])}</a>`).join('')}
  </div>
  <div class="panel">
    <h3>Revisión cada 2 o 3 meses</h3>
    <p>${ultima ? `La última fue el ${fechaCorta(ultima)}. ${toca ? '<b>Ya toca la próxima.</b>' : `La próxima es el ${fechaCorta(proxima)}.`}` : 'Todavía no hicieron la primera. Revisen vencimientos, linternas, reservas de agua y comida, y la lista de teléfonos.'}</p>
    <div class="fila"><button type="button" class="boton${toca ? ' primario' : ''}" data-accion="revision">Hicimos la revisión hoy</button></div>
  </div>
  <p class="nota"><a href="#ajustes">Ajustes y copia de seguridad</a> · Prototipo. El contenido sale del curso de preparacionismo comunitario y hay que validarlo con protección civil y salud.</p>`;
}

/* ---------- necesidades ---------- */
function formSumar() {
  return `<form class="fila" data-form="sumar-integrante" autocomplete="off">
    <label class="campo" style="flex:2 1 160px">Nombre<input type="text" name="nombre" required maxlength="40" placeholder="Ej.: Ana"></label>
    <label class="campo" style="flex:1 1 150px">Quién es<select name="tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <button type="submit" class="boton primario" style="align-self:end">Sumar</button>
  </form>`;
}
function verNecesidades() {
  const h = estado.hogar, z = h.zona, p = personas();
  const caja = (campo, valor, texto) => `<label class="opcion"><input type="checkbox" data-campo="${campo}" ${valor ? 'checked' : ''}><span>${texto}</span></label>`;
  return `
  ${cabeza('Módulo 1', 'Mis necesidades', 'Contá quiénes son y dónde viven. Con eso la app calcula qué les falta y en qué orden conseguirlo.')}
  <div class="panel">
    <h3>1 · Quiénes son</h3>
    ${p ? `<ul class="limpia">${estado.integrantes.map((i) => `<li class="integrante-fila"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas><span><b>${esc(i.nombre)}</b> · ${TIPOS[i.tipo]}</span><button type="button" class="boton chico" data-accion="quitar-integrante" data-id="${i.id}">Quitar</button></li>`).join('')}</ul>` : '<p class="nota">Todavía no sumaste a nadie. Empezá por vos.</p>'}
    ${formSumar()}
  </div>
  <div class="panel">
    <h3>2 · Dónde viven</h3>
    <div class="opciones">
      ${caja('hogar.zona.inundable', z.inundable, 'La zona se inunda')}
      ${caja('hogar.zona.sismica', z.sismica, 'Es zona sísmica')}
      ${caja('hogar.zona.calor', z.calor, 'Hay olas de calor fuertes')}
      ${caja('hogar.zona.incendios', z.incendios, 'Hay riesgo de incendios cerca')}
      ${caja('hogar.mascotas', h.mascotas, 'Tenemos mascotas')}
    </div>
    <p class="nota">Si alguien es electrodependiente o toma medicación, marcalo en su ficha de <a href="#familia">Familia y yo</a>.</p>
  </div>
  <div class="panel">
    <h3>3 · Meta</h3>
    <div class="opciones">
      <label class="opcion"><input type="radio" name="meta" data-campo="hogar.meta" data-num value="3" ${h.meta !== 14 ? 'checked' : ''}><span><b>72 horas.</b> Para arrancar: son las horas más difíciles para los rescatistas.</span></label>
      <label class="opcion"><input type="radio" name="meta" data-campo="hogar.meta" data-num value="14" ${h.meta === 14 ? 'checked' : ''}><span><b>2 semanas.</b> La meta que propone el curso.</span></label>
    </div>
  </div>
  ${p ? resultadoNecesidades() : ''}`;
}
function resultadoNecesidades() {
  const p = personas(), dias = estado.hogar.meta, c = condiciones();
  const litros = p * 3 * dias;
  const meds = estado.integrantes.filter((i) => (i.medicacion || '').trim()).map((i) => esc(i.nombre));
  const prioridades = [
    meds.length ? `<li><span>Medicación de 2 a 4 semanas para ${meds.join(', ')}.</span></li>` : '',
    c.electro ? '<li><span>Energía para la persona electrodependiente: una UPS y un punto de carga en la cuadra.</span></li>' : '',
    c.bebes ? '<li><span>Pañales, leche y comida de bebé para 72 horas.</span></li>' : ''
  ].join('');
  return `
  ${cabeza('Resultado', 'Lo que necesitan')}
  <div class="resumen">
    <div class="panel"><span class="rotulo">Agua</span><span class="dato-grande">${litros} L</span><span class="nota">${p} × 3 L × ${dias} días · unos ${Math.ceil(litros / 6)} bidones de 6 L</span></div>
    <div class="panel"><span class="rotulo">Mochilas</span><span class="dato-grande">${p}</span><span class="nota">Una por persona, de no más del 15% de su peso</span></div>
    <div class="panel"><span class="rotulo">Efectivo</span><span class="dato-grande">72 h</span><span class="nota">Para comprar sin luz ni señal</span></div>
  </div>
  ${prioridades ? `<div class="panel alerta-panel"><h3>Primero esto</h3><ul class="puntos">${prioridades}</ul></div>` : ''}
  <div class="panel">
    <h3>En qué orden</h3>
    <ol class="orden">${CATEGORIAS.map((cat) => { const pr = progresoCat(cat); return `<li><div class="orden-fila"><a href="#checklists" data-accion="ir-cat" data-cat="${cat.id}">${cat.nombre}</a><span class="nota">${pr.n} de ${pr.total} listos</span><div class="mini-barra"><i style="width:${Math.round(pr.r * 100)}%"></i></div></div></li>`; }).join('')}</ol>
    <div class="fila"><a class="boton primario" href="#compras">Ver la lista de compras</a><a class="boton" href="#checklists">Ir a los checklists</a></div>
  </div>`;
}

/* ---------- familia ---------- */
let familiaSel = null;
function verFamilia() {
  const ints = estado.integrantes;
  const intro = 'Una ficha por integrante, con lo que hace falta saber en una emergencia. Queda guardada solo en este teléfono.';
  if (!ints.length) {
    return `${cabeza('Módulo 2', 'Familia y yo', intro)}<div class="panel"><h3>Todavía no hay nadie</h3><p>Sumá a cada integrante de la casa. Después completás su ficha.</p>${formSumar()}</div>`;
  }
  const sel = ints.find((i) => i.id === familiaSel) || ints[0];
  familiaSel = sel.id;
  const lleva = ints.find((i) => i.id === sel.mochila);
  const completo = [sel.grupo, sel.contacto, sel.alergias || sel.medicacion || sel.notas].filter(Boolean).length / 3;
  const dato = (etiqueta, valor) => `<div><span>${etiqueta}:</span> ${valor ? esc(valor) : '—'}</div>`;
  return `
  ${cabeza('Módulo 2', 'Familia y yo', intro)}
  <div class="panel pantalla-sel foco crt">
    <div class="pantalla">
      <canvas class="grande" width="7" height="13" data-avatar="${sel.id}" aria-hidden="true"></canvas>
      <div style="display:grid;gap:8px;min-width:0">
        <p class="rotulo">Elegí tu integrante</p>
        <p class="nombre aberracion">${esc(sel.nombre.toUpperCase())}</p>
        <div class="ficha">
          <div><span>Quién es:</span> ${TIPOS[sel.tipo]}${sel.electro ? ' · electrodependiente' : ''}</div>
          ${dato('Grupo y factor', sel.grupo)}
          ${dato('Alergias', sel.alergias)}
          ${dato('Medicación', sel.medicacion)}
          ${dato('Obra social', sel.obraSocial)}
          ${dato('Contacto', sel.contacto)}
          ${dato('Su mochila la lleva', lleva ? lleva.nombre : '')}
        </div>
        <div class="fila">${monedas(completo)}<button type="button" class="boton primario chico" data-accion="editar-integrante" data-id="${sel.id}">Editar ficha</button></div>
      </div>
    </div>
  </div>
  <div class="selector" role="group" aria-label="Integrantes">
    ${ints.map((i) => `<button type="button" data-accion="elegir-integrante" data-id="${i.id}" aria-pressed="${i.id === sel.id}"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas>${esc(i.nombre)}</button>`).join('')}
  </div>
  <div class="panel"><h3>Sumar a alguien</h3>${formSumar()}</div>`;
}
function abrirEdicion(id) {
  const i = estado.integrantes.find((x) => x.id === id);
  if (!i) return;
  const op = (valor, texto, actual) => `<option value="${esc(valor)}" ${valor === actual ? 'selected' : ''}>${esc(texto)}</option>`;
  dialogo.innerHTML = `
  <form data-dialogo="integrante" data-id="${i.id}">
    <h2 id="dialogo-titulo" style="font-size:30px">Ficha de ${esc(i.nombre)}</h2>
    <div class="dos">
      <label class="campo">Nombre<input type="text" name="nombre" value="${esc(i.nombre)}" required maxlength="40"></label>
      <label class="campo">Quién es<select name="tipo">${Object.entries(TIPOS).map(([k, v]) => op(k, v, i.tipo)).join('')}</select></label>
      <label class="campo">Grupo y factor<select name="grupo">${GRUPOS.map((g) => op(g, g || 'Elegí', i.grupo)).join('')}</select></label>
      <label class="campo">Teléfono de contacto<input type="tel" name="contacto" value="${esc(i.contacto)}" maxlength="30"></label>
      <label class="campo">Obra social<input type="text" name="obraSocial" value="${esc(i.obraSocial)}" maxlength="60"></label>
      <label class="campo">Su mochila la lleva<select name="mochila">${op('', 'Sin definir', i.mochila)}${estado.integrantes.map((o) => op(o.id, o.nombre, i.mochila)).join('')}</select></label>
    </div>
    <label class="campo">Alergias<input type="text" name="alergias" value="${esc(i.alergias)}" maxlength="120" placeholder="Ej.: penicilina"></label>
    <label class="campo">Medicación<input type="text" name="medicacion" value="${esc(i.medicacion)}" maxlength="160" placeholder="Qué toma y cada cuánto"></label>
    <label class="campo">Notas<textarea name="notas" maxlength="400" placeholder="Lo que haga falta saber para cuidarle">${esc(i.notas)}</textarea></label>
    <label class="opcion"><input type="checkbox" name="electro" ${i.electro ? 'checked' : ''}><span>Es electrodependiente</span></label>
    <div class="fila"><button type="submit" class="boton primario">Guardar</button><button type="button" class="boton" data-cerrar>Cancelar</button><button type="button" class="boton peligro" data-quitar="${i.id}">Quitar</button></div>
  </form>`;
  dialogo.showModal();
}
function quitarIntegrante(id) {
  estado.integrantes = estado.integrantes.filter((i) => i.id !== id);
  for (const i of estado.integrantes) if (i.mochila === id) i.mochila = '';
  for (const k of Object.keys(estado.plan.roles)) if (estado.plan.roles[k] === id) estado.plan.roles[k] = '';
  if (!estado.integrantes.length) estado.hogar.configurado = false;
  if (familiaSel === id) familiaSel = null;
  guardar();
  refrescar();
}

/* ---------- checklists ---------- */
let irACat = null;
function itemCheck(it) {
  const ch = estado.checks[it.id];
  const bloqueado = !cuenta(it);
  const vence = it.rotar && ch?.hecho && ch.fecha ? sumarMeses(ch.fecha, it.rotar) : null;
  const vencido = vence && vence <= hoy();
  const extra = vence
    ? `<span class="${vencido ? 'chip vencido' : ''}">${vencido ? 'Venció el' : 'Revisar el'} ${fechaCorta(vence)}</span>`
    : (it.rotar ? `<span>Se revisa cada ${it.rotar} meses</span>` : '');
  return `<label class="paso${bloqueado ? ' bloqueado' : ''}"><input type="checkbox" data-check="${it.id}" ${ch?.hecho ? 'checked' : ''}><span class="paso-texto"><span>${esc(it.texto)}</span><span class="chips"><span class="chip ${it.etapa === '14d' ? 'c14d' : 'c72h'}">${it.etapa === '14d' ? '2 semanas' : '72 h'}</span>${bloqueado ? '<span>Siguiente nivel</span>' : ''}${extra}</span></span></label>`;
}
function verChecklists() {
  const venc = vencidos();
  const meta = estado.hogar.meta;
  return `
  ${cabeza('Módulo 3', 'Checklists', `Tildá lo que ya tienen. Lo que se vence te avisa cuándo revisarlo. Meta actual: <b>${meta === 14 ? '2 semanas' : '72 horas'}</b>${meta === 14 ? '.' : '; lo de 2 semanas queda como siguiente nivel.'}`)}
  ${venc.length ? `<div class="panel alerta-panel"><h3>Para revisar</h3><ul class="limpia">${venc.map((v) => `<li class="fila" style="justify-content:space-between"><span>${esc(v.it.texto)} <span class="chip vencido">venció ${fechaCorta(v.vence)}</span></span><button type="button" class="boton chico" data-accion="renovar" data-id="${v.it.id}">Ya lo renové</button></li>`).join('')}</ul></div>` : ''}
  ${CATEGORIAS.map((cat) => {
    const pr = progresoCat(cat);
    return `<article class="panel" id="cat-${cat.id}">
      <div class="cat-tope"><canvas width="12" height="12" data-icono="${cat.icono}" aria-hidden="true"></canvas><h3>${cat.nombre}</h3><div class="cat-cuenta"><span>${pr.n}/${pr.total}</span>${monedas(pr.r)}</div></div>
      ${itemsDe(cat).map(itemCheck).join('')}
    </article>`;
  }).join('')}`;
}
function montarChecklists() {
  if (!irACat) return;
  const el = document.getElementById(`cat-${irACat}`);
  irACat = null;
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 76);
}

/* ---------- compras ---------- */
function faltaGastar(lista) {
  let falta = 0;
  for (const it of lista) { const c = estado.compras[it.id] || {}; if (!c.comprado) falta += Number(c.precio) || 0; }
  return falta;
}
function itemCompra(it) {
  const c = estado.compras[it.id] || {};
  const url = it.buscar ? `https://listado.mercadolibre.com.ar/${encodeURIComponent(it.buscar.replace(/\s+/g, '-'))}` : null;
  return `<li class="compra">
    <input type="checkbox" data-compra="${it.id}" ${c.comprado ? 'checked' : ''} aria-label="Comprado: ${esc(it.nombre)}">
    <div class="compra-cuerpo">
      <span><b>${esc(it.nombre)}</b> <span class="chip">${esc(it.cat)}</span></span>
      <span class="compra-cant">${esc(it.cant)}</span>
      <div class="compra-fila">
        <input type="number" inputmode="numeric" min="0" step="1" placeholder="Precio $" data-precio="${it.id}" value="${c.precio ?? ''}" aria-label="Precio de ${esc(it.nombre)}">
        ${url ? `<a href="${url}" target="_blank" rel="noopener">Buscar en Mercado Libre ↗</a>` : '<span class="nota">Con receta, en la farmacia</span>'}
      </div>
    </div>
  </li>`;
}
function verCompras() {
  const p = personas();
  if (!p) {
    return `${cabeza('Módulo 4', 'Compras')}<a class="panel cta" href="#necesidades"><span class="rotulo">Primero</span><h3>Contá quiénes son</h3><p>La lista se calcula según cuántas personas son y dónde viven.</p></a>`;
  }
  const lista = listaCompras();
  const comprados = lista.filter((it) => estado.compras[it.id]?.comprado).length;
  const etapas = [['72h', 'Primero: 72 horas'], ['14d', 'Después: 2 semanas']].filter(([e]) => lista.some((i) => i.etapa === e));
  return `
  ${cabeza('Módulo 4', 'Compras', `Calculado para ${plural(p, 'persona', 'personas')} y ${estado.hogar.meta === 14 ? '2 semanas' : '72 horas'}. Sin compras de pánico: de a poco, "un paquete más" cada vez.`)}
  <div class="resumen">
    <div class="panel"><span class="rotulo">Comprado</span><span class="dato-grande">${comprados}/${lista.length}</span></div>
    <div class="panel"><span class="rotulo">Falta gastar</span><span class="dato-grande" id="falta-gastar">${pesos(faltaGastar(lista))}</span><span class="nota">Según los precios que cargues</span></div>
  </div>
  ${etapas.map(([e, titulo]) => `<article class="panel"><h3>${titulo}</h3><ul class="limpia">${lista.filter((i) => i.etapa === e).map(itemCompra).join('')}</ul></article>`).join('')}
  <div class="panel">
    <h3>Comprar en grupo</h3>
    <p>Lo caro se comparte y al mayorista sale más barato. Copiá lo que falta y pasáselo a tus vecinos.</p>
    <div class="fila"><button type="button" class="boton primario" data-accion="copiar-compras">Copiar lo que falta</button></div>
  </div>`;
}
async function copiarCompras() {
  const pendientes = listaCompras().filter((it) => !estado.compras[it.id]?.comprado);
  const texto = `Lista de compras para emergencias:\n${pendientes.map((it) => `- ${it.nombre}: ${it.cant}`).join('\n')}`;
  try {
    await navigator.clipboard.writeText(texto);
    aviso('Lista copiada. Pegala en el grupo de vecinos.');
  } catch (e) {
    if (navigator.share) { try { await navigator.share({ text: texto }); } catch (err) { /* cancelado */ } }
    else aviso('No se pudo copiar en este navegador');
  }
}

/* ---------- plan ---------- */
function verPlan() {
  const pl = estado.plan, ints = estado.integrantes, c = condiciones();
  const amenazas = PROTOCOLOS.filter((pr) => pr.id !== 'pas' && (!pr.zona || c[pr.zona]));
  const texto = (k, etiqueta, ph) => `<label class="campo">${etiqueta}<input type="text" data-campo="plan.${k}" value="${esc(pl[k])}" placeholder="${ph}" maxlength="120"></label>`;
  return `
  ${cabeza('Módulo 5', 'Mi plan', 'Dónde se encuentran, por dónde salen y quién hace qué. Una orden concreta para cada uno, como en el PAS: si se le dice "a alguien", nadie lo hace.')}
  <div class="panel">
    <h3>Dónde nos encontramos</h3>
    ${texto('encuentro', 'Punto de encuentro cerca de casa', 'Ej.: la esquina de la plaza')}
    ${texto('encuentroAlt', 'Punto alternativo, fuera del barrio', 'Ej.: la casa de un familiar en otro barrio')}
    <label class="campo">Rutas de salida<textarea data-campo="plan.rutas" maxlength="600" placeholder="Dos caminos distintos, lejos de zonas que se inundan, estaciones de servicio y cables de alta tensión">${esc(pl.rutas)}</textarea></label>
    <p class="nota">Marcalos también en <a href="#zona">Mi zona</a>.</p>
  </div>
  <div class="panel">
    <h3>Quién hace qué</h3>
    ${ints.length ? ROLES_PLAN.map((rol, n) => `<label class="campo">${rol}<select data-rol="${n}"><option value="">Sin asignar</option>${ints.map((i) => `<option value="${i.id}" ${pl.roles[n] === i.id ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}</select></label>`).join('') : '<p class="nota">Primero sumá a los integrantes en <a href="#necesidades">Mis necesidades</a>.</p>'}
  </div>
  <div class="panel">
    <h3>Contactos clave</h3>
    <p class="nota">Alguien fuera del barrio a quien todos avisan, y los teléfonos que no pueden faltar.</p>
    ${pl.contactos.length ? `<ul class="limpia">${pl.contactos.map((ct) => `<li class="fila" style="justify-content:space-between"><span><b>${esc(ct.nombre)}</b> · ${esc(ct.tel)}${ct.rel ? ` · ${esc(ct.rel)}` : ''}</span><button type="button" class="boton chico" data-accion="quitar-contacto" data-id="${ct.id}">Quitar</button></li>`).join('')}</ul>` : ''}
    <form class="dos" data-form="sumar-contacto" autocomplete="off">
      <label class="campo">Nombre<input type="text" name="nombre" required maxlength="40"></label>
      <label class="campo">Teléfono<input type="tel" name="tel" required maxlength="30"></label>
      <label class="campo">Quién es<input type="text" name="rel" maxlength="40" placeholder="Ej.: tía, vecina, médica"></label>
      <button type="submit" class="boton" style="align-self:end">Sumar contacto</button>
    </form>
  </div>
  <div class="panel">
    <h3>Amenazas de tu zona</h3>
    <ul class="puntos">${amenazas.map((a) => `<li><span>${a.nombre}</span></li>`).join('')}</ul>
    <p class="nota">Salen de lo que marcaste en <a href="#necesidades">Mis necesidades</a>. Los protocolos van en la hoja y en el <a href="#emergencia">Modo emergencia</a>.</p>
  </div>
  <div class="fila"><a class="boton primario" href="#hoja">Ver la hoja para imprimir</a></div>`;
}
function verHoja() {
  const pl = estado.plan, ints = estado.integrantes, c = condiciones();
  const amenazas = PROTOCOLOS.filter((pr) => !pr.zona || c[pr.zona]);
  const nombreDe = (id) => esc(ints.find((i) => i.id === id)?.nombre || '');
  return `
  <div class="fila no-imprimir"><a class="boton" href="#plan">Volver</a><button type="button" class="boton primario" data-accion="imprimir">Imprimir</button></div>
  <article class="hoja">
    <h2>Plan familiar de emergencia</h2>
    <p>Actualizado el ${fechaCorta(hoy())}. Pegalo en la heladera y guardá una copia en la carpeta.</p>
    <h3>Integrantes</h3>
    <div class="hoja-caja"><table>
      <thead><tr><th>Nombre</th><th>Grupo</th><th>Alergias</th><th>Medicación</th><th>Contacto</th></tr></thead>
      <tbody>${ints.map((i) => `<tr><td>${esc(i.nombre)}${i.electro ? ' (electrodependiente)' : ''}</td><td>${esc(i.grupo)}</td><td>${esc(i.alergias)}</td><td>${esc(i.medicacion)}</td><td>${esc(i.contacto)}</td></tr>`).join('') || '<tr><td colspan="5">Sin integrantes cargados</td></tr>'}</tbody>
    </table></div>
    <h3>Dónde nos encontramos</h3>
    <p><b>Cerca de casa:</b> ${esc(pl.encuentro) || '—'}<br><b>Fuera del barrio:</b> ${esc(pl.encuentroAlt) || '—'}</p>
    <p><b>Rutas de salida:</b> ${esc(pl.rutas) || '—'}</p>
    <h3>Quién hace qué</h3>
    <ul>${ROLES_PLAN.map((r, n) => `<li>${r}: <b>${nombreDe(pl.roles[n]) || 'sin asignar'}</b></li>`).join('')}</ul>
    <h3>Teléfonos</h3>
    <p>${NUMEROS.map((n) => `${n.nombre}: <b>${n.num}</b>`).join(' · ')}</p>
    ${pl.contactos.length ? `<p>${pl.contactos.map((ct) => `${esc(ct.nombre)}${ct.rel ? ` (${esc(ct.rel)})` : ''}: <b>${esc(ct.tel)}</b>`).join(' · ')}</p>` : ''}
    <h3>Qué hacer</h3>
    ${amenazas.map((a) => `<p><b>${a.nombre}.</b> ${a.pasos.slice(0, 4).join(' ')}</p>`).join('')}
  </article>`;
}

/* ---------- zona ---------- */
let tipoMarcador = 'casa';
let mapa = null;
function centroActual() {
  if (estado.zona.centro) return estado.zona.centro;
  const casa = estado.zona.marcadores.find((m) => m.tipo === 'casa');
  return casa ? { lat: casa.lat, lng: casa.lng, zoom: 16 } : { lat: -34.6037, lng: -58.3816, zoom: 12 };
}
function linksCerca(c) {
  return BUSQUEDAS_CERCA.map((b) => `<a class="boton chico" href="https://www.google.com/maps/search/${encodeURIComponent(b.q)}/@${c.lat.toFixed(5)},${c.lng.toFixed(5)},15z" target="_blank" rel="noopener">${b.nombre} ↗</a>`).join('');
}
function verZona() {
  const ms = estado.zona.marcadores;
  return `
  ${cabeza('Módulo 6', 'Mi zona', 'Marcá tu casa, el punto de encuentro, los riesgos (estaciones de servicio, transformadores, cables de alta tensión, calles que se inundan) y lo que sirve cerca. Elegí el tipo y tocá el mapa.')}
  <div class="panel">
    <div class="tipos" role="group" aria-label="Tipo de punto">${Object.entries(TIPOS_MARCADOR).map(([k, t]) => `<button type="button" data-accion="tipo-marcador" data-tipo="${k}" aria-pressed="${k === tipoMarcador}"><span class="punto" style="background:${t.color}"></span>${t.nombre}</button>`).join('')}</div>
    <div id="mapa" class="mapa" aria-label="Mapa de tu zona"></div>
    <div class="fila"><button type="button" class="boton" data-accion="ubicarme">Ir a mi ubicación</button></div>
    <p class="nota">El mapa necesita internet. Cuando lo tengas armado, sacale una captura para tenerla en la emergencia.</p>
  </div>
  <div class="panel">
    <h3>Buscar cerca en Google Maps</h3>
    <p class="nota">Abre Google Maps alrededor del centro del mapa.</p>
    <div class="fila" id="busquedas">${linksCerca(centroActual())}</div>
  </div>
  <div class="panel">
    <h3>Tus puntos</h3>
    ${ms.length ? `<ul class="limpia">${ms.map((m) => `<li class="marcador-fila"><span class="punto" style="background:${TIPOS_MARCADOR[m.tipo].color}"></span><span><b>${esc(m.nombre)}</b> · ${TIPOS_MARCADOR[m.tipo].nombre}${m.nota ? `<br><span class="nota">${esc(m.nota)}</span>` : ''}<br><a href="https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}" target="_blank" rel="noopener">Ver en Google Maps ↗</a></span><button type="button" class="boton chico" data-accion="quitar-marcador" data-id="${m.id}">Quitar</button></li>`).join('')}</ul>` : '<p class="nota">Todavía no marcaste nada. Empezá por tu casa.</p>'}
  </div>`;
}
function cargarLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (cargarLeaflet.promesa) return cargarLeaflet.promesa;
  cargarLeaflet.promesa = new Promise((ok, mal) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    s.onload = () => ok(window.L);
    s.onerror = () => { cargarLeaflet.promesa = null; mal(new Error('No cargó el mapa')); };
    document.head.appendChild(s);
  });
  return cargarLeaflet.promesa;
}
function pin(L, m) {
  const t = TIPOS_MARCADOR[m.tipo];
  return L.marker([m.lat, m.lng], {
    title: m.nombre,
    icon: L.divIcon({ className: 'pin', html: `<span style="background:${t.color}"></span>`, iconSize: [24, 24], iconAnchor: [12, 12] })
  }).bindPopup(`<b>${esc(m.nombre)}</b><br>${t.nombre}`);
}
function montarZona() {
  const caja = document.getElementById('mapa');
  cargarLeaflet().then((L) => {
    if (!caja.isConnected) return;
    const c = centroActual();
    mapa = L.map(caja).setView([c.lat, c.lng], c.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(mapa);
    for (const m of estado.zona.marcadores) pin(L, m).addTo(mapa);
    mapa.on('click', (e) => abrirMarcador(e.latlng));
    mapa.on('moveend', () => {
      const ct = mapa.getCenter();
      estado.zona.centro = { lat: ct.lat, lng: ct.lng, zoom: mapa.getZoom() };
      guardar();
      const bq = document.getElementById('busquedas');
      if (bq) bq.innerHTML = linksCerca(estado.zona.centro);
    });
    const m = mapa;
    limpiar.push(() => { m.remove(); if (mapa === m) mapa = null; });
  }).catch(() => {
    caja.innerHTML = '<p class="nota" style="padding:16px">No se pudo cargar el mapa. Revisá la conexión a internet.</p>';
  });
}
function abrirMarcador(latlng) {
  const t = TIPOS_MARCADOR[tipoMarcador];
  dialogo.innerHTML = `
  <form data-dialogo="marcador" data-lat="${latlng.lat}" data-lng="${latlng.lng}">
    <h2 id="dialogo-titulo" style="font-size:30px">Nuevo punto</h2>
    <label class="campo">Tipo<select name="tipo">${Object.entries(TIPOS_MARCADOR).map(([k, v]) => `<option value="${k}" ${k === tipoMarcador ? 'selected' : ''}>${v.nombre}</option>`).join('')}</select></label>
    <label class="campo">Nombre<input type="text" name="nombre" required maxlength="60" placeholder="${tipoMarcador === 'riesgo' ? 'Ej.: transformador de la esquina' : tipoMarcador === 'recurso' ? 'Ej.: generador de Juan' : `Ej.: ${t.nombre.toLowerCase()}`}"></label>
    <label class="campo">Nota<input type="text" name="nota" maxlength="140" placeholder="Opcional"></label>
    <div class="fila"><button type="submit" class="boton primario">Guardar punto</button><button type="button" class="boton" data-cerrar>Cancelar</button></div>
  </form>`;
  dialogo.showModal();
}
function ubicarme() {
  if (!navigator.geolocation) { aviso('Este teléfono no comparte la ubicación'); return; }
  navigator.geolocation.getCurrentPosition(
    (pos) => { if (mapa) mapa.setView([pos.coords.latitude, pos.coords.longitude], 16); },
    () => aviso('No se pudo obtener tu ubicación'),
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

/* ---------- tutoriales ---------- */
function verTutoriales() {
  const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  return `
  ${cabeza('Módulo 7', 'Tutoriales', 'Búsquedas armadas por tema para aprender lo que no sabés hacer. Todavía no están curadas: elegí videos de fuentes confiables, como bomberos, Cruz Roja o Defensa Civil. Primeros auxilios se practica en persona.')}
  <div class="panel"><h3>El curso</h3><ul class="puntos">${CURSO.map((v) => `<li><a href="${v.url}" target="_blank" rel="noopener">${v.titulo} ↗</a></li>`).join('')}</ul></div>
  <div class="modulos" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,230px),1fr))">
    ${TUTORIALES.map((t) => `<article class="panel"><h3>${t.tema}</h3><ul class="puntos">${t.items.map((q) => `<li><a href="${yt(q)}" target="_blank" rel="noopener">${q.charAt(0).toUpperCase() + q.slice(1)} ↗</a></li>`).join('')}</ul></article>`).join('')}
  </div>
  <p class="nota">Más adelante: videos elegidos y descargables para verlos sin señal.</p>`;
}

/* ---------- emergencia ---------- */
let protoSel = 'pas';
let silbando = null;
let bloqueoPantalla = null;
function verEmergencia() {
  const pl = estado.plan, ints = estado.integrantes;
  const pr = PROTOCOLOS.find((p) => p.id === protoSel) || PROTOCOLOS[0];
  return `
  ${cabeza('Modo emergencia', 'Calma. Paso a paso.', 'Todo lo de esta pantalla funciona sin internet.')}
  <div class="sos-botones">
    <button type="button" class="boton sos-luz" data-accion="linterna">Linterna</button>
    <button type="button" class="boton sos-silbato" data-accion="silbato" aria-pressed="${!!silbando}">${silbando ? 'Parar silbato' : 'Silbato'}</button>
  </div>
  <div class="panel">
    <h3>Llamar</h3>
    <div class="numeros">${NUMEROS.map((n) => `<a class="numero" href="tel:${n.num}"><b>${n.num}</b><span>${n.nombre}</span></a>`).join('')}</div>
    <p class="nota">Verificá los números de tu localidad, como el del cuartel de bomberos más cercano. Si no hay señal, andá en persona al cuartel o a una clínica.</p>
  </div>
  ${pl.encuentro || pl.encuentroAlt ? `<div class="panel"><h3>Punto de encuentro</h3><p><b>${esc(pl.encuentro) || '—'}</b></p>${pl.encuentroAlt ? `<p class="nota">Alternativo: ${esc(pl.encuentroAlt)}</p>` : ''}</div>` : ''}
  <div class="panel">
    <h3>Qué hacer</h3>
    <div class="protocolos-botones" role="group" aria-label="Elegí la emergencia">${PROTOCOLOS.map((p) => `<button type="button" data-accion="protocolo" data-id="${p.id}" aria-pressed="${p.id === pr.id}">${p.nombre}</button>`).join('')}</div>
    <ol class="orden">${pr.pasos.map((s) => `<li><span>${s}</span></li>`).join('')}</ol>
  </div>
  ${ints.length ? `<div class="panel"><h3>Fichas médicas</h3><ul class="limpia">${ints.map((i) => `<li class="integrante-fila"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas><span><b>${esc(i.nombre)}</b> · grupo ${esc(i.grupo) || '—'}<br><span class="nota">Alergias: ${esc(i.alergias) || '—'} · Medicación: ${esc(i.medicacion) || '—'}${i.contacto ? ` · Tel.: ${esc(i.contacto)}` : ''}</span></span><span></span></li>`).join('')}</ul></div>` : ''}`;
}
async function prenderLinterna() {
  linterna.hidden = false;
  try { if (navigator.wakeLock) bloqueoPantalla = await navigator.wakeLock.request('screen'); } catch (e) { /* sin bloqueo de pantalla */ }
}
linterna.addEventListener('click', () => {
  linterna.hidden = true;
  if (bloqueoPantalla) { bloqueoPantalla.release().catch(() => {}); bloqueoPantalla = null; }
});
function alternarSilbato() {
  if (silbando) {
    silbando.parar();
    silbando = null;
  } else {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) { aviso('Este teléfono no puede sonar el silbato'); return; }
    const ctx = new Ctx();
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(ctx.destination);
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.value = 3100;
    o.connect(g);
    o.start();
    // tres pitidos y una pausa, en loop
    const tanda = () => {
      const t0 = ctx.currentTime + 0.05;
      for (let i = 0; i < 3; i++) { g.gain.setValueAtTime(0.35, t0 + i * 0.75); g.gain.setValueAtTime(0, t0 + i * 0.75 + 0.45); }
    };
    tanda();
    const iv = setInterval(tanda, 3200);
    silbando = { parar() { clearInterval(iv); try { o.stop(); ctx.close(); } catch (e) { /* ya estaba parado */ } } };
  }
  refrescar();
}

/* ---------- ajustes ---------- */
function verAjustes() {
  return `
  ${cabeza('Ajustes', 'Tus datos', 'Todo queda guardado solo en este teléfono: no hay cuentas ni servidor. Hacé una copia de seguridad cada tanto.')}
  <div class="panel">
    <h3>Copia de seguridad</h3>
    <p>Bajá un archivo con todo lo que cargaste, para guardarlo o pasarlo a otro teléfono.</p>
    <div class="fila"><button type="button" class="boton primario" data-accion="exportar">Bajar copia</button><label class="boton" for="importar">Cargar copia</label><input type="file" id="importar" accept="application/json,.json" hidden data-importar></div>
  </div>
  <div class="panel">
    <h3>Empezar de cero</h3>
    <p>Borra todo lo cargado en este teléfono. No se puede deshacer.</p>
    <div class="fila"><button type="button" class="boton peligro" data-accion="borrar-todo">Borrar todo</button></div>
  </div>
  <div class="panel">
    <h3>Sobre esta app</h3>
    <p>Prototipo independiente. El contenido sale del curso de preparacionismo comunitario (vivo del 29/10/2026 y clases del 4 y 6/11/2026). No es material oficial de ninguna organización y hay que validarlo con gente de protección civil y de salud.</p>
  </div>`;
}
function exportar() {
  const blob = new Blob([JSON.stringify(estado, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `barrio-listo-${hoy()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importar(archivo) {
  if (!archivo) return;
  const lector = new FileReader();
  lector.onload = () => {
    try {
      const d = JSON.parse(lector.result);
      if (!d || !Array.isArray(d.integrantes) || !d.hogar) throw new Error('formato');
      estado = normalizar(d);
      guardar();
      aviso('Copia cargada');
      location.hash = 'inicio';
      render(true);
    } catch (e) {
      aviso('Ese archivo no es una copia de Barrio Listo');
    }
  };
  lector.readAsText(archivo);
}

/* =========================================================
   Rutas y eventos
   ========================================================= */
const VISTAS = {
  inicio: verInicio, necesidades: verNecesidades, familia: verFamilia, checklists: verChecklists,
  compras: verCompras, plan: verPlan, hoja: verHoja, zona: verZona, tutoriales: verTutoriales,
  emergencia: verEmergencia, ajustes: verAjustes
};
const MONTAR = {
  inicio: () => { const parar = dibujarBarrio(document.getElementById('barrio')); limpiar.push(parar); },
  checklists: montarChecklists,
  zona: montarZona
};
const NAV = { hoja: 'plan', necesidades: 'inicio', compras: 'inicio', zona: 'inicio', tutoriales: 'inicio', ajustes: 'inicio' };
let limpiar = [];

function rutaActual() { const r = location.hash.slice(1); return VISTAS[r] ? r : 'inicio'; }
function render(arriba) {
  limpiar.forEach((f) => { try { f(); } catch (e) { /* nada */ } });
  limpiar = [];
  const r = rutaActual();
  document.body.dataset.ruta = r;
  vista.innerHTML = VISTAS[r]();
  pintarSprites(vista);
  const activa = NAV[r] || r;
  document.querySelectorAll('.navegacion a').forEach((a) => {
    if (a.dataset.ruta === activa) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  document.getElementById('reloj').textContent = estado.hogar.meta === 14 ? '14 DÍAS' : '72:00 HS';
  if (arriba) { window.scrollTo(0, 0); vista.focus({ preventScroll: true }); }
  if (MONTAR[r]) MONTAR[r]();
}
function refrescar() {
  const y = window.scrollY;
  const a = document.activeElement;
  let selector = null;
  if (a && vista.contains(a)) {
    for (const k of ['check', 'compra', 'campo', 'accion']) {
      if (a.dataset[k] !== undefined) {
        selector = `[data-${k}="${CSS.escape(a.dataset[k])}"]`;
        if (a.dataset.id) selector += `[data-id="${CSS.escape(a.dataset.id)}"]`;
        if (a.type === 'radio') selector += `[value="${CSS.escape(a.value)}"]`;
        break;
      }
    }
  }
  render(false);
  window.scrollTo(0, y);
  if (selector) vista.querySelector(selector)?.focus({ preventScroll: true });
}
window.addEventListener('hashchange', () => render(true));

const ACCIONES = {
  'quitar-integrante': (b) => confirmar(b, () => quitarIntegrante(b.dataset.id)),
  'editar-integrante': (b) => abrirEdicion(b.dataset.id),
  'elegir-integrante': (b) => { familiaSel = b.dataset.id; refrescar(); },
  'ir-cat': (b, e) => { e.preventDefault(); irACat = b.dataset.cat; if (location.hash === '#checklists') render(true); else location.hash = 'checklists'; },
  renovar: (b) => { estado.checks[b.dataset.id] = { hecho: true, fecha: hoy() }; guardar(); refrescar(); aviso('Renovado: el contador arranca de nuevo'); },
  revision: () => { estado.revision.ultima = hoy(); guardar(); refrescar(); aviso('Revisión anotada. La próxima, en 3 meses.'); },
  'copiar-compras': () => copiarCompras(),
  'quitar-contacto': (b) => { estado.plan.contactos = estado.plan.contactos.filter((c) => c.id !== b.dataset.id); guardar(); refrescar(); },
  imprimir: () => window.print(),
  'tipo-marcador': (b) => {
    tipoMarcador = b.dataset.tipo;
    vista.querySelectorAll('[data-accion="tipo-marcador"]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  },
  ubicarme: () => ubicarme(),
  'quitar-marcador': (b) => confirmar(b, () => { estado.zona.marcadores = estado.zona.marcadores.filter((m) => m.id !== b.dataset.id); guardar(); refrescar(); }),
  linterna: () => prenderLinterna(),
  silbato: () => alternarSilbato(),
  protocolo: (b) => { protoSel = b.dataset.id; refrescar(); },
  exportar: () => exportar(),
  'borrar-todo': (b) => confirmar(b, () => { estado = base(); familiaSel = null; guardar(); aviso('Se borró todo'); location.hash = 'inicio'; render(true); })
};
const FORMULARIOS = {
  'sumar-integrante': (f) => {
    const nombre = f.nombre.value.trim();
    if (!nombre) { aviso('Escribí un nombre'); return; }
    const i = { id: uid(), nombre, tipo: f.tipo.value, grupo: '', alergias: '', medicacion: '', obraSocial: '', contacto: '', notas: '', electro: false, mochila: '' };
    estado.integrantes.push(i);
    estado.hogar.configurado = true;
    familiaSel = i.id;
    guardar();
    refrescar();
    vista.querySelector('form[data-form="sumar-integrante"] [name="nombre"]')?.focus({ preventScroll: true });
    aviso(`${nombre} se sumó`);
  },
  'sumar-contacto': (f) => {
    const nombre = f.nombre.value.trim(), tel = f.tel.value.trim();
    if (!nombre || !tel) return;
    estado.plan.contactos.push({ id: uid(), nombre, tel, rel: f.rel.value.trim() });
    guardar();
    refrescar();
  }
};
const DIALOGOS = {
  integrante: (f) => {
    const i = estado.integrantes.find((x) => x.id === f.dataset.id);
    if (!i) { dialogo.close(); return; }
    const nombre = f.nombre.value.trim();
    if (!nombre) { aviso('Escribí un nombre'); return; }
    Object.assign(i, {
      nombre, tipo: f.tipo.value, grupo: f.grupo.value, contacto: f.contacto.value.trim(), obraSocial: f.obraSocial.value.trim(),
      mochila: f.mochila.value, alergias: f.alergias.value.trim(), medicacion: f.medicacion.value.trim(), notas: f.notas.value.trim(), electro: f.electro.checked
    });
    guardar();
    dialogo.close();
    refrescar();
    aviso('Ficha guardada');
  },
  marcador: (f) => {
    const nombre = f.nombre.value.trim();
    if (!nombre) { aviso('Poné un nombre'); return; }
    estado.zona.marcadores.push({ id: uid(), tipo: f.tipo.value, nombre, nota: f.nota.value.trim(), lat: Number(f.dataset.lat), lng: Number(f.dataset.lng) });
    guardar();
    dialogo.close();
    refrescar();
    aviso('Punto guardado');
  }
};

vista.addEventListener('click', (e) => {
  const b = e.target.closest('[data-accion]');
  if (!b || !vista.contains(b)) return;
  const f = ACCIONES[b.dataset.accion];
  if (f) f(b, e);
});
vista.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  FORMULARIOS[f.dataset.form]?.(f);
});
vista.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.check) {
    if (t.checked) estado.checks[t.dataset.check] = { hecho: true, fecha: hoy() };
    else delete estado.checks[t.dataset.check];
    guardar(); refrescar(); return;
  }
  if (t.dataset.compra) {
    estado.compras[t.dataset.compra] = { ...(estado.compras[t.dataset.compra] || {}), comprado: t.checked };
    guardar(); refrescar(); return;
  }
  if (t.dataset.precio) {
    const v = t.value === '' ? null : Math.max(0, Number(t.value));
    estado.compras[t.dataset.precio] = { ...(estado.compras[t.dataset.precio] || {}), precio: Number.isFinite(v) ? v : null };
    guardar();
    const el = document.getElementById('falta-gastar');
    if (el) el.textContent = pesos(faltaGastar(listaCompras()));
    return;
  }
  if (t.dataset.rol !== undefined) { estado.plan.roles[t.dataset.rol] = t.value; guardar(); return; }
  if (t.dataset.importar !== undefined) { importar(t.files[0]); t.value = ''; return; }
  if (t.dataset.campo) {
    const v = t.type === 'checkbox' ? t.checked : (t.dataset.num !== undefined ? Number(t.value) : t.value);
    setRuta(estado, t.dataset.campo, v);
    guardar();
    if (t.type === 'checkbox' || t.type === 'radio') refrescar();
  }
});
dialogo.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-dialogo]');
  if (!f) return;
  e.preventDefault();
  DIALOGOS[f.dataset.dialogo]?.(f);
});
dialogo.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar]')) { dialogo.close(); return; }
  const q = e.target.closest('[data-quitar]');
  if (q) confirmar(q, () => { dialogo.close(); quitarIntegrante(q.dataset.quitar); });
});

/* ---------- instalación y modo sin internet ---------- */
let pedidoInstalar = null;
const botonInstalar = document.getElementById('instalar');
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; botonInstalar.hidden = false; });
botonInstalar.addEventListener('click', async () => {
  if (!pedidoInstalar) return;
  pedidoInstalar.prompt();
  await pedidoInstalar.userChoice;
  pedidoInstalar = null;
  botonInstalar.hidden = true;
});
window.addEventListener('appinstalled', () => { botonInstalar.hidden = true; aviso('Barrio Listo quedó instalada'); });
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}

render(true);

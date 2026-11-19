import {
  TIPOS, GRUPOS, OBSERVACIONES, CATEGORIAS, ELEMENTOS, INICIALES, MIGRACION, PROTOCOLOS, NUMEROS, ROLES_PLAN,
  TIPOS_MARCADOR, BUSQUEDAS_CERCA, CURSO, TUTORIALES, GRUPOS_RED, MENSAJES, ANIMALES, DIAS_RESERVA
} from './datos.js';

const CLAVE = 'barrio-listo-v1';
const vista = document.getElementById('vista');
const dialogo = document.getElementById('dialogo');
const linterna = document.getElementById('linterna');

/* =========================================================
   Utilidades
   ========================================================= */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const dos = (n) => String(n).padStart(2, '0');
const iso = (f) => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
const hoy = () => iso(new Date());
function sumarMeses(fecha, m) { const [a, me, d] = fecha.split('-').map(Number); return iso(new Date(a, me - 1 + m, d)); }
function sumarDias(fecha, n) { const [a, me, d] = fecha.split('-').map(Number); return iso(new Date(a, me - 1, d + n)); }
const fechaCorta = (f) => { const [a, m, d] = f.split('-'); return `${d}/${m}/${a}`; };
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
  return `<span class="leds" role="img" aria-label="${n} de 3 luces encendidas">${[0, 1, 2].map((i) => `<i class="led${i < n ? ' on' : ''}"></i>`).join('')}</span>`;
}
// Botón de dos toques para lo que borra algo.
function confirmar(b, accion) {
  if (b.dataset.armado) { accion(); return; }
  const original = b.textContent;
  b.dataset.armado = '1';
  b.textContent = '¿Seguro? Tocá de nuevo';
  setTimeout(() => { if (b.isConnected) { delete b.dataset.armado; b.textContent = original; } }, 3500);
}
function abrirExterno(url) {
  if (url.startsWith('http')) window.open(url, '_blank', 'noopener');
  else window.location.href = url;
}

/* =========================================================
   Estado: todo queda en este teléfono (localStorage).
   Se comparte con la V01, que usa la misma clave.
   ========================================================= */
function base() {
  return {
    version: 2,
    hogar: {
      configurado: false, mascotas: false, diasReserva: 3,
      direccion: '', entreCalles: '', barrio: '', localidad: '', provincia: '', referencia: '',
      meta: 3, zona: { inundable: false, sismica: false, calor: false, incendios: false }
    },
    integrantes: [],
    mascotas: [],
    checks: {},
    inventario: {},
    extras: [],
    compras: {},
    plan: { encuentro: '', encuentroAlt: '', rutas: '', roles: {}, contactos: [] },
    red: [],
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
  for (const k of ['integrantes', 'extras', 'red', 'mascotas']) if (!Array.isArray(d[k])) d[k] = [];
  for (const m of d.mascotas) {
    if (m.cantidad === undefined || m.cantidad === null) m.cantidad = 1;
    for (const k of ['animal', 'edad', 'obs']) if (m[k] === undefined || m[k] === null) m[k] = '';
  }
  // Antes había solo un tilde de "Tenemos mascotas": pasa a ser un renglón para completar.
  if (!d.migradoMascotas) {
    if (d.hogar.mascotas && !d.mascotas.length) d.mascotas.push({ id: uid(), animal: '', cantidad: 1, edad: '', obs: '' });
    d.migradoMascotas = true;
  }
  if (!Array.isArray(d.plan.contactos)) d.plan.contactos = [];
  if (!d.plan.roles || typeof d.plan.roles !== 'object') d.plan.roles = {};
  if (!Array.isArray(d.zona.marcadores)) d.zona.marcadores = [];
  for (const i of d.integrantes) {
    if (!Array.isArray(i.obs)) i.obs = [];
    if (i.edad === undefined || i.edad === null) i.edad = '';
    if (i.electro && !i.obs.includes('electro')) i.obs.push('electro');
  }
  if (!d.migradoV02) {
    for (const [viejo, nuevo] of Object.entries(MIGRACION)) {
      const ch = d.checks[viejo];
      if (ch && ch.hecho && !d.inventario[nuevo]) d.inventario[nuevo] = { tengo: true, cantidad: null, vence: null, desde: ch.fecha || null };
    }
    for (const ct of d.plan.contactos) {
      if (!d.red.some((r) => r.id === ct.id)) d.red.push({ id: ct.id || uid(), nombre: ct.nombre || '', tel: ct.tel || '', grupo: 'otros', barrio: '', nota: ct.rel || '' });
    }
    d.migradoV02 = true;
  }
  return d;
}
function cargar() {
  try { const t = localStorage.getItem(CLAVE); return normalizar(t ? JSON.parse(t) : null); }
  catch (e) { return base(); }
}
let estado = cargar();
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
  catch (e) { aviso('No se pudo guardar en este teléfono'); }
}

/* =========================================================
   Cálculos
   ========================================================= */
const personas = () => estado.integrantes.length;
const nombreObs = (id) => OBSERVACIONES.find((o) => o.id === id)?.nombre || id;
const conObs = (id) => estado.integrantes.filter((i) => i.obs.includes(id));
const conMedicacion = () => estado.integrantes.filter((i) => (i.medicacion || '').trim() || i.obs.includes('medicacion'));
const datoAnimal = (id) => ANIMALES.find((a) => a.id === id);
const cantMascota = (m) => Math.max(0, Math.round(Number(m.cantidad) || 0));
const animales = () => estado.mascotas.reduce((s, m) => s + cantMascota(m), 0);
const aguaMascotasDia = () => estado.mascotas.reduce((s, m) => s + cantMascota(m) * (datoAnimal(m.animal)?.agua ?? 0.2), 0);
const dias = () => Number(estado.hogar.diasReserva) || 3;
const decimal = (n) => (Math.round(n * 10) / 10).toLocaleString('es-AR');
const listaNombres = (ints) => ints.map((i) => i.nombre).join(', ').replace(/, ([^,]*)$/, ' y $1');
function listaAnimales() {
  const partes = estado.mascotas.filter((m) => cantMascota(m) > 0).map((m) => {
    const a = datoAnimal(m.animal), n = cantMascota(m);
    if (!a) return plural(n, 'mascota', 'mascotas');
    return `${n} ${n === 1 ? a.nombre.toLowerCase() : a.plural}`;
  });
  return partes.join(', ').replace(/, ([^,]*)$/, ' y $1');
}
function quienes() {
  const p = personas(), a = animales();
  return [p ? plural(p, 'persona', 'personas') : '', a ? plural(a, 'mascota', 'mascotas') : ''].filter(Boolean).join(' y ');
}
function sincronizarMascotas() { estado.hogar.mascotas = animales() > 0; }
function condiciones() {
  const ints = estado.integrantes;
  return {
    electro: conObs('electro').length > 0,
    medicacion: conMedicacion().length > 0,
    bebes: ints.some((i) => i.tipo === 'bebe'),
    dieta: conObs('dieta').length > 0,
    anteojos: conObs('anteojos').length > 0,
    mascotas: animales() > 0
  };
}
// Lo que necesita la casa de cada cosa, según quiénes viven ahí.
// cant: número para comparar con lo que tienen (o null si es solo una guía).
function necesidad(e) {
  const p = personas(), d = dias();
  switch (e.por) {
    case 'persona':
      return p ? { cant: p, texto: `1 por persona: necesitan ${p}.` } : null;
    case 'agua': {
      const am = aguaMascotasDia();
      const porDia = p * 3 + am;
      if (!porDia) return null;
      const cant = Math.ceil(porDia * d);
      const detalle = [p ? '3 L por persona' : '', am ? `unos ${decimal(am)} L para las mascotas` : ''].filter(Boolean).join(' y ');
      return { cant, texto: `Para ${quienes()}: ${decimal(porDia)} L por día (${detalle}). Para ${d} días, ${cant} L.` };
    }
    case 'raciones': {
      // Los bebés y quienes tienen dieta especial tienen su propia línea.
      const aparte = estado.integrantes.filter((i) => i.tipo === 'bebe' || i.obs.includes('dieta'));
      const c = p - aparte.length;
      if (!c) return null;
      const cant = c * 3 * d;
      const nota = aparte.length ? ` (${listaNombres(aparte)} ${aparte.length === 1 ? 'va' : 'van'} aparte)` : '';
      return { cant, texto: `Para ${plural(c, 'persona', 'personas')}${nota}: 3 raciones por día cada una. Para ${d} días, ${cant} raciones.` };
    }
    case 'electro': {
      const n = conObs('electro').length;
      return n ? { cant: n, texto: `1 por persona electrodependiente: necesitan ${n}.` } : null;
    }
    case 'animal': {
      const n = estado.mascotas.reduce((s, m) => s + ((datoAnimal(m.animal)?.transporte ?? true) ? cantMascota(m) : 0), 0);
      return n ? { cant: n, texto: `1 por animal: necesitan ${n}.` } : null;
    }
    case 'bebe': {
      const n = estado.integrantes.filter((i) => i.tipo === 'bebe').length;
      return n ? { cant: null, texto: `Para ${plural(n, 'bebé', 'bebés')}: lo de ${d} días.` } : null;
    }
    case 'dieta': {
      const ints = conObs('dieta');
      if (!ints.length) return null;
      const cant = ints.length * 3 * d;
      return { cant, texto: `Para ${listaNombres(ints)}: 3 raciones por día. Para ${d} días, ${cant} raciones.` };
    }
    case 'mascotas': {
      const lista = listaAnimales();
      return lista ? { cant: null, texto: `Para ${lista}: lo que comen en ${d} días. El agua de las mascotas ya está sumada en Agua potable.` } : null;
    }
    case 'medicacion': {
      const ints = conMedicacion();
      return ints.length ? { cant: null, texto: `De 2 a 4 semanas de la medicación de ${listaNombres(ints)}.` } : null;
    }
    default:
      return null;
  }
}
const faltaTexto = (n, unidad) => `${n === 1 ? 'Falta' : 'Faltan'} ${decimal(n)} ${esc(unidad)}`;
// Cuánto falta para llegar a lo que necesitan. Solo si ya anotaron cuánto tienen.
function faltaDe(e) {
  const n = necesidad(e), r = registro(e.id);
  if (!n || !n.cant || !r.tengo || r.cantidad === null || r.cantidad === undefined) return 0;
  return Math.max(0, Math.ceil(n.cant - Number(r.cantidad)));
}
function elementos() {
  const c = condiciones();
  return [
    ...ELEMENTOS.filter((e) => !e.soloSi || c[e.soloSi]),
    ...estado.extras.map((x) => ({ ...x, unidad: x.unidad || 'u.', vence: true, extra: true }))
  ];
}
const registro = (id) => estado.inventario[id] || {};
function estadoElemento(e) {
  const r = registro(e.id);
  if (!r.tengo || e.saber) return { tipo: r.tengo ? 'ok' : 'falta', texto: '' };
  const h = hoy();
  if (r.vence) {
    if (r.vence <= h) return { tipo: 'renovar', texto: `Venció el ${fechaCorta(r.vence)}` };
    if (r.vence <= sumarDias(h, 30)) return { tipo: 'pronto', texto: `Vence el ${fechaCorta(r.vence)}` };
    return { tipo: 'ok', texto: `Vence el ${fechaCorta(r.vence)}` };
  }
  if (e.revisar && r.desde) {
    const rev = sumarMeses(r.desde, e.revisar);
    if (rev <= h) return { tipo: 'renovar', texto: 'Toca revisarlo' };
    return { tipo: 'ok', texto: `Revisarlo el ${fechaCorta(rev)}` };
  }
  return { tipo: 'ok', texto: '' };
}
function progresoDe(lista) {
  const n = lista.filter((e) => registro(e.id).tengo).length;
  return { n, total: lista.length, r: lista.length ? n / lista.length : 0 };
}
const progresoCat = (catId) => progresoDe(elementos().filter((e) => e.cat === catId));
const progresoInventario = () => progresoDe(elementos());
const paraRenovar = () => elementos().filter((e) => !e.saber && estadoElemento(e).tipo === 'renovar');
const faltantes = () => elementos().filter((e) => !e.saber && (!registro(e.id).tengo || estadoElemento(e).tipo === 'renovar' || faltaDe(e) > 0));
function hogarIniciado() {
  const h = estado.hogar;
  return personas() > 0 || !!(h.direccion || h.barrio) || INICIALES.some((id) => registro(id).tengo);
}
function progresoModulos() {
  const p = personas(), h = estado.hogar, pl = estado.plan, ms = estado.zona.marcadores;
  const comprables = elementos().filter((e) => !e.saber);
  const roles = Object.values(pl.roles).filter(Boolean).length;
  const grupos = new Set(estado.red.map((r) => r.grupo)).size;
  return {
    hogar: [p > 0, !!(h.direccion || h.barrio), INICIALES.some((id) => registro(id).tengo)].filter(Boolean).length / 3,
    familia: p ? estado.integrantes.reduce((s, i) => s + [i.edad !== '', i.grupo, i.contacto].filter(Boolean).length / 3, 0) / p : 0,
    inventario: progresoInventario().r,
    compras: comprables.length ? comprables.filter((e) => registro(e.id).tengo && estadoElemento(e).tipo !== 'renovar' && !faltaDe(e)).length / comprables.length : 0,
    plan: [pl.encuentro, pl.encuentroAlt, pl.rutas, roles >= 2].filter(Boolean).length / 4,
    red: [estado.red.length >= 1, estado.red.length >= 3, grupos >= 2].filter(Boolean).length / 3,
    zona: [ms.some((m) => m.tipo === 'casa'), ms.some((m) => m.tipo === 'encuentro'), ms.some((m) => m.tipo === 'riesgo' || m.tipo === 'servicio')].filter(Boolean).length / 3
  };
}
function direccionTexto() {
  const h = estado.hogar;
  return [h.direccion, h.entreCalles ? `entre ${h.entreCalles}` : '', h.barrio, h.localidad, h.provincia].filter(Boolean).join(', ');
}
function linkMapsDireccion() {
  const h = estado.hogar;
  const q = [h.direccion, h.barrio, h.localidad, h.provincia].filter(Boolean).join(', ');
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : '';
}
function textoMensaje(id) {
  const m = MENSAJES.find((x) => x.id === id) || MENSAJES[0];
  return m.texto.replace('{direccion}', direccionTexto() || 'casa').replace('{encuentro}', estado.plan.encuentro || 'el punto de encuentro');
}
// Teléfono para WhatsApp: formato internacional argentino (54 9 + área + número, sin 0 ni 15).
function telWhatsapp(tel) {
  let d = String(tel || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('54')) return d;
  d = d.replace(/^0/, '');
  if (d.length === 12) {
    for (const p of [2, 3, 4]) { if (d.slice(p, p + 2) === '15') { d = d.slice(0, p) + d.slice(p + 2); break; } }
  }
  return '549' + d;
}
const edadTexto = (i) => (i.edad !== '' && i.edad != null ? ` · ${i.edad} ${Number(i.edad) === 1 ? 'año' : 'años'}` : '');

/* =========================================================
   Pixel art: íconos e integrantes en pantalla ámbar
   ========================================================= */
const PAL = { R: '#ff5a1f', W: '#f4f3ef', Y: '#e5d23b', D: '#2b2b2e', T: '#3b3b3f', A: '#2b2b2e', G: '#2b2b2e', L: '#ff5a1f', H: '#3b3b3f', S: '#8a8a8d', C: '#ff5a1f', P: '#2b2b2e', B: '#2b2b2e' };
const ICONOS = {
  casa: ['.....RR.....', '....RRRR....', '...RRRRRR...', '..RRRRRRRR..', '.RRRRRRRRRR.', 'RRRRRRRRRRRR', '.WWWWWWWWWW.', '.WYYWWWWDDW.', '.WYYWWWWDDW.', '.WWWWWWWDDW.', '.WWWWWWWDDW.', '............'],
  cruz: ['............', '....LLLL....', '....LLLL....', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '.LLLLLLLLLL.', '....LLLL....', '....LLLL....', '............', 'TTTTTTTTTTTT', '............'],
  check: ['............', 'TTTTTTTT....', 'T......T..G.', 'T......T.GG.', 'T......TGG..', 'T.G...GGG...', 'T.GG.GGT....', 'T..GGG.T....', 'T...G..T....', 'TTTTTTTT....', '............', '............'],
  hoja: ['.WWWWWWW....', '.W.....WW...', '.W.YYY.WWW..', '.W.......W..', '.W.TTTTT.W..', '.W.......W..', '.W.TTTTT.W..', '.W.......W..', '.W.TTT...W..', '.W.......W..', '.WWWWWWWWW..', '............'],
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
const LCD_ROPAS = ['#ff9a3c', '#ffb866', '#e07a24'];
function hash(s) { let h = 0; for (const c of s) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; }
function paletaDe(i) {
  const h = hash(i.id);
  return { H: i.tipo === 'mayor' ? '#ffe2bd' : '#c4651f', S: '#ffd29a', C: LCD_ROPAS[(h >>> 6) % LCD_ROPAS.length], P: '#8a4514', B: '#5a2c0c' };
}
function sprite(ctx, filas, x, y, pal) {
  for (let j = 0; j < filas.length; j++) {
    for (let i = 0; i < filas[j].length; i++) {
      const k = filas[j][i];
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

/* =========================================================
   Vistas
   ========================================================= */
const MODULOS = [
  { id: 'hogar', nombre: 'Mi hogar', desc: 'Quiénes, dónde y qué tienen' },
  { id: 'familia', nombre: 'Familia', desc: 'Una ficha por persona' },
  { id: 'inventario', nombre: 'Inventario', desc: 'Cuánto hay y hasta cuándo' },
  { id: 'compras', nombre: 'Compras', desc: 'Lo que falta conseguir' },
  { id: 'plan', nombre: 'Mi plan', desc: 'Quién hace qué' },
  { id: 'red', nombre: 'Red', desc: 'Contactos para escribir' },
  { id: 'zona', nombre: 'Mi zona', desc: 'Mapa del barrio' },
  { id: 'tutoriales', nombre: 'Tutoriales', desc: 'Aprender haciendo', sinProgreso: true },
  { id: 'emergencia', nombre: 'SOS', desc: 'Luz, silbato, números', sinProgreso: true, sos: true }
];
const CODIGOS = ['1', '2', '3', '4', '5', '6', '7', '8', '✚'];

function cabeza(rotulo, titulo, intro) {
  return `<section class="cabeza"><p class="rotulo">${rotulo}</p><h2>${titulo}</h2>${intro ? `<p class="intro">${intro}</p>` : ''}</section>`;
}

/* ---------- inicio ---------- */
function verInicio() {
  const p = progresoModulos();
  const valores = Object.values(p);
  const total = valores.reduce((a, b) => a + b, 0) / valores.length;
  const pct = Math.round(total * 100);
  const inv = progresoInventario();
  const renovar = paraRenovar().length;
  const ultima = estado.revision.ultima;
  const proxima = ultima ? sumarMeses(ultima, 3) : null;
  const toca = !proxima || proxima <= hoy();
  const nRed = estado.red.length;
  return `
  <section class="panel consola" aria-label="Barrio Listo">
    <div class="consola-tope"><span class="rejilla" aria-hidden="true"></span></div>
    <div class="consola-cuerpo">
      <div class="pantalla-lcd titulo-lcd">
        <h1 class="titulo-grande">Barrio<br>Listo</h1>
        <div class="lcd-fila"><span class="lcd-lema"><span class="parpadeo" aria-hidden="true">▶</span> NADIE SE SALVA SOLO</span><span class="lcd-texto">${pct}%</span></div>
      </div>
      <div class="controles">
        <div class="grupo-corchete">
          <span class="corchete-titulo">TU RED</span>
          <a class="perilla" href="#red" aria-label="Abrir tu red: ${plural(nRed, 'contacto', 'contactos')}"><span></span></a>
          <span class="etiqueta">${plural(nRed, 'contacto', 'contactos')}</span>
        </div>
        <div class="medidor-caja">
          <span class="etiqueta">Avance</span>
          <div class="medidor" role="meter" aria-label="Avance de la preparación" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--nivel-n:${total.toFixed(3)}"><i></i><b></b></div>
        </div>
        <div class="estado-lcd pantalla-lcd">
          <span>INVENTARIO</span>
          <strong>${inv.n}/${inv.total}</strong>
          <span>${renovar ? `${renovar} PARA RENOVAR` : 'TODO AL DÍA'}</span>
        </div>
      </div>
    </div>
  </section>
  ${!hogarIniciado() ? `<a class="panel cta" href="#hogar"><span class="rotulo">Para empezar</span><h3>Cargá tu hogar</h3><p>Quiénes son, dónde viven y qué ya tienen en casa. Se completa de a poco, a tu ritmo.</p></a>` : ''}
  ${renovar ? `<a class="panel alerta-panel" href="#inventario"><span class="rotulo">Para renovar</span><h3>${renovar === 1 ? 'Hay 1 cosa para renovar' : `Hay ${renovar} cosas para renovar`}</h3><p>Nada urgente: sumalo a la próxima compra.</p></a>` : ''}
  <p class="rotulo">Elegí tu módulo</p>
  <div class="teclado">
    ${MODULOS.map((m, n) => `<a class="tecla-doble${m.sos ? ' sos' : ''}" href="#${m.id}"><span class="tecla-leds">${m.sinProgreso ? '<span class="leds"><i class="led"></i></span>' : monedas(p[m.id])}</span><span class="tecla-sup"><span class="tecla-cod">${CODIGOS[n]}</span>${m.nombre}</span><span class="tecla-inf">${m.desc}</span></a>`).join('')}
  </div>
  <div class="panel">
    <h3>Repaso cada 2 o 3 meses</h3>
    <p>${ultima ? `El último fue el ${fechaCorta(ultima)}. ${toca ? '<b>Ya se puede hacer el próximo.</b>' : `El próximo, desde el ${fechaCorta(proxima)}.`}` : 'Un repaso tranquilo del inventario: vencimientos, pilas, agua y teléfonos.'}</p>
    <div class="fila"><button type="button" class="boton${toca ? ' primario' : ''}" data-accion="revision">Hicimos el repaso hoy</button></div>
  </div>
  <p class="nota"><a href="#ajustes">Ajustes y copia de seguridad</a> · <a href="../">Ir a la versión 1</a> · Prototipo. El contenido sale del curso de preparacionismo comunitario y hay que validarlo con protección civil y salud.</p>`;
}

/* ---------- mi hogar ---------- */
function formSumar() {
  return `<form class="fila" data-form="sumar-integrante" autocomplete="off">
    <label class="campo" style="flex:2 1 150px">Nombre<input type="text" name="nombre" required maxlength="40" placeholder="Ej.: Ana"></label>
    <label class="campo" style="flex:1 1 130px">Quién es<select name="tipo">${Object.entries(TIPOS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></label>
    <label class="campo" style="flex:0 1 90px">Edad<input type="number" name="edad" min="0" max="120" inputmode="numeric" placeholder="Años"></label>
    <button type="submit" class="boton primario" style="align-self:end">Sumar</button>
  </form>`;
}
// Un renglón por animal: qué es, cuántos, edad y observaciones.
function bloqueMascotas(enPanel) {
  const ms = estado.mascotas;
  const fila = (m) => `<div class="mascota-fila">
      <label class="campo chico m-animal">Animal<select data-mcampo="animal" data-id="${m.id}">${m.animal ? '' : '<option value="" selected>Elegí</option>'}${ANIMALES.map((a) => `<option value="${a.id}" ${a.id === m.animal ? 'selected' : ''}>${a.nombre}</option>`).join('')}</select></label>
      <label class="campo chico m-cantidad">Cantidad<input type="number" min="1" max="50" inputmode="numeric" data-mcampo="cantidad" data-id="${m.id}" value="${esc(m.cantidad)}"></label>
      <label class="campo chico m-edad">Edad<input type="text" maxlength="20" data-mcampo="edad" data-id="${m.id}" value="${esc(m.edad)}" placeholder="Ej.: 4 años"></label>
      <label class="campo chico m-obs">Observaciones<input type="text" maxlength="120" data-mcampo="obs" data-id="${m.id}" value="${esc(m.obs)}" placeholder="Ej.: toma medicación, se asusta con los truenos"></label>
      <button type="button" class="boton chico m-quitar" data-accion="quitar-mascota" data-id="${m.id}">Quitar</button>
    </div>`;
  return `<div class="mascotas">
    ${enPanel ? '<h3>Mascotas</h3>' : '<span class="campo-titulo">Mascotas</span>'}
    ${ms.length ? ms.map(fila).join('') : '<p class="nota">Si tienen animales, sumá un renglón por cada tipo.</p>'}
    <div class="fila"><button type="button" class="boton chico" data-accion="sumar-mascota">+ Sumar una mascota</button></div>
  </div>`;
}
function verHogar() {
  const h = estado.hogar, p = personas();
  const campo = (k, etiqueta, ph) => `<label class="campo">${etiqueta}<input type="text" data-campo="hogar.${k}" value="${esc(h[k])}" placeholder="${ph}" maxlength="120" autocomplete="off"></label>`;
  const pr = progresoInventario();
  const mapa = linkMapsDireccion();
  return `
  ${cabeza('Módulo 1', 'Mi hogar', 'Quiénes son, dónde viven y qué ya tienen en casa. Con eso se arman el inventario y la lista de compras. Se completa de a poco.')}
  <div class="panel">
    <h3>1 · Quiénes son</h3>
    ${p ? `<ul class="limpia">${estado.integrantes.map((i) => `<li class="integrante-fila"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas><span><b>${esc(i.nombre)}</b> · ${TIPOS[i.tipo]}${edadTexto(i)}</span><button type="button" class="boton chico" data-accion="quitar-integrante" data-id="${i.id}">Quitar</button></li>`).join('')}</ul>` : '<p class="nota">Todavía no sumaste a nadie. Empezá por vos.</p>'}
    ${formSumar()}
    <p class="nota">La salud y las observaciones de cada uno se completan en <a href="#familia">Familia</a>.</p>
    ${bloqueMascotas()}
  </div>
  <div class="panel">
    <h3>2 · Dónde viven</h3>
    <div class="dos">
      ${campo('direccion', 'Calle y número', 'Ej.: Av. San Martín 1234')}
      ${campo('entreCalles', 'Entre calles', 'Ej.: Belgrano y Moreno')}
      ${campo('barrio', 'Barrio', 'Ej.: Villa Crespo')}
      ${campo('localidad', 'Localidad o partido', 'Ej.: CABA')}
      ${campo('provincia', 'Provincia', 'Ej.: Buenos Aires')}
      ${campo('referencia', 'Referencia', 'Ej.: portón verde, casa del fondo')}
    </div>
    <div class="fila"><a class="boton chico" id="ver-direccion" href="${mapa || '#hogar'}" target="_blank" rel="noopener" ${mapa ? '' : 'hidden'}>Ver en Google Maps ↗</a><a class="boton chico" href="#zona">Marcar en Mi zona</a></div>
    <p class="nota">Sirve para decir dónde están si hay que pedir ayuda. Queda guardado solo en este teléfono.</p>
  </div>
  <div class="panel">
    <h3>3 · Qué ya tienen en casa</h3>
    <p class="nota">Tocá lo que ya tienen. Las cantidades y los vencimientos se anotan después en el inventario.</p>
    <div class="grilla-tengo">${INICIALES.map((id) => {
      const e = ELEMENTOS.find((x) => x.id === id);
      const t = !!registro(id).tengo;
      return `<button type="button" class="tecla-tengo" data-accion="tengo" data-id="${id}" aria-pressed="${t}"><i class="led${t ? ' on' : ''}" aria-hidden="true"></i><span>${e.corto}</span></button>`;
    }).join('')}</div>
  </div>
  <div class="panel">
    <h3>Cómo vienen</h3>
    <p>Tienen <b>${pr.n} de ${pr.total}</b> cosas de la lista.</p>
    <ul class="limpia">${CATEGORIAS.map((cat) => { const c = progresoCat(cat.id); return c.total ? `<li class="orden-fila"><a href="#inventario" data-accion="ir-cat" data-cat="${cat.id}">${cat.nombre}</a><span class="nota">${c.n} de ${c.total}</span><div class="mini-barra"><i style="width:${Math.round(c.r * 100)}%"></i></div></li>` : ''; }).join('')}</ul>
    <div class="fila"><a class="boton primario" href="#inventario">Ir al inventario</a><a class="boton" href="#compras">Qué falta conseguir</a></div>
  </div>`;
}
function actualizarLinkDireccion() {
  const a = document.getElementById('ver-direccion');
  if (!a) return;
  const url = linkMapsDireccion();
  a.hidden = !url;
  a.href = url || '#hogar';
}

/* ---------- familia ---------- */
let familiaSel = null;
let obsEdicion = [];
function verFamilia() {
  const ints = estado.integrantes;
  const intro = 'Una ficha por persona, con lo que hace falta saber para cuidarse entre todos. Queda guardada solo en este teléfono.';
  if (!ints.length) return `${cabeza('Módulo 2', 'Familia', intro)}<div class="panel"><h3>Todavía no hay nadie</h3><p>Sumá a cada persona de la casa. Después completás su ficha.</p>${formSumar()}</div><div class="panel">${bloqueMascotas(true)}</div>`;
  const sel = ints.find((i) => i.id === familiaSel) || ints[0];
  familiaSel = sel.id;
  const lleva = ints.find((i) => i.id === sel.mochila);
  const completo = [sel.edad !== '', sel.grupo, sel.contacto].filter(Boolean).length / 3;
  const dato = (etiqueta, valor) => `<div><span>${etiqueta}:</span> ${valor ? esc(valor) : '—'}</div>`;
  return `
  ${cabeza('Módulo 2', 'Familia', intro)}
  <div class="panel pantalla-sel">
    <div class="pantalla">
      <canvas class="grande" width="7" height="13" data-avatar="${sel.id}" aria-hidden="true"></canvas>
      <div style="display:grid;gap:8px;min-width:0">
        <p class="rotulo">Elegí la persona</p>
        <p class="nombre">${esc(sel.nombre.toUpperCase())}</p>
        <div class="ficha">
          <div><span>Quién es:</span> ${TIPOS[sel.tipo]}${edadTexto(sel)}</div>
          ${dato('Grupo y factor', sel.grupo)}
          ${dato('Alergias', sel.alergias)}
          ${dato('Medicación', sel.medicacion)}
          ${dato('Obra social', sel.obraSocial)}
          ${dato('Contacto', sel.contacto)}
          ${dato('Su mochila la lleva', lleva ? lleva.nombre : '')}
          ${sel.notas ? dato('Notas', sel.notas) : ''}
        </div>
        ${sel.obs.length ? `<div class="obs-ficha">${sel.obs.map((o) => `<span class="chip-lcd">${esc(nombreObs(o))}</span>`).join('')}</div>` : ''}
        <div class="fila">${monedas(completo)}<button type="button" class="boton primario chico" data-accion="editar-integrante" data-id="${sel.id}">Editar ficha</button></div>
      </div>
    </div>
  </div>
  <div class="selector" role="group" aria-label="Personas">
    ${ints.map((i) => `<button type="button" data-accion="elegir-integrante" data-id="${i.id}" aria-pressed="${i.id === sel.id}"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas>${esc(i.nombre)}</button>`).join('')}
  </div>
  <div class="panel"><h3>Sumar a alguien</h3>${formSumar()}</div>
  <div class="panel">${bloqueMascotas(true)}</div>`;
}
function chipsObs() {
  return obsEdicion.length
    ? obsEdicion.map((o) => `<span class="chip-obs">${esc(nombreObs(o))}<button type="button" data-obs-quitar="${o}" aria-label="Quitar ${esc(nombreObs(o))}">×</button></span>`).join('')
    : '<span class="nota">Sin observaciones. Elegí de la lista para sumar.</span>';
}
function opcionesObs() {
  return `<option value="">+ Sumar una observación</option>${OBSERVACIONES.filter((o) => !obsEdicion.includes(o.id)).map((o) => `<option value="${o.id}">${o.nombre}</option>`).join('')}`;
}
function redibujarObs() {
  const l = dialogo.querySelector('#obs-lista');
  const s = dialogo.querySelector('[data-obs-select]');
  if (l) l.innerHTML = chipsObs();
  if (s) s.innerHTML = opcionesObs();
}
function abrirEdicion(id) {
  const i = estado.integrantes.find((x) => x.id === id);
  if (!i) return;
  obsEdicion = [...i.obs];
  const op = (valor, texto, actual) => `<option value="${esc(valor)}" ${valor === actual ? 'selected' : ''}>${esc(texto)}</option>`;
  dialogo.innerHTML = `
  <form data-dialogo="integrante" data-id="${i.id}">
    <h2 id="dialogo-titulo">Ficha de ${esc(i.nombre)}</h2>
    <div class="dos">
      <label class="campo">Nombre<input type="text" name="nombre" value="${esc(i.nombre)}" required maxlength="40"></label>
      <label class="campo">Quién es<select name="tipo">${Object.entries(TIPOS).map(([k, v]) => op(k, v, i.tipo)).join('')}</select></label>
      <label class="campo">Edad<input type="number" name="edad" min="0" max="120" inputmode="numeric" value="${esc(i.edad)}" placeholder="Años"></label>
      <label class="campo">Grupo y factor<select name="grupo">${GRUPOS.map((g) => op(g, g || 'Elegí', i.grupo)).join('')}</select></label>
      <label class="campo">Teléfono de contacto<input type="tel" name="contacto" value="${esc(i.contacto)}" maxlength="30"></label>
      <label class="campo">Obra social<input type="text" name="obraSocial" value="${esc(i.obraSocial)}" maxlength="60"></label>
      <label class="campo">Su mochila la lleva<select name="mochila">${op('', 'Sin definir', i.mochila)}${estado.integrantes.map((o) => op(o.id, o.nombre, i.mochila)).join('')}</select></label>
    </div>
    <div class="campo-obs">
      <span class="campo-titulo">Observaciones</span>
      <div class="obs-lista" id="obs-lista">${chipsObs()}</div>
      <select data-obs-select aria-label="Sumar una observación">${opcionesObs()}</select>
    </div>
    <label class="campo">Alergias<input type="text" name="alergias" value="${esc(i.alergias)}" maxlength="120" placeholder="Ej.: penicilina"></label>
    <label class="campo">Medicación<input type="text" name="medicacion" value="${esc(i.medicacion)}" maxlength="160" placeholder="Qué toma y cada cuánto"></label>
    <label class="campo">Notas<textarea name="notas" maxlength="400" placeholder="Lo que haga falta saber para acompañar a esta persona">${esc(i.notas)}</textarea></label>
    <div class="fila"><button type="submit" class="boton primario">Guardar</button><button type="button" class="boton" data-cerrar>Cancelar</button><button type="button" class="boton peligro" data-quitar="${i.id}">Quitar</button></div>
  </form>`;
  dialogo.showModal();
}
function quitarIntegrante(id) {
  estado.integrantes = estado.integrantes.filter((i) => i.id !== id);
  for (const i of estado.integrantes) if (i.mochila === id) i.mochila = '';
  for (const k of Object.keys(estado.plan.roles)) if (estado.plan.roles[k] === id) estado.plan.roles[k] = '';
  if (familiaSel === id) familiaSel = null;
  guardar();
  refrescar();
}

/* ---------- inventario ---------- */
let irACat = null;
function notaAgua(r) {
  const porDia = personas() * 3 + aguaMascotasDia();
  if (!porDia || !(Number(r.cantidad) > 0)) return '';
  const d = Math.floor(Number(r.cantidad) / porDia);
  return `Con ${decimal(Number(r.cantidad))} L tienen agua para ${d < 1 ? 'menos de un día' : plural(d, 'día', 'días')}.`;
}
function chipsElemento(e) {
  const r = registro(e.id);
  const st = estadoElemento(e);
  const nec = e.saber ? null : necesidad(e);
  const falta = faltaDe(e);
  return [
    st.texto ? `<span class="chip ${st.tipo}">${st.texto}</span>` : '',
    nec && nec.cant && r.tengo && r.cantidad !== null && r.cantidad !== undefined
      ? (falta ? `<span class="chip pronto">${faltaTexto(falta, e.unidad)}</span>` : '<span class="chip ok">Alcanza</span>')
      : ''
  ].filter(Boolean).join('');
}
const paraCompletar = () => elementos().filter((e) => !e.saber && faltaDe(e) > 0).length;
// Al cambiar una cantidad se actualizan solo los textos, sin redibujar los campos.
function actualizarCuenta(id) {
  const e = elementos().find((x) => x.id === id);
  if (!e) return;
  const c = vista.querySelector(`[data-chips="${CSS.escape(id)}"]`);
  if (c) c.innerHTML = chipsElemento(e);
  if (id === 'agua-litros') { const n = vista.querySelector('[data-nota-agua]'); if (n) n.textContent = notaAgua(registro(id)); }
  const pc = document.getElementById('para-completar');
  if (pc) {
    const n = paraCompletar();
    pc.textContent = n;
    pc.nextElementSibling.textContent = n ? 'Tienen algo, pero no alcanza para todos.' : 'Lo que anotaron alcanza.';
  }
}
function filaElemento(e) {
  const r = registro(e.id);
  const nec = e.saber ? null : necesidad(e);
  const chip = `<span class="chips" data-chips="${e.id}">${chipsElemento(e)}</span>`;
  const necTexto = nec ? `<span class="nota necesidad">${esc(nec.texto)}</span>` : '';
  const agua = e.id === 'agua-litros' && r.tengo ? `<span class="nota" data-nota-agua>${notaAgua(r)}</span>` : '';
  const quitar = e.extra ? `<button type="button" class="boton chico" data-accion="quitar-extra" data-id="${e.id}">Quitar</button>` : '';
  const datos = r.tengo && !e.saber
    ? `<div class="elemento-datos">
        <label class="campo chico">Cantidad<span class="con-unidad"><input type="number" min="0" step="any" inputmode="decimal" data-cantidad="${e.id}" value="${r.cantidad ?? ''}"><span>${nec && nec.cant ? `de ${nec.cant} ${esc(e.unidad)}` : esc(e.unidad)}</span></span></label>
        ${e.vence ? `<label class="campo chico">Vence<input type="date" data-vence="${e.id}" value="${r.vence || ''}"></label>` : ''}
        ${quitar}
      </div>`
    : (quitar ? `<div class="elemento-datos">${quitar}</div>` : '');
  return `<div class="elemento">
    <label class="paso"><input type="checkbox" data-tengo="${e.id}" ${r.tengo ? 'checked' : ''}><span class="paso-texto"><span>${esc(e.nombre)}</span>${necTexto}${e.ref ? `<span class="nota">${esc(e.ref)}</span>` : ''}${agua}${chip}</span></label>
    ${datos}
  </div>`;
}
function verInventario() {
  const pr = progresoInventario();
  const ren = paraRenovar();
  const completar = paraCompletar();
  const q = quienes();
  return `
  ${cabeza('Módulo 3', 'Inventario', 'Lo que tienen, cuánto y hasta cuándo. Las cantidades se ajustan solas a quiénes viven en la casa. Anotá los vencimientos: la app te avisa con tiempo cuando algo conviene renovarse.')}
  <div class="panel">
    <h3>Para quiénes se calcula</h3>
    <p>${q ? `<b>${q}</b>${estado.mascotas.length ? ` (${esc(listaAnimales())})` : ''}.` : 'Todavía no cargaste a nadie.'} <a href="#hogar">${q ? 'Cambiar' : 'Cargar en Mi hogar'}</a></p>
    <label class="campo">Agua y comida para<select data-campo="hogar.diasReserva">${DIAS_RESERVA.map((n) => `<option value="${n}" ${n === dias() ? 'selected' : ''}>${n} días</option>`).join('')}</select></label>
    <p class="nota">Es una referencia para hacer las cuentas, no un plazo. Cuando sumás o sacás a alguien, lo que necesitan de cada cosa se recalcula.</p>
  </div>
  <div class="resumen">
    <div class="panel"><span class="rotulo">Tienen</span><span class="dato-grande">${pr.n}/${pr.total}</span></div>
    <div class="panel"><span class="rotulo">Para completar</span><span class="dato-grande" id="para-completar">${completar}</span><span class="nota">${completar ? 'Tienen algo, pero no alcanza para todos.' : 'Lo que anotaron alcanza.'}</span></div>
    <div class="panel"><span class="rotulo">Para renovar</span><span class="dato-grande">${ren.length}</span><span class="nota">${ren.length ? 'Sumalo a la próxima compra.' : 'Todo al día.'}</span></div>
  </div>
  ${CATEGORIAS.map((cat) => {
    const els = elementos().filter((e) => e.cat === cat.id);
    if (!els.length) return '';
    const c = progresoDe(els);
    return `<article class="panel" id="cat-${cat.id}">
      <div class="cat-tope"><canvas width="12" height="12" data-icono="${cat.icono}" aria-hidden="true"></canvas><h3>${cat.nombre}</h3><div class="cat-cuenta"><span>${c.n}/${c.total}</span>${monedas(c.r)}</div></div>
      ${els.map(filaElemento).join('')}
    </article>`;
  }).join('')}
  <div class="panel">
    <h3>Sumar otra cosa</h3>
    <form class="dos" data-form="sumar-extra" autocomplete="off">
      <label class="campo">Qué es<input type="text" name="nombre" required maxlength="60" placeholder="Ej.: repelente"></label>
      <label class="campo">Dónde va<select name="cat">${CATEGORIAS.filter((c) => c.id !== 'saberes').map((c) => `<option value="${c.id}">${c.nombre}</option>`).join('')}</select></label>
      <button type="submit" class="boton" style="align-self:end">Sumar</button>
    </form>
  </div>`;
}
function montarInventario() {
  if (!irACat) return;
  const el = document.getElementById(`cat-${irACat}`);
  irACat = null;
  if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 80);
}
function alternarTengo(id, valor) {
  const r = registro(id);
  estado.inventario[id] = { ...r, tengo: valor, desde: valor ? (r.desde || hoy()) : r.desde };
  guardar();
}

/* ---------- compras ---------- */
function sugerencia(e) {
  const falta = faltaDe(e);
  const nec = necesidad(e);
  if (falta) return `${faltaTexto(falta, e.unidad)}: necesitan ${nec.cant} y tienen ${decimal(Number(registro(e.id).cantidad))}.`;
  if (nec) return nec.texto;
  return e.ref || '';
}
function faltaGastar(lista) {
  return lista.reduce((s, e) => s + (Number(estado.compras[e.id]?.precio) || 0), 0);
}
function verCompras() {
  const lista = faltantes();
  if (!lista.length) {
    return `${cabeza('Módulo 4', 'Compras')}<div class="panel"><h3>No falta nada de la lista</h3><p>Todo lo del inventario está y al día. Si querés sumar algo, hacelo desde el <a href="#inventario">inventario</a>.</p></div>`;
  }
  return `
  ${cabeza('Módulo 4', 'Compras', 'Lo que todavía no tienen o conviene renovar. De a poco, "un paquete más" cada vez; lo caro se puede comprar entre vecinos.')}
  <div class="resumen">
    <div class="panel"><span class="rotulo">Para conseguir</span><span class="dato-grande">${lista.length}</span></div>
    <div class="panel"><span class="rotulo">Presupuesto</span><span class="dato-grande" id="falta-gastar">${pesos(faltaGastar(lista))}</span><span class="nota">Según los precios que cargues</span></div>
  </div>
  ${CATEGORIAS.map((cat) => {
    const items = lista.filter((e) => e.cat === cat.id);
    if (!items.length) return '';
    return `<article class="panel"><h3>${cat.nombre}</h3><ul class="limpia">${items.map((e) => {
      const renovar = registro(e.id).tengo && estadoElemento(e).tipo === 'renovar';
      const url = e.buscar ? `https://listado.mercadolibre.com.ar/${encodeURIComponent(e.buscar.replace(/\s+/g, '-'))}` : null;
      const sug = sugerencia(e);
      return `<li class="compra solo"><div class="compra-cuerpo">
        <span><b>${esc(e.nombre)}</b>${renovar ? ' <span class="chip renovar">Para renovar</span>' : ''}${faltaDe(e) ? ' <span class="chip pronto">Para completar</span>' : ''}</span>
        ${sug ? `<span class="compra-cant">${esc(sug)}</span>` : ''}
        <div class="compra-fila">
          <input type="number" inputmode="numeric" min="0" step="1" placeholder="Precio $" data-precio="${e.id}" value="${estado.compras[e.id]?.precio ?? ''}" aria-label="Precio de ${esc(e.nombre)}">
          ${url ? `<a href="${url}" target="_blank" rel="noopener">Buscar en Mercado Libre ↗</a>` : '<span class="nota">En la farmacia o a mano</span>'}
          <button type="button" class="boton chico" data-accion="ya-lo-tengo" data-id="${e.id}">Ya lo tengo</button>
        </div>
      </div></li>`;
    }).join('')}</ul></article>`;
  }).join('')}
  <div class="panel">
    <h3>Comprar en grupo</h3>
    <p>Lo caro se comparte y al mayorista sale más barato. Copiá la lista y pasásela a tu red.</p>
    <div class="fila"><button type="button" class="boton primario" data-accion="copiar-compras">Copiar la lista</button><a class="boton" href="#red">Ir a mi red</a></div>
  </div>`;
}
async function copiarCompras() {
  const cuanto = (e) => {
    const falta = faltaDe(e), nec = necesidad(e);
    if (falta) return ` (${faltaTexto(falta, e.unidad).toLowerCase()})`;
    if (nec && nec.cant && !registro(e.id).tengo) return ` (${nec.cant} ${e.unidad})`;
    return '';
  };
  const texto = `Lista de compras para estar preparados:\n${faltantes().map((e) => `- ${e.nombre}${cuanto(e)}`).join('\n')}`;
  try { await navigator.clipboard.writeText(texto); aviso('Lista copiada'); }
  catch (e) {
    if (navigator.share) { try { await navigator.share({ text: texto }); } catch (err) { /* cancelado */ } }
    else aviso('No se pudo copiar en este navegador');
  }
}

/* ---------- plan y hoja ---------- */
function verPlan() {
  const pl = estado.plan, ints = estado.integrantes;
  const texto = (k, etiqueta, ph) => `<label class="campo">${etiqueta}<input type="text" data-campo="plan.${k}" value="${esc(pl[k])}" placeholder="${ph}" maxlength="120"></label>`;
  return `
  ${cabeza('Módulo 5', 'Mi plan', 'Dónde se encuentran, por dónde salen y quién hace qué. Una tarea concreta para cada persona, como en el PAS.')}
  <div class="panel">
    <h3>Dónde nos encontramos</h3>
    ${texto('encuentro', 'Punto de encuentro cerca de casa', 'Ej.: la esquina de la plaza')}
    ${texto('encuentroAlt', 'Punto alternativo, fuera del barrio', 'Ej.: la casa de un familiar en otro barrio')}
    <label class="campo">Rutas de salida<textarea data-campo="plan.rutas" maxlength="600" placeholder="Dos caminos distintos, lejos de zonas que se inundan, estaciones de servicio y cables de alta tensión">${esc(pl.rutas)}</textarea></label>
    <p class="nota">Marcalos también en <a href="#zona">Mi zona</a>.</p>
  </div>
  <div class="panel">
    <h3>Quién hace qué</h3>
    ${ints.length ? ROLES_PLAN.map((rol, n) => `<label class="campo">${rol}<select data-rol="${n}"><option value="">Sin asignar</option>${ints.map((i) => `<option value="${i.id}" ${pl.roles[n] === i.id ? 'selected' : ''}>${esc(i.nombre)}</option>`).join('')}</select></label>`).join('') : '<p class="nota">Primero sumá a las personas en <a href="#hogar">Mi hogar</a>.</p>'}
  </div>
  <div class="panel">
    <h3>A quién avisar</h3>
    <p>Los contactos para avisar están en tu <a href="#red">Red</a> (${plural(estado.red.length, 'contacto', 'contactos')}).</p>
  </div>
  <div class="fila"><a class="boton primario" href="#hoja">Ver la hoja para imprimir</a></div>`;
}
function verHoja() {
  const pl = estado.plan, ints = estado.integrantes;
  const nombreDe = (id) => esc(ints.find((i) => i.id === id)?.nombre || '');
  const dir = direccionTexto();
  return `
  <div class="fila no-imprimir"><a class="boton" href="#plan">Volver</a><button type="button" class="boton primario" data-accion="imprimir">Imprimir</button></div>
  <article class="hoja">
    <h2>Plan familiar</h2>
    <p>Actualizado el ${fechaCorta(hoy())}. Para la heladera y para la carpeta.</p>
    <h3>Dónde vivimos</h3>
    <p>${esc(dir) || '—'}${estado.hogar.referencia ? `<br>${esc(estado.hogar.referencia)}` : ''}</p>
    <h3>Quiénes somos</h3>
    <div class="hoja-caja"><table>
      <thead><tr><th>Nombre</th><th>Edad</th><th>Grupo</th><th>Observaciones</th><th>Alergias y medicación</th><th>Contacto</th></tr></thead>
      <tbody>${ints.map((i) => `<tr><td>${esc(i.nombre)}</td><td>${esc(i.edad)}</td><td>${esc(i.grupo)}</td><td>${i.obs.map((o) => esc(nombreObs(o))).join(', ')}</td><td>${[i.alergias, i.medicacion].filter(Boolean).map(esc).join(' · ')}</td><td>${esc(i.contacto)}</td></tr>`).join('') || '<tr><td colspan="6">Sin personas cargadas</td></tr>'}</tbody>
    </table></div>
    ${estado.mascotas.length ? `<h3>Mascotas</h3>
    <div class="hoja-caja"><table>
      <thead><tr><th>Animal</th><th>Cantidad</th><th>Edad</th><th>Observaciones</th></tr></thead>
      <tbody>${estado.mascotas.map((m) => `<tr><td>${esc(datoAnimal(m.animal)?.nombre || 'Mascota')}</td><td>${cantMascota(m)}</td><td>${esc(m.edad)}</td><td>${esc(m.obs)}</td></tr>`).join('')}</tbody>
    </table></div>` : ''}
    <h3>Dónde nos encontramos</h3>
    <p><b>Cerca de casa:</b> ${esc(pl.encuentro) || '—'}<br><b>Fuera del barrio:</b> ${esc(pl.encuentroAlt) || '—'}</p>
    <p><b>Rutas de salida:</b> ${esc(pl.rutas) || '—'}</p>
    <h3>Quién hace qué</h3>
    <ul>${ROLES_PLAN.map((r, n) => `<li>${r}: <b>${nombreDe(pl.roles[n]) || 'sin asignar'}</b></li>`).join('')}</ul>
    <h3>Teléfonos</h3>
    <p>${NUMEROS.map((n) => `${n.nombre}: <b>${n.num}</b>`).join(' · ')}</p>
    ${estado.red.length ? `<p>${estado.red.map((c) => `${esc(c.nombre)}: <b>${esc(c.tel)}</b>`).join(' · ')}</p>` : ''}
    <h3>Qué hacer</h3>
    ${PROTOCOLOS.map((a) => `<p><b>${a.nombre}.</b> ${a.pasos.slice(0, 4).join(' ')}</p>`).join('')}
  </article>`;
}

/* ---------- red ---------- */
let filtroRed = 'todos';
let msgSel = 'consulta';
const nombreGrupo = (id) => GRUPOS_RED.find((g) => g.id === id)?.nombre || 'Otros';
function verRed() {
  const lista = estado.red.filter((c) => filtroRed === 'todos' || c.grupo === filtroRed);
  const agenda = 'contacts' in navigator && navigator.contacts && 'select' in navigator.contacts;
  return `
  ${cabeza('Módulo 6', 'Red', 'Las personas con las que te organizás: familia, vecinos, la brigada. No es una red social: es tu lista de contactos para escribirles directo por WhatsApp o por mensaje de texto.')}
  <div class="panel">
    <h3>Mensaje</h3>
    <label class="campo">Elegí un mensaje armado<select data-mensaje-sel>${MENSAJES.map((m) => `<option value="${m.id}" ${m.id === msgSel ? 'selected' : ''}>${m.nombre}</option>`).join('')}</select></label>
    <label class="campo">Texto (lo podés cambiar)<textarea id="mensaje-red" maxlength="500">${esc(textoMensaje(msgSel))}</textarea></label>
    <div class="fila"><button type="button" class="boton primario" data-accion="mensaje-grupo" data-via="wa">Mandar a un grupo de WhatsApp</button><button type="button" class="boton" data-accion="mensaje-grupo" data-via="sms">Por SMS</button></div>
  </div>
  <div class="tipos" role="group" aria-label="Filtrar contactos">
    ${[{ id: 'todos', nombre: 'Todos' }, ...GRUPOS_RED].map((g) => `<button type="button" data-accion="filtro-red" data-grupo="${g.id}" aria-pressed="${g.id === filtroRed}">${g.nombre}</button>`).join('')}
  </div>
  <div class="panel">
    <h3>Contactos (${lista.length})</h3>
    ${lista.length ? `<ul class="limpia">${lista.map((c) => `<li class="contacto">
      <div class="contacto-datos"><b>${esc(c.nombre)}</b> <span class="chip">${nombreGrupo(c.grupo)}</span>${c.barrio ? `<span class="nota">${esc(c.barrio)}</span>` : ''}${c.nota ? `<span class="nota">${esc(c.nota)}</span>` : ''}<span class="nota">${esc(c.tel)}</span></div>
      <div class="contacto-acciones">
        <button type="button" class="boton chico primario" data-accion="mensaje" data-via="wa" data-id="${c.id}">WhatsApp</button>
        <button type="button" class="boton chico" data-accion="mensaje" data-via="sms" data-id="${c.id}">SMS</button>
        <a class="boton chico" href="tel:${esc(String(c.tel).replace(/[^\d+]/g, ''))}">Llamar</a>
        <button type="button" class="boton chico peligro" data-accion="quitar-contacto" data-id="${c.id}">Quitar</button>
      </div>
    </li>`).join('')}</ul>` : `<p class="nota">${estado.red.length ? 'No hay contactos en este grupo.' : 'Todavía no sumaste a nadie. Empezá por quien vive más cerca.'}</p>`}
  </div>
  <div class="panel">
    <h3>Sumar un contacto</h3>
    <form class="dos" data-form="sumar-contacto" autocomplete="off">
      <label class="campo">Nombre<input type="text" name="nombre" required maxlength="40"></label>
      <label class="campo">Teléfono<input type="tel" name="tel" required maxlength="30" placeholder="Con código de área: 11 2345 6789"></label>
      <label class="campo">Grupo<select name="grupo">${GRUPOS_RED.map((g) => `<option value="${g.id}">${g.nombre}</option>`).join('')}</select></label>
      <label class="campo">Barrio o cuadra<input type="text" name="barrio" maxlength="60" placeholder="Opcional"></label>
      <label class="campo">Nota<input type="text" name="nota" maxlength="80" placeholder="Ej.: tiene generador, es enfermera"></label>
      <div class="fila" style="align-self:end"><button type="submit" class="boton primario">Sumar</button>${agenda ? '<button type="button" class="boton" data-accion="elegir-contacto">Elegir de la agenda</button>' : ''}</div>
    </form>
  </div>`;
}
function mensajeActual() {
  const t = document.getElementById('mensaje-red');
  return (t && t.value.trim()) || textoMensaje(msgSel);
}
async function elegirContacto() {
  try {
    const [c] = await navigator.contacts.select(['name', 'tel'], { multiple: false });
    if (!c) return;
    const f = vista.querySelector('form[data-form="sumar-contacto"]');
    f.nombre.value = (c.name && c.name[0]) || '';
    f.tel.value = (c.tel && c.tel[0]) || '';
    f.nombre.focus();
  } catch (e) {
    aviso('No se pudo abrir la agenda');
  }
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
  const dir = linkMapsDireccion();
  return `
  ${cabeza('Módulo 7', 'Mi zona', 'Marcá tu casa, el punto de encuentro, lo que conviene evitar (estaciones de servicio, transformadores, cables de alta tensión, calles que se inundan) y lo que sirve cerca. Elegí el tipo y tocá el mapa.')}
  <div class="panel">
    <div class="tipos" role="group" aria-label="Tipo de punto">${Object.entries(TIPOS_MARCADOR).map(([k, t]) => `<button type="button" data-accion="tipo-marcador" data-tipo="${k}" aria-pressed="${k === tipoMarcador}"><span class="punto" style="background:${t.color}"></span>${t.nombre}</button>`).join('')}</div>
    <div id="mapa" class="mapa" aria-label="Mapa de tu zona"></div>
    <div class="fila"><button type="button" class="boton" data-accion="ubicarme">Ir a mi ubicación</button>${dir ? `<a class="boton" href="${dir}" target="_blank" rel="noopener">Mi dirección en Google Maps ↗</a>` : ''}</div>
    <p class="nota">El mapa necesita internet. Cuando lo tengas armado, sacale una captura para tenerla a mano.</p>
  </div>
  <div class="panel">
    <h3>Buscar cerca en Google Maps</h3>
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
    <h2 id="dialogo-titulo">Nuevo punto</h2>
    <label class="campo">Tipo<select name="tipo">${Object.entries(TIPOS_MARCADOR).map(([k, v]) => `<option value="${k}" ${k === tipoMarcador ? 'selected' : ''}>${v.nombre}</option>`).join('')}</select></label>
    <label class="campo">Nombre<input type="text" name="nombre" required maxlength="60" placeholder="Ej.: ${t.nombre.toLowerCase()}"></label>
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
  ${cabeza('Módulo 8', 'Tutoriales', 'Búsquedas armadas por tema para aprender lo que no sabés hacer. Todavía no están curadas: elegí videos de fuentes confiables, como bomberos, Cruz Roja o Defensa Civil. Primeros auxilios se practica en persona.')}
  <div class="panel"><h3>El curso</h3><ul class="puntos">${CURSO.map((v) => `<li><a href="${v.url}" target="_blank" rel="noopener">${v.titulo} ↗</a></li>`).join('')}</ul></div>
  <div class="modulos">
    ${TUTORIALES.map((t) => `<article class="panel"><h3>${t.tema}</h3><ul class="puntos">${t.items.map((q) => `<li><a href="${yt(q)}" target="_blank" rel="noopener">${q.charAt(0).toUpperCase() + q.slice(1)} ↗</a></li>`).join('')}</ul></article>`).join('')}
  </div>`;
}

/* ---------- emergencia ---------- */
let protoSel = 'pas';
let silbando = null;
let bloqueoPantalla = null;
function verEmergencia() {
  const pl = estado.plan, ints = estado.integrantes;
  const pr = PROTOCOLOS.find((p) => p.id === protoSel) || PROTOCOLOS[0];
  const dir = direccionTexto();
  return `
  ${cabeza('SOS', 'Calma. Paso a paso.', 'La linterna, el silbato, los teléfonos, los pasos y las fichas funcionan sin internet.')}
  <div class="pads">
    <button type="button" class="pad" data-accion="linterna"><span class="pad-boton" aria-hidden="true"></span>Luz</button>
    <span class="rejilla" aria-hidden="true"></span>
    <button type="button" class="pad" data-accion="silbato" aria-pressed="${!!silbando}"><span class="pad-boton" aria-hidden="true"></span>${silbando ? 'Parar' : 'Silbato'}</button>
  </div>
  <div class="panel">
    <h3>Llamar</h3>
    <div class="numeros">${NUMEROS.map((n) => `<a class="numero" href="tel:${n.num}"><b>${n.num}</b><span>${n.nombre}</span></a>`).join('')}</div>
    <p class="nota">Verificá los números de tu localidad. Si no hay señal, andá en persona al cuartel de bomberos o a una clínica.</p>
  </div>
  ${dir ? `<div class="panel"><h3>Dónde estamos</h3><p class="direccion-grande">${esc(dir)}</p>${estado.hogar.referencia ? `<p class="nota">${esc(estado.hogar.referencia)}</p>` : ''}<p class="nota">Para decirlo si llamás.</p></div>` : ''}
  <div class="panel">
    <h3>Avisar a tu red</h3>
    <div class="avisos">
      ${['bien', 'ayuda'].map((id) => `<div class="fila"><span class="aviso-nombre">${MENSAJES.find((m) => m.id === id).nombre}</span><button type="button" class="boton chico primario" data-accion="avisar" data-msg="${id}" data-via="wa">WhatsApp</button><button type="button" class="boton chico" data-accion="avisar" data-msg="${id}" data-via="sms">SMS</button></div>`).join('')}
    </div>
    <p class="nota">WhatsApp necesita internet; el SMS solo necesita señal. Tus contactos están en <a href="#red">Red</a>.</p>
  </div>
  ${pl.encuentro || pl.encuentroAlt ? `<div class="panel"><h3>Punto de encuentro</h3><p><b>${esc(pl.encuentro) || '—'}</b></p>${pl.encuentroAlt ? `<p class="nota">Alternativo: ${esc(pl.encuentroAlt)}</p>` : ''}</div>` : ''}
  <div class="panel">
    <h3>Qué hacer</h3>
    <div class="protocolos-botones" role="group" aria-label="Elegí la situación">${PROTOCOLOS.map((p) => `<button type="button" data-accion="protocolo" data-id="${p.id}" aria-pressed="${p.id === pr.id}">${p.nombre}</button>`).join('')}</div>
    <ol class="orden">${pr.pasos.map((s) => `<li><span>${s}</span></li>`).join('')}</ol>
  </div>
  ${ints.length ? `<div class="panel"><h3>Fichas</h3><ul class="limpia">${ints.map((i) => `<li class="integrante-fila"><canvas width="7" height="13" data-avatar="${i.id}" aria-hidden="true"></canvas><span><b>${esc(i.nombre)}</b>${edadTexto(i)} · grupo ${esc(i.grupo) || '—'}<br><span class="nota">${i.obs.length ? `${i.obs.map((o) => esc(nombreObs(o))).join(', ')} · ` : ''}Alergias: ${esc(i.alergias) || '—'} · Medicación: ${esc(i.medicacion) || '—'}${i.contacto ? ` · Tel.: ${esc(i.contacto)}` : ''}</span></span><span></span></li>`).join('')}</ul></div>` : ''}
  ${animales() ? `<div class="panel"><h3>Mascotas</h3><ul class="limpia">${estado.mascotas.filter((m) => cantMascota(m) > 0).map((m) => `<li><b>${cantMascota(m)} × ${esc(datoAnimal(m.animal)?.nombre || 'Mascota')}</b>${m.edad ? ` · ${esc(m.edad)}` : ''}${m.obs ? `<br><span class="nota">${esc(m.obs)}</span>` : ''}</li>`).join('')}</ul></div>` : ''}`;
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
  inicio: verInicio, hogar: verHogar, familia: verFamilia, inventario: verInventario, compras: verCompras,
  plan: verPlan, hoja: verHoja, red: verRed, zona: verZona, tutoriales: verTutoriales,
  emergencia: verEmergencia, ajustes: verAjustes
};
const ALIAS = { necesidades: 'hogar', checklists: 'inventario' };
const MONTAR = { inventario: montarInventario, zona: montarZona };
const NAV = { hogar: 'inicio', plan: 'inicio', hoja: 'inicio', compras: 'inventario', zona: 'inicio', tutoriales: 'inicio', ajustes: 'inicio' };
let limpiar = [];

function rutaActual() {
  let r = location.hash.slice(1);
  r = ALIAS[r] || r;
  return VISTAS[r] ? r : 'inicio';
}
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
  const h = new Date();
  document.getElementById('reloj').textContent = `${dos(h.getDate())}/${dos(h.getMonth() + 1)}/${String(h.getFullYear()).slice(2)}`;
  if (arriba) { window.scrollTo(0, 0); vista.focus({ preventScroll: true }); }
  if (MONTAR[r]) MONTAR[r]();
}
function refrescar() {
  const y = window.scrollY;
  const a = document.activeElement;
  let selector = null;
  if (a && vista.contains(a)) {
    for (const k of ['tengo', 'cantidad', 'vence', 'precio', 'campo', 'mcampo', 'accion']) {
      if (a.dataset[k] !== undefined) {
        selector = `[data-${k}="${CSS.escape(a.dataset[k])}"]`;
        if (a.dataset.id) selector += `[data-id="${CSS.escape(a.dataset.id)}"]`;
        if (a.dataset.via) selector += `[data-via="${CSS.escape(a.dataset.via)}"]`;
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
  tengo: (b) => { alternarTengo(b.dataset.id, !registro(b.dataset.id).tengo); refrescar(); },
  'quitar-integrante': (b) => confirmar(b, () => quitarIntegrante(b.dataset.id)),
  'sumar-mascota': () => {
    const m = { id: uid(), animal: 'perro', cantidad: 1, edad: '', obs: '' };
    estado.mascotas.push(m);
    sincronizarMascotas();
    guardar();
    refrescar();
    vista.querySelector(`[data-mcampo="animal"][data-id="${m.id}"]`)?.focus({ preventScroll: true });
  },
  'quitar-mascota': (b) => confirmar(b, () => { estado.mascotas = estado.mascotas.filter((m) => m.id !== b.dataset.id); sincronizarMascotas(); guardar(); refrescar(); }),
  'editar-integrante': (b) => abrirEdicion(b.dataset.id),
  'elegir-integrante': (b) => { familiaSel = b.dataset.id; refrescar(); },
  'ir-cat': (b, e) => { e.preventDefault(); irACat = b.dataset.cat; if (location.hash === '#inventario') render(true); else location.hash = 'inventario'; },
  'quitar-extra': (b) => confirmar(b, () => { estado.extras = estado.extras.filter((x) => x.id !== b.dataset.id); delete estado.inventario[b.dataset.id]; guardar(); refrescar(); }),
  'ya-lo-tengo': (b) => { const r = registro(b.dataset.id); estado.inventario[b.dataset.id] = { ...r, tengo: true, desde: hoy(), vence: null }; guardar(); refrescar(); aviso('Pasó al inventario'); },
  revision: () => { estado.revision.ultima = hoy(); guardar(); refrescar(); aviso('Repaso anotado'); },
  'copiar-compras': () => copiarCompras(),
  imprimir: () => window.print(),
  'filtro-red': (b) => { filtroRed = b.dataset.grupo; refrescar(); },
  'quitar-contacto': (b) => confirmar(b, () => { estado.red = estado.red.filter((c) => c.id !== b.dataset.id); guardar(); refrescar(); }),
  mensaje: (b) => {
    const c = estado.red.find((x) => x.id === b.dataset.id);
    if (!c) return;
    const texto = encodeURIComponent(mensajeActual());
    if (b.dataset.via === 'wa') abrirExterno(`https://wa.me/${telWhatsapp(c.tel)}?text=${texto}`);
    else abrirExterno(`sms:${String(c.tel).replace(/[^\d+]/g, '')}?&body=${texto}`);
  },
  'mensaje-grupo': (b) => {
    const texto = encodeURIComponent(mensajeActual());
    abrirExterno(b.dataset.via === 'wa' ? `https://wa.me/?text=${texto}` : `sms:?&body=${texto}`);
  },
  avisar: (b) => {
    const texto = encodeURIComponent(textoMensaje(b.dataset.msg));
    abrirExterno(b.dataset.via === 'wa' ? `https://wa.me/?text=${texto}` : `sms:?&body=${texto}`);
  },
  'elegir-contacto': () => elegirContacto(),
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
  'borrar-todo': (b) => confirmar(b, () => { estado = normalizar(null); familiaSel = null; guardar(); aviso('Se borró todo'); location.hash = 'inicio'; render(true); })
};
const FORMULARIOS = {
  'sumar-integrante': (f) => {
    const nombre = f.nombre.value.trim();
    if (!nombre) { aviso('Escribí un nombre'); return; }
    const edad = f.edad.value === '' ? '' : Math.max(0, Math.min(120, Math.round(Number(f.edad.value))));
    const i = { id: uid(), nombre, tipo: f.tipo.value, edad, obs: [], grupo: '', alergias: '', medicacion: '', obraSocial: '', contacto: '', notas: '', mochila: '' };
    estado.integrantes.push(i);
    familiaSel = i.id;
    guardar();
    refrescar();
    vista.querySelector('form[data-form="sumar-integrante"] [name="nombre"]')?.focus({ preventScroll: true });
    aviso(`${nombre} se sumó`);
  },
  'sumar-contacto': (f) => {
    const nombre = f.nombre.value.trim(), tel = f.tel.value.trim();
    if (!nombre || !tel) return;
    estado.red.push({ id: uid(), nombre, tel, grupo: f.grupo.value, barrio: f.barrio.value.trim(), nota: f.nota.value.trim() });
    guardar();
    refrescar();
    aviso(`${nombre} se sumó a tu red`);
  },
  'sumar-extra': (f) => {
    const nombre = f.nombre.value.trim();
    if (!nombre) return;
    const id = `x-${uid()}`;
    estado.extras.push({ id, nombre, cat: f.cat.value, unidad: 'u.' });
    estado.inventario[id] = { tengo: true, cantidad: null, vence: null, desde: hoy() };
    guardar();
    refrescar();
    aviso(`${nombre} se sumó al inventario`);
  }
};
const DIALOGOS = {
  integrante: (f) => {
    const i = estado.integrantes.find((x) => x.id === f.dataset.id);
    if (!i) { dialogo.close(); return; }
    const nombre = f.nombre.value.trim();
    if (!nombre) { aviso('Escribí un nombre'); return; }
    Object.assign(i, {
      nombre, tipo: f.tipo.value, edad: f.edad.value === '' ? '' : Math.max(0, Math.min(120, Math.round(Number(f.edad.value)))),
      grupo: f.grupo.value, contacto: f.contacto.value.trim(), obraSocial: f.obraSocial.value.trim(), mochila: f.mochila.value,
      obs: [...obsEdicion], alergias: f.alergias.value.trim(), medicacion: f.medicacion.value.trim(), notas: f.notas.value.trim()
    });
    delete i.electro;
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
  if (t.dataset.tengo) { alternarTengo(t.dataset.tengo, t.checked); refrescar(); return; }
  if (t.dataset.cantidad) {
    const v = t.value === '' ? null : Math.max(0, Number(t.value));
    estado.inventario[t.dataset.cantidad] = { ...registro(t.dataset.cantidad), cantidad: Number.isFinite(v) ? v : null };
    guardar();
    actualizarCuenta(t.dataset.cantidad);
    return;
  }
  if (t.dataset.mcampo) {
    const m = estado.mascotas.find((x) => x.id === t.dataset.id);
    if (!m) return;
    const k = t.dataset.mcampo;
    if (k === 'cantidad') m.cantidad = t.value === '' ? 1 : Math.max(1, Math.min(50, Math.round(Number(t.value) || 1)));
    else m[k] = k === 'animal' ? t.value : t.value.trim();
    sincronizarMascotas();
    guardar();
    return;
  }
  if (t.dataset.vence) { estado.inventario[t.dataset.vence] = { ...registro(t.dataset.vence), vence: t.value || null }; guardar(); refrescar(); return; }
  if (t.dataset.precio) {
    const v = t.value === '' ? null : Math.max(0, Number(t.value));
    estado.compras[t.dataset.precio] = { ...(estado.compras[t.dataset.precio] || {}), precio: Number.isFinite(v) ? v : null };
    guardar();
    const el = document.getElementById('falta-gastar');
    if (el) el.textContent = pesos(faltaGastar(faltantes()));
    return;
  }
  if (t.dataset.rol !== undefined) { estado.plan.roles[t.dataset.rol] = t.value; guardar(); return; }
  if (t.dataset.mensajeSel !== undefined) { msgSel = t.value; const ta = document.getElementById('mensaje-red'); if (ta) ta.value = textoMensaje(msgSel); return; }
  if (t.dataset.importar !== undefined) { importar(t.files[0]); t.value = ''; return; }
  if (t.dataset.campo) {
    const v = t.type === 'checkbox' ? t.checked : t.value;
    setRuta(estado, t.dataset.campo, v);
    guardar();
    if (t.dataset.campo.startsWith('hogar.')) actualizarLinkDireccion();
    if (t.type === 'checkbox' || t.type === 'radio' || t.tagName === 'SELECT') refrescar();
  }
});
dialogo.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-dialogo]');
  if (!f) return;
  e.preventDefault();
  DIALOGOS[f.dataset.dialogo]?.(f);
});
dialogo.addEventListener('change', (e) => {
  const s = e.target.closest('[data-obs-select]');
  if (!s || !s.value) return;
  if (!obsEdicion.includes(s.value)) obsEdicion.push(s.value);
  redibujarObs();
});
dialogo.addEventListener('click', (e) => {
  if (e.target.closest('[data-cerrar]')) { dialogo.close(); return; }
  const o = e.target.closest('[data-obs-quitar]');
  if (o) { obsEdicion = obsEdicion.filter((x) => x !== o.dataset.obsQuitar); redibujarObs(); return; }
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

guardar();
render(true);

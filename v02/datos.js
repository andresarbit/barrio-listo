// Contenido de la app. Todo sale del curso de preparacionismo comunitario
// (vivo del 29/10/2026 y clases del 4 y 6/11/2026). Validar con protección civil y salud.

export const NOMBRE_APP = 'Barrio Listo';

export const TIPOS = {
  adulto: 'Adulto/a',
  mayor: 'Persona mayor',
  nino: 'Chico/a',
  bebe: 'Bebé'
};

export const GRUPOS = ['', '0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No sé'];

// etapa: '72h' para arrancar, '14d' para la meta de dos semanas.
// rotar: cada cuántos meses hay que revisarlo o renovarlo.
// soloSi: el ítem aparece solo si el hogar tiene esa condición.
export const CATEGORIAS = [
  {
    id: 'agua', nombre: 'Agua', icono: 'gota',
    items: [
      { id: 'agua-72', texto: 'Reserva de agua para 72 horas: 3 litros por persona por día (2 para tomar y cocinar, 1 para higiene).', etapa: '72h', rotar: 6 },
      { id: 'agua-14', texto: 'Reserva de agua para 2 semanas.', etapa: '14d', rotar: 6 },
      { id: 'agua-lavandina', texto: 'Lavandina "apta para desinfectar agua" (leer el rótulo: dura de 3 a 6 meses).', etapa: '72h', rotar: 6 },
      { id: 'agua-saber', texto: 'Sabemos potabilizar: hervir fuerte 5 minutos (1 más cada 300 m de altura) o 2 gotas de lavandina por litro si tiene 50 g de cloro por litro.', etapa: '72h' },
      { id: 'agua-filtro', texto: 'Un filtro: de mesada, bombilla con filtro o casero (piedra, arena y carbón activado). Después de filtrar, igual se hierve o se clora.', etapa: '14d' },
      { id: 'agua-pastillas', texto: 'Pastillas potabilizadoras de reserva.', etapa: '14d' }
    ]
  },
  {
    id: 'carpeta', nombre: 'Carpeta y plata', icono: 'hoja',
    items: [
      { id: 'carpeta-armada', texto: 'Carpeta hermética, en altura y a mano: documentos, actas, recetas, alergias, grupo y factor de cada uno, analítico.', etapa: '72h', rotar: 3 },
      { id: 'carpeta-digital', texto: 'Copia escaneada en un pendrive (zip con contraseña) y otra en la nube.', etapa: '72h', rotar: 3 },
      { id: 'plata-efectivo', texto: 'Efectivo para 72 horas: si no hay luz ni señal, el QR no anda.', etapa: '72h' },
      { id: 'plata-cuentas', texto: 'Una cuenta para el día a día y otra de reserva, en empresas distintas.', etapa: '14d' }
    ]
  },
  {
    id: 'botiquin', nombre: 'Botiquín', icono: 'cruz',
    items: [
      { id: 'botiquin-trauma', texto: 'Trauma: gasas, apósitos, vendas de tres anchos y cinta.', etapa: '72h', rotar: 12 },
      { id: 'botiquin-antisepticos', texto: 'Antisépticos: yodo, solución fisiológica y jabón blanco.', etapa: '72h', rotar: 12 },
      { id: 'botiquin-proteccion', texto: 'Protección de quien asiste: guantes, barbijo, antiparras y tijera de punta roma.', etapa: '72h' },
      { id: 'botiquin-medicacion', texto: 'Medicación crónica para 2 a 4 semanas.', etapa: '72h', rotar: 3, soloSi: 'medicacion' },
      { id: 'botiquin-manta', texto: 'Manta térmica y un pañuelo grande.', etapa: '72h' },
      { id: 'botiquin-saber', texto: 'Sabemos la regla PAS: proteger, avisar, socorrer.', etapa: '72h' }
    ]
  },
  {
    id: 'comida', nombre: 'Comida', icono: 'lata',
    items: [
      { id: 'comida-72', texto: 'Comida que no necesita cocción para 72 horas.', etapa: '72h', rotar: 6 },
      { id: 'comida-14', texto: 'Para 2 semanas: arroz y fideos, legumbres, latas (atún, caballa, sardinas), frutos secos y fruta deshidratada. Solo lo que la familia come.', etapa: '14d', rotar: 6 },
      { id: 'comida-frascos', texto: 'Secos en frascos de vidrio con sello, rotulados con el vencimiento.', etapa: '14d' },
      { id: 'comida-freezer', texto: 'Lista del freezer pegada por fuera, para no abrirlo en un corte.', etapa: '14d' },
      { id: 'comida-bebe', texto: 'Pañales, leche y comida de bebé para 72 horas.', etapa: '72h', rotar: 3, soloSi: 'bebes' },
      { id: 'comida-mascotas', texto: 'Agua y alimento para las mascotas.', etapa: '72h', soloSi: 'mascotas' }
    ]
  },
  {
    id: 'energia', nombre: 'Energía', icono: 'rayo',
    items: [
      { id: 'energia-linternas', texto: 'Linternas y pilas, una por persona. Las recargables se descargan solas: revisarlas.', etapa: '72h', rotar: 6 },
      { id: 'energia-powerbank', texto: 'Power bank cargado. Ante una alerta, cargar todo.', etapa: '72h', rotar: 3 },
      { id: 'energia-termica', texto: 'Sabemos bajar la térmica cuando se corta la luz.', etapa: '72h' },
      { id: 'energia-ups', texto: 'UPS para el equipo de la persona electrodependiente.', etapa: '72h', soloSi: 'electro' },
      { id: 'energia-dinamo', texto: 'Linterna a dínamo.', etapa: '14d' },
      { id: 'energia-anafe', texto: 'Anafe de camping con garrafa, para hervir agua.', etapa: '14d' }
    ]
  },
  {
    id: 'comunicacion', nombre: 'Comunicación', icono: 'radio',
    items: [
      { id: 'com-papel', texto: 'Lista de teléfonos en papel.', etapa: '72h', rotar: 3 },
      { id: 'com-sms', texto: 'El celular configurado para mandar SMS sin internet.', etapa: '72h' },
      { id: 'com-radio', texto: 'Radio AM/FM a pilas: las radios locales avisan alertas y puntos de ayuda.', etapa: '72h' },
      { id: 'com-silbato', texto: 'Un silbato, para avisar o si alguien queda atrapado.', etapa: '72h' },
      { id: 'com-grupo', texto: 'Grupo de chat con los vecinos, como sistema de alerta.', etapa: '14d' }
    ]
  },
  {
    id: 'mochila', nombre: 'Mochilas', icono: 'mochila',
    items: [
      { id: 'mochila-una', texto: 'Una mochila de escape por persona, de no más del 15% del peso de quien la lleva.', etapa: '72h', rotar: 3 },
      { id: 'mochila-contenido', texto: 'Adentro: agua y comida para 72 horas, botiquín, radio, power bank, linterna, navaja, bolsas y soga.', etapa: '72h' },
      { id: 'mochila-carpeta', texto: 'La carpeta familiar va en la mochila de un adulto.', etapa: '72h' },
      { id: 'mochila-practica', texto: 'Practicamos el "salí en 3 minutos".', etapa: '14d' }
    ]
  },
  {
    id: 'casa', nombre: 'Casa segura', icono: 'casa',
    items: [
      { id: 'casa-tablero', texto: 'Varios sabemos dónde están el tablero, el disyuntor y la llave del gas, y están señalizados.', etapa: '72h' },
      { id: 'casa-encuentro', texto: 'Punto de encuentro y rutas de salida acordados.', etapa: '72h' },
      { id: 'casa-herramientas', texto: 'Caja de herramientas básica: pinza, destornillador, martillo.', etapa: '14d' },
      { id: 'casa-mantenimiento', texto: 'Desagües, canaletas y chapas en condiciones.', etapa: '14d', rotar: 6 },
      { id: 'casa-muebles', texto: 'Muebles pesados fijados a la pared y espejos pegados.', etapa: '14d', soloSi: 'sismica' }
    ]
  }
];

// Lista de compras calculada a partir del hogar.
export function generarCompras(personas, f) {
  const p = Math.max(1, personas);
  const l72 = p * 3 * 3;
  const l14 = p * 3 * 14;
  const lista = [
    { id: 'c-agua72', cat: 'Agua', nombre: 'Agua potable para 72 horas', cant: `${l72} L (unos ${Math.ceil(l72 / 6)} bidones de 6 L)`, etapa: '72h', buscar: 'bidon agua 6 litros' },
    { id: 'c-lavandina', cat: 'Agua', nombre: 'Lavandina apta para desinfectar agua', cant: '1 botella', etapa: '72h', buscar: 'lavandina apta desinfectar agua' },
    { id: 'c-carpeta', cat: 'Carpeta y plata', nombre: 'Carpeta o bolsa hermética para documentos', cant: '1', etapa: '72h', buscar: 'carpeta impermeable documentos' },
    { id: 'c-pendrive', cat: 'Carpeta y plata', nombre: 'Pendrive para la copia de los documentos', cant: '1', etapa: '72h', buscar: 'pendrive' },
    { id: 'c-trauma', cat: 'Botiquín', nombre: 'Gasas, apósitos, vendas de tres anchos y cinta', cant: '1 juego', etapa: '72h', buscar: 'gasas vendas botiquin' },
    { id: 'c-antisep', cat: 'Botiquín', nombre: 'Yodo, solución fisiológica y jabón blanco', cant: '1 de cada uno', etapa: '72h', buscar: 'solucion fisiologica' },
    { id: 'c-proteccion', cat: 'Botiquín', nombre: 'Guantes, barbijos, antiparras y tijera de punta roma', cant: '1 juego', etapa: '72h', buscar: 'tijera punta roma trauma' },
    { id: 'c-manta', cat: 'Botiquín', nombre: 'Manta térmica', cant: '1 o más', etapa: '72h', buscar: 'manta termica emergencia' },
    { id: 'c-comida72', cat: 'Comida', nombre: 'Comida que no necesita cocción', cant: `para ${p} ${p === 1 ? 'persona' : 'personas'} por 3 días`, etapa: '72h', buscar: 'conservas latas' },
    { id: 'c-linternas', cat: 'Energía', nombre: 'Linternas con pilas', cant: `${p}, una por persona`, etapa: '72h', buscar: 'linterna led pilas' },
    { id: 'c-powerbank', cat: 'Energía', nombre: 'Power bank', cant: '1', etapa: '72h', buscar: 'power bank' },
    { id: 'c-radio', cat: 'Comunicación', nombre: 'Radio AM/FM a pilas', cant: '1', etapa: '72h', buscar: 'radio am fm pilas' },
    { id: 'c-silbato', cat: 'Comunicación', nombre: 'Silbato', cant: '1 o más', etapa: '72h', buscar: 'silbato' },
    { id: 'c-mochilas', cat: 'Mochilas', nombre: 'Mochila común (nada táctico)', cant: `${p}, una por persona`, etapa: '72h', buscar: 'mochila' },
    { id: 'c-navaja', cat: 'Mochilas', nombre: 'Navaja, bolsas de residuo gruesas y soga', cant: '1 juego por mochila', etapa: '72h', buscar: 'navaja multiuso' },
    { id: 'c-agua14', cat: 'Agua', nombre: 'Agua potable para completar 2 semanas', cant: `${l14 - l72} L más (unos ${Math.ceil((l14 - l72) / 6)} bidones de 6 L)`, etapa: '14d', buscar: 'bidon agua 6 litros' },
    { id: 'c-filtro', cat: 'Agua', nombre: 'Filtro de agua (de mesada o bombilla)', cant: '1', etapa: '14d', buscar: 'filtro agua gravedad' },
    { id: 'c-pastillas', cat: 'Agua', nombre: 'Pastillas potabilizadoras', cant: '1 tira', etapa: '14d', buscar: 'pastillas potabilizadoras' },
    { id: 'c-comida14', cat: 'Comida', nombre: 'Arroz, fideos, legumbres, latas de pescado y frutos secos', cant: `para ${p} ${p === 1 ? 'persona' : 'personas'} por 2 semanas`, etapa: '14d', buscar: 'legumbres arroz' },
    { id: 'c-frascos', cat: 'Comida', nombre: 'Frascos de vidrio con tapa y sello', cant: 'según la despensa', etapa: '14d', buscar: 'frascos vidrio hermeticos' },
    { id: 'c-dinamo', cat: 'Energía', nombre: 'Linterna a dínamo', cant: '1', etapa: '14d', buscar: 'linterna dinamo' },
    { id: 'c-anafe', cat: 'Energía', nombre: 'Anafe de camping con garrafa', cant: '1', etapa: '14d', buscar: 'anafe camping garrafa' },
    { id: 'c-herramientas', cat: 'Casa segura', nombre: 'Caja de herramientas básica', cant: '1', etapa: '14d', buscar: 'caja herramientas' },
    { id: 'c-fluo', cat: 'Casa segura', nombre: 'Pintura fluorescente para señalizar tablero y gas', cant: '1', etapa: '14d', buscar: 'pintura fluorescente' }
  ];
  if (f.electro) lista.push({ id: 'c-ups', cat: 'Energía', nombre: 'UPS para la persona electrodependiente', cant: '1', etapa: '72h', buscar: 'ups' });
  if (f.medicacion) lista.push({ id: 'c-medicacion', cat: 'Botiquín', nombre: 'Medicación crónica de reserva', cant: 'de 2 a 4 semanas', etapa: '72h', buscar: null });
  if (f.bebes) lista.push({ id: 'c-bebe', cat: 'Comida', nombre: 'Pañales, leche y comida de bebé', cant: 'para 72 horas', etapa: '72h', buscar: 'pañales' });
  if (f.mascotas) lista.push({ id: 'c-mascotas', cat: 'Comida', nombre: 'Agua y alimento para mascotas', cant: 'para 72 horas', etapa: '72h', buscar: 'alimento mascotas' });
  if (f.sismica) lista.push({ id: 'c-fijaciones', cat: 'Casa segura', nombre: 'Tarugos, tornillos y escuadras para fijar muebles', cant: 'según los muebles', etapa: '14d', buscar: 'escuadras fijar muebles' });
  return lista;
}

export const PROTOCOLOS = [
  {
    id: 'pas', nombre: 'PAS · primeros auxilios', pasos: [
      'Proteger: mirá la escena antes de acercarte. ¿Hay un cable, fuego, tránsito?',
      'Avisar: llamá o mandá a una persona puntual con una orden clara. Si se dice "que alguien llame", nadie llama.',
      'Socorrer: fijate si sangra, si hubo un golpe, si respira, si está consciente.',
      'No sumes víctimas: si te ponés en riesgo, pasan a ser dos los lastimados.',
      'Sangrado: presión con gasa. Si se empapa, otra encima, sin sacar la primera.',
      'Quemadura: agua limpia, no helada y nunca hielo. Ni cremas ni dentífrico.',
      'Fractura: nunca acomodar el hueso. Inmovilizar e ir a la guardia.',
      'Atragantamiento: si tose, que tosa fuerte. Si no, cinco golpes secos entre los omóplatos.'
    ]
  },
  {
    id: 'inundacion', nombre: 'Inundación', zona: 'inundable', pasos: [
      'Antes: reservas listas y la carpeta en altura.',
      'Cortá la luz aunque el agua todavía no haya entrado.',
      'Si hay que salir, por la vereda y nunca por la calle. Lejos de los cables caídos.',
      'No circules en auto: puede haber tapas de alcantarilla levantadas, y la ola le mete agua a los vecinos.',
      'Después: no subas la térmica hasta que todo esté seco.',
      'Desinfectá con lavandina. Tirá la comida mojada. El agua de reserva que quedó bajo el agua ya no sirve.',
      'Basura en bolsa doble, con doble nudo y en altura.'
    ]
  },
  {
    id: 'tormenta', nombre: 'Tormenta', pasos: [
      'Entrá todo lo que se pueda volar.',
      'Revisá desagües, canaletas, chapas y tejas, pensando también en el daño que se le puede hacer a otros.',
      'Cargá el celular y los power banks. Guardá batería para las alertas.',
      'Tené el número de Defensa Civil y seguí sus indicaciones.'
    ]
  },
  {
    id: 'incendio', nombre: 'Incendio', zona: 'incendios', pasos: [
      'Salí primero, sin volver por nada. Llamá recién estando afuera.',
      'Tocá la puerta con el dorso de la mano: si está caliente, no la abras y buscá otra salida.',
      'Moverse agachado, por debajo del humo. Nunca uses el ascensor.',
      'Ayudá a salir a chicos y a personas con movilidad reducida.',
      'Cuéntense en el punto de encuentro. Si falta alguien, no vuelvas a entrar: llamá a los bomberos.'
    ]
  },
  {
    id: 'sismo', nombre: 'Sismo', zona: 'sismica', pasos: [
      'Agachate, cubrite y aferrate bajo un mueble sólido. El marco de la puerta ya no es lo recomendado.',
      'Si no hay mueble, en cuclillas contra una pared interior, lejos de las ventanas.',
      'Después: si hay olor a gas, no toques interruptores ni prendas fuego.',
      'Cortá el gas igual, y el agua si hay pérdida.'
    ]
  },
  {
    id: 'calor', nombre: 'Ola de calor', zona: 'calor', pasos: [
      'Tomá agua segura aunque no tengas sed.',
      'Nada helado ni caliente, ni alcohol ni bebidas azucaradas.',
      'Ropa clara y no salir en las horas de más sol.',
      'Persianas cerradas de día; ventilá de noche.',
      'Atención especial a bebés, chicos y mayores. Si la piel pellizcada tarda en volver, es deshidratación: dar de beber.'
    ]
  },
  {
    id: 'luz', nombre: 'Corte de luz', pasos: [
      'Bajá la térmica: cuando vuelve la luz puede quemar todo.',
      'No abras el freezer. Comé primero lo de la heladera.',
      'Efectivo a mano: el QR y la billetera virtual no andan.',
      'Batería del celular para emergencias y alertas, no para redes.',
      'Si hay alguien electrodependiente, activá su plan de energía.'
    ]
  }
];

export const NUMEROS = [
  { num: '911', nombre: 'Emergencias' },
  { num: '107', nombre: 'Emergencias médicas' },
  { num: '100', nombre: 'Bomberos' },
  { num: '103', nombre: 'Defensa Civil' },
  { num: '101', nombre: 'Policía' }
];

export const ROLES_PLAN = [
  'Cortar la luz y el gas',
  'Buscar a los chicos',
  'Llevar la carpeta familiar',
  'Avisar a la familia y a los vecinos',
  'Ayudar a quien tiene movilidad reducida',
  'Llevar el botiquín y los remedios'
];

export const TIPOS_MARCADOR = {
  casa: { nombre: 'Casa', color: '#ffd447' },
  encuentro: { nombre: 'Punto de encuentro', color: '#7bd04a' },
  riesgo: { nombre: 'Riesgo', color: '#ff5c7a' },
  servicio: { nombre: 'Servicio', color: '#4cc9d6' },
  recurso: { nombre: 'Recurso de un vecino', color: '#ff9f43' }
};

export const BUSQUEDAS_CERCA = [
  { nombre: 'Hospitales', q: 'hospital' },
  { nombre: 'Bomberos', q: 'cuartel de bomberos' },
  { nombre: 'Comisarías', q: 'comisaría' },
  { nombre: 'Farmacias', q: 'farmacia' },
  { nombre: 'Defensa Civil', q: 'defensa civil' },
  { nombre: 'Estaciones de servicio', q: 'estación de servicio' }
];

export const CURSO = [
  { titulo: 'Organizarse ante la emergencia (vivo, 29/10)', url: 'https://www.youtube.com/watch?v=bPP2Bsh9_XQ' },
  { titulo: 'Clase 1: agua, alimentos, documentos y finanzas (4/11)', url: 'https://www.youtube.com/watch?v=JR5XOdpyPS8' },
  { titulo: 'Clase 2: primeros auxilios, energía, comunicaciones y protocolos (6/11)', url: 'https://www.youtube.com/watch?v=K9VTMPiH2wo' }
];

export const TUTORIALES = [
  { tema: 'Electricidad', items: ['bajar la térmica y probar el disyuntor', 'cómo funciona el tablero eléctrico de la casa', 'qué hacer si se corta la luz'] },
  { tema: 'Gas', items: ['cerrar la llave de paso del gas', 'detectar una pérdida de gas'] },
  { tema: 'Plomería', items: ['cortar la llave de paso del agua', 'arreglar una pérdida de una canilla'] },
  { tema: 'Mecánica', items: ['usar el auto para cargar el celular', 'cambiar una rueda'] },
  { tema: 'Reparaciones', items: ['asegurar una chapa del techo', 'sellar una gotera', 'destapar una canaleta'] },
  { tema: 'Agua', items: ['filtro de agua casero con arena y carbón', 'potabilizar agua con lavandina', 'hervir agua para potabilizar'] },
  { tema: 'Comida', items: ['conservas caseras seguras', 'ordenar la alacena por vencimiento'] },
  { tema: 'Primeros auxilios', items: ['regla PAS proteger avisar socorrer', 'cómo frenar una hemorragia', 'maniobra para desatragantar', 'RCP paso a paso'] },
  { tema: 'Seguridad de la casa', items: ['seguridad en el hogar iluminación y cerraduras', 'defensa personal básica'] },
  { tema: 'Comunicación', items: ['radio AM FM en emergencias', 'Meshtastic red en malla'] },
  { tema: 'Planes', items: ['plan familiar de emergencia', 'mochila de emergencia 72 horas'] }
];

// Barrio Listo V02: contenidos. Salen del curso de preparacionismo comunitario
// (vivo del 29/10/2026 y clases del 4 y 6/11/2026). Validar con protección civil y salud.
// Enfoque: organizarse y contar lo que hay, sin cuentas regresivas.

export const TIPOS = {
  adulto: 'Adulto/a',
  mayor: 'Persona mayor',
  nino: 'Chico/a',
  bebe: 'Bebé'
};

export const GRUPOS = ['', '0+', '0-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'No sé'];

// Observaciones de cada integrante: se eligen varias y se suman como etiquetas.
export const OBSERVACIONES = [
  { id: 'motriz', nombre: 'Discapacidad motriz' },
  { id: 'visual', nombre: 'Discapacidad visual' },
  { id: 'auditiva', nombre: 'Discapacidad auditiva' },
  { id: 'intelectual', nombre: 'Discapacidad intelectual' },
  { id: 'movilidad', nombre: 'Movilidad reducida' },
  { id: 'silla', nombre: 'Usa silla de ruedas' },
  { id: 'lesion', nombre: 'Lesión' },
  { id: 'cronica', nombre: 'Enfermedad crónica' },
  { id: 'diabetes', nombre: 'Diabetes' },
  { id: 'respiratorio', nombre: 'Problema respiratorio' },
  { id: 'cardiaco', nombre: 'Problema cardíaco' },
  { id: 'electro', nombre: 'Electrodependiente' },
  { id: 'medicacion', nombre: 'Toma medicación diaria' },
  { id: 'alergia', nombre: 'Alergias' },
  { id: 'embarazo', nombre: 'Embarazo' },
  { id: 'mental', nombre: 'Salud mental' },
  { id: 'dieta', nombre: 'Dieta especial o celiaquía' },
  { id: 'acompanamiento', nombre: 'Necesita acompañamiento permanente' },
  { id: 'anteojos', nombre: 'Usa anteojos o audífonos' },
  { id: 'otra', nombre: 'Otra (detallar en notas)' }
];

export const CATEGORIAS = [
  { id: 'agua', nombre: 'Agua', icono: 'gota' },
  { id: 'comida', nombre: 'Comida', icono: 'lata' },
  { id: 'botiquin', nombre: 'Botiquín', icono: 'cruz' },
  { id: 'energia', nombre: 'Luz y energía', icono: 'rayo' },
  { id: 'comunicacion', nombre: 'Comunicación', icono: 'radio' },
  { id: 'documentos', nombre: 'Documentos y plata', icono: 'hoja' },
  { id: 'mochilas', nombre: 'Mochilas', icono: 'mochila' },
  { id: 'casa', nombre: 'Casa y herramientas', icono: 'casa' },
  { id: 'saberes', nombre: 'Lo que sabemos hacer', icono: 'check' }
];

// Elementos del inventario.
// unidad: cómo se cuenta. ref: referencia del curso. revisar: cada cuántos meses conviene revisarlo.
// vence: tiene fecha de vencimiento para anotar.
// por: cómo se calcula lo que necesitan según quiénes viven en la casa
//   (persona, agua, raciones, electro, animal, bebe, mascotas, medicacion, dieta).
// corto: nombre para la grilla de "qué ya tienen". soloSi: aparece solo si el hogar lo necesita.
// saber: no se cuenta, solo se tilda.
export const ELEMENTOS = [
  { id: 'agua-litros', cat: 'agua', nombre: 'Agua potable', corto: 'Agua', unidad: 'L', por: 'agua', ref: 'Referencia del curso: 3 litros por persona por día (2 para tomar y cocinar, 1 para higiene). Se rota cada 3 a 6 meses.', revisar: 6, buscar: 'bidon agua 6 litros' },
  { id: 'agua-cantimploras', cat: 'agua', nombre: 'Botellas o cantimploras', corto: 'Cantimploras', unidad: 'u.', por: 'persona', buscar: 'cantimplora' },
  { id: 'agua-lavandina', cat: 'agua', nombre: 'Lavandina apta para desinfectar agua', unidad: 'u.', ref: 'Leer el rótulo: pierde concentración con el tiempo.', vence: true, buscar: 'lavandina apta desinfectar agua' },
  { id: 'agua-pastillas', cat: 'agua', nombre: 'Pastillas potabilizadoras', unidad: 'u.', vence: true, buscar: 'pastillas potabilizadoras' },
  { id: 'agua-filtro', cat: 'agua', nombre: 'Filtro de agua', unidad: 'u.', ref: 'De mesada, bombilla con filtro o casero. Después de filtrar, igual se hierve o se clora.', buscar: 'filtro agua gravedad' },

  { id: 'comida-noperecedera', cat: 'comida', nombre: 'Comida no perecedera', corto: 'Comida no perecedera', unidad: 'raciones', por: 'raciones', ref: 'Latas, legumbres, arroz, fideos: solo lo que la familia come. Se cuenta en raciones (un plato para una persona) y se usa primero lo que vence antes.', vence: true, buscar: 'conservas latas' },
  { id: 'comida-secos', cat: 'comida', nombre: 'Frutos secos y fruta deshidratada', unidad: 'u.', vence: true, buscar: 'frutos secos' },
  { id: 'comida-frascos', cat: 'comida', nombre: 'Frascos de vidrio con sello', unidad: 'u.', buscar: 'frascos vidrio hermeticos' },
  { id: 'comida-bebe', cat: 'comida', nombre: 'Pañales, leche y comida de bebé', unidad: 'u.', vence: true, soloSi: 'bebes', por: 'bebe', buscar: 'pañales' },
  { id: 'comida-dieta', cat: 'comida', nombre: 'Comida apta para dieta especial o celiaquía', unidad: 'raciones', vence: true, soloSi: 'dieta', por: 'dieta', buscar: 'alimentos sin tacc' },
  { id: 'comida-mascotas', cat: 'comida', nombre: 'Alimento para mascotas', unidad: 'kg', vence: true, soloSi: 'mascotas', por: 'mascotas', buscar: 'alimento mascotas' },

  { id: 'botiquin-gasas', cat: 'botiquin', nombre: 'Gasas, apósitos, vendas y cinta', corto: 'Gasas y vendas', unidad: 'u.', buscar: 'gasas vendas botiquin' },
  { id: 'botiquin-antisepticos', cat: 'botiquin', nombre: 'Yodo, solución fisiológica y jabón blanco', unidad: 'u.', vence: true, buscar: 'solucion fisiologica' },
  { id: 'botiquin-proteccion', cat: 'botiquin', nombre: 'Guantes, barbijos y antiparras', unidad: 'u.', buscar: 'guantes descartables' },
  { id: 'botiquin-tijera', cat: 'botiquin', nombre: 'Tijera de punta roma', unidad: 'u.', buscar: 'tijera punta roma trauma' },
  { id: 'botiquin-manta', cat: 'botiquin', nombre: 'Manta térmica', unidad: 'u.', por: 'persona', buscar: 'manta termica emergencia' },
  { id: 'botiquin-medicacion', cat: 'botiquin', nombre: 'Medicación de reserva', unidad: 'u.', ref: 'De 2 a 4 semanas de la medicación de todos los días.', vence: true, soloSi: 'medicacion', por: 'medicacion', buscar: null },
  { id: 'botiquin-anteojos', cat: 'botiquin', nombre: 'Anteojos de repuesto y pilas para audífonos', unidad: 'u.', soloSi: 'anteojos', buscar: null },

  { id: 'energia-linternas', cat: 'energia', nombre: 'Linternas', corto: 'Linternas', unidad: 'u.', por: 'persona', buscar: 'linterna led' },
  { id: 'energia-pilas', cat: 'energia', nombre: 'Pilas', corto: 'Pilas', unidad: 'u.', vence: true, buscar: 'pilas aa' },
  { id: 'energia-powerbank', cat: 'energia', nombre: 'Cargador externo (power bank)', corto: 'Cargador externo', unidad: 'u.', ref: 'Se descarga solo con el tiempo: conviene recargarlo cada tanto.', revisar: 3, buscar: 'power bank' },
  { id: 'energia-velas', cat: 'energia', nombre: 'Velas y fósforos', corto: 'Velas y fósforos', unidad: 'u.', buscar: 'velas' },
  { id: 'energia-dinamo', cat: 'energia', nombre: 'Linterna a dínamo', unidad: 'u.', buscar: 'linterna dinamo' },
  { id: 'energia-anafe', cat: 'energia', nombre: 'Anafe de camping con garrafa', unidad: 'u.', ref: 'Para hervir agua si no hay luz ni gas.', buscar: 'anafe camping garrafa' },
  { id: 'energia-ups', cat: 'energia', nombre: 'UPS para el equipo de la persona electrodependiente', unidad: 'u.', soloSi: 'electro', por: 'electro', buscar: 'ups' },

  { id: 'com-radio', cat: 'comunicacion', nombre: 'Radio AM/FM a pilas', corto: 'Radio a pilas', unidad: 'u.', ref: 'Las radios locales avisan alertas y puntos de ayuda.', buscar: 'radio am fm pilas' },
  { id: 'com-silbato', cat: 'comunicacion', nombre: 'Silbato', unidad: 'u.', por: 'persona', buscar: 'silbato' },
  { id: 'com-papel', cat: 'comunicacion', nombre: 'Lista de teléfonos en papel', unidad: 'u.', revisar: 3, buscar: null },

  { id: 'doc-carpeta', cat: 'documentos', nombre: 'Carpeta hermética con la documentación', corto: 'Carpeta con documentos', unidad: 'u.', ref: 'Documentos, actas, recetas, alergias, grupo y factor de cada uno. En altura y a mano.', revisar: 3, buscar: 'carpeta impermeable documentos' },
  { id: 'doc-digital', cat: 'documentos', nombre: 'Copia digital (pendrive con contraseña o nube)', unidad: 'u.', revisar: 3, buscar: 'pendrive' },
  { id: 'doc-efectivo', cat: 'documentos', nombre: 'Efectivo de reserva', unidad: '$', ref: 'Si no hay luz ni señal, el QR no anda.', buscar: null },

  { id: 'mochila', cat: 'mochilas', nombre: 'Mochilas de escape', corto: 'Mochilas', unidad: 'u.', por: 'persona', ref: 'De no más del 15% del peso de quien la lleva. Una mochila común, nada táctico.', revisar: 3, buscar: 'mochila' },
  { id: 'mochila-extras', cat: 'mochilas', nombre: 'Navaja, bolsas gruesas y soga', unidad: 'u.', buscar: 'navaja multiuso' },
  { id: 'mascotas-transporte', cat: 'mochilas', nombre: 'Correa o transportadora y libreta sanitaria de las mascotas', unidad: 'u.', soloSi: 'mascotas', por: 'animal', buscar: 'transportadora mascotas' },

  { id: 'casa-herramientas', cat: 'casa', nombre: 'Caja de herramientas básica', corto: 'Herramientas', unidad: 'u.', ref: 'Pinza, destornillador, martillo.', buscar: 'caja herramientas' },
  { id: 'casa-fluo', cat: 'casa', nombre: 'Pintura fluorescente para señalizar tablero y gas', unidad: 'u.', buscar: 'pintura fluorescente' },
  { id: 'casa-fijaciones', cat: 'casa', nombre: 'Escuadras y tarugos para fijar muebles pesados', unidad: 'u.', buscar: 'escuadras fijar muebles' },

  { id: 'saber-potabilizar', cat: 'saberes', nombre: 'Sabemos potabilizar: hervir fuerte 5 minutos, o 2 gotas de lavandina por litro si tiene 50 g de cloro por litro.', saber: true },
  { id: 'saber-termica', cat: 'saberes', nombre: 'Varios sabemos bajar la térmica y cerrar la llave del gas.', saber: true },
  { id: 'saber-pas', cat: 'saberes', nombre: 'Conocemos la regla PAS: proteger, avisar, socorrer.', saber: true },
  { id: 'saber-encuentro', cat: 'saberes', nombre: 'Tenemos un punto de encuentro acordado.', saber: true },
  { id: 'saber-mochilas', cat: 'saberes', nombre: 'Practicamos salir con las mochilas.', saber: true }
];

// Mascotas. agua: litros por día por animal, aproximado (depende del tamaño).
// transporte: necesita correa o transportadora para salir.
export const ANIMALES = [
  { id: 'perro', nombre: 'Perro', plural: 'perros', agua: 1, transporte: true },
  { id: 'gato', nombre: 'Gato', plural: 'gatos', agua: 0.25, transporte: true },
  { id: 'ave', nombre: 'Ave', plural: 'aves', agua: 0.05, transporte: true },
  { id: 'conejo', nombre: 'Conejo', plural: 'conejos', agua: 0.3, transporte: true },
  { id: 'roedor', nombre: 'Hámster o cobayo', plural: 'hámsters o cobayos', agua: 0.1, transporte: true },
  { id: 'tortuga', nombre: 'Tortuga', plural: 'tortugas', agua: 0.05, transporte: true },
  { id: 'pez', nombre: 'Pez', plural: 'peces', agua: 0, transporte: false },
  { id: 'otro', nombre: 'Otro', plural: 'otros animales', agua: 0.2, transporte: true }
];

// Para cuántos días se calculan el agua y la comida. Es una referencia para las cuentas, no un plazo.
export const DIAS_RESERVA = [3, 5, 7, 10, 14];

// La grilla de "qué ya tienen en casa": 4 filas de 3.
export const INICIALES = [
  'energia-linternas', 'mochila', 'doc-carpeta',
  'agua-cantimploras', 'energia-powerbank', 'botiquin-gasas',
  'agua-litros', 'comida-noperecedera', 'energia-pilas',
  'com-radio', 'energia-velas', 'casa-herramientas'
];

// Lo que se tildó en la V01 pasa al inventario de la V02.
export const MIGRACION = {
  'agua-72': 'agua-litros', 'agua-14': 'agua-litros', 'agua-lavandina': 'agua-lavandina', 'agua-pastillas': 'agua-pastillas',
  'agua-filtro': 'agua-filtro', 'agua-saber': 'saber-potabilizar',
  'carpeta-armada': 'doc-carpeta', 'carpeta-digital': 'doc-digital', 'plata-efectivo': 'doc-efectivo',
  'botiquin-trauma': 'botiquin-gasas', 'botiquin-antisepticos': 'botiquin-antisepticos', 'botiquin-proteccion': 'botiquin-proteccion',
  'botiquin-medicacion': 'botiquin-medicacion', 'botiquin-manta': 'botiquin-manta', 'botiquin-saber': 'saber-pas',
  'comida-72': 'comida-noperecedera', 'comida-14': 'comida-noperecedera', 'comida-frascos': 'comida-frascos',
  'comida-bebe': 'comida-bebe', 'comida-mascotas': 'comida-mascotas',
  'energia-linternas': 'energia-linternas', 'energia-powerbank': 'energia-powerbank', 'energia-termica': 'saber-termica',
  'energia-ups': 'energia-ups', 'energia-dinamo': 'energia-dinamo', 'energia-anafe': 'energia-anafe',
  'com-papel': 'com-papel', 'com-radio': 'com-radio', 'com-silbato': 'com-silbato',
  'mochila-una': 'mochila', 'mochila-contenido': 'mochila-extras', 'mochila-practica': 'saber-mochilas',
  'casa-tablero': 'saber-termica', 'casa-encuentro': 'saber-encuentro', 'casa-herramientas': 'casa-herramientas',
  'casa-muebles': 'casa-fijaciones'
};

export const GRUPOS_RED = [
  { id: 'familia', nombre: 'Familia' },
  { id: 'vecinos', nombre: 'Vecinos' },
  { id: 'brigada', nombre: 'Brigada u organización' },
  { id: 'otros', nombre: 'Otros' }
];

// Mensajes armados para escribirle a la red. {direccion} y {encuentro} se completan solos.
export const MENSAJES = [
  { id: 'consulta', nombre: '¿Están bien?', texto: 'Hola, ¿están bien? ¿Necesitan algo?' },
  { id: 'bien', nombre: 'Estamos bien', texto: 'Hola, nosotros estamos bien.' },
  { id: 'ayuda', nombre: 'Necesitamos ayuda', texto: 'Necesitamos ayuda. Estamos en {direccion}.' },
  { id: 'encuentro', nombre: 'Punto de encuentro', texto: 'Nos encontramos en {encuentro}.' },
  { id: 'carga', nombre: 'Ofrecer punto de carga', texto: 'En casa tenemos energía para cargar celulares y guardar remedios en la heladera. Estamos en {direccion}.' }
];

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
    id: 'inundacion', nombre: 'Inundación', pasos: [
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
      'Cargá el celular y los cargadores externos. Guardá batería para las alertas.',
      'Tené el número de Defensa Civil y seguí sus indicaciones.'
    ]
  },
  {
    id: 'incendio', nombre: 'Incendio', pasos: [
      'Salí primero, sin volver por nada. Llamá recién estando afuera.',
      'Tocá la puerta con el dorso de la mano: si está caliente, no la abras y buscá otra salida.',
      'Moverse agachado, por debajo del humo. Nunca uses el ascensor.',
      'Ayudá a salir a chicos y a personas con movilidad reducida.',
      'Cuéntense en el punto de encuentro. Si falta alguien, no vuelvas a entrar: llamá a los bomberos.'
    ]
  },
  {
    id: 'sismo', nombre: 'Sismo', pasos: [
      'Agachate, cubrite y aferrate bajo un mueble sólido. El marco de la puerta ya no es lo recomendado.',
      'Si no hay mueble, en cuclillas contra una pared interior, lejos de las ventanas.',
      'Después: si hay olor a gas, no toques interruptores ni prendas fuego.',
      'Cortá el gas igual, y el agua si hay pérdida.'
    ]
  },
  {
    id: 'calor', nombre: 'Ola de calor', pasos: [
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
  { tema: 'Planes', items: ['plan familiar de emergencia', 'mochila de emergencia'] }
];

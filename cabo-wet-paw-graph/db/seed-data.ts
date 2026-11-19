/**
 * Datos del seed de Cabo Wet Paw (separados de la lógica de carga en seed.ts).
 *
 * Todo es DETERMINISTA: los catálogos, clientes, mascotas y referidos están
 * escritos a mano, y las compras y servicios se generan con un PRNG con semilla
 * fija (mulberry32). Cada `npm run seed` produce exactamente el mismo grafo, así
 * la demo siempre muestra las mismas recomendaciones y el mismo ranking.
 */

// ───────────────────────── Catálogos ─────────────────────────

export const categorias = ['Shampoos', 'Alimentos', 'Accesorios', 'Juguetes'] as const;

export interface ProductoSeed {
  sku: string;
  nombre: string;
  precio: number;
  especie: 'perro' | 'gato' | 'ambos';
  stock: number;
  categoria: (typeof categorias)[number];
}

export const productos: ProductoSeed[] = [
  // Shampoos
  { sku: 'SH-01', nombre: 'Shampoo deslanador para doble capa', precio: 289, especie: 'perro', stock: 25, categoria: 'Shampoos' },
  { sku: 'SH-02', nombre: 'Shampoo hipoalergénico de avena', precio: 249, especie: 'ambos', stock: 30, categoria: 'Shampoos' },
  { sku: 'SH-03', nombre: 'Shampoo con acondicionador para pelo rizado', precio: 269, especie: 'perro', stock: 18, categoria: 'Shampoos' },
  { sku: 'SH-04', nombre: 'Shampoo en seco para gato', precio: 219, especie: 'gato', stock: 15, categoria: 'Shampoos' },
  { sku: 'SH-05', nombre: 'Shampoo desenredante para pelo largo', precio: 259, especie: 'ambos', stock: 12, categoria: 'Shampoos' },
  { sku: 'SH-06', nombre: 'Shampoo para cachorro sin lágrimas', precio: 199, especie: 'perro', stock: 20, categoria: 'Shampoos' },
  // Alimentos
  { sku: 'AL-01', nombre: 'Croquetas raza grande adulto 15 kg', precio: 1349, especie: 'perro', stock: 22, categoria: 'Alimentos' },
  { sku: 'AL-02', nombre: 'Croquetas raza pequeña adulto 4 kg', precio: 549, especie: 'perro', stock: 28, categoria: 'Alimentos' },
  { sku: 'AL-03', nombre: 'Alimento húmedo para gato (12 latas)', precio: 399, especie: 'gato', stock: 35, categoria: 'Alimentos' },
  { sku: 'AL-04', nombre: 'Croquetas para gato esterilizado 3 kg', precio: 489, especie: 'gato', stock: 20, categoria: 'Alimentos' },
  { sku: 'AL-05', nombre: 'Premios dentales para perro', precio: 179, especie: 'perro', stock: 40, categoria: 'Alimentos' },
  { sku: 'AL-06', nombre: 'Croquetas raza mediana adulto 8 kg', precio: 899, especie: 'perro', stock: 16, categoria: 'Alimentos' },
  // Accesorios
  { sku: 'AC-01', nombre: 'Arnés acolchado talla M', precio: 459, especie: 'perro', stock: 14, categoria: 'Accesorios' },
  { sku: 'AC-02', nombre: 'Cepillo deslanador', precio: 329, especie: 'ambos', stock: 24, categoria: 'Accesorios' },
  { sku: 'AC-03', nombre: 'Rascador de cartón para gato', precio: 239, especie: 'gato', stock: 18, categoria: 'Accesorios' },
  { sku: 'AC-04', nombre: 'Collar ajustable con placa', precio: 189, especie: 'ambos', stock: 30, categoria: 'Accesorios' },
  { sku: 'AC-05', nombre: 'Cama ortopédica talla G', precio: 1199, especie: 'perro', stock: 8, categoria: 'Accesorios' },
  { sku: 'AC-06', nombre: 'Arenero con tapa para gato', precio: 649, especie: 'gato', stock: 10, categoria: 'Accesorios' },
  // Juguetes
  { sku: 'JU-01', nombre: 'Pelota de hule resistente', precio: 159, especie: 'perro', stock: 35, categoria: 'Juguetes' },
  { sku: 'JU-02', nombre: 'Cuerda trenzada para morder', precio: 129, especie: 'perro', stock: 30, categoria: 'Juguetes' },
  { sku: 'JU-03', nombre: 'Ratón de juguete con catnip', precio: 89, especie: 'gato', stock: 40, categoria: 'Juguetes' },
  { sku: 'JU-04', nombre: 'Varita con plumas para gato', precio: 119, especie: 'gato', stock: 25, categoria: 'Juguetes' },
  { sku: 'JU-05', nombre: 'Peluche chillón para perro pequeño', precio: 149, especie: 'perro', stock: 22, categoria: 'Juguetes' },
  { sku: 'JU-06', nombre: 'Juguete dispensador de premios', precio: 279, especie: 'ambos', stock: 5, categoria: 'Juguetes' },
];

export const razas: { nombre: string; especie: 'perro' | 'gato' }[] = [
  { nombre: 'Golden Retriever', especie: 'perro' },
  { nombre: 'Labrador', especie: 'perro' },
  { nombre: 'Pastor Alemán', especie: 'perro' },
  { nombre: 'Husky Siberiano', especie: 'perro' },
  { nombre: 'Chihuahua', especie: 'perro' },
  { nombre: 'Schnauzer Mini', especie: 'perro' },
  { nombre: 'Poodle', especie: 'perro' },
  { nombre: 'French Poodle Toy', especie: 'perro' },
  { nombre: 'Shih Tzu', especie: 'perro' },
  { nombre: 'Mestizo', especie: 'perro' },
  { nombre: 'Doméstico de pelo corto', especie: 'gato' },
  { nombre: 'Persa', especie: 'gato' },
  { nombre: 'Siamés', especie: 'gato' },
];

export const servicios = [
  { id: 'srv-bano', nombre: 'Baño', precio: 250 },
  { id: 'srv-bano-corte', nombre: 'Baño y corte', precio: 420 },
  { id: 'srv-deslanado', nombre: 'Deslanado', precio: 480 },
  { id: 'srv-unas', nombre: 'Corte de uñas', precio: 120 },
  { id: 'srv-guarderia', nombre: 'Guardería por día', precio: 350 },
  { id: 'srv-hotel', nombre: 'Hotel por noche', precio: 550 },
];

// ───────────────────────── Clientes ─────────────────────────

export interface ClienteSeed {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  fechaAlta: string;
}

const c = (n: number, nombre: string, email: string | null, fechaAlta: string): ClienteSeed => ({
  id: `cli-${String(n).padStart(2, '0')}`,
  nombre,
  telefono: `624${String(1000000 + n * 137).padStart(7, '0')}`, // lada de Los Cabos
  email,
  fechaAlta,
});

export const clientes: ClienteSeed[] = [
  c(1, 'María Fernanda López', 'mafer.lopez@example.com', '2024-01-15'),
  c(2, 'José Luis Hernández', 'joseluis.h@example.com', '2024-02-03'),
  c(3, 'Ana Sofía Martínez', null, '2024-02-20'),
  c(4, 'Carlos Alberto Ramírez', 'carlos.ramirez@example.com', '2024-03-08'),
  c(5, 'Guadalupe Torres', null, '2024-03-30'),
  c(6, 'Juan Pablo García', 'jp.garcia@example.com', '2024-04-12'),
  c(7, 'Daniela Flores', 'dani.flores@example.com', '2024-05-02'),
  c(8, 'Luis Miguel Sánchez', null, '2024-05-25'),
  c(9, 'Alejandra Castillo', 'ale.castillo@example.com', '2024-06-14'),
  c(10, 'Ricardo Morales', null, '2024-07-01'),
  c(11, 'Fernanda Ruiz', 'fer.ruiz@example.com', '2024-07-19'),
  c(12, 'Jorge Mendoza', null, '2024-08-05'),
  c(13, 'Paola Jiménez', 'paola.jimenez@example.com', '2024-08-22'),
  c(14, 'Miguel Ángel Vargas', null, '2024-09-10'),
  c(15, 'Valeria Ortiz', 'vale.ortiz@example.com', '2024-10-01'),
  c(16, 'Roberto Aguilar', null, '2024-11-11'),
  c(17, 'Karla Domínguez', 'karla.dominguez@example.com', '2024-12-03'),
  c(18, 'Eduardo Navarro', null, '2025-01-20'),
  c(19, 'Mariana Gutiérrez', 'mariana.gtz@example.com', '2025-02-14'),
  c(20, 'Arturo Romero', null, '2025-03-09'),
  c(21, 'Ximena Salazar', 'ximena.salazar@example.com', '2026-09-02'), // demo
  c(22, 'Héctor Cruz', null, '2026-09-20'), // demo
  c(23, 'Lucía Reyes', 'lucia.reyes@example.com', '2026-10-05'), // demo
  c(24, 'Diego Herrera', null, '2025-10-03'),
  c(25, 'Sofía Medina', 'sofia.medina@example.com', '2025-11-21'),
];

/** Clientes con pocas o ninguna compra: sus recomendaciones lucen en la demo. */
export const clientesDemo = ['cli-21', 'cli-22', 'cli-23'];

// ───────────────────────── Mascotas ─────────────────────────

export interface MascotaSeed {
  id: string;
  clienteId: string;
  nombre: string;
  especie: 'perro' | 'gato';
  raza: string;
  tamano: 'chico' | 'mediano' | 'grande';
  tipoPelo: 'corto' | 'largo' | 'doble capa' | 'rizado';
  fechaNacimiento: string | null;
}

type FilaMascota = [number, number, string, 'perro' | 'gato', string, MascotaSeed['tamano'], MascotaSeed['tipoPelo'], string | null];

const filasMascotas: FilaMascota[] = [
  [1, 1, 'Max', 'perro', 'Golden Retriever', 'grande', 'doble capa', '2019-04-12'],
  [2, 1, 'Luna', 'gato', 'Siamés', 'chico', 'corto', '2021-08-03'],
  [3, 2, 'Rocky', 'perro', 'Pastor Alemán', 'grande', 'doble capa', '2018-11-20'],
  [4, 3, 'Coco', 'perro', 'French Poodle Toy', 'chico', 'rizado', '2020-02-14'],
  [5, 3, 'Nala', 'gato', 'Persa', 'chico', 'largo', '2019-06-30'],
  [6, 4, 'Thor', 'perro', 'Husky Siberiano', 'grande', 'doble capa', '2020-09-09'],
  [7, 5, 'Bella', 'perro', 'Labrador', 'grande', 'doble capa', '2017-05-22'],
  [8, 6, 'Kira', 'perro', 'Golden Retriever', 'grande', 'doble capa', '2021-01-15'],
  [9, 7, 'Chispa', 'perro', 'Chihuahua', 'chico', 'corto', '2022-03-08'],
  [10, 7, 'Pelusa', 'gato', 'Doméstico de pelo corto', 'chico', 'corto', '2020-12-01'],
  [11, 8, 'Bruno', 'perro', 'Labrador', 'grande', 'doble capa', '2019-07-19'],
  [12, 9, 'Lola', 'perro', 'Shih Tzu', 'chico', 'largo', '2020-10-10'],
  [13, 10, 'Zeus', 'perro', 'Pastor Alemán', 'grande', 'doble capa', '2018-04-04'],
  [14, 11, 'Simba', 'gato', 'Doméstico de pelo corto', 'mediano', 'corto', '2019-09-25'],
  [15, 11, 'Milo', 'gato', 'Siamés', 'chico', 'corto', '2022-06-11'],
  [16, 12, 'Toby', 'perro', 'Schnauzer Mini', 'chico', 'largo', '2021-04-02'],
  [17, 13, 'Princesa', 'perro', 'Poodle', 'mediano', 'rizado', '2019-03-17'],
  [18, 14, 'Rex', 'perro', 'Husky Siberiano', 'grande', 'doble capa', '2020-01-28'],
  [19, 15, 'Mía', 'perro', 'Shih Tzu', 'chico', 'largo', '2021-11-05'],
  [20, 15, 'Oliver', 'gato', 'Persa', 'chico', 'largo', '2020-05-14'],
  [21, 16, 'Duque', 'perro', 'Golden Retriever', 'grande', 'doble capa', '2018-08-08'],
  [22, 17, 'Canica', 'perro', 'Mestizo', 'mediano', 'corto', '2020-07-07'],
  [23, 17, 'Tom', 'gato', 'Doméstico de pelo corto', 'mediano', 'corto', '2018-02-20'],
  [24, 18, 'Oso', 'perro', 'Labrador', 'grande', 'doble capa', '2021-10-30'],
  [25, 19, 'Frida', 'gato', 'Siamés', 'chico', 'corto', '2021-03-03'],
  [26, 19, 'Kiara', 'perro', 'Chihuahua', 'chico', 'corto', '2022-08-18'],
  [27, 20, 'Sombra', 'perro', 'Pastor Alemán', 'grande', 'doble capa', '2019-12-12'],
  [28, 20, 'Tito', 'perro', 'Mestizo', 'grande', 'corto', '2017-09-01'],
  [29, 21, 'Canela', 'perro', 'Golden Retriever', 'grande', 'doble capa', '2023-02-10'], // demo
  [30, 22, 'Mishi', 'gato', 'Persa', 'chico', 'largo', '2022-04-22'], // demo
  [31, 23, 'Nieve', 'perro', 'Husky Siberiano', 'grande', 'doble capa', '2022-12-24'], // demo
  [32, 24, 'Rufo', 'perro', 'Schnauzer Mini', 'chico', 'largo', '2020-06-06'],
  [33, 25, 'Lucky', 'perro', 'Poodle', 'mediano', 'rizado', '2021-05-05'],
  [34, 25, 'Michi', 'gato', 'Doméstico de pelo corto', 'chico', 'corto', null],
  [35, 2, 'Benito', 'perro', 'Mestizo', 'mediano', 'corto', '2021-02-02'],
];

export const mascotas: MascotaSeed[] = filasMascotas.map(([n, cli, nombre, especie, raza, tamano, tipoPelo, fechaNacimiento]) => ({
  id: `m-${String(n).padStart(2, '0')}`,
  clienteId: `cli-${String(cli).padStart(2, '0')}`,
  nombre,
  especie,
  raza,
  tamano,
  tipoPelo,
  fechaNacimiento,
}));

// ───────────────────────── Referidos ─────────────────────────
// Cadena A (estrella: María Fernanda, cli-01): 01 → 02 → 06 → 08 → 09 (4 niveles)
//                                             01 → 03 → 10 → 11 (3 niveles)
// Cadena B (Paola, cli-13): 13 → 14 → 15 → 16 → 17 (4 niveles)
// Cadena C: 19 → 20 → 21 (Ximena, demo)
// Sin red ni referidor: cli-22, cli-24, cli-25.

export const referidos: { de: string; a: string; fecha: string }[] = [
  ['01', '02', '2024-02-03'], ['01', '03', '2024-02-20'], ['01', '04', '2024-03-08'], ['01', '05', '2024-03-30'],
  ['02', '06', '2024-04-12'], ['02', '07', '2024-05-02'], ['06', '08', '2024-05-25'], ['08', '09', '2024-06-14'],
  ['03', '10', '2024-07-01'], ['10', '11', '2024-07-19'], ['04', '12', '2024-08-05'], ['05', '23', '2026-10-05'],
  ['13', '14', '2024-09-10'], ['14', '15', '2024-10-01'], ['15', '16', '2024-11-11'], ['16', '17', '2024-12-03'],
  ['13', '18', '2025-01-20'],
  ['19', '20', '2025-03-09'], ['20', '21', '2026-09-02'],
].map(([de, a, fecha]) => ({ de: `cli-${de}`, a: `cli-${a}`, fecha }));

// ───────────────────────── Generador determinista ─────────────────────────

/** PRNG mulberry32: misma semilla ⇒ misma secuencia en cada ejecución. */
function mulberry32(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(20261118);
const entre = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1));

/** Fecha-hora ISO entre `desde` y el 2026-11-10, a una hora de tienda (9 a 19 h, UTC-7). */
function fechaHora(desde: string): string {
  const ini = Date.parse(`${desde}T00:00:00Z`);
  const fin = Date.parse('2026-11-10T00:00:00Z');
  const dia = new Date(ini + Math.floor(rnd() * Math.max(fin - ini, 86400000)));
  dia.setUTCHours(16 + entre(0, 10), entre(0, 59), 0, 0);
  return dia.toISOString();
}

/**
 * Patrones de compra por perfil de mascota (lo que hace que las recomendaciones
 * tengan sentido): [sku, probabilidad].
 */
function canasta(m: MascotaSeed): [string, number][] {
  if (m.especie === 'gato') {
    const base: [string, number][] = [['AC-03', 0.85], ['AL-03', 0.85], ['JU-03', 0.45], ['AL-04', 0.4], ['JU-04', 0.3], ['AC-06', 0.25]];
    if (m.tipoPelo === 'largo') base.push(['SH-04', 0.7], ['AC-02', 0.6], ['SH-05', 0.4]);
    return base;
  }
  const items: [string, number][] = [];
  if (m.tipoPelo === 'doble capa') items.push(['SH-01', 0.9], ['AC-02', 0.8]);
  if (m.tipoPelo === 'rizado') items.push(['SH-03', 0.85], ['SH-02', 0.4]);
  if (m.tipoPelo === 'largo') items.push(['SH-05', 0.75], ['AC-02', 0.45]);
  if (m.tamano === 'grande') items.push(['AL-01', 0.9], ['JU-01', 0.8], ['AC-05', 0.3], ['JU-02', 0.3]);
  if (m.tamano === 'mediano') items.push(['AL-06', 0.8], ['JU-02', 0.6], ['AC-01', 0.5]);
  if (m.tamano === 'chico') items.push(['AL-02', 0.85], ['JU-05', 0.65], ['SH-06', 0.25]);
  items.push(['AL-05', 0.3], ['AC-04', 0.2], ['JU-06', 0.15]);
  return items;
}

export interface CompraSeed {
  clienteId: string;
  sku: string;
  fecha: string;
  cantidad: number;
}

function generarCompras(): CompraSeed[] {
  const compras: CompraSeed[] = [];
  const alta = new Map(clientes.map((cl) => [cl.id, cl.fechaAlta]));
  for (const m of mascotas) {
    if (clientesDemo.includes(m.clienteId)) continue;
    for (const [sku, p] of canasta(m)) {
      if (rnd() >= p) continue;
      // Algunos consumibles (alimento, shampoo) se recompran.
      const consumible = sku.startsWith('AL') || sku.startsWith('SH');
      const veces = consumible && rnd() < 0.25 ? 2 : 1;
      for (let i = 0; i < veces; i++) {
        compras.push({ clienteId: m.clienteId, sku, fecha: fechaHora(alta.get(m.clienteId)!), cantidad: consumible ? entre(1, 2) : 1 });
      }
    }
  }
  // Clientes de demo: pocas compras a propósito.
  compras.push({ clienteId: 'cli-22', sku: 'AL-03', fecha: '2026-09-25T18:10:00.000Z', cantidad: 1 });
  compras.push({ clienteId: 'cli-23', sku: 'SH-01', fecha: '2026-10-08T20:30:00.000Z', cantidad: 1 });
  return compras;
}

export const compras = generarCompras();

// ───────────────────────── Servicios recibidos ─────────────────────────

export interface ServicioRecibidoSeed {
  mascotaId: string;
  servicioId: string;
  fecha: string;
}

function generarServicios(): ServicioRecibidoSeed[] {
  const salida: ServicioRecibidoSeed[] = [];
  const alta = new Map(clientes.map((cl) => [cl.id, cl.fechaAlta]));
  for (const m of mascotas) {
    const desde = alta.get(m.clienteId)!;
    const principal = m.tipoPelo === 'doble capa' ? 'srv-deslanado' : m.tipoPelo === 'corto' ? 'srv-bano' : 'srv-bano-corte';
    salida.push({ mascotaId: m.id, servicioId: principal, fecha: fechaHora(desde) });
    if (rnd() < 0.35) salida.push({ mascotaId: m.id, servicioId: 'srv-unas', fecha: fechaHora(desde) });
    if (m.especie === 'perro' && rnd() < 0.3) salida.push({ mascotaId: m.id, servicioId: 'srv-guarderia', fecha: fechaHora(desde) });
    if (rnd() < 0.15) salida.push({ mascotaId: m.id, servicioId: 'srv-hotel', fecha: fechaHora(desde) });
  }
  return salida;
}

export const serviciosRecibidos = generarServicios();

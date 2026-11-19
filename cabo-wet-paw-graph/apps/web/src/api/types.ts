// Tipos de las respuestas de la API (se declaran con `type` para que Table de Astryx los acepte como Record<string, unknown>).

export type Especie = 'perro' | 'gato';
export type EspecieProducto = Especie | 'ambos';

export type ClienteFila = {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  fechaAlta: string;
  mascotas: number;
  compras: number;
};

export type Mascota = {
  id: string;
  nombre: string;
  especie: Especie;
  tamano: 'chico' | 'mediano' | 'grande';
  tipoPelo: string;
  fechaNacimiento: string | null;
  raza: string | null;
};

export type CompraFila = { sku: string; nombre: string; precio: number; cantidad: number; fecha: string };

export type NodoCliente = { id: string; nombre: string };

export type FichaCliente = {
  cliente: { id: string; nombre: string; telefono: string; email: string | null; fechaAlta: string };
  referidoPor: NodoCliente | null;
  mascotas: Mascota[];
  ultimasCompras: CompraFila[];
};

export type Recomendacion = {
  sku: string;
  nombre: string;
  precio: number;
  categoria: string;
  afinidad: number;
  duenos: number;
  motivo: string;
};

export type RespuestaRecomendaciones = { mascota: Mascota; recomendaciones: Recomendacion[] };

export type MiembroRed = NodoCliente & { nivel: number; puntos: number };
export type RedReferidos = {
  clienteId: string;
  totalReferidos: number;
  puntosTotales: number;
  niveles: { nivel: number; puntos: number; miembros: MiembroRed[] }[];
};

export type Cadena = { clienteId: string; cadena: NodoCliente[]; llegoPorSuCuenta: boolean };

export type RankingFila = NodoCliente & { tamanoRed: number; puntos: number };

export type Camino = { camino: NodoCliente[]; saltos: number };

export type Producto = {
  sku: string;
  nombre: string;
  precio: number;
  especie: EspecieProducto;
  stock: number;
  categoria: string;
};

export type Categoria = { nombre: string; productos: number };

export type Resumen = { clientes: number; mascotas: number; productos: number; compras: number };

export type Health = {
  ok: boolean;
  estado: string;
  uri: string;
  database: string;
  servidor?: string | null;
  latenciaMs?: number;
  nube?: boolean;
  error?: string;
};

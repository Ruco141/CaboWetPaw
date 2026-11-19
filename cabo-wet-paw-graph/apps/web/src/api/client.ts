/**
 * Cliente HTTP tipado contra la API. Todas las llamadas pasan por `pedir()`,
 * que convierte las respuestas de error en `ApiError` con el mensaje que envía
 * el servidor (p. ej. 409 "Este cliente ya fue referido por otra persona").
 */
import type {
  Cadena, Camino, Categoria, ClienteFila, FichaCliente, Health, Producto, RankingFila,
  RedReferidos, RespuestaRecomendaciones, Resumen,
} from './types';

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(public status: number, message: string, public detalles?: { campo: string; mensaje: string }[]) {
    super(message);
  }
}

async function pedir<T>(metodo: string, ruta: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${ruta}`, {
      method: metodo,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, `No se pudo contactar la API en ${API_URL}. ¿Está corriendo npm run dev?`);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const detalles = json?.detalles as ApiError['detalles'];
    const mensaje = detalles?.length
      ? `${json.error}: ${detalles.map((d) => (d.campo ? `${d.campo} — ${d.mensaje}` : d.mensaje)).join('; ')}`
      : (json?.error ?? `Error ${res.status}`);
    throw new ApiError(res.status, mensaje, detalles);
  }
  return json as T;
}

const qs = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') s.set(k, String(v));
  const t = s.toString();
  return t ? `?${t}` : '';
};

export const api = {
  health: () => pedir<Health>('GET', '/health'),
  resumen: () => pedir<Resumen>('GET', '/resumen'),

  clientes: (buscar?: string) => pedir<ClienteFila[]>('GET', `/clientes${qs({ buscar })}`),
  ficha: (id: string) => pedir<FichaCliente>('GET', `/clientes/${encodeURIComponent(id)}`),
  crearCliente: (datos: { nombre: string; telefono: string; email?: string; referidoPor?: string }) =>
    pedir<{ id: string }>('POST', '/clientes', datos),
  actualizarCliente: (id: string, datos: { nombre?: string; telefono?: string; email?: string }) =>
    pedir('PATCH', `/clientes/${encodeURIComponent(id)}`, datos),
  eliminarCliente: (id: string) => pedir('DELETE', `/clientes/${encodeURIComponent(id)}`),

  recomendaciones: (mascotaId: string, limite = 5) =>
    pedir<RespuestaRecomendaciones>('GET', `/mascotas/${encodeURIComponent(mascotaId)}/recomendaciones${qs({ limite })}`),

  productos: (filtros: { categoria?: string; especie?: string } = {}) => pedir<Producto[]>('GET', `/productos${qs(filtros)}`),
  crearProducto: (p: Producto) => pedir('POST', '/productos', p),
  actualizarProducto: (sku: string, p: Partial<Producto>) => pedir('PATCH', `/productos/${encodeURIComponent(sku)}`, p),
  eliminarProducto: (sku: string) => pedir('DELETE', `/productos/${encodeURIComponent(sku)}`),
  categorias: () => pedir<Categoria[]>('GET', '/categorias'),

  comprar: (datos: { clienteId: string; sku: string; cantidad: number }) =>
    pedir<{ sku: string; stockRestante: number }>('POST', '/compras', datos),

  red: (id: string) => pedir<RedReferidos>('GET', `/clientes/${encodeURIComponent(id)}/referidos`),
  cadena: (id: string) => pedir<Cadena>('GET', `/clientes/${encodeURIComponent(id)}/cadena`),
  agregarReferido: (id: string, referidoId: string) =>
    pedir('POST', `/clientes/${encodeURIComponent(id)}/referidos`, { referidoId }),
  ranking: (limite = 10) => pedir<RankingFila[]>('GET', `/referidos/ranking${qs({ limite })}`),
  camino: (desde: string, hasta: string) => pedir<Camino>('GET', `/referidos/camino${qs({ desde, hasta })}`),
};

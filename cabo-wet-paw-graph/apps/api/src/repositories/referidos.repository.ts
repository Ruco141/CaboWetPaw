import { escribir, int, leer } from '../db/driver';
import * as Q from '../queries/referidos.cypher';
import { conflicto, HttpError, noEncontrado } from '../middleware/errores';
import { existeCliente } from './clientes.repository';

interface NodoCliente {
  id: string;
  nombre: string;
}

export async function redDeReferidos(clienteId: string) {
  if (!(await existeCliente(clienteId))) throw noEncontrado('Cliente no encontrado');
  const red = await leer<NodoCliente & { nivel: number; puntos: number }>(Q.RED_REFERIDOS.cypher, { clienteId });
  const niveles = [1, 2, 3].map((nivel) => {
    const miembros = red.filter((r) => r.nivel === nivel);
    return { nivel, miembros, puntos: miembros.reduce((s, r) => s + r.puntos, 0) };
  });
  return { clienteId, totalReferidos: red.length, puntosTotales: red.reduce((s, r) => s + r.puntos, 0), niveles, red };
}

export async function cadenaHaciaArriba(clienteId: string) {
  if (!(await existeCliente(clienteId))) throw noEncontrado('Cliente no encontrado');
  const [fila] = await leer<{ cadena: NodoCliente[] }>(Q.CADENA_REFERIDOS.cypher, { clienteId });
  // Sin fila = nadie lo refirió; la cadena es solo él mismo.
  return { clienteId, cadena: fila?.cadena ?? [], llegoPorSuCuenta: !fila };
}

export async function ranking(limite: number) {
  return leer<NodoCliente & { tamanoRed: number; puntos: number }>(Q.RANKING_REFERIDORES.cypher, { limite: int(limite) });
}

export async function caminoEntre(desde: string, hasta: string) {
  const [fila] = await leer<{ camino: NodoCliente[]; saltos: number }>(Q.CAMINO_ENTRE_CLIENTES.cypher, { desde, hasta });
  if (!fila) {
    const [a, b] = await Promise.all([existeCliente(desde), existeCliente(hasta)]);
    if (!a || !b) throw noEncontrado('Alguno de los clientes no existe');
    throw noEncontrado('No están conectados por referidos');
  }
  return fila;
}

/**
 * Crea REFIRIO respetando las reglas. Primero se intenta la escritura con las
 * reglas en el WHERE (es la garantía real); solo si no devuelve filas se corre
 * el diagnóstico para explicar cuál regla falló.
 */
export async function crearReferido(referidorId: string, referidoId: string) {
  if (referidorId === referidoId) throw conflicto('Un cliente no puede referirse a sí mismo');
  const [creado] = await escribir(Q.CREAR_REFERIDO.cypher, { referidorId, referidoId });
  if (creado) return creado;

  const [d] = await leer<{ referidorExiste: boolean; referidoExiste: boolean; referidoPor: string | null; creariaCiclo: boolean }>(
    Q.DIAGNOSTICO_REFERIDO.cypher,
    { referidorId, referidoId },
  );
  if (!d.referidorExiste) throw noEncontrado('El cliente referidor no existe');
  if (!d.referidoExiste) throw noEncontrado('El cliente referido no existe');
  if (d.referidoPor) throw conflicto(`Este cliente ya fue referido por otra persona (${d.referidoPor})`);
  if (d.creariaCiclo) throw conflicto('No se permiten ciclos: ese cliente ya está arriba en la cadena de referidos de quien lo quiere referir');
  throw new HttpError(409, 'No se pudo crear el referido');
}

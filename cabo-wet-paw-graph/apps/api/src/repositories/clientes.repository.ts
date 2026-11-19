import { randomUUID } from 'node:crypto';
import { enTx, escribir, leer, transaccionEscritura } from '../db/driver';
import * as Q from '../queries/clientes.cypher';
import { CREAR_REFERIDO } from '../queries/referidos.cypher';
import { noEncontrado } from '../middleware/errores';
import { soloDefinidos } from './util';

export interface ClienteBasico {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  fechaAlta: string;
}

export async function listarClientes(buscar?: string) {
  return leer(Q.LISTAR_CLIENTES.cypher, { buscar: buscar ?? null });
}

export async function fichaCliente(id: string) {
  const [fila] = await leer(Q.FICHA_CLIENTE.cypher, { id });
  if (!fila) throw noEncontrado('Cliente no encontrado');
  return fila;
}

export async function existeCliente(id: string): Promise<boolean> {
  return (await leer(Q.EXISTE_CLIENTE.cypher, { id })).length > 0;
}

/**
 * Crea el cliente y, si viene `referidoPor`, la relación REFIRIO, ambas en una
 * sola transacción: si el referidor no existe se revierte también el cliente.
 * Un cliente recién creado no tiene referidor ni red, así que las reglas de
 * "un solo referidor" y "sin ciclos" se cumplen siempre; aun así se usa la
 * misma consulta CREAR_REFERIDO para no duplicar la lógica.
 */
export async function crearCliente(datos: { nombre: string; telefono: string; email?: string; referidoPor?: string }) {
  const id = randomUUID();
  return transaccionEscritura(async (tx) => {
    const [fila] = await enTx<{ cliente: ClienteBasico }>(tx, Q.CREAR_CLIENTE.cypher, {
      id,
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email ?? null,
    });
    if (datos.referidoPor) {
      const ref = await enTx(tx, CREAR_REFERIDO.cypher, { referidorId: datos.referidoPor, referidoId: id });
      if (ref.length === 0) throw noEncontrado('El cliente indicado en "¿Quién lo refirió?" no existe');
    }
    return fila.cliente;
  });
}

export async function actualizarCliente(id: string, cambios: { nombre?: string; telefono?: string; email?: string }) {
  const [fila] = await escribir<{ cliente: ClienteBasico }>(Q.ACTUALIZAR_CLIENTE.cypher, { id, cambios: soloDefinidos(cambios) });
  if (!fila) throw noEncontrado('Cliente no encontrado');
  return fila.cliente;
}

export async function eliminarCliente(id: string) {
  const [fila] = await escribir(Q.ELIMINAR_CLIENTE.cypher, { id });
  if (!fila) throw noEncontrado('Cliente no encontrado');
  return fila;
}

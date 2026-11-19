import { randomUUID } from 'node:crypto';
import { enTx, escribir, leer, transaccionEscritura } from '../db/driver';
import * as Q from '../queries/mascotas.cypher';
import { conflicto, noEncontrado } from '../middleware/errores';
import { soloDefinidos } from './util';

interface NuevaMascota {
  nombre: string;
  especie: 'perro' | 'gato';
  raza: string;
  tamano: string;
  tipoPelo: string;
  fechaNacimiento?: string;
}

export async function crearMascota(clienteId: string, datos: NuevaMascota) {
  // Consulta previa para responder con el motivo exacto si algo no cuadra.
  const [diag] = await leer<{ clienteExiste: boolean; especieRaza: string | null }>(Q.DIAGNOSTICO_MASCOTA.cypher, {
    clienteId,
    raza: datos.raza,
  });
  if (!diag.clienteExiste) throw noEncontrado('Cliente no encontrado');
  if (!diag.especieRaza) throw noEncontrado(`La raza "${datos.raza}" no existe`);
  if (diag.especieRaza !== datos.especie) {
    throw conflicto(`La raza "${datos.raza}" es de ${diag.especieRaza}, no de ${datos.especie}`);
  }
  const [fila] = await escribir<{ mascota: unknown }>(Q.CREAR_MASCOTA.cypher, {
    clienteId,
    id: randomUUID(),
    ...datos,
    fechaNacimiento: datos.fechaNacimiento ?? null,
  });
  if (!fila) throw conflicto('No se pudo crear la mascota; vuelve a intentarlo');
  return fila.mascota;
}

export async function obtenerMascota(id: string) {
  const [fila] = await leer<{ mascota: { id: string; especie: string; raza: string | null; tamano: string } }>(
    Q.OBTENER_MASCOTA.cypher,
    { id },
  );
  if (!fila) throw noEncontrado('Mascota no encontrada');
  return fila.mascota;
}

/** Varias escrituras dependientes (propiedades + cambio de raza) => una transacción. */
export async function actualizarMascota(
  id: string,
  datos: { nombre?: string; raza?: string; tamano?: string; tipoPelo?: string; fechaNacimiento?: string },
) {
  const { raza, fechaNacimiento, ...resto } = datos;
  await transaccionEscritura(async (tx) => {
    const [fila] = await enTx<{ especie: string }>(tx, Q.ACTUALIZAR_MASCOTA.cypher, {
      id,
      cambios: soloDefinidos(resto),
      fechaNacimiento: fechaNacimiento ?? null,
    });
    if (!fila) throw noEncontrado('Mascota no encontrada');
    if (raza) {
      const cambio = await enTx(tx, Q.CAMBIAR_RAZA_MASCOTA.cypher, { id, raza });
      if (cambio.length === 0) throw conflicto(`La raza "${raza}" no existe o no es de ${fila.especie}`);
    }
  });
  return obtenerMascota(id);
}

export async function eliminarMascota(id: string) {
  const [fila] = await escribir<{ eliminadas: number }>(Q.ELIMINAR_MASCOTA.cypher, { id });
  if (!fila || fila.eliminadas === 0) throw noEncontrado('Mascota no encontrada');
  return fila;
}

export async function registrarServicio(mascotaId: string, servicioId: string) {
  const [fila] = await escribir(Q.REGISTRAR_SERVICIO.cypher, { mascotaId, servicioId });
  if (!fila) throw noEncontrado('Mascota o servicio no encontrado');
  return fila;
}

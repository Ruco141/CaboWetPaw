import { int, leer } from '../db/driver';
import * as Q from '../queries/recomendaciones.cypher';
import { obtenerMascota } from './mascotas.repository';

interface Recomendacion {
  sku: string;
  nombre: string;
  precio: number;
  categoria: string;
  afinidad: number;
}

interface Motivo {
  sku: string;
  duenos: number;
  duenosMismaRaza: number;
  duenosMismoTamano: number;
  raza: string;
  especie: string;
  tamano: string;
}

const PLURAL_ESPECIE: Record<string, string> = { perro: 'perros', gato: 'gatos' };
const PLURAL_TAMANO: Record<string, string> = { chico: 'chicos', mediano: 'medianos', grande: 'grandes' };

/** "lo compraron 4 dueños de Golden Retriever o de perros grandes" */
export function textoMotivo(m: Motivo): string {
  const verbo = m.duenos === 1 ? 'lo compró 1 dueño' : `lo compraron ${m.duenos} dueños`;
  const grupoTamano = `${PLURAL_ESPECIE[m.especie] ?? m.especie} ${PLURAL_TAMANO[m.tamano] ?? m.tamano}`;
  if (m.duenosMismaRaza > 0 && m.duenosMismoTamano > 0) return `${verbo} de ${m.raza} o de ${grupoTamano}`;
  if (m.duenosMismaRaza > 0) return `${verbo} de ${m.raza}`;
  return `${verbo} de ${grupoTamano}`;
}

export async function recomendarParaMascota(mascotaId: string, limite: number) {
  const mascota = await obtenerMascota(mascotaId); // 404 si no existe
  const recomendaciones = await leer<Recomendacion>(Q.RECOMENDAR_PRODUCTOS.cypher, {
    mascotaId,
    limite: int(limite), // LIMIT exige entero
  });
  if (recomendaciones.length === 0) return { mascota, recomendaciones: [] };

  const motivos = await leer<Motivo>(Q.MOTIVO_RECOMENDACION.cypher, {
    mascotaId,
    skus: recomendaciones.map((r) => r.sku),
  });
  const porSku = new Map(motivos.map((m) => [m.sku, m]));
  return {
    mascota,
    recomendaciones: recomendaciones.map((r) => {
      const m = porSku.get(r.sku);
      return { ...r, duenos: m?.duenos ?? 0, motivo: m ? textoMotivo(m) : 'lo compraron dueños de mascotas parecidas' };
    }),
  };
}

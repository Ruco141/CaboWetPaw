/**
 * Conversión de valores de Neo4j a JSON plano.
 *
 * El driver devuelve las fechas como objetos propios (neo4j.Date, neo4j.DateTime…)
 * que JSON.stringify no sabe representar. Aquí se convierten a strings ISO:
 *   - Date          -> "2025-03-14"
 *   - DateTime      -> "2025-03-14T18:30:00.000Z"
 *   - LocalDateTime -> "2025-03-14T18:30:00"
 * Los enteros ya llegan como `number` porque el driver se crea con
 * `disableLosslessIntegers: true` (ver driver.ts); aun así, si apareciera un
 * neo4j.Integer se convierte por seguridad.
 */
import neo4j from 'neo4j-driver';

export function serialize(valor: unknown): unknown {
  if (valor === null || valor === undefined) return null;
  if (neo4j.isDateTime(valor)) return valor.toStandardDate().toISOString();
  if (neo4j.isDate(valor) || neo4j.isLocalDateTime(valor) || neo4j.isTime(valor) || neo4j.isLocalTime(valor)) {
    return valor.toString();
  }
  if (neo4j.isDuration(valor)) return valor.toString();
  if (neo4j.isInt(valor)) return valor.toNumber();
  if (Array.isArray(valor)) return valor.map(serialize);
  if (typeof valor === 'object') {
    const salida: Record<string, unknown> = {};
    for (const [clave, v] of Object.entries(valor as Record<string, unknown>)) salida[clave] = serialize(v);
    return salida;
  }
  return valor;
}

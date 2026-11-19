/**
 * Cada consulta Cypher del proyecto se declara con `consulta({...})`.
 * Además del texto Cypher guarda su propósito, parámetros y un ejemplo de
 * resultado: con esos metadatos `npm run docs:consultas` genera
 * docs/consultas.md, así la documentación nunca se desfasa del código.
 */
export interface Consulta {
  /** Para qué sirve, en una o dos frases. */
  proposito: string;
  /** Nombre del parámetro -> descripción y tipo. */
  parametros: Record<string, string>;
  /** Fila (o filas) de ejemplo que devuelve. */
  ejemplo: unknown;
  /** Texto Cypher (siempre parametrizado). */
  cypher: string;
}

export const consulta = (c: Consulta): Consulta => ({ ...c, cypher: c.cypher.trim() });

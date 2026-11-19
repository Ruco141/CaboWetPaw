import { consulta } from './consulta';

/**
 * Consulta central #1 del proyecto (se usa tal cual la especificación).
 *
 * Recorrido: mascota -> su raza / su tamaño -> otras mascotas parecidas de la
 * misma especie -> sus dueños -> lo que esos dueños compraron.
 * En SQL esto serían 5-6 JOINs con auto-join de mascotas; aquí es un patrón.
 * Peso: misma raza = 2, solo mismo tamaño = 1. Se excluye lo que el dueño ya compró.
 */
export const RECOMENDAR_PRODUCTOS = consulta({
  proposito: 'Recomienda productos para una mascota según lo que compraron dueños de mascotas parecidas (misma especie y misma raza o mismo tamaño), sin repetir lo que su dueño ya compró. Ordena por afinidad.',
  parametros: { mascotaId: 'string', limite: 'integer (neo4j.int), por defecto 5' },
  ejemplo: [{ sku: 'SH-01', nombre: 'Shampoo deslanador para doble capa', precio: 289.0, categoria: 'Shampoos', afinidad: 14 }],
  cypher: `
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $mascotaId})-[:ES_RAZA]->(raza:Raza)
MATCH (otra:Mascota)<-[:TIENE]-(otro:Cliente)-[:COMPRO]->(p:Producto)
WHERE otro <> c
  AND otra.especie = m.especie
  AND ((otra)-[:ES_RAZA]->(raza) OR otra.tamano = m.tamano)
  AND p.especie IN [m.especie, 'ambos']
  AND NOT (c)-[:COMPRO]->(p)
WITH DISTINCT p, otra,
     CASE WHEN (otra)-[:ES_RAZA]->(raza) THEN 2 ELSE 1 END AS peso
WITH p, sum(peso) AS afinidad
MATCH (p)-[:PERTENECE_A]->(cat:Categoria)
RETURN p.sku AS sku, p.nombre AS nombre, p.precio AS precio,
       cat.nombre AS categoria, afinidad
ORDER BY afinidad DESC, nombre
LIMIT $limite
`,
});

/**
 * Complemento de la anterior, solo para la explicación en la UI
 * ("lo compraron 4 dueños de Golden Retriever o de perros grandes").
 * Se mantiene separada para no alterar la consulta principal.
 */
export const MOTIVO_RECOMENDACION = consulta({
  proposito: 'Para cada SKU recomendado cuenta cuántos dueños distintos de mascotas parecidas lo compraron (en total, de la misma raza y del mismo tamaño). Alimenta el texto del motivo.',
  parametros: { mascotaId: 'string', skus: 'list<string> — SKUs devueltos por RECOMENDAR_PRODUCTOS' },
  ejemplo: [{ sku: 'SH-01', duenos: 6, duenosMismaRaza: 2, duenosMismoTamano: 6, raza: 'Golden Retriever', especie: 'perro', tamano: 'grande' }],
  cypher: `
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $mascotaId})-[:ES_RAZA]->(raza:Raza)
UNWIND $skus AS sku
MATCH (p:Producto {sku: sku})<-[:COMPRO]-(otro:Cliente)-[:TIENE]->(otra:Mascota)
WHERE otro <> c
  AND otra.especie = m.especie
  AND (EXISTS { (otra)-[:ES_RAZA]->(raza) } OR otra.tamano = m.tamano)
WITH sku, raza, m, otro, EXISTS { (otra)-[:ES_RAZA]->(raza) } AS mismaRaza, otra.tamano = m.tamano AS mismoTamano
RETURN sku,
       count(DISTINCT otro) AS duenos,
       count(DISTINCT CASE WHEN mismaRaza THEN otro END) AS duenosMismaRaza,
       count(DISTINCT CASE WHEN mismoTamano THEN otro END) AS duenosMismoTamano,
       raza.nombre AS raza, m.especie AS especie, m.tamano AS tamano
`,
});

import { consulta } from './consulta';

/**
 * Consulta central #2: traversal de longitud variable (1 a 3 saltos).
 * `min(length(path))` asegura que si a alguien se llega por dos caminos, cuente
 * en su nivel más cercano. Puntos: nivel 1 = 100, nivel 2 = 50, nivel 3 = 25.
 */
export const RED_REFERIDOS = consulta({
  proposito: 'Red de referidos de un cliente hasta 3 niveles hacia abajo, con el nivel y los puntos que aporta cada referido.',
  parametros: { clienteId: 'string' },
  ejemplo: [
    { id: 'cli-02', nombre: 'José Luis Hernández', nivel: 1, puntos: 100 },
    { id: 'cli-06', nombre: 'Juan Pablo García', nivel: 2, puntos: 50 },
    { id: 'cli-08', nombre: 'Luis Miguel Sánchez', nivel: 3, puntos: 25 },
  ],
  cypher: `
MATCH path = (c:Cliente {id: $clienteId})-[:REFIRIO*1..3]->(r:Cliente)
WITH r, min(length(path)) AS nivel
RETURN r.id AS id, r.nombre AS nombre, nivel,
       CASE nivel WHEN 1 THEN 100 WHEN 2 THEN 50 ELSE 25 END AS puntos
ORDER BY nivel, nombre
`,
});

export const CADENA_REFERIDOS = consulta({
  proposito: 'Cadena hacia arriba: quién refirió al cliente, quién refirió a esa persona… hasta el origen (alguien a quien nadie refirió). Sin filas = llegó por su cuenta.',
  parametros: { clienteId: 'string' },
  ejemplo: { cadena: [{ id: 'cli-01', nombre: 'María Fernanda López' }, { id: 'cli-02', nombre: 'José Luis Hernández' }, { id: 'cli-06', nombre: 'Juan Pablo García' }] },
  cypher: `
MATCH path = (origen:Cliente)-[:REFIRIO*1..10]->(c:Cliente {id: $clienteId})
WHERE NOT ()-[:REFIRIO]->(origen)
RETURN [n IN nodes(path) | {id: n.id, nombre: n.nombre}] AS cadena
`,
});

export const RANKING_REFERIDORES = consulta({
  proposito: 'Ranking de los clientes que más puntos acumulan por su red de referidos (3 niveles).',
  parametros: { limite: 'integer (neo4j.int), por defecto 10' },
  ejemplo: [{ id: 'cli-01', nombre: 'María Fernanda López', tamanoRed: 11, puntos: 700 }],
  cypher: `
MATCH path = (c:Cliente)-[:REFIRIO*1..3]->(r:Cliente)
WITH c, r, min(length(path)) AS nivel
WITH c, count(r) AS tamanoRed,
     sum(CASE nivel WHEN 1 THEN 100 WHEN 2 THEN 50 ELSE 25 END) AS puntos
RETURN c.id AS id, c.nombre AS nombre, tamanoRed, puntos
ORDER BY puntos DESC, nombre
LIMIT $limite
`,
});

/** Búsqueda de caminos: ignora la dirección (`-` en lugar de `->`) para ver cómo se conectan dos personas. */
export const CAMINO_ENTRE_CLIENTES = consulta({
  proposito: 'Camino más corto (shortestPath) entre dos clientes a través de relaciones REFIRIO en cualquier dirección, hasta 8 saltos.',
  parametros: { desde: 'string — id de cliente', hasta: 'string — id de cliente (distinto de desde)' },
  ejemplo: { camino: [{ id: 'cli-09', nombre: 'Alejandra Castillo' }, { id: 'cli-08', nombre: 'Luis Miguel Sánchez' }, { id: 'cli-06', nombre: 'Juan Pablo García' }], saltos: 2 },
  cypher: `
MATCH (a:Cliente {id: $desde}), (b:Cliente {id: $hasta})
MATCH p = shortestPath((a)-[:REFIRIO*..8]-(b))
RETURN [n IN nodes(p) | {id: n.id, nombre: n.nombre}] AS camino, length(p) AS saltos
`,
});

/**
 * Crear referido aplicando las reglas que el grafo no impone por sí mismo:
 *  - a <> b                                 -> sin auto-referencias
 *  - NOT EXISTS { ()-[:REFIRIO]->(b) }      -> b solo puede tener un referidor
 *  - NOT EXISTS { (b)-[:REFIRIO*]->(a) }    -> no se forman ciclos
 */
export const CREAR_REFERIDO = consulta({
  proposito: 'Crea la relación REFIRIO solo si se cumplen las reglas (sin auto-referencia, un solo referidor, sin ciclos). Sin filas = alguna regla falló.',
  parametros: { referidorId: 'string', referidoId: 'string' },
  ejemplo: { referidor: 'cli-01', referido: 'cli-24' },
  cypher: `
MATCH (a:Cliente {id: $referidorId}), (b:Cliente {id: $referidoId})
WHERE a <> b
  AND NOT EXISTS { ()-[:REFIRIO]->(b) }
  AND NOT EXISTS { (b)-[:REFIRIO*]->(a) }
CREATE (a)-[:REFIRIO {fecha: date()}]->(b)
RETURN a.id AS referidor, b.id AS referido
`,
});

export const DIAGNOSTICO_REFERIDO = consulta({
  proposito: 'Consulta previa a CREAR_REFERIDO para explicar qué regla falla: clientes inexistentes, referido que ya tiene referidor o ciclo.',
  parametros: { referidorId: 'string', referidoId: 'string' },
  ejemplo: { referidorExiste: true, referidoExiste: true, referidoPor: 'José Luis Hernández', creariaCiclo: false },
  cypher: `
OPTIONAL MATCH (a:Cliente {id: $referidorId})
OPTIONAL MATCH (b:Cliente {id: $referidoId})
OPTIONAL MATCH (previo:Cliente)-[:REFIRIO]->(b)
RETURN a IS NOT NULL AS referidorExiste,
       b IS NOT NULL AS referidoExiste,
       previo.nombre AS referidoPor,
       CASE WHEN a IS NULL OR b IS NULL THEN false
            ELSE EXISTS { (b)-[:REFIRIO*]->(a) } END AS creariaCiclo
`,
});

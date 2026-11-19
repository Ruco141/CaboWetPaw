/**
 * Driver de Neo4j: UNA sola instancia por proceso (singleton).
 *
 * ¿Por qué singleton? El objeto `Driver` administra el pool de conexiones TCP/TLS
 * hacia AuraDB, la tabla de enrutamiento del clúster y la autenticación. Crearlo
 * por petición obligaría a repetir el handshake TLS + Bolt + auth cada vez (cientos
 * de ms) y agotaría conexiones. Se crea una vez al arrancar, se verifica con
 * `verifyConnectivity()` y se cierra en el apagado ordenado.
 *
 * Lecturas y escrituras:
 *  - `leer()` / `escribir()` usan `driver.executeQuery` con `routing: READ` o
 *    `WRITE`. AuraDB es un clúster: el driver manda las lecturas a cualquier
 *    miembro que pueda leer y las escrituras al líder. `executeQuery` además
 *    reintenta automáticamente ante errores transitorios (p. ej. cambio de líder
 *    o conexión caída), nunca ante errores de la consulta.
 *  - `transaccionEscritura()` abre una sesión y usa `session.executeWrite` para
 *    operaciones con varias escrituras dependientes (todo o nada; también con
 *    reintentos automáticos de la función completa).
 *
 * Siempre se pasan parámetros (`$param`), jamás se concatenan strings: evita
 * inyección de Cypher y permite que Neo4j reutilice el plan de ejecución en caché.
 */
import neo4j, { type Driver, type ManagedTransaction, type Neo4jError } from 'neo4j-driver';
import { config } from '../config';
import { serialize } from './serialize';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(config.NEO4J_URI, neo4j.auth.basic(config.NEO4J_USERNAME, config.NEO4J_PASSWORD), {
      // Los enteros de Neo4j son de 64 bits; con esta opción llegan como `number` de JS
      // (suficiente para conteos, stock y cantidades de este proyecto).
      disableLosslessIntegers: true,
      // Etiqueta visible en los logs/monitoreo de AuraDB.
      userAgent: 'cabo-wet-paw-graph/1.0',
    });
  }
  return driver;
}

/** Verifica que AuraDB responde (credenciales, red y TLS). Se llama antes de abrir el puerto. */
export async function verificarConexion() {
  // A diferencia de executeQuery, verifyConnectivity NO reintenta. Un primer
  // handshake TLS hacia AuraDB puede cortarse (red, instancia despertando), así
  // que se reintenta hasta 4 veces con espera creciente antes de darse por vencido.
  for (let intento = 1; ; intento++) {
    try {
      await getDriver().verifyConnectivity({ database: config.NEO4J_DATABASE });
      break;
    } catch (err) {
      if (intento >= 4 || (err as Neo4jError).code !== 'ServiceUnavailable') throw err;
      await new Promise((r) => setTimeout(r, 500 * intento));
    }
  }
  // Versión del servidor para mostrarla en /api/health y en el log de arranque.
  const [info] = await leer<{ agent: string }>(
    "CALL dbms.components() YIELD name, versions, edition RETURN name + '/' + versions[0] + ' (' + edition + ')' AS agent",
  );
  return { agent: info?.agent ?? 'Neo4j' };
}

export async function cerrarDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

type Fila = Record<string, unknown>;

/** Ejecuta una consulta de LECTURA y devuelve las filas ya serializadas a JSON. */
export async function leer<T = Fila>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const { records } = await getDriver().executeQuery(query, params, {
    database: config.NEO4J_DATABASE,
    routing: neo4j.routing.READ,
  });
  return records.map((r) => serialize(r.toObject()) as T);
}

/** Ejecuta una consulta de ESCRITURA (auto-commit administrado) y devuelve las filas serializadas. */
export async function escribir<T = Fila>(query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const { records } = await getDriver().executeQuery(query, params, {
    database: config.NEO4J_DATABASE,
    routing: neo4j.routing.WRITE,
  });
  return records.map((r) => serialize(r.toObject()) as T);
}

/** Ayudante para ejecutar una consulta dentro de una transacción administrada. */
export async function enTx<T = Fila>(tx: ManagedTransaction, query: string, params: Record<string, unknown> = {}): Promise<T[]> {
  const resultado = await tx.run(query, params);
  return resultado.records.map((r) => serialize(r.toObject()) as T);
}

/**
 * Ejecuta `trabajo` dentro de `session.executeWrite`: todas sus consultas se
 * confirman juntas o, si algo lanza un error, se revierten juntas.
 * Ojo: la función puede re-ejecutarse ante errores transitorios, así que no
 * debe tener efectos fuera de la base de datos.
 */
export async function transaccionEscritura<T>(trabajo: (tx: ManagedTransaction) => Promise<T>): Promise<T> {
  const session = getDriver().session({ database: config.NEO4J_DATABASE, defaultAccessMode: neo4j.session.WRITE });
  try {
    return await session.executeWrite(trabajo);
  } finally {
    await session.close();
  }
}

/** Atajo para enteros: los `number` de JS viajan a Neo4j como Float; LIMIT, SKIP, stock y cantidad requieren Integer. */
export const int = (n: number) => neo4j.int(n);

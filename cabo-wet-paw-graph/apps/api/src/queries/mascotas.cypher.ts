import { consulta } from './consulta';

export const DIAGNOSTICO_MASCOTA = consulta({
  proposito: 'Consulta previa a crear una mascota: ¿existe el cliente? ¿de qué especie es la raza indicada? Permite responder 404 o 409 con el motivo exacto.',
  parametros: { clienteId: 'string', raza: 'string — nombre de la raza' },
  ejemplo: { clienteExiste: true, especieRaza: 'perro' },
  cypher: `
OPTIONAL MATCH (c:Cliente {id: $clienteId})
OPTIONAL MATCH (r:Raza {nombre: $raza})
RETURN c IS NOT NULL AS clienteExiste, r.especie AS especieRaza
`,
});

export const CREAR_MASCOTA = consulta({
  proposito: 'Crea la mascota colgando de su dueño (TIENE) y la liga a su raza (ES_RAZA). El WHERE impone que la raza sea de la misma especie.',
  parametros: {
    clienteId: 'string', id: 'string (uuid)', nombre: 'string', especie: "'perro' | 'gato'",
    tamano: "'chico' | 'mediano' | 'grande'", tipoPelo: "'corto' | 'largo' | 'doble capa' | 'rizado'",
    raza: 'string', fechaNacimiento: 'string ISO (YYYY-MM-DD) | null',
  },
  ejemplo: { mascota: { id: '9b2e…', nombre: 'Pancho', especie: 'perro', tamano: 'chico', tipoPelo: 'corto', fechaNacimiento: '2024-05-01', raza: 'Chihuahua' } },
  cypher: `
MATCH (c:Cliente {id: $clienteId})
MATCH (r:Raza {nombre: $raza})
WHERE r.especie = $especie
CREATE (c)-[:TIENE]->(m:Mascota {id: $id, nombre: $nombre, especie: $especie, tamano: $tamano, tipoPelo: $tipoPelo})
CREATE (m)-[:ES_RAZA]->(r)
SET m.fechaNacimiento = CASE WHEN $fechaNacimiento IS NULL THEN null ELSE date($fechaNacimiento) END
RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre} AS mascota
`,
});

export const ACTUALIZAR_MASCOTA = consulta({
  proposito: 'Actualización parcial de la mascota (nombre, tamaño, tipo de pelo, fecha de nacimiento). La especie no cambia.',
  parametros: { id: 'string', cambios: 'map', fechaNacimiento: 'string ISO | null' },
  ejemplo: { especie: 'perro' },
  cypher: `
MATCH (m:Mascota {id: $id})
SET m += $cambios
FOREACH (f IN CASE WHEN $fechaNacimiento IS NULL THEN [] ELSE [$fechaNacimiento] END |
  SET m.fechaNacimiento = date(f))
RETURN m.especie AS especie
`,
});

export const CAMBIAR_RAZA_MASCOTA = consulta({
  proposito: 'Reemplaza la relación ES_RAZA. Solo devuelve fila si la nueva raza es de la misma especie que la mascota.',
  parametros: { id: 'string', raza: 'string' },
  ejemplo: { raza: 'Labrador' },
  cypher: `
MATCH (m:Mascota {id: $id}), (r:Raza {nombre: $raza})
WHERE r.especie = m.especie
OPTIONAL MATCH (m)-[anterior:ES_RAZA]->(:Raza)
DELETE anterior
CREATE (m)-[:ES_RAZA]->(r)
RETURN r.nombre AS raza
`,
});

export const OBTENER_MASCOTA = consulta({
  proposito: 'Datos de una mascota con su raza y su dueño.',
  parametros: { id: 'string' },
  ejemplo: { mascota: { id: 'm-29', nombre: 'Canela', especie: 'perro', tamano: 'grande', tipoPelo: 'doble capa', fechaNacimiento: '2023-02-10', raza: 'Golden Retriever', clienteId: 'cli-21' } },
  cypher: `
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $id})
OPTIONAL MATCH (m)-[:ES_RAZA]->(r:Raza)
RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre, clienteId: c.id} AS mascota
`,
});

export const ELIMINAR_MASCOTA = consulta({
  proposito: 'Elimina una mascota y sus relaciones (TIENE, ES_RAZA, RECIBIO).',
  parametros: { id: 'string' },
  ejemplo: { eliminadas: 1 },
  cypher: `
MATCH (m:Mascota {id: $id})
DETACH DELETE m
RETURN count(*) AS eliminadas
`,
});

export const REGISTRAR_SERVICIO = consulta({
  proposito: 'Registra que una mascota recibió un servicio (grooming, guardería u hotel) con la fecha y hora actuales.',
  parametros: { mascotaId: 'string', servicioId: 'string' },
  ejemplo: { mascotaId: 'm-29', servicio: 'Deslanado', fecha: '2026-11-18T19:05:11.000Z' },
  cypher: `
MATCH (m:Mascota {id: $mascotaId}), (s:Servicio {id: $servicioId})
CREATE (m)-[r:RECIBIO {fecha: datetime()}]->(s)
RETURN m.id AS mascotaId, s.nombre AS servicio, r.fecha AS fecha
`,
});

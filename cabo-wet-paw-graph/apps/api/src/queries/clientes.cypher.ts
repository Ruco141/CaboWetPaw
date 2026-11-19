import { consulta } from './consulta';

export const LISTAR_CLIENTES = consulta({
  proposito: 'Lista de clientes con número de mascotas y de compras; filtra por nombre o teléfono si se envía `buscar`.',
  parametros: { buscar: 'string | null — texto a buscar (sin distinguir mayúsculas)' },
  ejemplo: [{ id: 'cli-01', nombre: 'María Fernanda López', telefono: '6241000001', email: 'mafer@example.com', fechaAlta: '2024-01-15', mascotas: 2, compras: 9 }],
  cypher: `
MATCH (c:Cliente)
WHERE $buscar IS NULL
   OR toLower(c.nombre) CONTAINS toLower($buscar)
   OR c.telefono CONTAINS $buscar
RETURN c.id AS id, c.nombre AS nombre, c.telefono AS telefono, c.email AS email,
       c.fechaAlta AS fechaAlta,
       COUNT { (c)-[:TIENE]->(:Mascota) } AS mascotas,
       COUNT { (c)-[:COMPRO]->(:Producto) } AS compras
ORDER BY nombre
`,
});

export const FICHA_CLIENTE = consulta({
  proposito: 'Ficha completa: datos del cliente, sus mascotas con raza, sus últimas 10 compras y quién lo refirió (vecindad de 1 salto en varias direcciones).',
  parametros: { id: 'string — id del cliente' },
  ejemplo: {
    cliente: { id: 'cli-21', nombre: 'Ximena Salazar', telefono: '6241000021', email: null, fechaAlta: '2026-09-02' },
    referidoPor: { id: 'cli-20', nombre: 'Arturo Romero' },
    mascotas: [{ id: 'm-29', nombre: 'Canela', especie: 'perro', tamano: 'grande', tipoPelo: 'doble capa', fechaNacimiento: '2023-02-10', raza: 'Golden Retriever' }],
    ultimasCompras: [],
  },
  cypher: `
MATCH (c:Cliente {id: $id})
OPTIONAL MATCH (ref:Cliente)-[:REFIRIO]->(c)
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente,
       CASE WHEN ref IS NULL THEN null ELSE ref {.id, .nombre} END AS referidoPor,
       COLLECT {
         MATCH (c)-[:TIENE]->(m:Mascota)
         OPTIONAL MATCH (m)-[:ES_RAZA]->(r:Raza)
         WITH m, r ORDER BY m.nombre
         RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre}
       } AS mascotas,
       COLLECT {
         MATCH (c)-[k:COMPRO]->(p:Producto)
         WITH k, p ORDER BY k.fecha DESC LIMIT 10
         RETURN {sku: p.sku, nombre: p.nombre, precio: p.precio, cantidad: k.cantidad, fecha: k.fecha}
       } AS ultimasCompras
`,
});

export const EXISTE_CLIENTE = consulta({
  proposito: 'Comprueba si existe un cliente (para distinguir 404 de otras reglas).',
  parametros: { id: 'string — id del cliente' },
  ejemplo: [{ id: 'cli-01' }],
  cypher: `
MATCH (c:Cliente {id: $id})
RETURN c.id AS id
`,
});

export const CREAR_CLIENTE = consulta({
  proposito: 'Crea un cliente nuevo. El `id` lo genera la API con crypto.randomUUID() y `fechaAlta` es la fecha del servidor.',
  parametros: { id: 'string (uuid)', nombre: 'string', telefono: 'string (único)', email: 'string | null' },
  ejemplo: { cliente: { id: '6f1c…', nombre: 'Pedro Ríos', telefono: '6241234567', email: null, fechaAlta: '2026-11-18' } },
  cypher: `
CREATE (c:Cliente {id: $id, nombre: $nombre, telefono: $telefono, fechaAlta: date()})
SET c.email = $email
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente
`,
});

export const ACTUALIZAR_CLIENTE = consulta({
  proposito: 'Actualización parcial: `SET c += $cambios` solo toca las propiedades enviadas (nombre, telefono, email).',
  parametros: { id: 'string', cambios: 'map — p. ej. {telefono: "6249998877"}' },
  ejemplo: { cliente: { id: 'cli-24', nombre: 'Diego Herrera', telefono: '6249998877', email: null, fechaAlta: '2025-10-03' } },
  cypher: `
MATCH (c:Cliente {id: $id})
SET c += $cambios
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente
`,
});

export const ELIMINAR_CLIENTE = consulta({
  proposito: 'Elimina al cliente y a sus mascotas con DETACH DELETE (borra también sus COMPRO, RECIBIO y REFIRIO; corta la cadena de referidos que pasaba por él).',
  parametros: { id: 'string' },
  ejemplo: { eliminado: 1, mascotasEliminadas: 2 },
  cypher: `
MATCH (c:Cliente {id: $id})
OPTIONAL MATCH (c)-[:TIENE]->(m:Mascota)
WITH c, collect(m) AS mascotas
FOREACH (x IN mascotas | DETACH DELETE x)
DETACH DELETE c
RETURN 1 AS eliminado, size(mascotas) AS mascotasEliminadas
`,
});

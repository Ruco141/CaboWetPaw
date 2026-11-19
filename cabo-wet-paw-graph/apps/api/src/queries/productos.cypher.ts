import { consulta } from './consulta';

export const LISTAR_PRODUCTOS = consulta({
  proposito: "Catálogo de productos con su categoría. Filtros opcionales: categoría y especie (filtrar por 'perro' o 'gato' incluye también los de 'ambos').",
  parametros: { categoria: 'string | null', especie: "'perro' | 'gato' | 'ambos' | null" },
  ejemplo: [{ sku: 'SH-01', nombre: 'Shampoo deslanador para doble capa', precio: 289.0, especie: 'perro', stock: 25, categoria: 'Shampoos' }],
  cypher: `
MATCH (p:Producto)-[:PERTENECE_A]->(cat:Categoria)
WHERE ($categoria IS NULL OR cat.nombre = $categoria)
  AND ($especie IS NULL OR p.especie = $especie OR ($especie <> 'ambos' AND p.especie = 'ambos'))
RETURN p.sku AS sku, p.nombre AS nombre, p.precio AS precio, p.especie AS especie,
       p.stock AS stock, cat.nombre AS categoria
ORDER BY categoria, nombre
`,
});

export const CREAR_PRODUCTO = consulta({
  proposito: 'Crea un producto y lo liga a su categoría existente. El SKU es la llave natural (constraint de unicidad).',
  parametros: { sku: 'string', nombre: 'string', precio: 'float (MXN)', especie: "'perro' | 'gato' | 'ambos'", stock: 'integer (neo4j.int)', categoria: 'string' },
  ejemplo: { producto: { sku: 'JU-07', nombre: 'Frisbee de goma', precio: 189.0, especie: 'perro', stock: 15, categoria: 'Juguetes' } },
  cypher: `
MATCH (cat:Categoria {nombre: $categoria})
CREATE (p:Producto {sku: $sku, nombre: $nombre, precio: $precio, especie: $especie, stock: $stock})-[:PERTENECE_A]->(cat)
RETURN p {.sku, .nombre, .precio, .especie, .stock, categoria: cat.nombre} AS producto
`,
});

export const ACTUALIZAR_PRODUCTO = consulta({
  proposito: 'Actualización parcial del producto (nombre, precio, especie, stock).',
  parametros: { sku: 'string', cambios: 'map (stock como neo4j.int)' },
  ejemplo: { sku: 'SH-01' },
  cypher: `
MATCH (p:Producto {sku: $sku})
SET p += $cambios
RETURN p.sku AS sku
`,
});

export const CAMBIAR_CATEGORIA_PRODUCTO = consulta({
  proposito: 'Mueve el producto a otra categoría reemplazando la relación PERTENECE_A.',
  parametros: { sku: 'string', categoria: 'string' },
  ejemplo: { categoria: 'Accesorios' },
  cypher: `
MATCH (p:Producto {sku: $sku}), (cat:Categoria {nombre: $categoria})
OPTIONAL MATCH (p)-[anterior:PERTENECE_A]->(:Categoria)
DELETE anterior
CREATE (p)-[:PERTENECE_A]->(cat)
RETURN cat.nombre AS categoria
`,
});

export const OBTENER_PRODUCTO = consulta({
  proposito: 'Un producto con su categoría.',
  parametros: { sku: 'string' },
  ejemplo: { producto: { sku: 'SH-01', nombre: 'Shampoo deslanador para doble capa', precio: 289.0, especie: 'perro', stock: 25, categoria: 'Shampoos' } },
  cypher: `
MATCH (p:Producto {sku: $sku})
OPTIONAL MATCH (p)-[:PERTENECE_A]->(cat:Categoria)
RETURN p {.sku, .nombre, .precio, .especie, .stock, categoria: cat.nombre} AS producto
`,
});

export const ELIMINAR_PRODUCTO = consulta({
  proposito: 'Elimina el producto con DETACH DELETE (también borra el historial COMPRO hacia él).',
  parametros: { sku: 'string' },
  ejemplo: { eliminados: 1 },
  cypher: `
MATCH (p:Producto {sku: $sku})
DETACH DELETE p
RETURN count(*) AS eliminados
`,
});

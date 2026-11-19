import { consulta } from './consulta';

export const LISTAR_RAZAS = consulta({
  proposito: 'Razas disponibles, opcionalmente filtradas por especie.',
  parametros: { especie: "'perro' | 'gato' | null" },
  ejemplo: [{ nombre: 'Golden Retriever', especie: 'perro' }],
  cypher: `
MATCH (r:Raza)
WHERE $especie IS NULL OR r.especie = $especie
RETURN r.nombre AS nombre, r.especie AS especie
ORDER BY especie, nombre
`,
});

export const LISTAR_CATEGORIAS = consulta({
  proposito: 'Categorías con el número de productos de cada una.',
  parametros: {},
  ejemplo: [{ nombre: 'Shampoos', productos: 6 }],
  cypher: `
MATCH (cat:Categoria)
RETURN cat.nombre AS nombre, COUNT { (:Producto)-[:PERTENECE_A]->(cat) } AS productos
ORDER BY nombre
`,
});

export const LISTAR_SERVICIOS = consulta({
  proposito: 'Servicios del negocio (grooming, guardería, hotel) con su precio.',
  parametros: {},
  ejemplo: [{ id: 'srv-bano', nombre: 'Baño', precio: 250.0 }],
  cypher: `
MATCH (s:Servicio)
RETURN s.id AS id, s.nombre AS nombre, s.precio AS precio
ORDER BY s.precio
`,
});

export const RESUMEN = consulta({
  proposito: 'Totales para el dashboard: clientes, mascotas, productos y compras.',
  parametros: {},
  ejemplo: { clientes: 25, mascotas: 35, productos: 24, compras: 120 },
  cypher: `
RETURN COUNT { (:Cliente) } AS clientes,
       COUNT { (:Mascota) } AS mascotas,
       COUNT { (:Producto) } AS productos,
       COUNT { (:Cliente)-[:COMPRO]->(:Producto) } AS compras
`,
});

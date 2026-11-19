import { consulta } from './consulta';

export const REGISTRAR_COMPRA = consulta({
  proposito: 'Registra la compra y descuenta el stock en la MISMA transacción (se ejecuta dentro de session.executeWrite). Si no hay stock suficiente no devuelve filas.',
  parametros: { clienteId: 'string', sku: 'string', cantidad: 'integer (neo4j.int)' },
  ejemplo: { sku: 'SH-01', stockRestante: 24 },
  cypher: `
MATCH (c:Cliente {id: $clienteId}), (p:Producto {sku: $sku})
WHERE p.stock >= $cantidad
CREATE (c)-[:COMPRO {fecha: datetime(), cantidad: $cantidad}]->(p)
SET p.stock = p.stock - $cantidad
RETURN p.sku AS sku, p.stock AS stockRestante
`,
});

export const DIAGNOSTICO_COMPRA = consulta({
  proposito: 'Cuando REGISTRAR_COMPRA no devuelve filas, explica por qué: cliente inexistente, producto inexistente o stock insuficiente.',
  parametros: { clienteId: 'string', sku: 'string' },
  ejemplo: { clienteExiste: true, productoExiste: true, stock: 2 },
  cypher: `
OPTIONAL MATCH (c:Cliente {id: $clienteId})
OPTIONAL MATCH (p:Producto {sku: $sku})
RETURN c IS NOT NULL AS clienteExiste, p IS NOT NULL AS productoExiste, p.stock AS stock
`,
});

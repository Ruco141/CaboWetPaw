import { enTx, int, transaccionEscritura } from '../db/driver';
import * as Q from '../queries/compras.cypher';
import { conflicto, noEncontrado } from '../middleware/errores';

/**
 * Compra = crear COMPRO + descontar stock. Ambas cosas ocurren en la misma
 * consulta y dentro de `executeWrite`: si dos personas compran la última pieza
 * a la vez, Neo4j bloquea el nodo Producto y solo una de las dos pasa el
 * `WHERE p.stock >= $cantidad`.
 */
export async function registrarCompra(datos: { clienteId: string; sku: string; cantidad: number }) {
  return transaccionEscritura(async (tx) => {
    const params = { ...datos, cantidad: int(datos.cantidad) };
    const [fila] = await enTx<{ sku: string; stockRestante: number }>(tx, Q.REGISTRAR_COMPRA.cypher, params);
    if (fila) return fila;

    const [diag] = await enTx<{ clienteExiste: boolean; productoExiste: boolean; stock: number | null }>(
      tx,
      Q.DIAGNOSTICO_COMPRA.cypher,
      datos,
    );
    if (!diag.clienteExiste) throw noEncontrado('Cliente no encontrado');
    if (!diag.productoExiste) throw noEncontrado('Producto no encontrado');
    throw conflicto(`Stock insuficiente: quedan ${diag.stock ?? 0} piezas y pediste ${datos.cantidad}`);
  });
}

import { enTx, escribir, int, leer, transaccionEscritura } from '../db/driver';
import * as Q from '../queries/productos.cypher';
import { noEncontrado } from '../middleware/errores';
import { soloDefinidos } from './util';

export async function listarProductos(filtros: { categoria?: string; especie?: string }) {
  return leer(Q.LISTAR_PRODUCTOS.cypher, { categoria: filtros.categoria ?? null, especie: filtros.especie ?? null });
}

export async function obtenerProducto(sku: string) {
  const [fila] = await leer<{ producto: unknown }>(Q.OBTENER_PRODUCTO.cypher, { sku });
  if (!fila) throw noEncontrado('Producto no encontrado');
  return fila.producto;
}

export async function crearProducto(datos: { sku: string; nombre: string; precio: number; especie: string; stock: number; categoria: string }) {
  const [fila] = await escribir<{ producto: unknown }>(Q.CREAR_PRODUCTO.cypher, {
    ...datos,
    stock: int(datos.stock), // entero de Neo4j, no float
  });
  if (!fila) throw noEncontrado(`La categoría "${datos.categoria}" no existe (¿corriste el seed?)`);
  return fila.producto;
}

export async function actualizarProducto(
  sku: string,
  datos: { nombre?: string; precio?: number; especie?: string; stock?: number; categoria?: string },
) {
  const { categoria, stock, ...resto } = datos;
  const cambios = soloDefinidos({ ...resto, stock: stock === undefined ? undefined : int(stock) });
  await transaccionEscritura(async (tx) => {
    const filas = await enTx(tx, Q.ACTUALIZAR_PRODUCTO.cypher, { sku, cambios });
    if (filas.length === 0) throw noEncontrado('Producto no encontrado');
    if (categoria) {
      const cambio = await enTx(tx, Q.CAMBIAR_CATEGORIA_PRODUCTO.cypher, { sku, categoria });
      if (cambio.length === 0) throw noEncontrado(`La categoría "${categoria}" no existe`);
    }
  });
  return obtenerProducto(sku);
}

export async function eliminarProducto(sku: string) {
  const [fila] = await escribir<{ eliminados: number }>(Q.ELIMINAR_PRODUCTO.cypher, { sku });
  if (!fila || fila.eliminados === 0) throw noEncontrado('Producto no encontrado');
  return fila;
}

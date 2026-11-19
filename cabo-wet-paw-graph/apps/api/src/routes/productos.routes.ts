import { Router } from 'express';
import * as productos from '../repositories/productos.repository';
import { registrarCompra } from '../repositories/compras.repository';
import { actualizarProductoBody, crearCompraBody, crearProductoBody, listarProductosQuery, skuParam } from '../schemas/productos.schema';

export const productosRouter = Router();

productosRouter.get('/productos', async (req, res) => {
  res.json(await productos.listarProductos(listarProductosQuery.parse(req.query)));
});

productosRouter.post('/productos', async (req, res) => {
  res.status(201).json(await productos.crearProducto(crearProductoBody.parse(req.body)));
});

productosRouter.patch('/productos/:sku', async (req, res) => {
  const { sku } = skuParam.parse(req.params);
  res.json(await productos.actualizarProducto(sku, actualizarProductoBody.parse(req.body)));
});

productosRouter.delete('/productos/:sku', async (req, res) => {
  const { sku } = skuParam.parse(req.params);
  res.json(await productos.eliminarProducto(sku));
});

productosRouter.post('/compras', async (req, res) => {
  res.status(201).json(await registrarCompra(crearCompraBody.parse(req.body)));
});

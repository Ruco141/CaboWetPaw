import { z } from 'zod';
import { CATEGORIAS, ESPECIES_PRODUCTO, opcional, texto } from './comunes';

const precio = z.coerce.number().positive('El precio debe ser mayor a 0').max(100000);
const stock = z.coerce.number().int('El stock debe ser entero').min(0).max(100000);

export const listarProductosQuery = z.object({
  categoria: opcional(z.enum(CATEGORIAS)),
  especie: opcional(z.enum(ESPECIES_PRODUCTO)),
});

export const crearProductoBody = z.object({
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, 'SKU: letras, números y guiones (2 a 20)'),
  nombre: texto(),
  precio,
  especie: z.enum(ESPECIES_PRODUCTO),
  stock,
  categoria: z.enum(CATEGORIAS),
});

export const actualizarProductoBody = z
  .object({
    nombre: texto().optional(),
    precio: precio.optional(),
    especie: z.enum(ESPECIES_PRODUCTO).optional(),
    stock: stock.optional(),
    categoria: z.enum(CATEGORIAS).optional(),
  })
  .refine((o) => Object.values(o).some((v) => v !== undefined), 'Envía al menos un campo a modificar');

export const skuParam = z.object({ sku: texto(20) });

export const crearCompraBody = z.object({
  clienteId: texto(64),
  sku: texto(20),
  cantidad: z.coerce.number().int('La cantidad debe ser entera').min(1).max(100),
});

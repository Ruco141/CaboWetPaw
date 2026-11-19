/**
 * Traducción de errores a respuestas HTTP.
 *   - HttpError lanzado por la app        -> su status (404, 409…) con su mensaje
 *   - ZodError (entrada inválida)          -> 400 con el detalle de cada campo
 *   - ConstraintValidationFailed (Neo4j)   -> 409 (p. ej. teléfono o SKU repetido)
 *   - Cualquier otra cosa                  -> 500 genérico; el detalle solo va al log
 * Express 5 propaga solo los errores de handlers async, no hace falta try/catch.
 */
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Neo4jError } from 'neo4j-driver';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const noEncontrado = (mensaje: string) => new HttpError(404, mensaje);
export const conflicto = (mensaje: string) => new HttpError(409, mensaje);

/** Mensaje amigable según la propiedad del constraint que se violó. */
function mensajeConstraint(detalle: string): string {
  if (/telefono/i.test(detalle)) return 'Ya existe un cliente con ese teléfono.';
  if (/sku/i.test(detalle)) return 'Ya existe un producto con ese SKU.';
  if (/Mascota/.test(detalle)) return 'Ya existe una mascota con ese id.';
  return 'El registro viola una restricción de unicidad de la base de datos.';
}

export const rutaNoEncontrada: RequestHandler = (req, res) => {
  res.status(404).json({ error: `No existe la ruta ${req.method} ${req.path}` });
};

export const manejarErrores: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Datos inválidos',
      detalles: err.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message })),
    });
    return;
  }
  if (err instanceof Neo4jError && err.code === 'Neo.ClientError.Schema.ConstraintValidationFailed') {
    res.status(409).json({ error: mensajeConstraint(err.message) });
    return;
  }
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'El cuerpo de la petición no es JSON válido' });
    return;
  }
  console.error('[error]', err);
  res.status(500).json({ error: 'Error interno del servidor' });
};

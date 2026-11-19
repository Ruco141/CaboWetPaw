import { z } from 'zod';
import { opcional, texto } from './comunes';

const telefono = z.string().trim().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos (p. ej. 6241234567)');
const email = z.string().trim().email('Email inválido');

export const listarClientesQuery = z.object({ buscar: opcional(z.string().trim().max(60)) });

export const crearClienteBody = z.object({
  nombre: texto(),
  telefono,
  email: opcional(email),
  referidoPor: opcional(texto(64)),
});

export const actualizarClienteBody = z
  .object({ nombre: texto().optional(), telefono: telefono.optional(), email: opcional(email) })
  .refine((o) => Object.values(o).some((v) => v !== undefined), 'Envía al menos un campo a modificar');

export const crearReferidoBody = z.object({ referidoId: texto(64) });

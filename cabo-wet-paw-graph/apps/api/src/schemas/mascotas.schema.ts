import { z } from 'zod';
import { ESPECIES, TAMANOS, TIPOS_PELO, fechaISO, limite, opcional, texto } from './comunes';

export const crearMascotaBody = z.object({
  nombre: texto(60),
  especie: z.enum(ESPECIES),
  raza: texto(60),
  tamano: z.enum(TAMANOS),
  tipoPelo: z.enum(TIPOS_PELO),
  fechaNacimiento: opcional(fechaISO),
});

/** La especie no se puede cambiar (la raza y el historial dependen de ella). */
export const actualizarMascotaBody = z
  .object({
    nombre: texto(60).optional(),
    raza: texto(60).optional(),
    tamano: z.enum(TAMANOS).optional(),
    tipoPelo: z.enum(TIPOS_PELO).optional(),
    fechaNacimiento: opcional(fechaISO),
  })
  .refine((o) => Object.values(o).some((v) => v !== undefined), 'Envía al menos un campo a modificar');

export const registrarServicioBody = z.object({ servicioId: texto(64) });

export const recomendacionesQuery = z.object({ limite: limite(5, 20) });

export const razasQuery = z.object({ especie: opcional(z.enum(ESPECIES)) });

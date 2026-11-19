import { z } from 'zod';
import { limite, texto } from './comunes';

export const rankingQuery = z.object({ limite: limite(10) });

export const caminoQuery = z
  .object({ desde: texto(64), hasta: texto(64) })
  .refine((q) => q.desde !== q.hasta, { message: 'Elige dos clientes distintos', path: ['hasta'] });

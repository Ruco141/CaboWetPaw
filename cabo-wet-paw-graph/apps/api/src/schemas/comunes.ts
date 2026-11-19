import { z } from 'zod';

export const ESPECIES = ['perro', 'gato'] as const;
export const ESPECIES_PRODUCTO = ['perro', 'gato', 'ambos'] as const;
export const TAMANOS = ['chico', 'mediano', 'grande'] as const;
export const TIPOS_PELO = ['corto', 'largo', 'doble capa', 'rizado'] as const;
export const CATEGORIAS = ['Shampoos', 'Alimentos', 'Accesorios', 'Juguetes'] as const;

/** Texto obligatorio sin espacios sobrantes. */
export const texto = (max = 120) => z.string().trim().min(1, 'Requerido').max(max);

/** Query param opcional: "" se trata como ausente. */
export const opcional = <T extends z.ZodTypeAny>(s: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? undefined : v), s.optional());

/** `?limite=` con valor por defecto y tope. */
export const limite = (porDefecto: number, max = 50) =>
  z.coerce.number().int().min(1).max(max).default(porDefecto);

export const fechaISO = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD');

export const idParam = z.object({ id: texto(64) });

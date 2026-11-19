import { Router } from 'express';
import * as catalogos from '../repositories/catalogos.repository';
import { razasQuery } from '../schemas/mascotas.schema';
import { config, uriEnmascarada } from '../config';
import { verificarConexion } from '../db/driver';

export const catalogosRouter = Router();

catalogosRouter.get('/razas', async (req, res) => {
  const { especie } = razasQuery.parse(req.query);
  res.json(await catalogos.listarRazas(especie));
});

catalogosRouter.get('/categorias', async (_req, res) => {
  res.json(await catalogos.listarCategorias());
});

catalogosRouter.get('/servicios', async (_req, res) => {
  res.json(await catalogos.listarServicios());
});

catalogosRouter.get('/resumen', async (_req, res) => {
  res.json(await catalogos.resumen());
});

/** Estado de la conexión a AuraDB; útil en la demo para mostrar que la base está en la nube. */
catalogosRouter.get('/health', async (_req, res) => {
  const base = { uri: uriEnmascarada(), database: config.NEO4J_DATABASE };
  try {
    const inicio = Date.now();
    const info = await verificarConexion();
    res.json({
      ok: true,
      estado: 'conectado',
      ...base,
      servidor: info.agent ?? null,
      latenciaMs: Date.now() - inicio,
      nube: /\.databases\.neo4j\.io/.test(config.NEO4J_URI),
    });
  } catch (err) {
    res.status(503).json({ ok: false, estado: 'sin conexión', ...base, error: (err as Error).message });
  }
});

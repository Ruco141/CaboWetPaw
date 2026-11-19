import { Router } from 'express';
import * as referidos from '../repositories/referidos.repository';
import { caminoQuery, rankingQuery } from '../schemas/referidos.schema';

export const referidosRouter = Router();

referidosRouter.get('/referidos/ranking', async (req, res) => {
  const { limite } = rankingQuery.parse(req.query);
  res.json(await referidos.ranking(limite));
});

referidosRouter.get('/referidos/camino', async (req, res) => {
  const { desde, hasta } = caminoQuery.parse(req.query);
  res.json(await referidos.caminoEntre(desde, hasta));
});

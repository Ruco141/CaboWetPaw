import { Router } from 'express';
import * as mascotas from '../repositories/mascotas.repository';
import { recomendarParaMascota } from '../repositories/recomendaciones.repository';
import { actualizarMascotaBody, recomendacionesQuery, registrarServicioBody } from '../schemas/mascotas.schema';
import { idParam } from '../schemas/comunes';

export const mascotasRouter = Router();

mascotasRouter.patch('/mascotas/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await mascotas.actualizarMascota(id, actualizarMascotaBody.parse(req.body)));
});

mascotasRouter.delete('/mascotas/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await mascotas.eliminarMascota(id));
});

mascotasRouter.post('/mascotas/:id/servicios', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { servicioId } = registrarServicioBody.parse(req.body);
  res.status(201).json(await mascotas.registrarServicio(id, servicioId));
});

mascotasRouter.get('/mascotas/:id/recomendaciones', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { limite } = recomendacionesQuery.parse(req.query);
  res.json(await recomendarParaMascota(id, limite));
});

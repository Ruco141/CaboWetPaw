import { Router } from 'express';
import * as clientes from '../repositories/clientes.repository';
import * as referidos from '../repositories/referidos.repository';
import { crearMascota } from '../repositories/mascotas.repository';
import { actualizarClienteBody, crearClienteBody, crearReferidoBody, listarClientesQuery } from '../schemas/clientes.schema';
import { crearMascotaBody } from '../schemas/mascotas.schema';
import { idParam } from '../schemas/comunes';

export const clientesRouter = Router();

clientesRouter.get('/clientes', async (req, res) => {
  const { buscar } = listarClientesQuery.parse(req.query);
  res.json(await clientes.listarClientes(buscar));
});

clientesRouter.get('/clientes/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await clientes.fichaCliente(id));
});

clientesRouter.post('/clientes', async (req, res) => {
  const datos = crearClienteBody.parse(req.body);
  res.status(201).json(await clientes.crearCliente(datos));
});

clientesRouter.patch('/clientes/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await clientes.actualizarCliente(id, actualizarClienteBody.parse(req.body)));
});

clientesRouter.delete('/clientes/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await clientes.eliminarCliente(id));
});

clientesRouter.post('/clientes/:id/mascotas', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.status(201).json(await crearMascota(id, crearMascotaBody.parse(req.body)));
});

clientesRouter.get('/clientes/:id/referidos', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await referidos.redDeReferidos(id));
});

clientesRouter.post('/clientes/:id/referidos', async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { referidoId } = crearReferidoBody.parse(req.body);
  res.status(201).json(await referidos.crearReferido(id, referidoId));
});

clientesRouter.get('/clientes/:id/cadena', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await referidos.cadenaHaciaArriba(id));
});

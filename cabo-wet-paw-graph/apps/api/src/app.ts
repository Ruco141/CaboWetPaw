/** Construcción de la app Express (separada de index.ts para poder usarla en el smoke test). */
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { clientesRouter } from './routes/clientes.routes';
import { mascotasRouter } from './routes/mascotas.routes';
import { productosRouter } from './routes/productos.routes';
import { referidosRouter } from './routes/referidos.routes';
import { catalogosRouter } from './routes/catalogos.routes';
import { manejarErrores, rutaNoEncontrada } from './middleware/errores';

export function crearApp() {
  const app = express();
  app.use(cors({ origin: config.WEB_ORIGIN }));
  app.use(express.json());

  const api = express.Router();
  api.use(catalogosRouter, clientesRouter, mascotasRouter, productosRouter, referidosRouter);
  app.use('/api', api);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}

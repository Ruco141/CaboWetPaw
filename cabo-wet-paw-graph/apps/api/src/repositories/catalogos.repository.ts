import { leer } from '../db/driver';
import * as Q from '../queries/catalogos.cypher';

export const listarRazas = (especie?: string) => leer(Q.LISTAR_RAZAS.cypher, { especie: especie ?? null });
export const listarCategorias = () => leer(Q.LISTAR_CATEGORIAS.cypher);
export const listarServicios = () => leer(Q.LISTAR_SERVICIOS.cypher);
export const resumen = async () => (await leer(Q.RESUMEN.cypher))[0];

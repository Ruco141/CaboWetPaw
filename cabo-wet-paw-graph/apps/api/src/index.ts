/**
 * Arranque de la API.
 * 1. Valida la configuración (config.ts se detiene si la URI no es de AuraDB).
 * 2. Crea el driver singleton y verifica la conectividad ANTES de abrir el puerto:
 *    si AuraDB no responde (instancia pausada, contraseña incorrecta…), falla rápido.
 * 3. Cierre ordenado en SIGINT/SIGTERM: primero deja de aceptar peticiones, luego
 *    cierra el driver (que a su vez cierra las conexiones del pool).
 */
import { config, uriEnmascarada } from './config';
import { cerrarDriver, verificarConexion } from './db/driver';
import { crearApp } from './app';

async function main() {
  try {
    const info = await verificarConexion();
    console.log(`✔ Conectado a Neo4j AuraDB ${uriEnmascarada()} (${info.agent})`);
  } catch (err) {
    console.error(`✖ No se pudo conectar a ${uriEnmascarada()}: ${(err as Error).message}`);
    console.error('  Revisa NEO4J_URI / NEO4J_PASSWORD en .env y que la instancia de AuraDB no esté pausada.');
    await cerrarDriver();
    process.exit(1);
  }

  const servidor = crearApp().listen(config.API_PORT, () => {
    console.log(`✔ API escuchando en http://localhost:${config.API_PORT}/api`);
  });

  let cerrando = false;
  const apagar = async (senal: string) => {
    if (cerrando) return;
    cerrando = true;
    console.log(`\n${senal} recibido: cerrando servidor…`);
    servidor.close(async () => {
      await cerrarDriver();
      console.log('✔ Driver de Neo4j cerrado. Adiós.');
      process.exit(0);
    });
    // Si alguna conexión HTTP keep-alive no se cierra, forzar salida.
    setTimeout(() => process.exit(0), 5000).unref();
    servidor.closeAllConnections?.();
  };
  process.on('SIGINT', () => void apagar('SIGINT'));
  process.on('SIGTERM', () => void apagar('SIGTERM'));
}

void main();

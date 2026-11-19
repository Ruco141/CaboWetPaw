/**
 * `npm run seed -- --yes` — borra los datos de la app en AuraDB y vuelve a poblar.
 *
 * - Usa el mismo driver singleton que la API.
 * - Aplica antes los constraints (idempotentes).
 * - Carga por lotes con UNWIND (una consulta por tipo de dato en lugar de cientos).
 * - Todo dentro de una transacción `executeWrite`: o queda el seed completo o nada.
 * - Pide `--yes` para no borrar la base por accidente.
 */
import neo4j from 'neo4j-driver';
import { cerrarDriver, enTx, leer, transaccionEscritura } from '../apps/api/src/db/driver';
import { uriEnmascarada } from '../apps/api/src/config';
import { aplicarConstraints } from './constraints';
import * as datos from './seed-data';

const ETIQUETAS_APP = ['Cliente', 'Mascota', 'Raza', 'Producto', 'Categoria', 'Servicio'];

async function main() {
  if (!process.argv.includes('--yes')) {
    console.log('Este comando BORRA todos los clientes, mascotas, productos, compras y referidos de');
    console.log(`${uriEnmascarada()} y los vuelve a crear con los datos de demo.`);
    console.log('\nPara confirmar ejecuta:  npm run seed -- --yes\n');
    process.exitCode = 1;
    return;
  }

  console.log(`Seed en ${uriEnmascarada()}`);
  console.log('1) Constraints');
  await aplicarConstraints();

  console.log('2) Borrando datos de la app y cargando el seed (una sola transacción)…');
  await transaccionEscritura(async (tx) => {
    await enTx(
      tx,
      `MATCH (n) WHERE any(l IN labels(n) WHERE l IN $etiquetas) DETACH DELETE n`,
      { etiquetas: ETIQUETAS_APP },
    );

    await enTx(tx, `UNWIND $nombres AS nombre CREATE (:Categoria {nombre: nombre})`, { nombres: [...datos.categorias] });

    await enTx(
      tx,
      `UNWIND $productos AS p
       MATCH (cat:Categoria {nombre: p.categoria})
       CREATE (:Producto {sku: p.sku, nombre: p.nombre, precio: p.precio, especie: p.especie, stock: p.stock})-[:PERTENECE_A]->(cat)`,
      // precio viaja como float (number de JS); stock como entero de Neo4j.
      { productos: datos.productos.map((p) => ({ ...p, stock: neo4j.int(p.stock) })) },
    );

    await enTx(tx, `UNWIND $razas AS r CREATE (:Raza {nombre: r.nombre, especie: r.especie})`, { razas: datos.razas });

    await enTx(tx, `UNWIND $servicios AS s CREATE (:Servicio {id: s.id, nombre: s.nombre, precio: s.precio})`, {
      servicios: datos.servicios,
    });

    await enTx(
      tx,
      `UNWIND $clientes AS c
       CREATE (n:Cliente {id: c.id, nombre: c.nombre, telefono: c.telefono, fechaAlta: date(c.fechaAlta)})
       SET n.email = c.email`,
      { clientes: datos.clientes },
    );

    await enTx(
      tx,
      `UNWIND $mascotas AS m
       MATCH (c:Cliente {id: m.clienteId})
       MATCH (r:Raza {nombre: m.raza})
       WHERE r.especie = m.especie
       CREATE (c)-[:TIENE]->(n:Mascota {id: m.id, nombre: m.nombre, especie: m.especie, tamano: m.tamano, tipoPelo: m.tipoPelo})
       CREATE (n)-[:ES_RAZA]->(r)
       SET n.fechaNacimiento = CASE WHEN m.fechaNacimiento IS NULL THEN null ELSE date(m.fechaNacimiento) END`,
      { mascotas: datos.mascotas },
    );

    await enTx(
      tx,
      `UNWIND $compras AS k
       MATCH (c:Cliente {id: k.clienteId}), (p:Producto {sku: k.sku})
       CREATE (c)-[:COMPRO {fecha: datetime(k.fecha), cantidad: k.cantidad}]->(p)`,
      { compras: datos.compras.map((k) => ({ ...k, cantidad: neo4j.int(k.cantidad) })) },
    );

    await enTx(
      tx,
      `UNWIND $servicios AS s
       MATCH (m:Mascota {id: s.mascotaId}), (srv:Servicio {id: s.servicioId})
       CREATE (m)-[:RECIBIO {fecha: datetime(s.fecha)}]->(srv)`,
      { servicios: datos.serviciosRecibidos },
    );

    await enTx(
      tx,
      `UNWIND $referidos AS r
       MATCH (a:Cliente {id: r.de}), (b:Cliente {id: r.a})
       CREATE (a)-[:REFIRIO {fecha: date(r.fecha)}]->(b)`,
      { referidos: datos.referidos },
    );
  });

  // Verificación: conteos reales en la base.
  const [conteo] = await leer(`
    RETURN COUNT { (:Categoria) } AS categorias, COUNT { (:Producto) } AS productos,
           COUNT { (:Raza) } AS razas, COUNT { (:Servicio) } AS servicios,
           COUNT { (:Cliente) } AS clientes, COUNT { (:Mascota) } AS mascotas,
           COUNT { ()-[:COMPRO]->() } AS compras, COUNT { ()-[:RECIBIO]->() } AS serviciosRecibidos,
           COUNT { ()-[:REFIRIO]->() } AS referidos`);
  console.log('3) Listo. Contenido de la base:');
  console.table(conteo);
  console.log(`Clientes de demo (pocas compras): ${datos.clientesDemo.join(', ')}`);
}

main()
  .catch((err) => {
    console.error('✖ Error en el seed:', err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => cerrarDriver());

/**
 * `npm run smoke` — prueba rápida antes de la demo.
 *
 * Levanta la app Express en un puerto libre (mismo código que `npm run dev`),
 * llama a los endpoints principales contra AuraDB e imprime un resumen.
 * No modifica datos: los casos de error (409) se eligen para que la regla
 * los rechace antes de escribir.
 */
import type { AddressInfo } from 'node:net';
import { crearApp } from '../apps/api/src/app';
import { cerrarDriver } from '../apps/api/src/db/driver';

let fallos = 0;

async function main() {
  const servidor = crearApp().listen(0);
  await new Promise((r) => servidor.once('listening', r));
  const base = `http://localhost:${(servidor.address() as AddressInfo).port}/api`;

  async function llamar(metodo: string, ruta: string, esperado: number, body?: unknown) {
    const res = await fetch(base + ruta, {
      method: metodo,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => null);
    const ok = res.status === esperado;
    if (!ok) fallos++;
    console.log(`${ok ? '✔' : '✖'} ${metodo.padEnd(4)} ${ruta}  → ${res.status}${ok ? '' : ` (esperado ${esperado})`}`);
    return json as any;
  }

  try {
    const health = await llamar('GET', '/health', 200);
    console.log(`    ${health.estado} a ${health.uri} · ${health.servidor ?? health.error} · ${health.latenciaMs ?? "-"} ms`);

    const resumen = await llamar('GET', '/resumen', 200);
    console.log('   ', resumen);

    const clientes = await llamar('GET', '/clientes', 200);
    console.log(`    ${clientes.length} clientes; búsqueda "ximena": ${(await llamar('GET', '/clientes?buscar=ximena', 200)).length}`);

    const ficha = await llamar('GET', '/clientes/cli-21', 200);
    console.log(`    ${ficha.cliente.nombre} · referida por ${ficha.referidoPor?.nombre} · mascotas: ${ficha.mascotas.map((m: any) => `${m.nombre} (${m.raza})`).join(', ')}`);

    for (const mascotaId of ['m-29', 'm-30', 'm-31']) {
      const r = await llamar('GET', `/mascotas/${mascotaId}/recomendaciones?limite=5`, 200);
      console.log(`    Recomendaciones para ${r.mascota.id} (${r.mascota.raza}, ${r.mascota.tamano}):`);
      for (const rec of r.recomendaciones) console.log(`      - [${rec.afinidad}] ${rec.nombre} — ${rec.motivo}`);
    }

    const red = await llamar('GET', '/clientes/cli-01/referidos', 200);
    console.log(`    Red de cli-01: ${red.totalReferidos} referidos, ${red.puntosTotales} puntos`);
    for (const n of red.niveles) console.log(`      Nivel ${n.nivel} (${n.puntos} pts): ${n.miembros.map((m: any) => m.nombre).join(', ')}`);

    const cadena = await llamar('GET', '/clientes/cli-09/cadena', 200);
    console.log(`    Cadena de cli-09: ${cadena.cadena.map((n: any) => n.nombre).join(' → ')}`);

    const ranking = await llamar('GET', '/referidos/ranking?limite=5', 200);
    for (const [i, r] of ranking.entries()) console.log(`    ${i + 1}. ${r.nombre} — ${r.puntos} pts (${r.tamanoRed} en su red)`);

    const camino = await llamar('GET', '/referidos/camino?desde=cli-09&hasta=cli-11', 200);
    console.log(`    Camino cli-09 ↔ cli-11 (${camino.saltos} saltos): ${camino.camino.map((n: any) => n.nombre).join(' – ')}`);
    const sinCamino = await llamar('GET', '/referidos/camino?desde=cli-17&hasta=cli-01', 404);
    console.log(`    cli-17 ↔ cli-01: ${sinCamino.error}`);

    console.log(`    ${(await llamar('GET', '/productos?categoria=Shampoos', 200)).length} shampoos; ${(await llamar('GET', '/razas?especie=gato', 200)).length} razas de gato; ${(await llamar('GET', '/servicios', 200)).length} servicios; ${(await llamar('GET', '/categorias', 200)).length} categorías`);

    console.log('  Reglas de negocio (no escriben nada):');
    console.log(`    ${(await llamar('POST', '/clientes/cli-13/referidos', 409, { referidoId: 'cli-02' })).error}`);
    console.log(`    ${(await llamar('POST', '/clientes/cli-08/referidos', 409, { referidoId: 'cli-01' })).error}`);
    console.log(`    ${(await llamar('POST', '/clientes/cli-01/referidos', 409, { referidoId: 'cli-01' })).error}`);
    console.log(`    ${(await llamar('POST', '/compras', 409, { clienteId: 'cli-21', sku: 'JU-06', cantidad: 99 })).error}`);
    console.log(`    ${(await llamar('POST', '/clientes', 400, { nombre: '', telefono: '123' })).error}`);
    console.log(`    ${(await llamar('GET', '/clientes/no-existe', 404)).error}`);
  } finally {
    servidor.close();
    await cerrarDriver();
  }

  console.log(fallos === 0 ? '\n✔ Smoke test OK' : `\n✖ ${fallos} verificación(es) fallaron`);
  process.exitCode = fallos === 0 ? 0 : 1;
}

main().catch(async (err) => {
  console.error('✖ Error en el smoke test:', err.message ?? err);
  await cerrarDriver();
  process.exitCode = 1;
});

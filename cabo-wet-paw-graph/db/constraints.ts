/**
 * `npm run db:constraints` — aplica db/constraints.cypher en AuraDB.
 * Usa el mismo driver singleton que la API (apps/api/src/db/driver.ts).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { cerrarDriver, escribir, leer } from '../apps/api/src/db/driver';
import { uriEnmascarada } from '../apps/api/src/config';

const archivo = path.join(path.dirname(fileURLToPath(import.meta.url)), 'constraints.cypher');

/** Separa el archivo en sentencias (por `;`) ignorando comentarios `//`. */
export function leerSentencias(): string[] {
  return readFileSync(archivo, 'utf8')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function aplicarConstraints(): Promise<void> {
  const sentencias = leerSentencias();
  for (const s of sentencias) {
    await escribir(s); // DDL: no lleva parámetros
    console.log(`  ✔ ${s.split(' IF NOT EXISTS')[0]}`);
  }
}

// Ejecutado directamente (no importado por seed.ts)
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  console.log(`Aplicando constraints en ${uriEnmascarada()}…`);
  try {
    await aplicarConstraints();
    const existentes = await leer<{ name: string; type: string }>('SHOW CONSTRAINTS YIELD name, type RETURN name, type ORDER BY name');
    console.log(`\nConstraints en la base (${existentes.length}): ${existentes.map((c) => c.name).join(', ')}`);
  } catch (err) {
    console.error('✖ Error aplicando constraints:', (err as Error).message);
    process.exitCode = 1;
  } finally {
    await cerrarDriver();
  }
}

/**
 * `npm run docs:consultas` — genera docs/consultas.md a partir de
 * apps/api/src/queries/*.cypher.ts, para que la documentación y el código
 * siempre coincidan.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Consulta } from '../apps/api/src/queries/consulta';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dirQueries = path.join(raiz, 'apps/api/src/queries');

const TITULOS: Record<string, string> = {
  'clientes.cypher.ts': 'Clientes (CRUD)',
  'mascotas.cypher.ts': 'Mascotas (CRUD y servicios)',
  'productos.cypher.ts': 'Productos (CRUD)',
  'compras.cypher.ts': 'Compras',
  'recomendaciones.cypher.ts': 'Recomendaciones (vecindad de 2 saltos)',
  'referidos.cypher.ts': 'Referidos (traversals de longitud variable y shortestPath)',
  'catalogos.cypher.ts': 'Catálogos y resumen',
};

const archivos = readdirSync(dirQueries).filter((f) => f.endsWith('.cypher.ts'));
const orden = Object.keys(TITULOS);
archivos.sort((a, b) => orden.indexOf(a) - orden.indexOf(b));

let md = `# Catálogo de consultas Cypher\n\n`;
md += `> Archivo generado con \`npm run docs:consultas\` a partir de \`apps/api/src/queries/\`. No lo edites a mano.\n\n`;
md += `Todas las consultas son **parametrizadas** (\`$param\`). Los enteros (\`LIMIT\`, \`cantidad\`, \`stock\`) se envían con \`neo4j.int()\`.\n\n`;

let total = 0;
const indice: string[] = [];
const cuerpo: string[] = [];
for (const archivo of archivos) {
  const modulo = (await import(pathToFileURL(path.join(dirQueries, archivo)).href)) as Record<string, Consulta>;
  cuerpo.push(`## ${TITULOS[archivo] ?? archivo}\n\nArchivo: \`apps/api/src/queries/${archivo}\`\n`);
  for (const [nombre, q] of Object.entries(modulo)) {
    if (!q || typeof q !== 'object' || !('cypher' in q)) continue;
    total++;
    indice.push(`- [\`${nombre}\`](#${nombre.toLowerCase()}) — ${archivo}`);
    const params = Object.entries(q.parametros);
    cuerpo.push(
      `### ${nombre}\n\n${q.proposito}\n\n` +
        `**Parámetros:** ${params.length ? '\n\n' + params.map(([k, v]) => `- \`$${k}\`: ${v}`).join('\n') : 'ninguno'}\n\n` +
        '```cypher\n' + q.cypher + '\n```\n\n' +
        '**Ejemplo de resultado:**\n\n```json\n' + JSON.stringify(q.ejemplo, null, 2) + '\n```\n',
    );
  }
}
md += `**${total} consultas.**\n\n${indice.join('\n')}\n\n${cuerpo.join('\n')}`;
md += `\n## Consultas de los scripts de \`db/\`\n\nEl seed (\`db/seed.ts\`) usa consultas \`UNWIND $lista AS x CREATE …\` por lotes y \`db/constraints.cypher\` contiene el DDL; ambos están comentados en su archivo.\n`;

writeFileSync(path.join(raiz, 'docs/consultas.md'), md);
console.log(`✔ docs/consultas.md generado (${total} consultas)`);

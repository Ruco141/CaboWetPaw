/**
 * Configuración de la API.
 *
 * Lee el archivo `.env` de la RAÍZ del monorepo (lo comparten la API y los
 * scripts de `db/`) y valida cada variable con zod. Si algo falta o la URI
 * apunta a una instancia local, el proceso se detiene con un mensaje claro:
 * el requisito de la materia es que la base viva en Neo4j AuraDB (nube).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(raiz, '.env'), quiet: true });

const esquemaEnv = z.object({
  NEO4J_URI: z
    .string({ error: 'Falta NEO4J_URI en .env' })
    .min(1, 'Falta NEO4J_URI en .env')
    .refine((uri) => !/localhost|127\.0\.0\.1|\[::1\]/i.test(uri), {
      message:
        'NEO4J_URI apunta a una base local. Este proyecto exige Neo4j AuraDB en la nube (neo4j+s://<id>.databases.neo4j.io).',
    })
    .refine((uri) => /^neo4j(\+s|\+ssc)?:\/\//.test(uri), {
      message: 'NEO4J_URI debe empezar con neo4j+s:// (la URI que entrega AuraDB).',
    }),
  NEO4J_USERNAME: z.string().min(1).default('neo4j'),
  NEO4J_PASSWORD: z.string({ error: 'Falta NEO4J_PASSWORD en .env' }).min(1, 'Falta NEO4J_PASSWORD en .env'),
  NEO4J_DATABASE: z.string().min(1).default('neo4j'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:5173'),
});

const resultado = esquemaEnv.safeParse(process.env);
if (!resultado.success) {
  console.error('\n✖ Configuración inválida (revisa el archivo .env en la raíz del repo):');
  for (const issue of resultado.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('  Copia .env.example a .env y llena los datos de tu instancia de AuraDB.\n');
  process.exit(1);
}

export const config = resultado.data;

/** URI con el identificador de la instancia parcialmente oculto, para mostrar en /api/health. */
export function uriEnmascarada(uri = config.NEO4J_URI): string {
  return uri.replace(/(:\/\/)([^.]+)/, (_m, proto: string, id: string) =>
    `${proto}${id.slice(0, 4)}${'*'.repeat(Math.max(id.length - 4, 0))}`,
  );
}

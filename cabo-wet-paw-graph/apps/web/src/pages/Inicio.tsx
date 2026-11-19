import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { api } from '../api/client';
import type { RankingFila } from '../api/types';
import { ConEstados, Vacio } from '../components/Estados';
import { Seccion } from '../components/Seccion';
import { useCarga } from '../components/useCarga';

const TARJETAS = [
  { clave: 'clientes', titulo: 'Clientes' },
  { clave: 'mascotas', titulo: 'Mascotas' },
  { clave: 'productos', titulo: 'Productos' },
  { clave: 'compras', titulo: 'Compras' },
] as const;

export function Inicio() {
  const resumen = useCarga(() => api.resumen(), []);
  const ranking = useCarga(() => api.ranking(5), []);
  const health = useCarga(() => api.health(), []);

  return (
    <VStack gap={6}>
      <VStack gap={1}>
        <Heading level={1}>Inicio</Heading>
        <Text type="supporting">Boutique de perros y gatos en Cabo San Lucas · datos en un grafo de Neo4j AuraDB</Text>
      </VStack>

      <ConEstados {...resumen}>
        {(r) => (
          <Grid columns={{ minWidth: 180 }} gap={4}>
            {TARJETAS.map((t) => (
              <Card key={t.clave}>
                <VStack gap={1}>
                  <Text type="supporting">{t.titulo}</Text>
                  <Heading level={2} type="display-2">
                    {r[t.clave]}
                  </Heading>
                </VStack>
              </Card>
            ))}
          </Grid>
        )}
      </ConEstados>

      <Grid columns={{ minWidth: 340 }} gap={4}>
        <Seccion titulo="Top 5 referidores" subtitulo="Puntos por red de hasta 3 niveles: 100 · 50 · 25">
          <ConEstados {...ranking} esVacio={(d) => d.length === 0} vacio={<Vacio titulo="Aún no hay referidos" />}>
            {(filas) => (
              <Table<RankingFila>
                data={filas}
                idKey="id"
                density="compact"
                columns={[
                  { key: 'pos', header: '#', renderCell: (f) => <Text hasTabularNumbers>{filas.indexOf(f) + 1}</Text> },
                  { key: 'nombre', header: 'Cliente', renderCell: (f) => <Link href={`/clientes/${f.id}`}>{f.nombre}</Link> },
                  { key: 'tamanoRed', header: 'Red', align: 'end' },
                  {
                    key: 'puntos',
                    header: 'Puntos',
                    align: 'end',
                    renderCell: (f) => <Badge label={`${f.puntos} pts`} variant={filas.indexOf(f) === 0 ? 'success' : 'neutral'} />,
                  },
                ]}
              />
            )}
          </ConEstados>
        </Seccion>

        <Seccion titulo="Conexión a la base de datos" subtitulo="GET /api/health">
          <ConEstados {...health}>
            {(h) => (
              <VStack gap={2}>
                <HStack gap={2} vAlign="center">
                  <StatusDot variant={h.ok ? 'success' : 'error'} label={h.estado} isPulsing={h.ok} />
                  <Text weight="semibold">{h.ok ? 'Conectado a Neo4j AuraDB (nube)' : 'Sin conexión'}</Text>
                </HStack>
                <Text type="code">{h.uri}</Text>
                <Text type="supporting">
                  Base: {h.database}
                  {h.servidor ? ` · ${h.servidor}` : ''}
                  {h.latenciaMs !== undefined ? ` · ${h.latenciaMs} ms` : ''}
                </Text>
                <Text type="supporting">Protocolo neo4j+s: Bolt sobre TLS, con enrutamiento de clúster.</Text>
                {h.error && <Text type="supporting">{h.error}</Text>}
              </VStack>
            )}
          </ConEstados>
        </Seccion>
      </Grid>
    </VStack>
  );
}

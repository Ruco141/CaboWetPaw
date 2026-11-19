import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { api, ApiError } from '../api/client';
import type { Camino } from '../api/types';
import { ConEstados } from '../components/Estados';
import { SelectorCliente } from '../components/SelectorCliente';
import { useCarga } from '../components/useCarga';

/** Búsqueda de caminos: shortestPath((a)-[:REFIRIO*..8]-(b)), sin importar la dirección. */
export function Conexiones() {
  const clientes = useCarga(() => api.clientes(), []);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [resultado, setResultado] = useState<Camino | null>(null);
  const [error, setError] = useState<{ tipo: 'info' | 'error'; texto: string } | null>(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    setResultado(null);
    setError(null);
    if (!desde || !hasta) return setError({ tipo: 'error', texto: 'Elige los dos clientes' });
    setBuscando(true);
    try {
      setResultado(await api.camino(desde, hasta));
    } catch (e) {
      const sinCamino = e instanceof ApiError && e.status === 404;
      setError({ tipo: sinCamino ? 'info' : 'error', texto: (e as Error).message });
    } finally {
      setBuscando(false);
    }
  }

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={1}>Conexiones</Heading>
        <Text type="supporting">¿Cómo se conectan dos clientes por la red de referidos? Camino más corto, hasta 8 saltos.</Text>
      </VStack>

      <ConEstados {...clientes}>
        {(lista) => (
          <Card>
            <VStack gap={4}>
              <Grid columns={{ minWidth: 260 }} gap={4}>
                <SelectorCliente label="Desde" clientes={lista} value={desde} onChange={setDesde} excluir={hasta ? [hasta] : []} />
                <SelectorCliente label="Hasta" clientes={lista} value={hasta} onChange={setHasta} excluir={desde ? [desde] : []} />
              </Grid>
              <HStack hAlign="end">
                <Button label="Buscar camino" variant="primary" onClick={buscar} isLoading={buscando} />
              </HStack>
            </VStack>
          </Card>
        )}
      </ConEstados>

      {error && <Banner status={error.tipo} title={error.tipo === 'info' ? 'Sin conexión' : 'Error'} description={error.texto} />}

      {resultado && (
        <Card>
          <VStack gap={3}>
            <HStack gap={2} vAlign="center">
              <Heading level={2}>Camino encontrado</Heading>
              <Badge label={`${resultado.saltos} ${resultado.saltos === 1 ? 'salto' : 'saltos'}`} variant="info" />
            </HStack>
            <HStack gap={2} wrap="wrap" vAlign="center">
              {resultado.camino.map((n, i) => (
                <HStack key={n.id} gap={2} vAlign="center">
                  {i > 0 && <Text type="supporting">↔</Text>}
                  <Link href={`/clientes/${n.id}`}>{n.nombre}</Link>
                </HStack>
              ))}
            </HStack>
            <Text type="supporting">Cada ↔ es una relación REFIRIO (en cualquier dirección) en el grafo.</Text>
          </VStack>
        </Card>
      )}
    </VStack>
  );
}

import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Divider } from '@astryxdesign/core/Divider';
import { api } from '../api/client';
import { ConEstados, Vacio } from './Estados';
import { mxn } from './formato';
import { useCarga } from './useCarga';

/**
 * Panel de recomendaciones de una mascota. `version` cambia cuando se registra
 * una compra, lo que fuerza a volver a consultar el grafo.
 */
export function Recomendaciones({ mascotaId, version }: { mascotaId: string; version: number }) {
  const carga = useCarga(() => api.recomendaciones(mascotaId, 5), [mascotaId, version]);
  return (
    <ConEstados
      {...carga}
      esVacio={(d) => d.recomendaciones.length === 0}
      vacio={<Vacio titulo="Sin recomendaciones" descripcion="Su dueño ya compró todo lo que compran los dueños de mascotas parecidas." />}
    >
      {(d) => (
        <VStack gap={2}>
          {d.recomendaciones.map((r, i) => (
            <VStack key={r.sku} gap={1}>
              {i > 0 && <Divider />}
              <HStack gap={2} hAlign="between" vAlign="center">
                <Text weight="semibold">{r.nombre}</Text>
                <HStack gap={1} vAlign="center">
                  <Badge label={r.categoria} variant="neutral" />
                  <Badge label={`afinidad ${r.afinidad}`} variant="info" />
                </HStack>
              </HStack>
              <HStack gap={2} hAlign="between">
                <Text type="supporting">Motivo: {r.motivo}</Text>
                <Text type="supporting" hasTabularNumbers>{mxn(r.precio)}</Text>
              </HStack>
            </VStack>
          ))}
        </VStack>
      )}
    </ConEstados>
  );
}

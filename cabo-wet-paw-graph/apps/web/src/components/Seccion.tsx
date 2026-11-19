import type { ReactNode } from 'react';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/** Card con título, subtítulo opcional y acciones a la derecha. */
export function Seccion(props: { titulo: string; subtitulo?: string; acciones?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <VStack gap={4}>
        <HStack gap={3} hAlign="between" vAlign="center" wrap="wrap">
          <VStack gap={1}>
            <Heading level={2}>{props.titulo}</Heading>
            {props.subtitulo && <Text type="supporting">{props.subtitulo}</Text>}
          </VStack>
          {props.acciones && (
            <HStack gap={2} vAlign="center">
              {props.acciones}
            </HStack>
          )}
        </HStack>
        {props.children}
      </VStack>
    </Card>
  );
}

import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Divider } from '@astryxdesign/core/Divider';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { api } from '../api/client';
import type { ClienteFila } from '../api/types';
import { ConEstados, Vacio } from './Estados';
import { Seccion } from './Seccion';
import { SelectorCliente } from './SelectorCliente';
import { useCarga } from './useCarga';

const NOMBRE_NIVEL: Record<number, string> = {
  1: 'Nivel 1 · referidos directos',
  2: 'Nivel 2 · referidos de sus referidos',
  3: 'Nivel 3',
};

/** Red de referidos (traversal REFIRIO*1..3) agrupada por nivel + formulario para agregar un referido. */
export function RedReferidosPanel(props: { clienteId: string; clientes: ClienteFila[]; version: number; alCambiar: () => void }) {
  const red = useCarga(() => api.red(props.clienteId), [props.clienteId, props.version]);
  const [referidoId, setReferidoId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function agregar() {
    setOk(null);
    if (!referidoId) return setError('Elige a qué cliente refirió');
    setGuardando(true);
    setError(null);
    try {
      await api.agregarReferido(props.clienteId, referidoId);
      setOk(`Referido agregado: ${props.clientes.find((c) => c.id === referidoId)?.nombre ?? referidoId}`);
      setReferidoId('');
      props.alCambiar();
    } catch (e) {
      setError((e as Error).message); // p. ej. 409 "Este cliente ya fue referido por otra persona"
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Seccion
      titulo="Red de referidos"
      subtitulo="Hasta 3 niveles · 100, 50 y 25 puntos"
      acciones={red.datos && <Badge label={`${red.datos.puntosTotales} pts · ${red.datos.totalReferidos} personas`} variant="success" />}
    >
      <ConEstados {...red} esVacio={(d) => d.totalReferidos === 0} vacio={<Vacio titulo="Aún no ha referido a nadie" />}>
        {(d) => (
          <VStack gap={3}>
            {d.niveles
              .filter((n) => n.miembros.length > 0)
              .map((n) => (
                <VStack key={n.nivel} gap={1}>
                  <HStack gap={2} hAlign="between">
                    <Text type="label">{NOMBRE_NIVEL[n.nivel]}</Text>
                    <Badge label={`${n.puntos} pts`} />
                  </HStack>
                  <HStack gap={3} wrap="wrap">
                    {n.miembros.map((m) => (
                      <Link key={m.id} href={`/clientes/${m.id}`}>
                        {m.nombre}
                      </Link>
                    ))}
                  </HStack>
                </VStack>
              ))}
          </VStack>
        )}
      </ConEstados>
      <Divider />
      <VStack gap={2}>
        <SelectorCliente
          label="Agregar a alguien que este cliente refirió"
          clientes={props.clientes}
          value={referidoId}
          onChange={setReferidoId}
          excluir={[props.clienteId]}
        />
        <HStack hAlign="end">
          <Button label="Agregar referido" onClick={agregar} isLoading={guardando} />
        </HStack>
        {error && <Banner status="error" title="No se pudo agregar el referido" description={error} />}
        {ok && <Banner status="success" title={ok} isDismissable onDismiss={() => setOk(null)} />}
      </VStack>
    </Seccion>
  );
}

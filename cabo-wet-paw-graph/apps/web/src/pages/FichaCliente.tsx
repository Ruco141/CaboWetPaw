import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { BreadcrumbItem, Breadcrumbs } from '@astryxdesign/core/Breadcrumbs';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { api } from '../api/client';
import type { Cadena, CompraFila, Mascota } from '../api/types';
import { ClienteDialog } from '../components/ClienteDialog';
import { CompraDialog } from '../components/CompraDialog';
import { ConEstados, Vacio } from '../components/Estados';
import { fecha, mxn } from '../components/formato';
import { Recomendaciones } from '../components/Recomendaciones';
import { RedReferidosPanel } from '../components/RedReferidosPanel';
import { Seccion } from '../components/Seccion';
import { useCarga } from '../components/useCarga';

const ICONO: Record<string, string> = { perro: '🐶', gato: '🐱' };

function TarjetaMascota({ m, version }: { m: Mascota; version: number }) {
  return (
    <Card>
      <VStack gap={3}>
        <VStack gap={1}>
          <Heading level={3}>
            {ICONO[m.especie]} {m.nombre}
          </Heading>
          <HStack gap={1} wrap="wrap">
            <Badge label={m.raza ?? 'Sin raza'} variant="blue" />
            <Badge label={m.tamano} />
            <Badge label={`pelo ${m.tipoPelo}`} />
          </HStack>
        </VStack>
        <Text type="label">Recomendaciones para {m.nombre}</Text>
        <Recomendaciones mascotaId={m.id} version={version} />
      </VStack>
    </Card>
  );
}

/** Cadena hacia arriba como migas de pan: origen → … → este cliente. */
function MigasCadena({ cadena, cargando }: { cadena?: Cadena; cargando: boolean }) {
  if (!cadena) return <Text type="supporting">{cargando ? 'Cargando cadena…' : ''}</Text>;
  if (cadena.llegoPorSuCuenta) return <Text type="supporting">Llegó por su cuenta (nadie lo refirió)</Text>;
  return (
    <Breadcrumbs label="Cadena de referidos" separator="→">
      {cadena.cadena.map((n, i, arr) =>
        i === arr.length - 1 ? (
          <BreadcrumbItem key={n.id} isCurrent>
            {n.nombre}
          </BreadcrumbItem>
        ) : (
          <BreadcrumbItem key={n.id} href={`/clientes/${n.id}`}>
            {n.nombre}
          </BreadcrumbItem>
        ),
      )}
    </Breadcrumbs>
  );
}

export function FichaCliente() {
  const { id = '' } = useParams();
  const [version, setVersion] = useState(0); // se incrementa tras cada compra o cambio -> recarga
  const ficha = useCarga(() => api.ficha(id), [id, version]);
  const cadena = useCarga(() => api.cadena(id), [id, version]);
  const clientes = useCarga(() => api.clientes(), [version]);
  const [compraAbierta, setCompraAbierta] = useState(false);
  const [editarAbierto, setEditarAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <ConEstados {...ficha}>
      {(f) => (
        <VStack gap={5}>
          <VStack gap={1}>
            <Text type="supporting">Cadena de referidos</Text>
            <MigasCadena cadena={cadena.datos} cargando={cadena.cargando} />
          </VStack>

          <HStack gap={3} hAlign="between" vAlign="end" wrap="wrap">
            <VStack gap={1}>
              <Heading level={1}>{f.cliente.nombre}</Heading>
              <Text type="supporting">
                Tel. {f.cliente.telefono} · {f.cliente.email ?? 'sin email'} · cliente desde {fecha(f.cliente.fechaAlta)}
              </Text>
              <Text type="supporting">
                Referido por: {f.referidoPor ? <Link href={`/clientes/${f.referidoPor.id}`}>{f.referidoPor.nombre}</Link> : 'nadie'}
              </Text>
            </VStack>
            <HStack gap={2}>
              <Button label="Editar" onClick={() => setEditarAbierto(true)} />
              <Button label="Registrar compra" variant="primary" onClick={() => setCompraAbierta(true)} />
            </HStack>
          </HStack>

          {aviso && <Banner status="success" title={aviso} isDismissable onDismiss={() => setAviso(null)} />}

          <VStack gap={3}>
            <Heading level={2}>Mascotas y recomendaciones</Heading>
            {f.mascotas.length === 0 ? (
              <Vacio titulo="Sin mascotas registradas" />
            ) : (
              <Grid columns={{ minWidth: 360 }} gap={4}>
                {f.mascotas.map((m) => (
                  <TarjetaMascota key={m.id} m={m} version={version} />
                ))}
              </Grid>
            )}
          </VStack>

          <Grid columns={{ minWidth: 380 }} gap={4}>
            <Seccion titulo="Últimas compras" subtitulo="Las 10 más recientes (relaciones COMPRO)">
              {f.ultimasCompras.length === 0 ? (
                <Vacio titulo="Todavía no compra nada" descripcion="Registra una compra y mira cómo cambian las recomendaciones." />
              ) : (
                <Table<CompraFila>
                  data={f.ultimasCompras}
                  idKey={(c) => `${c.sku}-${c.fecha}`}
                  density="compact"
                  columns={[
                    { key: 'fecha', header: 'Fecha', renderCell: (c) => fecha(c.fecha) },
                    { key: 'nombre', header: 'Producto' },
                    { key: 'cantidad', header: 'Cant.', align: 'end' },
                    { key: 'precio', header: 'Precio', align: 'end', renderCell: (c) => mxn(c.precio) },
                  ]}
                />
              )}
            </Seccion>

            <RedReferidosPanel
              clienteId={f.cliente.id}
              clientes={clientes.datos ?? []}
              version={version}
              alCambiar={() => setVersion((v) => v + 1)}
            />
          </Grid>

          <CompraDialog
            abierto={compraAbierta}
            cerrar={() => setCompraAbierta(false)}
            clienteId={f.cliente.id}
            alComprar={(msg) => {
              setAviso(`${msg} Las recomendaciones se recalcularon.`);
              setVersion((v) => v + 1);
            }}
          />
          <ClienteDialog
            abierto={editarAbierto}
            cerrar={() => setEditarAbierto(false)}
            cliente={f.cliente}
            alGuardar={() => {
              setAviso('Datos actualizados');
              setVersion((v) => v + 1);
            }}
          />
        </VStack>
      )}
    </ConEstados>
  );
}

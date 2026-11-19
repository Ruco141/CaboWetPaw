import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { api } from '../api/client';
import type { ClienteFila } from '../api/types';
import { ClienteDialog, type ClienteEditable } from '../components/ClienteDialog';
import { ConfirmarEliminar } from '../components/ConfirmarEliminar';
import { ConEstados, Vacio } from '../components/Estados';
import { fecha } from '../components/formato';
import { useCarga } from '../components/useCarga';

export function Clientes() {
  const navegar = useNavigate();
  const [buscar, setBuscar] = useState('');
  const [filtro, setFiltro] = useState('');
  const [dialogo, setDialogo] = useState<{ abierto: boolean; cliente: ClienteEditable | null }>({ abierto: false, cliente: null });
  const [eliminar, setEliminar] = useState<ClienteFila | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // Pequeño debounce para no consultar en cada tecla.
  useEffect(() => {
    const t = setTimeout(() => setFiltro(buscar.trim()), 250);
    return () => clearTimeout(t);
  }, [buscar]);

  const lista = useCarga(() => api.clientes(filtro || undefined), [filtro]);
  // Lista completa (sin filtro) para el selector "¿Quién lo refirió?".
  const todos = useCarga(() => api.clientes(), [lista.datos]);

  return (
    <VStack gap={4}>
      <HStack gap={3} hAlign="between" vAlign="end" wrap="wrap">
        <VStack gap={1}>
          <Heading level={1}>Clientes</Heading>
          <Text type="supporting">Dueños de mascotas registrados en el grafo</Text>
        </VStack>
        <Button label="Nuevo cliente" variant="primary" onClick={() => setDialogo({ abierto: true, cliente: null })} />
      </HStack>

      {aviso && <Banner status="success" title={aviso} isDismissable onDismiss={() => setAviso(null)} />}

      <TextInput
        label="Buscar"
        isLabelHidden
        placeholder="Buscar por nombre o teléfono…"
        type="search"
        value={buscar}
        onChange={setBuscar}
        hasClear
        width={360}
      />

      <ConEstados
        {...lista}
        esVacio={(d) => d.length === 0}
        vacio={
          <Vacio
            titulo={filtro ? 'Ningún cliente coincide' : 'Aún no hay clientes'}
            descripcion={filtro ? 'Prueba con otro nombre o teléfono.' : 'Corre npm run seed -- --yes o crea uno nuevo.'}
          />
        }
      >
        {(clientes) => (
          <Table<ClienteFila>
            data={clientes}
            idKey="id"
            hasHover
            columns={[
              { key: 'nombre', header: 'Nombre', renderCell: (c) => <Link href={`/clientes/${c.id}`}>{c.nombre}</Link> },
              { key: 'telefono', header: 'Teléfono' },
              { key: 'email', header: 'Email', renderCell: (c) => <Text type="supporting">{c.email ?? '—'}</Text> },
              { key: 'fechaAlta', header: 'Alta', renderCell: (c) => fecha(c.fechaAlta) },
              { key: 'mascotas', header: 'Mascotas', align: 'end' },
              { key: 'compras', header: 'Compras', align: 'end' },
              {
                key: 'acciones',
                header: '',
                align: 'end',
                renderCell: (c) => (
                  <HStack gap={1} hAlign="end">
                    <Button label="Editar" size="sm" onClick={() => setDialogo({ abierto: true, cliente: c })} />
                    <Button label="Eliminar" size="sm" variant="destructive" onClick={() => setEliminar(c)} />
                  </HStack>
                ),
              },
            ]}
          />
        )}
      </ConEstados>

      <ClienteDialog
        abierto={dialogo.abierto}
        cliente={dialogo.cliente}
        clientes={todos.datos ?? []}
        cerrar={() => setDialogo({ abierto: false, cliente: null })}
        alGuardar={(id) => {
          if (dialogo.cliente) {
            setAviso('Cliente actualizado');
            lista.recargar();
          } else {
            navegar(`/clientes/${id}`);
          }
        }}
      />

      <ConfirmarEliminar
        abierto={eliminar !== null}
        cerrar={() => setEliminar(null)}
        titulo={`¿Eliminar a ${eliminar?.nombre ?? ''}?`}
        descripcion="Se borrarán el cliente, sus mascotas, sus compras y sus relaciones de referidos. Las personas que refirió quedarán sin referidor (la cadena se corta). No se puede deshacer."
        onConfirmar={async () => {
          await api.eliminarCliente(eliminar!.id);
          setAviso(`${eliminar!.nombre} fue eliminado`);
          lista.recargar();
        }}
      />
    </VStack>
  );
}

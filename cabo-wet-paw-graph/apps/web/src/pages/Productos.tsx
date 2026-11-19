import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Selector } from '@astryxdesign/core/Selector';
import { Table } from '@astryxdesign/core/Table';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { api } from '../api/client';
import type { Producto } from '../api/types';
import { ConfirmarEliminar } from '../components/ConfirmarEliminar';
import { ConEstados, Vacio } from '../components/Estados';
import { ESPECIE_LABEL, mxn } from '../components/formato';
import { OPCIONES_CATEGORIA, OPCIONES_ESPECIE, ProductoDialog } from '../components/ProductoDialog';
import { useCarga } from '../components/useCarga';

export function Productos() {
  const [categoria, setCategoria] = useState('');
  const [especie, setEspecie] = useState('');
  const [dialogo, setDialogo] = useState<{ abierto: boolean; producto: Producto | null }>({ abierto: false, producto: null });
  const [eliminar, setEliminar] = useState<Producto | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const lista = useCarga(
    () => api.productos({ categoria: categoria || undefined, especie: especie || undefined }),
    [categoria, especie],
  );

  return (
    <VStack gap={4}>
      <HStack gap={3} hAlign="between" vAlign="end" wrap="wrap">
        <VStack gap={1}>
          <Heading level={1}>Productos</Heading>
          <Text type="supporting">Shampoos, alimentos, accesorios y juguetes de la tienda</Text>
        </VStack>
        <Button label="Nuevo producto" variant="primary" onClick={() => setDialogo({ abierto: true, producto: null })} />
      </HStack>

      {aviso && <Banner status="success" title={aviso} isDismissable onDismiss={() => setAviso(null)} />}

      <HStack gap={3} wrap="wrap" vAlign="start">
        <Selector
          label="Categoría"
          options={OPCIONES_CATEGORIA}
          value={categoria || null}
          onChange={(v: string | null) => setCategoria(v ?? '')}
          hasClear
          placeholder="Todas"
          width={220}
        />
        <Selector
          label="Especie"
          options={OPCIONES_ESPECIE}
          value={especie || null}
          onChange={(v: string | null) => setEspecie(v ?? '')}
          hasClear
          placeholder="Todas"
          width={220}
          description="Perro o gato incluye los de ambos"
        />
      </HStack>

      <ConEstados {...lista} esVacio={(d) => d.length === 0} vacio={<Vacio titulo="No hay productos con esos filtros" />}>
        {(productos) => (
          <Table<Producto>
            data={productos}
            idKey="sku"
            hasHover
            columns={[
              { key: 'sku', header: 'SKU', renderCell: (p) => <Text type="code">{p.sku}</Text> },
              { key: 'nombre', header: 'Nombre' },
              { key: 'categoria', header: 'Categoría' },
              { key: 'especie', header: 'Especie', renderCell: (p) => ESPECIE_LABEL[p.especie] },
              { key: 'precio', header: 'Precio', align: 'end', renderCell: (p) => <Text hasTabularNumbers>{mxn(p.precio)}</Text> },
              {
                key: 'stock',
                header: 'Stock',
                align: 'end',
                renderCell: (p) => <Badge label={String(p.stock)} variant={p.stock === 0 ? 'error' : p.stock < 8 ? 'warning' : 'neutral'} />,
              },
              {
                key: 'acciones',
                header: '',
                align: 'end',
                renderCell: (p) => (
                  <HStack gap={1} hAlign="end">
                    <Button label="Editar" size="sm" onClick={() => setDialogo({ abierto: true, producto: p })} />
                    <Button label="Eliminar" size="sm" variant="destructive" onClick={() => setEliminar(p)} />
                  </HStack>
                ),
              },
            ]}
          />
        )}
      </ConEstados>

      <ProductoDialog
        abierto={dialogo.abierto}
        producto={dialogo.producto}
        cerrar={() => setDialogo({ abierto: false, producto: null })}
        alGuardar={() => {
          setAviso(dialogo.producto ? 'Producto actualizado' : 'Producto creado');
          lista.recargar();
        }}
      />
      <ConfirmarEliminar
        abierto={eliminar !== null}
        cerrar={() => setEliminar(null)}
        titulo={`¿Eliminar ${eliminar?.nombre ?? ''}?`}
        descripcion="Se borrará el producto y su historial de compras (DETACH DELETE). No se puede deshacer."
        onConfirmar={async () => {
          await api.eliminarProducto(eliminar!.sku);
          setAviso(`${eliminar!.nombre} fue eliminado`);
          lista.recargar();
        }}
      />
    </VStack>
  );
}

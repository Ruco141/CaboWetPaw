import { useEffect, useState } from 'react';
import { HStack } from '@astryxdesign/core/HStack';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { TextInput } from '@astryxdesign/core/TextInput';
import { api } from '../api/client';
import type { EspecieProducto, Producto } from '../api/types';
import { DialogoFormulario } from './Dialogo';

export const OPCIONES_CATEGORIA = ['Shampoos', 'Alimentos', 'Accesorios', 'Juguetes'];
export const OPCIONES_ESPECIE = [
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ambos', label: 'Perro y gato' },
];

export function ProductoDialog(props: { abierto: boolean; cerrar: () => void; producto?: Producto | null; alGuardar: () => void }) {
  const editando = Boolean(props.producto);
  const [p, setP] = useState<Producto>({ sku: '', nombre: '', precio: 0, especie: 'perro', stock: 10, categoria: 'Shampoos' });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!props.abierto) return;
    setP(props.producto ?? { sku: '', nombre: '', precio: 0, especie: 'perro', stock: 10, categoria: 'Shampoos' });
    setError(null);
  }, [props.abierto, props.producto]);

  const set = <K extends keyof Producto>(k: K, v: Producto[K]) => setP((prev) => ({ ...prev, [k]: v }));

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      if (props.producto) {
        const { sku, ...cambios } = p;
        await api.actualizarProducto(sku, cambios);
      } else {
        await api.crearProducto(p);
      }
      props.alGuardar();
      props.cerrar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <DialogoFormulario
      abierto={props.abierto}
      cerrar={props.cerrar}
      titulo={editando ? `Editar ${p.sku}` : 'Nuevo producto'}
      error={error}
      guardando={guardando}
      textoGuardar={editando ? 'Guardar cambios' : 'Crear producto'}
      onGuardar={guardar}
    >
      {!editando && <TextInput label="SKU" value={p.sku} onChange={(v) => set('sku', v.toUpperCase())} isRequired description="Ej. JU-07" />}
      <TextInput label="Nombre" value={p.nombre} onChange={(v) => set('nombre', v)} isRequired />
      <HStack gap={3}>
        <NumberInput label="Precio" value={p.precio} onChange={(v) => set('precio', v ?? 0)} min={0} step={10} units="MXN" width="100%" />
        <NumberInput label="Stock" value={p.stock} onChange={(v) => set('stock', v ?? 0)} min={0} isIntegerOnly hasNumberSteppers width="100%" />
      </HStack>
      <HStack gap={3}>
        <Selector label="Categoría" options={OPCIONES_CATEGORIA} value={p.categoria} onChange={(v) => set('categoria', v)} width="100%" />
        <Selector label="Especie" options={OPCIONES_ESPECIE} value={p.especie} onChange={(v) => set('especie', v as EspecieProducto)} width="100%" />
      </HStack>
    </DialogoFormulario>
  );
}

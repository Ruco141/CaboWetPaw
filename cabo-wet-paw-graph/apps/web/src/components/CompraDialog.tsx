import { useEffect, useState } from 'react';
import { NumberInput } from '@astryxdesign/core/NumberInput';
import { Selector } from '@astryxdesign/core/Selector';
import { api } from '../api/client';
import type { Producto } from '../api/types';
import { DialogoFormulario } from './Dialogo';
import { ESPECIE_LABEL, mxn } from './formato';

/** Registrar compra: POST /compras (crea COMPRO y descuenta stock en una transacción). */
export function CompraDialog(props: { abierto: boolean; cerrar: () => void; clienteId: string; alComprar: (msg: string) => void }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sku, setSku] = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!props.abierto) return;
    setSku('');
    setCantidad(1);
    setError(null);
    api.productos().then(setProductos).catch((e: Error) => setError(e.message));
  }, [props.abierto]);

  async function guardar() {
    if (!sku) return setError('Elige un producto');
    setGuardando(true);
    setError(null);
    try {
      const r = await api.comprar({ clienteId: props.clienteId, sku, cantidad });
      const p = productos.find((x) => x.sku === sku);
      props.alComprar(`Compra registrada: ${cantidad} × ${p?.nombre ?? sku}. Quedan ${r.stockRestante} en stock.`);
      props.cerrar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  // Agrupado por categoría para que sea fácil de encontrar en la demo.
  const categorias = [...new Set(productos.map((p) => p.categoria))];
  const opciones = categorias.map((cat) => ({
    type: 'section' as const,
    title: cat,
    options: productos
      .filter((p) => p.categoria === cat)
      .map((p) => ({
        value: p.sku,
        label: p.nombre,
        description: `${mxn(p.precio)} · ${ESPECIE_LABEL[p.especie]} · stock ${p.stock}`,
        disabled: p.stock === 0,
      })),
  }));

  return (
    <DialogoFormulario
      abierto={props.abierto}
      cerrar={props.cerrar}
      titulo="Registrar compra"
      subtitulo="Al guardar se recalculan las recomendaciones"
      error={error}
      guardando={guardando}
      textoGuardar="Registrar compra"
      onGuardar={guardar}
    >
      <Selector label="Producto" options={opciones} value={sku || undefined} onChange={setSku} hasSearch searchPlaceholder="Buscar producto…" width="100%" isRequired />
      <NumberInput label="Cantidad" value={cantidad} onChange={(v) => setCantidad(v ?? 1)} min={1} max={100} isIntegerOnly hasNumberSteppers width={160} />
    </DialogoFormulario>
  );
}

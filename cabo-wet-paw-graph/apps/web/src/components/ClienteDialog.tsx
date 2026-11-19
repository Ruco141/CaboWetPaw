import { useEffect, useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { api } from '../api/client';
import type { ClienteFila } from '../api/types';
import { DialogoFormulario } from './Dialogo';
import { SelectorCliente } from './SelectorCliente';

export type ClienteEditable = { id: string; nombre: string; telefono: string; email: string | null };

/** Crear (con "¿Quién lo refirió?") o editar un cliente. */
export function ClienteDialog(props: {
  abierto: boolean;
  cerrar: () => void;
  cliente?: ClienteEditable | null;
  clientes?: ClienteFila[];
  alGuardar: (id: string) => void;
}) {
  const editando = Boolean(props.cliente);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [referidoPor, setReferidoPor] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!props.abierto) return;
    setNombre(props.cliente?.nombre ?? '');
    setTelefono(props.cliente?.telefono ?? '');
    setEmail(props.cliente?.email ?? '');
    setReferidoPor('');
    setError(null);
  }, [props.abierto, props.cliente]);

  async function guardar() {
    setGuardando(true);
    setError(null);
    try {
      const datos = { nombre, telefono, email: email || undefined };
      if (props.cliente) {
        await api.actualizarCliente(props.cliente.id, datos);
        props.alGuardar(props.cliente.id);
      } else {
        const creado = await api.crearCliente({ ...datos, referidoPor: referidoPor || undefined });
        props.alGuardar(creado.id);
      }
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
      titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
      error={error}
      guardando={guardando}
      textoGuardar={editando ? 'Guardar cambios' : 'Crear cliente'}
      onGuardar={guardar}
    >
      <TextInput label="Nombre" value={nombre} onChange={setNombre} isRequired hasAutoFocus />
      <TextInput label="Teléfono" type="tel" value={telefono} onChange={setTelefono} isRequired description="10 dígitos, p. ej. 6241234567" inputMode="tel" />
      <TextInput label="Email" type="email" value={email} onChange={setEmail} isOptional />
      {!editando && props.clientes && (
        <SelectorCliente
          label="¿Quién lo refirió?"
          clientes={props.clientes}
          value={referidoPor}
          onChange={setReferidoPor}
          isOptional
          placeholder="Nadie (llegó por su cuenta)"
          description="Crea la relación REFIRIO en el grafo"
        />
      )}
    </DialogoFormulario>
  );
}

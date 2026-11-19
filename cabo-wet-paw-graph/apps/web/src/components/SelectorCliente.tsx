import { Selector } from '@astryxdesign/core/Selector';
import type { ClienteFila } from '../api/types';

/** Selector con búsqueda sobre la lista de clientes. */
export function SelectorCliente(props: {
  label: string;
  clientes: ClienteFila[];
  value: string;
  onChange: (id: string) => void;
  excluir?: string[];
  isOptional?: boolean;
  description?: string;
  placeholder?: string;
}) {
  const opciones = props.clientes
    .filter((c) => !props.excluir?.includes(c.id))
    .map((c) => ({ value: c.id, label: c.nombre, description: c.telefono }));
  return (
    <Selector
      label={props.label}
      options={opciones}
      value={props.value || null}
      onChange={(v: string | null) => props.onChange(v ?? '')}
      hasSearch
      hasClear
      searchPlaceholder="Buscar por nombre…"
      placeholder={props.placeholder ?? 'Elige un cliente'}
      emptySearchText="Ningún cliente coincide"
      isOptional={props.isOptional}
      description={props.description}
      width="100%"
    />
  );
}

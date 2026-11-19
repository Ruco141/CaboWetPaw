import { useState } from 'react';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';

/** Confirmación antes de eliminar. Si la API falla, el mensaje se muestra en el propio diálogo. */
export function ConfirmarEliminar(props: {
  abierto: boolean;
  cerrar: () => void;
  titulo: string;
  descripcion: string;
  onConfirmar: () => Promise<unknown>;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <AlertDialog
      isOpen={props.abierto}
      onOpenChange={(o) => {
        if (!o) {
          setError(null);
          props.cerrar();
        }
      }}
      title={props.titulo}
      description={error ? `Error: ${error}` : props.descripcion}
      actionLabel="Eliminar"
      cancelLabel="Cancelar"
      isActionLoading={cargando}
      onAction={async () => {
        setCargando(true);
        try {
          await props.onConfirmar();
          setError(null);
          props.cerrar();
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setCargando(false);
        }
      }}
    />
  );
}

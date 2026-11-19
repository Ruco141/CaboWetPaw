import type { ReactNode } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Spinner } from '@astryxdesign/core/Spinner';

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <Center>
      <Spinner size="lg" label={texto} />
    </Center>
  );
}

export function ErrorCarga({ mensaje, reintentar }: { mensaje: string; reintentar?: () => void }) {
  return (
    <Banner
      status="error"
      title="No se pudo cargar la información"
      description={mensaje}
      endContent={reintentar ? <Button label="Reintentar" size="sm" onClick={reintentar} /> : undefined}
    />
  );
}

export function Vacio({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return <EmptyState title={titulo} description={descripcion} actions={acciones} isCompact />;
}

/**
 * Envoltura común: muestra spinner, error o vacío según el estado de la carga
 * y, si hay datos, renderiza `children(datos)`.
 */
export function ConEstados<T>(props: {
  cargando: boolean;
  error: string | null;
  datos: T | undefined;
  recargar?: () => void;
  esVacio?: (d: T) => boolean;
  vacio?: ReactNode;
  children: (d: T) => ReactNode;
}) {
  const { cargando, error, datos, recargar, esVacio, vacio, children } = props;
  if (error) return <ErrorCarga mensaje={error} reintentar={recargar} />;
  if (cargando && datos === undefined) return <Cargando />;
  if (datos === undefined) return null;
  if (esVacio?.(datos)) return <>{vacio ?? <Vacio titulo="Sin datos" />}</>;
  return <>{children(datos)}</>;
}

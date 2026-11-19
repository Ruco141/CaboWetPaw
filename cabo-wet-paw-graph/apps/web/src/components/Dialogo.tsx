import type { ReactNode } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';

/** Diálogo de formulario: encabezado, campos, mensaje de error de la API y botones. */
export function DialogoFormulario(props: {
  abierto: boolean;
  cerrar: () => void;
  titulo: string;
  subtitulo?: string;
  error: string | null;
  guardando: boolean;
  textoGuardar: string;
  onGuardar: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog isOpen={props.abierto} onOpenChange={(o) => !o && props.cerrar()} purpose="form" width={520}>
      <DialogHeader title={props.titulo} subtitle={props.subtitulo} onOpenChange={(o) => !o && props.cerrar()} />
      <VStack gap={4} padding={4}>
        {props.children}
        {props.error && <Banner status="error" title="No se pudo guardar" description={props.error} />}
        <HStack gap={2} hAlign="end">
          <Button label="Cancelar" variant="ghost" onClick={props.cerrar} />
          <Button label={props.textoGuardar} variant="primary" isLoading={props.guardando} onClick={props.onGuardar} />
        </HStack>
      </VStack>
    </Dialog>
  );
}

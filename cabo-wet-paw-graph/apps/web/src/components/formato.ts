const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const mxn = (n: number) => moneda.format(n);

export const fecha = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const ESPECIE_LABEL: Record<string, string> = { perro: 'Perro', gato: 'Gato', ambos: 'Perro y gato' };

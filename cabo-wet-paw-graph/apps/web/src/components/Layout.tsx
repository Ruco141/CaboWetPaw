import { Outlet, useLocation } from 'react-router-dom';
import { AppShell } from '@astryxdesign/core/AppShell';
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { api } from '../api/client';
import { useCarga } from './useCarga';

const RUTAS = [
  { href: '/', label: 'Inicio' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/productos', label: 'Productos' },
  { href: '/conexiones', label: 'Conexiones' },
];

export function Layout() {
  const { pathname } = useLocation();
  const health = useCarga(() => api.health(), []);
  const conectado = health.datos?.ok === true;
  return (
    <AppShell
      height="auto"
      contentPadding={4}
      topNav={
        <TopNav
          label="Navegación principal"
          heading={<TopNavHeading heading="Cabo Wet Paw" subheading="Grooming · Guardería · Hotel · Tienda" headingHref="/" />}
          startContent={RUTAS.map((r) => (
            <TopNavItem
              key={r.href}
              label={r.label}
              href={r.href}
              isSelected={r.href === '/' ? pathname === '/' : pathname.startsWith(r.href)}
            />
          ))}
          endContent={
            <StatusDot
              variant={health.cargando ? 'neutral' : conectado ? 'success' : 'error'}
              label={conectado ? 'Conectado a Neo4j AuraDB' : 'Sin conexión a AuraDB'}
              tooltip={conectado ? `AuraDB: ${health.datos?.uri}` : (health.datos?.error ?? health.error ?? 'Comprobando…')}
              isPulsing={conectado}
            />
          }
        />
      }
    >
      <Outlet />
    </AppShell>
  );
}

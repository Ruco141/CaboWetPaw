/**
 * Punto de entrada de la web: estilos de Astryx, tema neutral y router.
 * El `LinkProvider` hace que los links de Astryx (TopNavItem, Link, Button con
 * href) naveguen con react-router sin recargar la página.
 */
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import '@astryxdesign/theme-neutral/theme.css';

import { forwardRef, StrictMode, type AnchorHTMLAttributes } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link as RouterLink, Route, Routes } from 'react-router-dom';
import { Theme } from '@astryxdesign/core/theme';
import { LinkProvider } from '@astryxdesign/core/Link';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';
import { Clientes } from './pages/Clientes';
import { FichaCliente } from './pages/FichaCliente';
import { Productos } from './pages/Productos';
import { Conexiones } from './pages/Conexiones';
import { Vacio } from './components/Estados';

/** Adaptador: Astryx entrega `href`, react-router espera `to`. */
const EnlaceRouter = forwardRef<HTMLAnchorElement, AnchorHTMLAttributes<HTMLAnchorElement>>(({ href = '/', ...resto }, ref) => (
  <RouterLink ref={ref} to={href} {...resto} />
));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme theme={neutralTheme}>
      <BrowserRouter>
        <LinkProvider component={EnlaceRouter}>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Inicio />} />
              <Route path="clientes" element={<Clientes />} />
              <Route path="clientes/:id" element={<FichaCliente />} />
              <Route path="productos" element={<Productos />} />
              <Route path="conexiones" element={<Conexiones />} />
              <Route path="*" element={<Vacio titulo="Página no encontrada" />} />
            </Route>
          </Routes>
        </LinkProvider>
      </BrowserRouter>
    </Theme>
  </StrictMode>,
);

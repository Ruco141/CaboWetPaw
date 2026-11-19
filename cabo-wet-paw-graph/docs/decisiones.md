# Decisiones

Decisiones de diseño tomadas durante la construcción y por qué. Las marcadas con ✱ resuelven ambigüedades de la especificación eligiendo la opción más simple.

## Base de datos y driver

- **Solo AuraDB.** `config.ts` rechaza el arranque si `NEO4J_URI` falta, contiene `localhost`/`127.0.0.1` o no empieza con `neo4j+s://` (o `neo4j://`, `neo4j+ssc://`). No hay Docker ni instancia local.
- **Driver singleton** en `apps/api/src/db/driver.ts`, compartido por la API, `db/constraints.ts`, `db/seed.ts` y `scripts/smoke.ts`.
- **`disableLosslessIntegers: true`**: los enteros llegan como `number`. Al enviar, `LIMIT`, `cantidad` y `stock` van con `neo4j.int()`; `precio` va como float.
- ✱ **Verificación de conectividad** con `driver.verifyConnectivity()`; la versión del servidor que se muestra en `/api/health` se obtiene con `CALL dbms.components()`. (`getServerInfo()` falló en esta instancia con "No routing servers available" aunque la conexión era correcta.)
- **Transacciones administradas** (`session.executeWrite`) en: crear cliente con referidor, actualizar mascota (propiedades + raza), actualizar producto (propiedades + categoría), registrar compra y el seed completo.

## Consultas

- Las consultas de la sección 8 se usan **tal cual**. No hubo que ajustar ninguna.
- ✱ **Motivo de la recomendación**: la consulta principal no devuelve cuántos dueños compraron cada producto. Para no alterarla se añadió `MOTIVO_RECOMENDACION`, que cuenta dueños distintos (total, de la misma raza y del mismo tamaño) solo para los SKUs ya recomendados. Con eso la API arma el texto "lo compraron 4 dueños de Golden Retriever o de perros grandes".
- ✱ **Formato de las consultas**: cada consulta es un objeto `consulta({ proposito, parametros, ejemplo, cypher })` en vez de un string suelto. Así `npm run docs:consultas` genera `docs/consultas.md` desde el código y los dos no se desfasan.
- ✱ **Archivos de consultas adicionales**: además de los seis de la estructura se agregaron `catalogos.cypher.ts` (razas, categorías, servicios y resumen) y `consulta.ts` (el helper). También se agregó `apps/api/src/app.ts`, que construye la app Express, para que `npm run smoke` pueda levantarla en memoria.
- ✱ **Filtro por especie en productos**: filtrar por `perro` o `gato` incluye también los productos `ambos`; filtrar por `ambos` muestra solo esos.
- ✱ **Cadena hacia arriba sin referidor**: si el cliente llegó por su cuenta, la consulta no devuelve filas y la API responde `{ cadena: [], llegoPorSuCuenta: true }` (200, no 404).
- ✱ **Camino entre el mismo cliente**: `shortestPath` no admite inicio y fin iguales, así que zod rechaza `desde == hasta` con 400.

## Reglas de negocio

- **Eliminar cliente** hace `DETACH DELETE` del cliente y de sus mascotas. Esto también borra sus `COMPRO`, `RECIBIO` y `REFIRIO`. **La cadena de referidos que pasaba por él se corta**: quienes refirió quedan sin referidor (pueden volver a ser referidos) y su referidor pierde los puntos de esa rama. Se eligió así por simplicidad; la alternativa (re-enganchar los referidos al referidor de arriba) cambiaría la historia del programa de referidos.
- ✱ **Eliminar producto** también usa `DETACH DELETE`, así que se borra su historial de compras. Es lo más simple y no deja relaciones colgando.
- ✱ **La especie de una mascota no se puede editar** (`PATCH /mascotas/:id` no la acepta), porque la raza y las recomendaciones dependen de ella. El tamaño, el tipo de pelo, la raza (de la misma especie), el nombre y la fecha de nacimiento sí se pueden editar.
- ✱ **Crear cliente con referidor**: se usa la misma consulta `CREAR_REFERIDO` dentro de la transacción. Si el referidor no existe, se revierte también el alta del cliente (404).
- ✱ **Teléfono** validado como 10 dígitos. El email se puede cambiar pero no borrar con `PATCH`.
- ✱ **Puntos de referidos** se calculan al consultar (100/50/25 por nivel), no se guardan.

## Seed

- **Determinista**: catálogos, clientes, mascotas y referidos escritos a mano; compras y servicios generados con `mulberry32` y semilla fija `20261118`. Resultado: 25 clientes, 35 mascotas, 24 productos, **130 compras**, **61 servicios recibidos**, 19 referidos.
- ✱ **IDs legibles en el seed** (`cli-01`, `m-29`) para poder citarlos en la demo y en el smoke test. Las entidades creadas desde la API usan `crypto.randomUUID()`.
- ✱ **El stock del seed es el stock actual**: las compras históricas del seed no lo descuentan. Solo las compras registradas por la API lo descuentan.
- ✱ **Borrado**: el seed borra solo nodos con las etiquetas de la app (`Cliente`, `Mascota`, `Raza`, `Producto`, `Categoria`, `Servicio`), no toda la base, y lo hace en la misma transacción que la carga.
- `JU-06` (juguete dispensador) tiene stock 5 a propósito, para mostrar en vivo el 409 de "Stock insuficiente".

## Frontend

- **Versiones exactas** (sin `^`) en todos los `package.json`, porque Astryx está en beta.
- ✱ **`@stylexjs/stylex`** se instaló en `apps/web` porque la sección Vite del README de `@astryxdesign/core` lo pide junto a core y theme-neutral. No se usa directamente.
- Componentes de Astryx verificados con `npm run astryx -- component <Nombre>`. Rutas de importación reales: `@astryxdesign/core/<Componente>` (`VStack`/`HStack` viven en `@astryxdesign/core/VStack` y `@astryxdesign/core/HStack`, no en `/Layout`), `Theme` en `@astryxdesign/core/theme` y `neutralTheme` en `@astryxdesign/theme-neutral/built`. CSS: `reset.css`, `astryx.css` y `theme-neutral/theme.css`.
- `LinkProvider` con un adaptador hacia el `Link` de react-router, para que `TopNavItem`, `Link` y `BreadcrumbItem` naveguen sin recargar la página.
- ✱ **Sin pantalla de mascotas**: la sección 10 no la pide. Las mascotas se gestionan por API (`POST /clientes/:id/mascotas`, `PATCH`/`DELETE /mascotas/:id`, `POST /mascotas/:id/servicios`) y se muestran en la ficha del cliente.
- ✱ **Script `astryx`**: npm hoistea el CLI a la raíz, así que el script apunta a `../../node_modules/@astryxdesign/cli/clients/cli/bin/astryx.mjs`, la ruta real del binario en la versión 0.7.16 (la de la especificación, `bin/astryx.mjs`, no existe). El CLI de Astryx pide Node 22.13+; el resto del proyecto corre con Node 20+.
- ✱ **TypeScript 7** (la última estable al instalar). Ambos workspaces usan `moduleResolution: "Bundler"`; la API corre con `tsx`, así que no hay paso de compilación.
- ✱ **npm 11** bloquea por defecto los scripts `postinstall` (aviso `allow-scripts`). No hacen falta: esbuild trae su binario como dependencia opcional y el postinstall del CLI de Astryx es opcional.

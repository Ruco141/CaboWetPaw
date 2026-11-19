# Cabo Wet Paw · grafo de clientes, mascotas y referidos

Proyecto individual de **Bases de Datos Avanzadas**. Aplicación web para **Cabo Wet Paw**, una boutique de perros y gatos en Cabo San Lucas (grooming, guardería, hotel y tienda), conectada a una base de datos de grafo **Neo4j AuraDB en la nube**.

Resuelve dos preguntas del negocio, y las dos son recorridos sobre relaciones:

1. **¿Qué le recomiendo a este cliente?** Productos que compraron dueños de mascotas parecidas (misma especie y misma raza o mismo tamaño), sin repetir lo que ya compró. Es una vecindad de 2 saltos con peso.
2. **¿Quién trajo a quién?** Programa de referidos: la red de cada cliente hasta 3 niveles, la cadena hacia arriba, un ranking y el camino más corto entre dos clientes. Son traversals de longitud variable y `shortestPath`.

En SQL las dos requieren muchos JOINs o CTE recursivas. En el grafo son patrones de una línea. Todas las consultas están en [`apps/api/src/queries/`](apps/api/src/queries) y catalogadas en [`docs/consultas.md`](docs/consultas.md).

## Requisitos

- **Node.js 20 o superior** (el CLI de Astryx, `npm run astryx`, pide 22.13+; no hace falta para correr la app).
- **npm 10+** (se usan npm workspaces).
- Una cuenta gratuita de **Neo4j AuraDB Free**: <https://console.neo4j.io>.

> La base **siempre** está en AuraDB. La API se niega a arrancar si `NEO4J_URI` apunta a `localhost` o `127.0.0.1`.

## 1. Crear la instancia de AuraDB

1. Entra a <https://console.neo4j.io> y crea una cuenta (o inicia sesión).
2. **New instance → AuraDB Free → Create**.
3. Se descarga un archivo `Neo4j-xxxxxxxx-Created-<fecha>.txt` con la contraseña. **Guárdalo**: la contraseña solo se muestra una vez.
4. Espera a que la instancia diga **Running** (1 o 2 minutos).
5. Del archivo descargado toma `NEO4J_URI` (algo como `neo4j+s://xxxxxxxx.databases.neo4j.io`), `NEO4J_USERNAME` y `NEO4J_PASSWORD`.

> AuraDB Free se **pausa** tras 3 días sin uso. Si la API dice que no puede conectar, entra a la consola y pulsa **Resume**.

## 2. Configurar `.env`

En la raíz del repo:

```bash
cp .env.example .env
```

Llena los valores (la API y los scripts de `db/` leen este mismo archivo):

```ini
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=la-contraseña-del-archivo-descargado
NEO4J_DATABASE=neo4j
API_PORT=4000
WEB_ORIGIN=http://localhost:5173
```

> **Usuario y base de datos.** En las instancias de AuraDB creadas recientemente, **el usuario y el nombre de la base son el ID de la instancia** (los 8 caracteres de la URI), no `neo4j`. Usa los valores exactos del archivo descargado. Si ves "authentication failure", revisa `NEO4J_USERNAME`; si ves "database does not exist", revisa `NEO4J_DATABASE`.

La web usa `VITE_API_URL` (por defecto `http://localhost:4000`). Solo cámbialo si mueves la API; ve [`apps/web/.env.example`](apps/web/.env.example).

## 3. Instalar y poblar

```bash
npm install
```

```bash
npm run db:constraints
```

```bash
npm run seed -- --yes
```

```bash
npm run smoke
```

- `db:constraints` aplica [`db/constraints.cypher`](db/constraints.cypher): 7 constraints de unicidad y 1 índice. Es idempotente.
- `seed` **borra** los datos de la app y carga datos de demo deterministas. Sin `--yes` solo explica lo que haría.
- `smoke` levanta la API en memoria, llama a los endpoints principales e imprime recomendaciones, red de referidos, ranking, camino y los 409 de las reglas. No modifica datos.

## 4. Ejecutar

```bash
npm run dev
```

- API: <http://localhost:4000/api/health>
- Web: <http://localhost:5173>

Otros scripts:

| Script | Qué hace |
|---|---|
| `npm run typecheck` | `tsc --noEmit` en `apps/api` y `apps/web` |
| `npm run docs:consultas` | Regenera `docs/consultas.md` desde `apps/api/src/queries/` |
| `npm run astryx -w apps/web -- component --list` | Documentación de los componentes de Astryx |

## Estructura

```
cabo-wet-paw-graph/
├── apps/
│   ├── api/src/
│   │   ├── index.ts            Arranque, verificación de AuraDB y cierre ordenado
│   │   ├── app.ts              Construcción de la app Express (la usa también el smoke)
│   │   ├── config.ts           Variables de entorno validadas con zod (rechaza localhost)
│   │   ├── db/driver.ts        Driver singleton, leer/escribir/transaccionEscritura
│   │   ├── db/serialize.ts     Date/DateTime de Neo4j -> ISO
│   │   ├── queries/            TODO el Cypher, una constante por consulta
│   │   ├── repositories/       Ejecutan las consultas y aplican las reglas
│   │   ├── routes/             Routers de Express por recurso
│   │   ├── schemas/            Validación de entradas (zod)
│   │   └── middleware/         Traducción de errores a HTTP
│   └── web/src/
│       ├── main.tsx            Tema de Astryx + router
│       ├── api/client.ts       fetch tipado contra la API
│       ├── pages/              Inicio, Clientes, FichaCliente, Productos, Conexiones
│       └── components/         Diálogos, paneles y estados (carga/vacío/error)
├── db/
│   ├── constraints.cypher      DDL
│   ├── constraints.ts          npm run db:constraints
│   ├── seed.ts                 npm run seed
│   └── seed-data.ts            Datos del seed (deterministas)
├── scripts/
│   ├── smoke.ts                npm run smoke
│   └── generar-docs-consultas.ts
└── docs/                       arquitectura · modelo-grafo · consultas · decisiones
```

## Endpoints

Todos bajo `/api`. Entradas validadas con zod: 400 si son inválidas, 404 si no existe el recurso, 409 si se viola una regla o un constraint.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Estado de la conexión a AuraDB y URI enmascarada |
| GET | `/resumen` | Totales de clientes, mascotas, productos y compras |
| GET | `/clientes?buscar=` | Lista con número de mascotas y compras |
| GET | `/clientes/:id` | Ficha: datos, mascotas con raza, últimas 10 compras y quién lo refirió |
| POST | `/clientes` | Crea `{nombre, telefono, email?, referidoPor?}` |
| PATCH | `/clientes/:id` | Actualiza nombre, teléfono o email |
| DELETE | `/clientes/:id` | Elimina al cliente y sus mascotas (`DETACH DELETE`) |
| POST | `/clientes/:id/mascotas` | Crea `{nombre, especie, raza, tamano, tipoPelo, fechaNacimiento?}` |
| PATCH | `/mascotas/:id` | Actualiza nombre, raza, tamaño, tipo de pelo o fecha de nacimiento |
| DELETE | `/mascotas/:id` | Elimina la mascota |
| POST | `/mascotas/:id/servicios` | Registra `{servicioId}` recibido |
| GET | `/mascotas/:id/recomendaciones?limite=5` | Recomendaciones con afinidad y motivo |
| GET | `/productos?categoria=&especie=` | Catálogo filtrable |
| POST | `/productos` | Crea `{sku, nombre, precio, especie, stock, categoria}` |
| PATCH | `/productos/:sku` | Actualización parcial |
| DELETE | `/productos/:sku` | Elimina el producto |
| GET | `/razas?especie=` · `/categorias` · `/servicios` | Catálogos |
| POST | `/compras` | `{clienteId, sku, cantidad}`: crea `COMPRO` y descuenta stock en una transacción (409 sin stock) |
| GET | `/clientes/:id/referidos` | Red hasta 3 niveles con nivel y puntos |
| GET | `/clientes/:id/cadena` | Cadena hacia arriba |
| POST | `/clientes/:id/referidos` | `{referidoId}`: crea `REFIRIO` aplicando las reglas |
| GET | `/referidos/ranking?limite=10` | Ranking de referidores |
| GET | `/referidos/camino?desde=&hasta=` | Camino más corto entre dos clientes |

## Datos de demo

El seed es determinista: siempre produce 25 clientes, 35 mascotas, 24 productos, 130 compras, 61 servicios recibidos y 19 referidos.

**Clientes de demo** (pocas compras, recomendaciones vistosas):

| Cliente | Mascota | Compras | Lo que se recomienda |
|---|---|---|---|
| **Ximena Salazar** (`cli-21`) | Canela, Golden Retriever grande, doble capa | 0 | Croquetas raza grande, shampoo deslanador, cepillo deslanador, pelota resistente |
| **Lucía Reyes** (`cli-23`) | Nieve, Husky Siberiano grande, doble capa | 1 (shampoo deslanador) | Croquetas raza grande, cepillo deslanador, pelota resistente (el shampoo ya no aparece) |
| **Héctor Cruz** (`cli-22`) | Mishi, gato Persa | 1 (alimento húmedo) | Rascador de cartón, cepillo deslanador, croquetas para gato esterilizado |

**Referidos:**

- **María Fernanda López** (`cli-01`) es la estrella: 11 personas en su red y 700 puntos.
- Cadenas de 4 niveles: María Fernanda → José Luis → Juan Pablo → Luis Miguel → Alejandra, y Paola → Miguel Ángel → Valeria → Roberto → Karla.
- Sin red ni referidor: Héctor Cruz, **Diego Herrera** (`cli-24`, bueno para agregarlo como referido en vivo) y Sofía Medina.
- Camino de 7 saltos: Alejandra Castillo ↔ Fernanda Ruiz. Sin conexión: Karla Domínguez ↔ María Fernanda López.
- `JU-06` (juguete dispensador) tiene solo 5 piezas, para mostrar el 409 de stock.

## Guion de demo (4 minutos)

**0:00 · La base está en la nube (30 s)**
1. Abre <http://localhost:5173>. En **Inicio**, señala la tarjeta "Conexión a la base de datos": URI `neo4j+s://xxxx****.databases.neo4j.io`, versión del servidor y latencia. El punto verde del encabezado es el mismo dato.
2. Di: "`neo4j+s` es Bolt sobre TLS; el driver es un singleton con pool y enruta lecturas y escrituras en el clúster de AuraDB".

**0:30 · Ranking de referidos (30 s)**
3. En el top 5, María Fernanda tiene 700 puntos. Explica: `REFIRIO*1..3` y `min(length(path))` dan el nivel; 100/50/25 puntos.

**1:00 · Ficha de cliente y recomendaciones (1 min 30 s)**
4. Ve a **Clientes**, busca "ximena" y abre a **Ximena Salazar**.
5. Migas de pan: *Mariana Gutiérrez → Arturo Romero → Ximena Salazar* (cadena hacia arriba, `REFIRIO*1..10`).
6. Panel de **Canela**: "Croquetas raza grande… lo compraron N dueños de Golden Retriever o de perros grandes". Explica el patrón de 2 saltos y el peso (raza = 2, tamaño = 1).
7. Pulsa **Registrar compra**, elige *Shampoo deslanador para doble capa* y guarda. El shampoo **desaparece** de las recomendaciones y sube el siguiente producto: el grafo se recalcula en vivo.
8. Opcional: registra 99 piezas del *Juguete dispensador de premios* para ver el 409 "Stock insuficiente".

**2:30 · Reglas de referidos (1 min)**
9. Abre a **María Fernanda López**: red agrupada por nivel con sus puntos.
10. En "Agregar referido", elige **Miguel Ángel Vargas** → 409 "Este cliente ya fue referido por otra persona (Paola Jiménez)".
11. Abre a **Luis Miguel Sánchez** e intenta referir a **María Fernanda** → 409 de ciclo.
12. Desde María Fernanda, refiere a **Diego Herrera** → se crea; sus puntos suben a 800.

**3:30 · Camino más corto (30 s)**
13. Ve a **Conexiones**: *Alejandra Castillo* ↔ *Fernanda Ruiz* → 7 saltos pasando por María Fernanda (`shortestPath` sin dirección).
14. *Karla Domínguez* ↔ *María Fernanda López* → "No están conectados por referidos".

> Antes de repetir la demo corre `npm run seed -- --yes` para volver al estado inicial.

## Documentación

- [`docs/arquitectura.md`](docs/arquitectura.md): diagrama y capas.
- [`docs/modelo-grafo.md`](docs/modelo-grafo.md): etiquetas, relaciones y reglas de integridad.
- [`docs/consultas.md`](docs/consultas.md): catálogo de todas las consultas Cypher, generado desde el código.
- [`docs/decisiones.md`](docs/decisiones.md): decisiones tomadas y por qué.

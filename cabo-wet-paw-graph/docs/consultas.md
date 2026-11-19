# Catálogo de consultas Cypher

> Archivo generado con `npm run docs:consultas` a partir de `apps/api/src/queries/`. No lo edites a mano.

Todas las consultas son **parametrizadas** (`$param`). Los enteros (`LIMIT`, `cantidad`, `stock`) se envían con `neo4j.int()`.

**33 consultas.**

- [`ACTUALIZAR_CLIENTE`](#actualizar_cliente) — clientes.cypher.ts
- [`CREAR_CLIENTE`](#crear_cliente) — clientes.cypher.ts
- [`ELIMINAR_CLIENTE`](#eliminar_cliente) — clientes.cypher.ts
- [`EXISTE_CLIENTE`](#existe_cliente) — clientes.cypher.ts
- [`FICHA_CLIENTE`](#ficha_cliente) — clientes.cypher.ts
- [`LISTAR_CLIENTES`](#listar_clientes) — clientes.cypher.ts
- [`ACTUALIZAR_MASCOTA`](#actualizar_mascota) — mascotas.cypher.ts
- [`CAMBIAR_RAZA_MASCOTA`](#cambiar_raza_mascota) — mascotas.cypher.ts
- [`CREAR_MASCOTA`](#crear_mascota) — mascotas.cypher.ts
- [`DIAGNOSTICO_MASCOTA`](#diagnostico_mascota) — mascotas.cypher.ts
- [`ELIMINAR_MASCOTA`](#eliminar_mascota) — mascotas.cypher.ts
- [`OBTENER_MASCOTA`](#obtener_mascota) — mascotas.cypher.ts
- [`REGISTRAR_SERVICIO`](#registrar_servicio) — mascotas.cypher.ts
- [`ACTUALIZAR_PRODUCTO`](#actualizar_producto) — productos.cypher.ts
- [`CAMBIAR_CATEGORIA_PRODUCTO`](#cambiar_categoria_producto) — productos.cypher.ts
- [`CREAR_PRODUCTO`](#crear_producto) — productos.cypher.ts
- [`ELIMINAR_PRODUCTO`](#eliminar_producto) — productos.cypher.ts
- [`LISTAR_PRODUCTOS`](#listar_productos) — productos.cypher.ts
- [`OBTENER_PRODUCTO`](#obtener_producto) — productos.cypher.ts
- [`DIAGNOSTICO_COMPRA`](#diagnostico_compra) — compras.cypher.ts
- [`REGISTRAR_COMPRA`](#registrar_compra) — compras.cypher.ts
- [`MOTIVO_RECOMENDACION`](#motivo_recomendacion) — recomendaciones.cypher.ts
- [`RECOMENDAR_PRODUCTOS`](#recomendar_productos) — recomendaciones.cypher.ts
- [`CADENA_REFERIDOS`](#cadena_referidos) — referidos.cypher.ts
- [`CAMINO_ENTRE_CLIENTES`](#camino_entre_clientes) — referidos.cypher.ts
- [`CREAR_REFERIDO`](#crear_referido) — referidos.cypher.ts
- [`DIAGNOSTICO_REFERIDO`](#diagnostico_referido) — referidos.cypher.ts
- [`RANKING_REFERIDORES`](#ranking_referidores) — referidos.cypher.ts
- [`RED_REFERIDOS`](#red_referidos) — referidos.cypher.ts
- [`LISTAR_CATEGORIAS`](#listar_categorias) — catalogos.cypher.ts
- [`LISTAR_RAZAS`](#listar_razas) — catalogos.cypher.ts
- [`LISTAR_SERVICIOS`](#listar_servicios) — catalogos.cypher.ts
- [`RESUMEN`](#resumen) — catalogos.cypher.ts

## Clientes (CRUD)

Archivo: `apps/api/src/queries/clientes.cypher.ts`

### ACTUALIZAR_CLIENTE

Actualización parcial: `SET c += $cambios` solo toca las propiedades enviadas (nombre, telefono, email).

**Parámetros:** 

- `$id`: string
- `$cambios`: map — p. ej. {telefono: "6249998877"}

```cypher
MATCH (c:Cliente {id: $id})
SET c += $cambios
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente
```

**Ejemplo de resultado:**

```json
{
  "cliente": {
    "id": "cli-24",
    "nombre": "Diego Herrera",
    "telefono": "6249998877",
    "email": null,
    "fechaAlta": "2025-10-03"
  }
}
```

### CREAR_CLIENTE

Crea un cliente nuevo. El `id` lo genera la API con crypto.randomUUID() y `fechaAlta` es la fecha del servidor.

**Parámetros:** 

- `$id`: string (uuid)
- `$nombre`: string
- `$telefono`: string (único)
- `$email`: string | null

```cypher
CREATE (c:Cliente {id: $id, nombre: $nombre, telefono: $telefono, fechaAlta: date()})
SET c.email = $email
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente
```

**Ejemplo de resultado:**

```json
{
  "cliente": {
    "id": "6f1c…",
    "nombre": "Pedro Ríos",
    "telefono": "6241234567",
    "email": null,
    "fechaAlta": "2026-11-18"
  }
}
```

### ELIMINAR_CLIENTE

Elimina al cliente y a sus mascotas con DETACH DELETE (borra también sus COMPRO, RECIBIO y REFIRIO; corta la cadena de referidos que pasaba por él).

**Parámetros:** 

- `$id`: string

```cypher
MATCH (c:Cliente {id: $id})
OPTIONAL MATCH (c)-[:TIENE]->(m:Mascota)
WITH c, collect(m) AS mascotas
FOREACH (x IN mascotas | DETACH DELETE x)
DETACH DELETE c
RETURN 1 AS eliminado, size(mascotas) AS mascotasEliminadas
```

**Ejemplo de resultado:**

```json
{
  "eliminado": 1,
  "mascotasEliminadas": 2
}
```

### EXISTE_CLIENTE

Comprueba si existe un cliente (para distinguir 404 de otras reglas).

**Parámetros:** 

- `$id`: string — id del cliente

```cypher
MATCH (c:Cliente {id: $id})
RETURN c.id AS id
```

**Ejemplo de resultado:**

```json
[
  {
    "id": "cli-01"
  }
]
```

### FICHA_CLIENTE

Ficha completa: datos del cliente, sus mascotas con raza, sus últimas 10 compras y quién lo refirió (vecindad de 1 salto en varias direcciones).

**Parámetros:** 

- `$id`: string — id del cliente

```cypher
MATCH (c:Cliente {id: $id})
OPTIONAL MATCH (ref:Cliente)-[:REFIRIO]->(c)
RETURN c {.id, .nombre, .telefono, .email, .fechaAlta} AS cliente,
       CASE WHEN ref IS NULL THEN null ELSE ref {.id, .nombre} END AS referidoPor,
       COLLECT {
         MATCH (c)-[:TIENE]->(m:Mascota)
         OPTIONAL MATCH (m)-[:ES_RAZA]->(r:Raza)
         WITH m, r ORDER BY m.nombre
         RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre}
       } AS mascotas,
       COLLECT {
         MATCH (c)-[k:COMPRO]->(p:Producto)
         WITH k, p ORDER BY k.fecha DESC LIMIT 10
         RETURN {sku: p.sku, nombre: p.nombre, precio: p.precio, cantidad: k.cantidad, fecha: k.fecha}
       } AS ultimasCompras
```

**Ejemplo de resultado:**

```json
{
  "cliente": {
    "id": "cli-21",
    "nombre": "Ximena Salazar",
    "telefono": "6241000021",
    "email": null,
    "fechaAlta": "2026-09-02"
  },
  "referidoPor": {
    "id": "cli-20",
    "nombre": "Arturo Romero"
  },
  "mascotas": [
    {
      "id": "m-29",
      "nombre": "Canela",
      "especie": "perro",
      "tamano": "grande",
      "tipoPelo": "doble capa",
      "fechaNacimiento": "2023-02-10",
      "raza": "Golden Retriever"
    }
  ],
  "ultimasCompras": []
}
```

### LISTAR_CLIENTES

Lista de clientes con número de mascotas y de compras; filtra por nombre o teléfono si se envía `buscar`.

**Parámetros:** 

- `$buscar`: string | null — texto a buscar (sin distinguir mayúsculas)

```cypher
MATCH (c:Cliente)
WHERE $buscar IS NULL
   OR toLower(c.nombre) CONTAINS toLower($buscar)
   OR c.telefono CONTAINS $buscar
RETURN c.id AS id, c.nombre AS nombre, c.telefono AS telefono, c.email AS email,
       c.fechaAlta AS fechaAlta,
       COUNT { (c)-[:TIENE]->(:Mascota) } AS mascotas,
       COUNT { (c)-[:COMPRO]->(:Producto) } AS compras
ORDER BY nombre
```

**Ejemplo de resultado:**

```json
[
  {
    "id": "cli-01",
    "nombre": "María Fernanda López",
    "telefono": "6241000001",
    "email": "mafer@example.com",
    "fechaAlta": "2024-01-15",
    "mascotas": 2,
    "compras": 9
  }
]
```

## Mascotas (CRUD y servicios)

Archivo: `apps/api/src/queries/mascotas.cypher.ts`

### ACTUALIZAR_MASCOTA

Actualización parcial de la mascota (nombre, tamaño, tipo de pelo, fecha de nacimiento). La especie no cambia.

**Parámetros:** 

- `$id`: string
- `$cambios`: map
- `$fechaNacimiento`: string ISO | null

```cypher
MATCH (m:Mascota {id: $id})
SET m += $cambios
FOREACH (f IN CASE WHEN $fechaNacimiento IS NULL THEN [] ELSE [$fechaNacimiento] END |
  SET m.fechaNacimiento = date(f))
RETURN m.especie AS especie
```

**Ejemplo de resultado:**

```json
{
  "especie": "perro"
}
```

### CAMBIAR_RAZA_MASCOTA

Reemplaza la relación ES_RAZA. Solo devuelve fila si la nueva raza es de la misma especie que la mascota.

**Parámetros:** 

- `$id`: string
- `$raza`: string

```cypher
MATCH (m:Mascota {id: $id}), (r:Raza {nombre: $raza})
WHERE r.especie = m.especie
OPTIONAL MATCH (m)-[anterior:ES_RAZA]->(:Raza)
DELETE anterior
CREATE (m)-[:ES_RAZA]->(r)
RETURN r.nombre AS raza
```

**Ejemplo de resultado:**

```json
{
  "raza": "Labrador"
}
```

### CREAR_MASCOTA

Crea la mascota colgando de su dueño (TIENE) y la liga a su raza (ES_RAZA). El WHERE impone que la raza sea de la misma especie.

**Parámetros:** 

- `$clienteId`: string
- `$id`: string (uuid)
- `$nombre`: string
- `$especie`: 'perro' | 'gato'
- `$tamano`: 'chico' | 'mediano' | 'grande'
- `$tipoPelo`: 'corto' | 'largo' | 'doble capa' | 'rizado'
- `$raza`: string
- `$fechaNacimiento`: string ISO (YYYY-MM-DD) | null

```cypher
MATCH (c:Cliente {id: $clienteId})
MATCH (r:Raza {nombre: $raza})
WHERE r.especie = $especie
CREATE (c)-[:TIENE]->(m:Mascota {id: $id, nombre: $nombre, especie: $especie, tamano: $tamano, tipoPelo: $tipoPelo})
CREATE (m)-[:ES_RAZA]->(r)
SET m.fechaNacimiento = CASE WHEN $fechaNacimiento IS NULL THEN null ELSE date($fechaNacimiento) END
RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre} AS mascota
```

**Ejemplo de resultado:**

```json
{
  "mascota": {
    "id": "9b2e…",
    "nombre": "Pancho",
    "especie": "perro",
    "tamano": "chico",
    "tipoPelo": "corto",
    "fechaNacimiento": "2024-05-01",
    "raza": "Chihuahua"
  }
}
```

### DIAGNOSTICO_MASCOTA

Consulta previa a crear una mascota: ¿existe el cliente? ¿de qué especie es la raza indicada? Permite responder 404 o 409 con el motivo exacto.

**Parámetros:** 

- `$clienteId`: string
- `$raza`: string — nombre de la raza

```cypher
OPTIONAL MATCH (c:Cliente {id: $clienteId})
OPTIONAL MATCH (r:Raza {nombre: $raza})
RETURN c IS NOT NULL AS clienteExiste, r.especie AS especieRaza
```

**Ejemplo de resultado:**

```json
{
  "clienteExiste": true,
  "especieRaza": "perro"
}
```

### ELIMINAR_MASCOTA

Elimina una mascota y sus relaciones (TIENE, ES_RAZA, RECIBIO).

**Parámetros:** 

- `$id`: string

```cypher
MATCH (m:Mascota {id: $id})
DETACH DELETE m
RETURN count(*) AS eliminadas
```

**Ejemplo de resultado:**

```json
{
  "eliminadas": 1
}
```

### OBTENER_MASCOTA

Datos de una mascota con su raza y su dueño.

**Parámetros:** 

- `$id`: string

```cypher
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $id})
OPTIONAL MATCH (m)-[:ES_RAZA]->(r:Raza)
RETURN m {.id, .nombre, .especie, .tamano, .tipoPelo, .fechaNacimiento, raza: r.nombre, clienteId: c.id} AS mascota
```

**Ejemplo de resultado:**

```json
{
  "mascota": {
    "id": "m-29",
    "nombre": "Canela",
    "especie": "perro",
    "tamano": "grande",
    "tipoPelo": "doble capa",
    "fechaNacimiento": "2023-02-10",
    "raza": "Golden Retriever",
    "clienteId": "cli-21"
  }
}
```

### REGISTRAR_SERVICIO

Registra que una mascota recibió un servicio (grooming, guardería u hotel) con la fecha y hora actuales.

**Parámetros:** 

- `$mascotaId`: string
- `$servicioId`: string

```cypher
MATCH (m:Mascota {id: $mascotaId}), (s:Servicio {id: $servicioId})
CREATE (m)-[r:RECIBIO {fecha: datetime()}]->(s)
RETURN m.id AS mascotaId, s.nombre AS servicio, r.fecha AS fecha
```

**Ejemplo de resultado:**

```json
{
  "mascotaId": "m-29",
  "servicio": "Deslanado",
  "fecha": "2026-11-18T19:05:11.000Z"
}
```

## Productos (CRUD)

Archivo: `apps/api/src/queries/productos.cypher.ts`

### ACTUALIZAR_PRODUCTO

Actualización parcial del producto (nombre, precio, especie, stock).

**Parámetros:** 

- `$sku`: string
- `$cambios`: map (stock como neo4j.int)

```cypher
MATCH (p:Producto {sku: $sku})
SET p += $cambios
RETURN p.sku AS sku
```

**Ejemplo de resultado:**

```json
{
  "sku": "SH-01"
}
```

### CAMBIAR_CATEGORIA_PRODUCTO

Mueve el producto a otra categoría reemplazando la relación PERTENECE_A.

**Parámetros:** 

- `$sku`: string
- `$categoria`: string

```cypher
MATCH (p:Producto {sku: $sku}), (cat:Categoria {nombre: $categoria})
OPTIONAL MATCH (p)-[anterior:PERTENECE_A]->(:Categoria)
DELETE anterior
CREATE (p)-[:PERTENECE_A]->(cat)
RETURN cat.nombre AS categoria
```

**Ejemplo de resultado:**

```json
{
  "categoria": "Accesorios"
}
```

### CREAR_PRODUCTO

Crea un producto y lo liga a su categoría existente. El SKU es la llave natural (constraint de unicidad).

**Parámetros:** 

- `$sku`: string
- `$nombre`: string
- `$precio`: float (MXN)
- `$especie`: 'perro' | 'gato' | 'ambos'
- `$stock`: integer (neo4j.int)
- `$categoria`: string

```cypher
MATCH (cat:Categoria {nombre: $categoria})
CREATE (p:Producto {sku: $sku, nombre: $nombre, precio: $precio, especie: $especie, stock: $stock})-[:PERTENECE_A]->(cat)
RETURN p {.sku, .nombre, .precio, .especie, .stock, categoria: cat.nombre} AS producto
```

**Ejemplo de resultado:**

```json
{
  "producto": {
    "sku": "JU-07",
    "nombre": "Frisbee de goma",
    "precio": 189,
    "especie": "perro",
    "stock": 15,
    "categoria": "Juguetes"
  }
}
```

### ELIMINAR_PRODUCTO

Elimina el producto con DETACH DELETE (también borra el historial COMPRO hacia él).

**Parámetros:** 

- `$sku`: string

```cypher
MATCH (p:Producto {sku: $sku})
DETACH DELETE p
RETURN count(*) AS eliminados
```

**Ejemplo de resultado:**

```json
{
  "eliminados": 1
}
```

### LISTAR_PRODUCTOS

Catálogo de productos con su categoría. Filtros opcionales: categoría y especie (filtrar por 'perro' o 'gato' incluye también los de 'ambos').

**Parámetros:** 

- `$categoria`: string | null
- `$especie`: 'perro' | 'gato' | 'ambos' | null

```cypher
MATCH (p:Producto)-[:PERTENECE_A]->(cat:Categoria)
WHERE ($categoria IS NULL OR cat.nombre = $categoria)
  AND ($especie IS NULL OR p.especie = $especie OR ($especie <> 'ambos' AND p.especie = 'ambos'))
RETURN p.sku AS sku, p.nombre AS nombre, p.precio AS precio, p.especie AS especie,
       p.stock AS stock, cat.nombre AS categoria
ORDER BY categoria, nombre
```

**Ejemplo de resultado:**

```json
[
  {
    "sku": "SH-01",
    "nombre": "Shampoo deslanador para doble capa",
    "precio": 289,
    "especie": "perro",
    "stock": 25,
    "categoria": "Shampoos"
  }
]
```

### OBTENER_PRODUCTO

Un producto con su categoría.

**Parámetros:** 

- `$sku`: string

```cypher
MATCH (p:Producto {sku: $sku})
OPTIONAL MATCH (p)-[:PERTENECE_A]->(cat:Categoria)
RETURN p {.sku, .nombre, .precio, .especie, .stock, categoria: cat.nombre} AS producto
```

**Ejemplo de resultado:**

```json
{
  "producto": {
    "sku": "SH-01",
    "nombre": "Shampoo deslanador para doble capa",
    "precio": 289,
    "especie": "perro",
    "stock": 25,
    "categoria": "Shampoos"
  }
}
```

## Compras

Archivo: `apps/api/src/queries/compras.cypher.ts`

### DIAGNOSTICO_COMPRA

Cuando REGISTRAR_COMPRA no devuelve filas, explica por qué: cliente inexistente, producto inexistente o stock insuficiente.

**Parámetros:** 

- `$clienteId`: string
- `$sku`: string

```cypher
OPTIONAL MATCH (c:Cliente {id: $clienteId})
OPTIONAL MATCH (p:Producto {sku: $sku})
RETURN c IS NOT NULL AS clienteExiste, p IS NOT NULL AS productoExiste, p.stock AS stock
```

**Ejemplo de resultado:**

```json
{
  "clienteExiste": true,
  "productoExiste": true,
  "stock": 2
}
```

### REGISTRAR_COMPRA

Registra la compra y descuenta el stock en la MISMA transacción (se ejecuta dentro de session.executeWrite). Si no hay stock suficiente no devuelve filas.

**Parámetros:** 

- `$clienteId`: string
- `$sku`: string
- `$cantidad`: integer (neo4j.int)

```cypher
MATCH (c:Cliente {id: $clienteId}), (p:Producto {sku: $sku})
WHERE p.stock >= $cantidad
CREATE (c)-[:COMPRO {fecha: datetime(), cantidad: $cantidad}]->(p)
SET p.stock = p.stock - $cantidad
RETURN p.sku AS sku, p.stock AS stockRestante
```

**Ejemplo de resultado:**

```json
{
  "sku": "SH-01",
  "stockRestante": 24
}
```

## Recomendaciones (vecindad de 2 saltos)

Archivo: `apps/api/src/queries/recomendaciones.cypher.ts`

### MOTIVO_RECOMENDACION

Para cada SKU recomendado cuenta cuántos dueños distintos de mascotas parecidas lo compraron (en total, de la misma raza y del mismo tamaño). Alimenta el texto del motivo.

**Parámetros:** 

- `$mascotaId`: string
- `$skus`: list<string> — SKUs devueltos por RECOMENDAR_PRODUCTOS

```cypher
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $mascotaId})-[:ES_RAZA]->(raza:Raza)
UNWIND $skus AS sku
MATCH (p:Producto {sku: sku})<-[:COMPRO]-(otro:Cliente)-[:TIENE]->(otra:Mascota)
WHERE otro <> c
  AND otra.especie = m.especie
  AND (EXISTS { (otra)-[:ES_RAZA]->(raza) } OR otra.tamano = m.tamano)
WITH sku, raza, m, otro, EXISTS { (otra)-[:ES_RAZA]->(raza) } AS mismaRaza, otra.tamano = m.tamano AS mismoTamano
RETURN sku,
       count(DISTINCT otro) AS duenos,
       count(DISTINCT CASE WHEN mismaRaza THEN otro END) AS duenosMismaRaza,
       count(DISTINCT CASE WHEN mismoTamano THEN otro END) AS duenosMismoTamano,
       raza.nombre AS raza, m.especie AS especie, m.tamano AS tamano
```

**Ejemplo de resultado:**

```json
[
  {
    "sku": "SH-01",
    "duenos": 6,
    "duenosMismaRaza": 2,
    "duenosMismoTamano": 6,
    "raza": "Golden Retriever",
    "especie": "perro",
    "tamano": "grande"
  }
]
```

### RECOMENDAR_PRODUCTOS

Recomienda productos para una mascota según lo que compraron dueños de mascotas parecidas (misma especie y misma raza o mismo tamaño), sin repetir lo que su dueño ya compró. Ordena por afinidad.

**Parámetros:** 

- `$mascotaId`: string
- `$limite`: integer (neo4j.int), por defecto 5

```cypher
MATCH (c:Cliente)-[:TIENE]->(m:Mascota {id: $mascotaId})-[:ES_RAZA]->(raza:Raza)
MATCH (otra:Mascota)<-[:TIENE]-(otro:Cliente)-[:COMPRO]->(p:Producto)
WHERE otro <> c
  AND otra.especie = m.especie
  AND ((otra)-[:ES_RAZA]->(raza) OR otra.tamano = m.tamano)
  AND p.especie IN [m.especie, 'ambos']
  AND NOT (c)-[:COMPRO]->(p)
WITH DISTINCT p, otra,
     CASE WHEN (otra)-[:ES_RAZA]->(raza) THEN 2 ELSE 1 END AS peso
WITH p, sum(peso) AS afinidad
MATCH (p)-[:PERTENECE_A]->(cat:Categoria)
RETURN p.sku AS sku, p.nombre AS nombre, p.precio AS precio,
       cat.nombre AS categoria, afinidad
ORDER BY afinidad DESC, nombre
LIMIT $limite
```

**Ejemplo de resultado:**

```json
[
  {
    "sku": "SH-01",
    "nombre": "Shampoo deslanador para doble capa",
    "precio": 289,
    "categoria": "Shampoos",
    "afinidad": 14
  }
]
```

## Referidos (traversals de longitud variable y shortestPath)

Archivo: `apps/api/src/queries/referidos.cypher.ts`

### CADENA_REFERIDOS

Cadena hacia arriba: quién refirió al cliente, quién refirió a esa persona… hasta el origen (alguien a quien nadie refirió). Sin filas = llegó por su cuenta.

**Parámetros:** 

- `$clienteId`: string

```cypher
MATCH path = (origen:Cliente)-[:REFIRIO*1..10]->(c:Cliente {id: $clienteId})
WHERE NOT ()-[:REFIRIO]->(origen)
RETURN [n IN nodes(path) | {id: n.id, nombre: n.nombre}] AS cadena
```

**Ejemplo de resultado:**

```json
{
  "cadena": [
    {
      "id": "cli-01",
      "nombre": "María Fernanda López"
    },
    {
      "id": "cli-02",
      "nombre": "José Luis Hernández"
    },
    {
      "id": "cli-06",
      "nombre": "Juan Pablo García"
    }
  ]
}
```

### CAMINO_ENTRE_CLIENTES

Camino más corto (shortestPath) entre dos clientes a través de relaciones REFIRIO en cualquier dirección, hasta 8 saltos.

**Parámetros:** 

- `$desde`: string — id de cliente
- `$hasta`: string — id de cliente (distinto de desde)

```cypher
MATCH (a:Cliente {id: $desde}), (b:Cliente {id: $hasta})
MATCH p = shortestPath((a)-[:REFIRIO*..8]-(b))
RETURN [n IN nodes(p) | {id: n.id, nombre: n.nombre}] AS camino, length(p) AS saltos
```

**Ejemplo de resultado:**

```json
{
  "camino": [
    {
      "id": "cli-09",
      "nombre": "Alejandra Castillo"
    },
    {
      "id": "cli-08",
      "nombre": "Luis Miguel Sánchez"
    },
    {
      "id": "cli-06",
      "nombre": "Juan Pablo García"
    }
  ],
  "saltos": 2
}
```

### CREAR_REFERIDO

Crea la relación REFIRIO solo si se cumplen las reglas (sin auto-referencia, un solo referidor, sin ciclos). Sin filas = alguna regla falló.

**Parámetros:** 

- `$referidorId`: string
- `$referidoId`: string

```cypher
MATCH (a:Cliente {id: $referidorId}), (b:Cliente {id: $referidoId})
WHERE a <> b
  AND NOT EXISTS { ()-[:REFIRIO]->(b) }
  AND NOT EXISTS { (b)-[:REFIRIO*]->(a) }
CREATE (a)-[:REFIRIO {fecha: date()}]->(b)
RETURN a.id AS referidor, b.id AS referido
```

**Ejemplo de resultado:**

```json
{
  "referidor": "cli-01",
  "referido": "cli-24"
}
```

### DIAGNOSTICO_REFERIDO

Consulta previa a CREAR_REFERIDO para explicar qué regla falla: clientes inexistentes, referido que ya tiene referidor o ciclo.

**Parámetros:** 

- `$referidorId`: string
- `$referidoId`: string

```cypher
OPTIONAL MATCH (a:Cliente {id: $referidorId})
OPTIONAL MATCH (b:Cliente {id: $referidoId})
OPTIONAL MATCH (previo:Cliente)-[:REFIRIO]->(b)
RETURN a IS NOT NULL AS referidorExiste,
       b IS NOT NULL AS referidoExiste,
       previo.nombre AS referidoPor,
       CASE WHEN a IS NULL OR b IS NULL THEN false
            ELSE EXISTS { (b)-[:REFIRIO*]->(a) } END AS creariaCiclo
```

**Ejemplo de resultado:**

```json
{
  "referidorExiste": true,
  "referidoExiste": true,
  "referidoPor": "José Luis Hernández",
  "creariaCiclo": false
}
```

### RANKING_REFERIDORES

Ranking de los clientes que más puntos acumulan por su red de referidos (3 niveles).

**Parámetros:** 

- `$limite`: integer (neo4j.int), por defecto 10

```cypher
MATCH path = (c:Cliente)-[:REFIRIO*1..3]->(r:Cliente)
WITH c, r, min(length(path)) AS nivel
WITH c, count(r) AS tamanoRed,
     sum(CASE nivel WHEN 1 THEN 100 WHEN 2 THEN 50 ELSE 25 END) AS puntos
RETURN c.id AS id, c.nombre AS nombre, tamanoRed, puntos
ORDER BY puntos DESC, nombre
LIMIT $limite
```

**Ejemplo de resultado:**

```json
[
  {
    "id": "cli-01",
    "nombre": "María Fernanda López",
    "tamanoRed": 11,
    "puntos": 700
  }
]
```

### RED_REFERIDOS

Red de referidos de un cliente hasta 3 niveles hacia abajo, con el nivel y los puntos que aporta cada referido.

**Parámetros:** 

- `$clienteId`: string

```cypher
MATCH path = (c:Cliente {id: $clienteId})-[:REFIRIO*1..3]->(r:Cliente)
WITH r, min(length(path)) AS nivel
RETURN r.id AS id, r.nombre AS nombre, nivel,
       CASE nivel WHEN 1 THEN 100 WHEN 2 THEN 50 ELSE 25 END AS puntos
ORDER BY nivel, nombre
```

**Ejemplo de resultado:**

```json
[
  {
    "id": "cli-02",
    "nombre": "José Luis Hernández",
    "nivel": 1,
    "puntos": 100
  },
  {
    "id": "cli-06",
    "nombre": "Juan Pablo García",
    "nivel": 2,
    "puntos": 50
  },
  {
    "id": "cli-08",
    "nombre": "Luis Miguel Sánchez",
    "nivel": 3,
    "puntos": 25
  }
]
```

## Catálogos y resumen

Archivo: `apps/api/src/queries/catalogos.cypher.ts`

### LISTAR_CATEGORIAS

Categorías con el número de productos de cada una.

**Parámetros:** ninguno

```cypher
MATCH (cat:Categoria)
RETURN cat.nombre AS nombre, COUNT { (:Producto)-[:PERTENECE_A]->(cat) } AS productos
ORDER BY nombre
```

**Ejemplo de resultado:**

```json
[
  {
    "nombre": "Shampoos",
    "productos": 6
  }
]
```

### LISTAR_RAZAS

Razas disponibles, opcionalmente filtradas por especie.

**Parámetros:** 

- `$especie`: 'perro' | 'gato' | null

```cypher
MATCH (r:Raza)
WHERE $especie IS NULL OR r.especie = $especie
RETURN r.nombre AS nombre, r.especie AS especie
ORDER BY especie, nombre
```

**Ejemplo de resultado:**

```json
[
  {
    "nombre": "Golden Retriever",
    "especie": "perro"
  }
]
```

### LISTAR_SERVICIOS

Servicios del negocio (grooming, guardería, hotel) con su precio.

**Parámetros:** ninguno

```cypher
MATCH (s:Servicio)
RETURN s.id AS id, s.nombre AS nombre, s.precio AS precio
ORDER BY s.precio
```

**Ejemplo de resultado:**

```json
[
  {
    "id": "srv-bano",
    "nombre": "Baño",
    "precio": 250
  }
]
```

### RESUMEN

Totales para el dashboard: clientes, mascotas, productos y compras.

**Parámetros:** ninguno

```cypher
RETURN COUNT { (:Cliente) } AS clientes,
       COUNT { (:Mascota) } AS mascotas,
       COUNT { (:Producto) } AS productos,
       COUNT { (:Cliente)-[:COMPRO]->(:Producto) } AS compras
```

**Ejemplo de resultado:**

```json
{
  "clientes": 25,
  "mascotas": 35,
  "productos": 24,
  "compras": 120
}
```

## Consultas de los scripts de `db/`

El seed (`db/seed.ts`) usa consultas `UNWIND $lista AS x CREATE …` por lotes y `db/constraints.cypher` contiene el DDL; ambos están comentados en su archivo.

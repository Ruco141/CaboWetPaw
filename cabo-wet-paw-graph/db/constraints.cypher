// Constraints e índices de Cabo Wet Paw.
// Se aplican con `npm run db:constraints` (y automáticamente al inicio de `npm run seed`).
// IF NOT EXISTS los hace idempotentes: se pueden correr las veces que sea.
CREATE CONSTRAINT cliente_id IF NOT EXISTS FOR (c:Cliente) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT cliente_telefono IF NOT EXISTS FOR (c:Cliente) REQUIRE c.telefono IS UNIQUE;
CREATE CONSTRAINT mascota_id IF NOT EXISTS FOR (m:Mascota) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT producto_sku IF NOT EXISTS FOR (p:Producto) REQUIRE p.sku IS UNIQUE;
CREATE CONSTRAINT raza_nombre IF NOT EXISTS FOR (r:Raza) REQUIRE r.nombre IS UNIQUE;
CREATE CONSTRAINT categoria_nombre IF NOT EXISTS FOR (c:Categoria) REQUIRE c.nombre IS UNIQUE;
CREATE CONSTRAINT servicio_id IF NOT EXISTS FOR (s:Servicio) REQUIRE s.id IS UNIQUE;
CREATE INDEX cliente_nombre IF NOT EXISTS FOR (c:Cliente) ON (c.nombre);

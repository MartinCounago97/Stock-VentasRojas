Listado de métodos

✅ Productos (/api/productos)
GET /api/productos
Filtros: q, activo, bajoStock, moneda, ubicacionId, precioMin, precioMax, limit

GET /api/productos/:id

POST /api/productos (admin)
Crea producto. Si stock > 0, genera movimiento ingreso con observación “Stock inicial”.

PUT /api/productos/:id (admin)
Edita producto (⚠️ no permite modificar stock por aquí).

DELETE /api/productos/:id (admin)
Baja lógica (activo=false).

PATCH /api/productos/:id/stock (admin)
Aplica movimiento de stock. Body: { cantidad, observaciones }
cantidad > 0 ingreso, cantidad < 0 venta/ajuste negativo. No permite stock negativo.

GET /api/productos/:id/movimientos
Filtros: tipo (ingreso|venta|ajuste), limit

Opcional (si lo dejaste):

POST /api/productos/with-image (admin, multipart)
image (opcional) + campos de producto.

✅ Ubicaciones (/api/ubicaciones)

GET /api/ubicaciones
Filtros: activo, q, sector

GET /api/ubicaciones/:id

POST /api/ubicaciones (admin)

PUT /api/ubicaciones/:id (admin)

DELETE /api/ubicaciones/:id (admin)
Baja lógica (activo=false)

✅ Ventas/Pedidos (/api/ventas o /api/venta según tu app.js)

Una sola entidad “Venta” con estado:

pendiente (pedido desde catálogo/WPP o creado por admin sin confirmar)

confirmada (al confirmar recién descuenta stock y crea movimientos)

rechazada (no toca stock)

anulada (opcional futuro)

Endpoints:

GET /api/ventas (admin)
Filtros: estado, origen, q (cliente), limit

GET /api/ventas/:id (admin)

POST /api/ventas (público o admin, según decidas)
Crea venta pendiente, NO descuenta stock.

PUT /api/ventas/:id (admin)
Modificar antes de confirmar (solo si estado=pendiente).

POST /api/ventas/:id/confirmar (admin)
Valida stock, descuenta stock, crea movimientos venta (cantidad negativa), pasa a confirmada.

POST /api/ventas/:id/rechazar (admin)
Pasa a rechazada (opcional motivo).

✅ Movimientos de stock

No tiene controller propio.

Se consulta por producto:

GET /api/productos/:id/movimientos

# Cambios v4.6

## Shop: categorización automática

- El usuario sigue cargando **un enlace de Mercado Libre por línea** en `shop/productos.txt`.
- La API consulta, cuando está disponible, la categoría oficial y su ruta de Mercado Libre.
- Cada producto se clasifica automáticamente en una categoría comercial de Área 1 y una subcategoría detallada.
- Los filtros visibles del Shop usan categorías comerciales simples y aparecen solo cuando contienen productos.
- La búsqueda también utiliza la subcategoría y la categoría oficial de Mercado Libre, aunque esos datos no recargan visualmente la interfaz.
- Se conserva la categoría oficial como `marketplaceCategory` y `marketplaceCategoryPath` para trazabilidad.
- El modo `/api/product?...&debug=1` informa el resultado y origen de la clasificación.

### Categorías comerciales

1. Tecnología
2. Electrodomésticos
3. Hogar y Jardín
4. Herramientas
5. Oficina y Comercio
6. Gaming
7. Audio y Video
8. Redes y Conectividad
9. Servidores e Infraestructura
10. Automotor
11. Belleza y Cuidado Personal
12. Deportes y Tiempo Libre
13. Otros (solo cuando no existe coincidencia confiable)

La clasificación combina título, marca, categoría oficial y ruta de categorías de Mercado Libre.

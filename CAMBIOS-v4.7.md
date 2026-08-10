# Cambios v4.7

- Se agregó un estado de carga visible en Área 1 Shop: **“Aguardá un momento. Estamos buscando productos para vos.”**
- El estado de carga muestra el progreso mientras se consultan los enlaces de Mercado Libre.
- **Tecnología** pasa a ser la categoría inicial y el primer filtro visible cuando existen productos de esa categoría.
- **Todos** permanece disponible, pero deja de ser la vista inicial.
- Se mejoró la clasificación automática con prioridad al título real del producto y reglas comerciales más específicas.
- Se evita usar una marca aislada para decidir la categoría.
- Se bloquearon falsos positivos de categorías de infraestructura/redes provenientes de contenido lateral o recomendaciones de páginas sociales de Mercado Libre.
- Se ampliaron términos de Electrodomésticos y Belleza y Cuidado Personal.
- Se aumentó moderadamente la concurrencia de carga y se permite reutilizar la caché del endpoint para mejorar la velocidad percibida al recargar.
- No se modifica `shop/productos.txt`.

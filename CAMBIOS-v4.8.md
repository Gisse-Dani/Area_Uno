# Cambios v4.8

- Integracion de **Vercel Web Analytics** en las paginas publicas de Area 1.
- La implementacion usa el script de Web Analytics para sitios HTML estaticos.
- Paginas incluidas: Inicio, Eventos, Analitica & Procesos, Equipamiento, Contacto, Shop y paginas 404 publicas.
- `shop/gestor.html` queda deliberadamente fuera del seguimiento para no mezclar uso interno con trafico real de visitantes.
- No se modificaron `shop/productos.txt`, `api/product.js`, precios, categorias ni funcionamiento del Shop.
- No se requiere convertir el proyecto a Next.js.

Despues de subir esta version, Web Analytics debe estar habilitado en Vercel y se debe realizar un nuevo deployment.

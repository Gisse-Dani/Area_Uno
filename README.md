# Área 1 Integrado v3.1 — Shop original restaurado

Este proyecto integra las tres unidades de Área 1 en un único despliegue de Vercel:

- `/` — página central
- `/shop` — Shop original v5.1, conservando su diseño
- `/eventos` — Área 1 Eventos
- `/datos` — Área 1 Data
- `/shop/gestor` — gestor interno del catálogo

## Corrección aplicada

El Shop integrado anteriormente utilizaba rutas relativas. Al abrirse como `/shop` sin barra final, el navegador buscaba sus recursos en `/assets` y su archivo de productos en `/productos.txt`. Eso provocaba dos fallas:

1. Se cargaban estilos de la página central y el diseño parecía diferente.
2. No se encontraba `shop/productos.txt`, por lo que el catálogo quedaba vacío.

La versión v3.1 restaura el Shop v5.1 original y utiliza rutas absolutas:

- `/shop/assets/css/styles.css`
- `/shop/assets/js/app.js`
- `/shop/productos.txt`
- `/api/product`

## Publicación

- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: vacío
- Output Directory: vacío
- Production Branch: `main`

## Productos

El catálogo se administra en `shop/productos.txt`, con un enlace de Mercado Libre por línea.

Al aplicar el paquete de corrección, **no reemplazar `shop/productos.txt`** si el repositorio ya contiene la lista real de productos.

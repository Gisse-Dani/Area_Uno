# Área 1 Integrado v3.0

Sitio institucional integrado de **Área 1**, con sus tres unidades dentro del mismo proyecto:

- **Área 1 Shop**: catálogo y curaduría de productos dentro de `/shop`.
- **Área 1 Eventos**: invitaciones digitales y micrositios para celebraciones.
- **Área 1 Data**: servicios profesionales de datos, procesos, tableros e informes.

## Estructura principal

- `index.html`: página central de la marca.
- `eventos.html`: presentación de Área 1 Eventos.
- `datos.html`: presentación de Área 1 Data.
- `shop/index.html`: landing del Shop integrada dentro del mismo sitio.
- `shop/gestor.html`: gestor interno del catálogo.
- `shop/productos.txt`: listado editable de links de productos.
- `api/product.js`: función serverless para leer datos públicos de Mercado Libre.
- `assets/`: estilos, scripts e imágenes de la marca y Eventos.
- `shop/assets/`: estilos, scripts e imágenes propios del Shop.

## Publicación en Vercel

Configuración recomendada:

- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: vacío
- Output Directory: vacío

## Qué quedó integrado

- El **Shop ya no depende de un sitio separado**.
- La navegación principal de Inicio, Eventos y Data ahora enlaza al Shop interno.
- El Shop incluye enlaces de regreso al ecosistema Área 1.
- La función `api/product.js` quedó disponible a nivel raíz para que `/shop` funcione correctamente en Vercel.

## Próximo paso sugerido

Definir los canales finales de contacto (WhatsApp, email o formulario) para reemplazar los CTA comerciales de Eventos y Data, y cargar los enlaces reales en `shop/productos.txt`.

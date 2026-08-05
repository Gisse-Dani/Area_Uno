## Nota de integración

Este Shop ahora forma parte del sitio principal de Área 1 y se publica dentro de la ruta `/shop`.

# Área Uno Shop v5.1

Sitio de recomendaciones de productos publicado en Vercel.

## Publicación

El proyecto está preparado para desplegarse desde GitHub hacia Vercel con:

- Framework Preset: Other
- Root Directory: `./`
- Build Command: vacío
- Output Directory: vacío
- Production Branch: `main`

## Carga de productos

Los productos continúan cargándose desde `productos.txt`, con un enlace por línea:

```text
https://meli.la/ENLACE-UNO
https://meli.la/ENLACE-DOS
```

La página obtiene los datos públicos mediante `api/product.js`.

## Diseño v5.1

- Logo horizontal color en encabezado y pie.
- Hero compacto.
- Catálogo inmediatamente después del hero.
- Grilla inicial de 3 columnas por 4 filas en escritorio.
- Botón para mostrar más productos cuando existen más de 12.
- Beneficios después del catálogo.
- Tres productos destacados después de los beneficios.

## Actualización sin perder productos

Para actualizar un sitio existente, reemplazá:

- `index.html`
- `404.html`
- `assets/css/styles.css`
- `assets/js/app.js`
- `assets/img/brand/`

No reemplaces `productos.txt` ni `api/product.js` si ya contienen tu configuración actual.

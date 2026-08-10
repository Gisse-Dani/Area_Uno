# Área 1 Integrado v4.0

Sitio institucional integrado de **Área 1**, ahora con cuatro unidades dentro del mismo proyecto:

- **Área 1 Shop**: catálogo y curaduría de productos dentro de `/shop`.
- **Área 1 Eventos**: invitaciones digitales y micrositios para celebraciones.
- **Área 1 Analítica & Procesos**: servicios profesionales de análisis de datos, relevamiento de procesos, tableros e informes.
- **Área 1 Equipamiento**: equipamiento tecnológico presupuestable para proyectos, con servidores, storage, redes, wireless, UPS y puesto de trabajo.

## Archivos principales

- `index.html`: página central de la marca.
- `eventos.html`: Área 1 Eventos.
- `datos.html`: Área 1 Analítica & Procesos.
- `equipamiento.html`: Área 1 Equipamiento.
- `shop/index.html`: Shop integrado.
- `shop/productos.txt`: listado de links del Shop.
- `api/product.js`: función serverless del Shop.
- `assets/img/equipment/`: imágenes de apoyo derivadas del catálogo aportado para Equipamiento.

## Publicación en Vercel

- Framework Preset: `Other`
- Root Directory: `./`
- Build Command: vacío
- Output Directory: vacío

## Nota sobre Equipamiento

Las familias, modelos y marcas se presentan como referencias presupuestables basadas en el catálogo suministrado. Disponibilidad, configuración final, precio y plazo deben confirmarse en cada cotización.


## Contacto y catálogo (v4.4)

- WhatsApp: +54 9 2984 713844
- Catálogo de equipamiento: `assets/docs/catalogo-area1.pdf`
- La página `equipamiento.html` incluye acceso directo a cotización y descarga del catálogo.


## Formulario de contacto v4.5

El formulario público está en `contacto.html` y envía los mensajes a través de `/api/contact`.

En Vercel configurar estas variables privadas de entorno:

- `GMAIL_USER`: cuenta Gmail que enviará y recibirá las consultas.
- `GMAIL_APP_PASSWORD`: contraseña de aplicación de Google (16 caracteres, sin espacios).
- `CONTACT_RECIPIENT`: opcional; si se omite, se utiliza `GMAIL_USER` como destinatario.

La dirección de correo no se renderiza ni se incluye en el HTML público.

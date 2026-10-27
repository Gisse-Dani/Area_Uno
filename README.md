# Área 1 Integrado v4.0

Sitio institucional integrado de **Área 1**, ahora con cuatro unidades dentro del mismo proyecto:

- **Área 1 Shop**: catálogo y curaduría de productos dentro de `/shop`.
- **Área 1 Proyectos Digitales**: invitaciones digitales y micrositios para celebraciones.
- **Área 1 Analítica & Procesos**: servicios profesionales de análisis de datos, relevamiento de procesos, tableros e informes.
- **Área 1 Equipamiento**: infraestructura, conectividad, storage, energía y puestos de trabajo con cotización por proyecto.
- **Área 1 Proyectos Digitales**: equipamiento tecnológico presupuestable para proyectos, con servidores, storage, redes, wireless, UPS y puesto de trabajo.

## Archivos principales

- `index.html`: página central de la marca.
- `proyectos-digitales.html`: Área 1 Proyectos Digitales.
- `datos.html`: Área 1 Analítica & Procesos.
- `proyectos-digitales.html`: Área 1 Proyectos Digitales.
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


## Shop: categorías automáticas

Los productos se categorizan automáticamente a partir del título, marca y categoría oficial de Mercado Libre. La carga sigue siendo un enlace por línea en `shop/productos.txt`.

## Multirregión Argentina / Chile

La región se selecciona desde la barra superior. También puede abrirse directamente con:
- `/?region=ar`
- `/?region=cl`

El Shop está disponible exclusivamente para Argentina y utiliza `shop/productos-ar.txt`. Si un visitante con región Chile intenta ingresar a `/shop/`, vuelve a la home regional de Chile.

Los contactos públicos pueden configurarse por región desde variables de entorno de Vercel, sin tener que editar HTML. Si se conecta un dominio `.cl` al mismo proyecto, la interfaz selecciona Chile automáticamente. No hace falta duplicar el sitio.

## Disponibilidad regional v5.1

- Argentina: Analítica & Procesos, Equipamiento, Shop y Proyectos Digitales.
- Chile: Analítica & Procesos, Equipamiento y Proyectos Digitales.
- Shop está disponible únicamente en Argentina.
- WhatsApp Chile para todas las verticales: +56 9 2218 4205.



## Contacto regional

- Argentina: conserva la configuración existente mediante `CONTACT_RECIPIENT` / `CONTACT_RECIPIENT_AR`.
- Chile: las consultas se entregan internamente a `areaunocl@gmail.com` por defecto. Puede sobreescribirse con `CONTACT_RECIPIENT_CL`.
- Ninguna dirección de correo se muestra en la interfaz pública.


## Regionalización v5.2
- Argentina: @areauno.servicios.
- Chile: @areaunocl.
- Selector visual con banderas y persistencia de región.
- Textos visibles adaptados a es-AR / es-CL.


## Detección automática de región (v5.3)

El sitio consulta `/api/region` en una primera visita sin preferencia previa. En Vercel, el endpoint lee `x-vercel-ip-country` y propone `ar` para Argentina o `cl` para Chile. No usa GPS. El visitante puede cambiar la región en cualquier momento con el selector de banderas; la elección manual queda guardada en el navegador y tiene prioridad sobre la detección automática.

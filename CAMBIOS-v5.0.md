# Área 1 v5.0 — Argentina + Chile

## Multirregión
- Selector visible de región: **Argentina / Chile**.
- La selección se conserva en el navegador y también se agrega a los enlaces internos como `?region=ar` o `?region=cl`.
- Idioma regional: `es-AR` / `es-CL`.
- GA4 recibe la dimensión `site_region` y registra el evento `region_selected`.

## Contacto regional
- Argentina mantiene:
  - General / Analítica / Shop / Proyectos Digitales: +54 9 2984 713844.
  - Equipamiento: +54 9 2984 28-3869.
- Chile queda preparado para números propios mediante variables de entorno. Mientras no existan, no se muestra un número argentino como contacto chileno; se prioriza el formulario.
- El formulario envía la región en forma interna y el asunto recibido indica `Área 1 Argentina` o `Área 1 Chile`.
- El correo nunca se muestra en la web.

## Shop regional
- Argentina usa `shop/productos-ar.txt` (copiado del catálogo actual).
- Chile usa `shop/productos-cl.txt`.
- El extractor acepta enlaces de Mercado Libre Argentina (`MLA`) y Chile (`MLC`) y dominios `.com.ar` / `.cl`.
- Moneda y formato: ARS / es-AR para Argentina, CLP / es-CL para Chile.
- El gestor interno permite elegir región y descargar el archivo correcto.

## Textos
- Se conservan textos neutros cuando funcionan para ambos mercados.
- En Chile se ajustan expresiones visibles de voseo en Shop/Contacto y `Casamientos` pasa a `Matrimonios` en Proyectos Digitales.
- Las imágenes actuales son regionalmente neutras. La infraestructura permite usar `data-src-ar` y `data-src-cl` cuando haya imágenes específicas por país.

## Variables de entorno opcionales / recomendadas
### Chile
- `WHATSAPP_GENERAL_CL`
- `WHATSAPP_GENERAL_DISPLAY_CL`
- `WHATSAPP_EQUIPMENT_CL`
- `WHATSAPP_EQUIPMENT_DISPLAY_CL`
- `WHATSAPP_ANALYTICS_CL` / `WHATSAPP_ANALYTICS_DISPLAY_CL`
- `WHATSAPP_SHOP_CL` / `WHATSAPP_SHOP_DISPLAY_CL`
- `WHATSAPP_PROJECTS_CL` / `WHATSAPP_PROJECTS_DISPLAY_CL`
- `INSTAGRAM_CL`
- `CONTACT_RECIPIENT_CL`
- Opcionales por vertical: `CONTACT_RECIPIENT_EQUIPMENT_CL`, `CONTACT_RECIPIENT_ANALYTICS_CL`, `CONTACT_RECIPIENT_SHOP_CL`, `CONTACT_RECIPIENT_PROJECTS_CL`
- `GMAIL_USER_CL` (solo si el remitente SMTP también será distinto)
- `GMAIL_APP_PASSWORD_CL` (solo si el remitente SMTP también será distinto)

### Argentina (opcionales para sobrescribir los valores actuales)
- `WHATSAPP_GENERAL_AR`
- `WHATSAPP_GENERAL_DISPLAY_AR`
- `WHATSAPP_EQUIPMENT_AR`
- `WHATSAPP_EQUIPMENT_DISPLAY_AR`
- `WHATSAPP_ANALYTICS_AR` / `WHATSAPP_ANALYTICS_DISPLAY_AR`
- `WHATSAPP_SHOP_AR` / `WHATSAPP_SHOP_DISPLAY_AR`
- `WHATSAPP_PROJECTS_AR` / `WHATSAPP_PROJECTS_DISPLAY_AR`
- `INSTAGRAM_AR`
- `CONTACT_RECIPIENT_AR`
- Opcionales por vertical: `CONTACT_RECIPIENT_EQUIPMENT_AR`, `CONTACT_RECIPIENT_ANALYTICS_AR`, `CONTACT_RECIPIENT_SHOP_AR`, `CONTACT_RECIPIENT_PROJECTS_AR`
- `GMAIL_USER_AR`
- `GMAIL_APP_PASSWORD_AR`

Las variables generales existentes (`GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CONTACT_RECIPIENT`) continúan funcionando como respaldo.

## Dominio y selección automática
- `/?region=ar` o `/ar` abre Argentina.
- `/?region=cl` o `/cl` abre Chile.
- Si el mismo proyecto se publica con un dominio terminado en `.cl` (por ejemplo `AreaUno.cl`), Chile se selecciona automáticamente, salvo que la URL indique explícitamente otra región.

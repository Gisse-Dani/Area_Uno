# Cambios v4.9

- Integrado Google Analytics 4 con el ID de medición `G-RB4RWLLV15` en todas las páginas públicas.
- Se mantiene Vercel Web Analytics en paralelo.
- No se agregó Analytics al gestor interno `/shop/gestor`.
- Eventos comerciales GA4 incorporados:
  - `whatsapp_click`
  - `instagram_click`
  - `quote_request`
  - `catalog_download`
  - `contact_form_sent`
  - `shop_search`
  - `category_selected`
  - `shop_sort`
  - `shop_load_more`
  - `mercadolibre_click`
- El formulario no envía a Analytics nombres, correos ni contenido del mensaje.
- No se modificó `shop/productos.txt` ni la lógica de extracción de Mercado Libre.

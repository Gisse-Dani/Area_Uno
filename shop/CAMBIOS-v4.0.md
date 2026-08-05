# Cambios v4.0 — Solo enlaces

- Se eliminó la necesidad de códigos de búsqueda.
- Se eliminó el Access Token y todas las variables de entorno.
- Se eliminó `promociones.txt` y las reglas globales de descuento.
- `productos.txt` acepta únicamente un enlace por línea.
- El gestor genera el archivo desde una lista de links.
- La página solo calcula precio final cuando detecta una bonificación o descuento en los datos públicos del enlace.
- Si no puede confirmar una promoción, muestra el precio publicado o invita a consultar el precio final en Mercado Libre.
- El enlace de afiliado original se conserva siempre en el botón de compra.

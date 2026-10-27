# Área 1 v5.3

## Detección automática de región

- La primera visita puede detectar Argentina o Chile por país estimado de IP mediante Vercel.
- La detección usa únicamente el código de país; no solicita GPS ni ubicación precisa.
- Prioridad: parámetro `?region=` > elección manual guardada > dominio `.cl` / `.com.ar` > región de la sesión > detección IP > idioma del navegador.
- El selector 🇦🇷 Argentina / 🇨🇱 Chile permanece siempre disponible.
- Una selección manual queda guardada y prevalece sobre futuras detecciones automáticas.
- Se elimina una clave heredada que mezclaba selección automática y manual en versiones anteriores.
- Chile sigue sin Shop y conserva sus contactos regionales.

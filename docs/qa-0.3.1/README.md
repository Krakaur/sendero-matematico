# Evidencias técnicas de 0.3.1

Las imágenes y registros corresponden exclusivamente a perfiles sintéticos y respuestas automatizadas. Las tasas elevadas visibles en algunas capturas reflejan la automatización y no son datos de niños ni evidencia de eficacia educativa.

`031-one-tap.png` muestra el segundo ejercicio tras un solo clic en el primero. `031-correction.png` conserva la solución destacada después de un error. `031-progress.png` y `031-laptop.png` muestran el informe con la tasa de primera respuesta, precisión, número de observaciones y exclusiones. `031-windows.png` y su JSON documentan la aplicación Windows empaquetada, abierta con protocolo local y sin navegador externo.

Las pruebas reproducibles están en `scripts/qa-web-fluency.js`, `scripts/qa-web-timing.js`, `scripts/qa-web-bank.js` y `scripts/qa-windows-fluency.cjs`. El reloj virtual de la comprobación temporal debe instalarse antes de iniciar la aventura, para que controle también el temporizador de inactividad.

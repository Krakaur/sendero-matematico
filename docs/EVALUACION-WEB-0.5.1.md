# Web 0.5.1: llegada y repetición

13 de octubre de 2026. Tercer incremento del ciclo web, centrado en completar la carrera y facilitar una nueva partida. Publicado en GitHub Pages mediante la ejecución satisfactoria `38451610176`. Los 30 archivos públicos coinciden byte a byte con la fuente Git. La actualización desde 0.5.0 conservó los datos y permitió continuar offline; evidencia en `qa-web-0.5.1/publication.json`. Los paquetes Android y Windows permanecen en 0.4.0.

## Cambio observable

En el cierre anterior, a 1280 × 800 píxeles, el botón para repetir comenzaba en la coordenada vertical 1901,7. Ahora empieza en 381,5: posición, puntos, tiempo y siguiente acción caben en la primera vista. La escena conserva el río ilustrado, amplía el personaje de Luma y añade muelle, banderines, copa y hojas animadas. No se incorporan recursos de Arcademics.

El último acierto conserva la escena durante una llegada de 650 ms antes de mostrar el resultado. Esa transición no cuenta como tiempo de respuesta ni de carrera. Con movimiento reducido se omite y se desactivan las animaciones del cierre. El motivo de llegada se emite una sola vez en el flujo normal; la prueba confirma el disparo del sintetizador, no constituye una valoración perceptiva del sonido.

«Volver al río» inicia otra carrera con el nivel que corresponde a la adaptación anterior. «Elegir otro camino» vuelve a la selección. El informe educativo y las posiciones detalladas permanecen disponibles al desplegar el bloque de resultados. La clasificación distingue participantes que ya llegaron y rivales todavía en el río: no presenta sus tiempos programados como llegadas ya ocurridas. Se conservan empates y las cuatro posiciones posibles. Los puntos de juego continúan separados de la calificación escolar.

## Conservación y pruebas

La sesión y la ruta de resultados se guardan antes de la animación opcional. Recargar durante esa transición mantiene una única sesión completada. El cambio no modifica preguntas, reglas de adaptación, perfiles, formato de informes ni trayectorias de los rivales.

Pasaron 38 pruebas Node, incluidas tres sobre clasificación, empates y distinción entre acierto inicial, recuperación y recompensa. Los recorridos en Chromium con perfiles sintéticos comprueban carrera de ocho retos con error, victoria, cuarto lugar mediante un tiempo sintético explícito, repetición con nuevo identificador y nivel, conservación del historial, recarga durante la llegada, reducción de movimiento, repetición offline y continuidad de práctica tranquila y razonamiento.

Las acciones de repetir y salir tienen al menos 44 píxeles de altura, permanecen dentro de la primera vista y no quedan cubiertas por la navegación en 1280 × 800, 390 × 844, 360 × 640 y 854 × 480. También se comprobó el texto de recuperación y cuarto lugar en 360 × 640. Estas medidas describen los casos probados; no equivalen a una auditoría completa de accesibilidad.

Evidencia compacta: `qa-web-0.5.1/browser-verification.json`, capturas y registro de pruebas. Evidencia extensa: `output/playwright/ciclo-web-3-20261013/`, excluida de Git. La grabación `arrival-replay.webm` no incluye pista de sonido.

## Respaldo y publicación

Antes de modificar la entrega se preservó la rama publicada `ab3f8861baebb651884079a878d082365cba0246` en `qa-private/public-web-backup-20261013-1845/`: ZIP, 29 archivos obtenidos por HTTP, manifiesto de hashes y `RESTORE.txt`. Los 29 coincidieron byte a byte con los objetos de Git. La restauración se realiza mediante un nuevo commit de `gh-pages`, sin reescribir su historia. Los perfiles locales de cada navegador no forman parte de ese respaldo del sitio.

La actualización pública se comprobó en un navegador independiente con perfil sintético, una carrera 0.5.0 ya completada y otra pendiente con un acierto y un error. Se conservaron perfil, historial, adaptación, identificador, intentos, primera respuesta, semilla, ritmos y tiempos de los rivales. La carrera pendiente se completó una sola vez; después se abrió una nueva 0.5.1 y se comprobó recarga y respuesta offline.

## Continuidad del plan

Este incremento cubre llegada y repetición de la jornada 14; la preparación de salida sigue pendiente. No cierra las veinte jornadas ni demuestra preferencia infantil, diversión o eficacia educativa. Continúan pendientes la valoración estética y sonora del autor, la prueba física, las métricas de rendimiento y la observación de uso. La siguiente intervención debe dar continuidad a la preparación y salida de la carrera y medir su respuesta visual.

# Evaluación de la web 0.8.0

13 de octubre de 2026, Chihuahua; evidencia UTC del 14 de octubre. Alcance: web, análisis global, didáctica, juego entre personas y circuitos. Atractivo, preferencia y audio quedan expresamente fuera de esta intervención. Los paquetes nativos continúan en 0.4.0.

## Resultado de la intervención

La carrera deja de limitarse a desplazamiento horizontal contra NPC. Incorpora tres trazados geométricos, uno cerrado con vuelta de 360°, cámara y minimapa coherentes. «Jugar juntos» añade dos personas en una pantalla y salas privadas de dos a cuatro, con carrera amistosa o cooperación. Todos reciben los mismos ocho hechos, responden desde sus propios controles y deben confirmar la salida; una pausa detiene a todos. La primera llegada no cierra las tareas pendientes, y una desconexión no adjudica victoria.

La revisión didáctica añade representaciones y estrategias a las ayudas y al cierre, mejora las alternativas de cálculo y corrige bandas textuales del informe. Distingue acierto inicial, respuesta sin ayuda y corrección. Los resultados compartidos no se incorporan al expediente individual. El análisis comparativo de 25 dimensiones y sus límites está en [ANALISIS-GLOBAL-WEB-0.8.0.md](ANALISIS-GLOBAL-WEB-0.8.0.md); los detalles de operación están en [MULTIJUGADOR-Y-CIRCUITOS.md](MULTIJUGADOR-Y-CIRCUITOS.md).

## Evidencia funcional

`node-tests.txt` registra 61 pruebas aprobadas: lógica educativa anterior, respaldo, validación, adaptación, modos, geometría, reglas compartidas, empates y persistencia. Se conserva la matriz de NPC de 4.800 configuraciones y 24.000 llegadas; las curvas no modifican sus tiempos. El análisis estructural comprueba 1.600 configuraciones compartidas y 12.800 ejercicios sin repetición exacta dentro de cada recorrido ni alternativas inválidas. El banco de razonamiento conserva 6.630 enunciados, 148 plantillas y 21 etiquetas de familia; son conteos estructurales, no niveles de eficacia o diversidad cognitiva acreditada.

Los registros `individual-chromium.json` e `individual-firefox.json` comprueban preparación, selección de circuito, independencia de nivel e intensidad, error sin avance, corrección, pausa, recarga, conservación de rivales, final offline y movimiento reducido. Se probaron 1280 × 800, 390 × 844, 360 × 640, 320 × 568 y 854 × 480: respuestas visibles, sin desplazamiento horizontal y objetivos táctiles de al menos 44 px. Son viewports de escritorio, no teléfonos físicos. La prueba de ocultación individual utiliza un evento de visibilidad sintético, identificado en los JSON.

`local-chromium.json` y `local-firefox.json` comprueban controles independientes, pistas, errores, pausa común, recuperación tras recargar, teclado, conclusión offline, nueva semilla y cooperación sin clasificación. Las respuestas de ambas personas caben en los cinco viewports. La herramienta de teclado Chromium no admite directamente Ñ en todas las configuraciones; el script declara cuando utiliza un evento sintético para esa tecla. El diseño conserva los botones táctiles como alternativa.

`network-chromium.json` y `network-firefox.json` documentan partidas completas de dos y cuatro participantes, hechos idénticos, corrección remota, pausa conjunta, revancha, resultados idénticos y desconexión que detiene el juego. Cerrar una sala terminada conserva los resultados de los invitados. Se utilizó señalización pública real y canales WebRTC entre contextos de navegador aislados, en un mismo equipo físico. Esto comprueba transporte e integración, pero no conectividad entre redes heterogéneas. `network-boundaries.json` verifica el rechazo de una invitación con llave incorrecta y de un quinto participante sin alterar el grupo admitido.

`other-modes.json` comprueba práctica tranquila completa y avance de razonamiento sin competición. Los recorridos utilizan perfiles de prueba; los datos personales de la instalación del autor no se modificaron. Las pruebas automatizadas no sustituyen observación de uso, accesibilidad asistida completa ni validación docente.

## Rendimiento

Chromium sin ventana visible, viewport 1280 × 800, cinco recorridos y cuarenta respuestas: las primeras tres carreras duraron 63,9–65,1 s y recorrieron los tres circuitos. El p95 entre cuadros fue 16,9–17,2 ms en las cinco carreras; el p95 desde clic hasta el siguiente cuadro con avance actualizado fue 21,5 ms, máximo 22,5 ms. El objetivo instrumental era p95 entre cuadros ≤33,4 ms y respuesta ≤100 ms. Registro completo: `performance-chromium.json`.

La medida es un indicador de actualización visual obtenido con eventos y `requestAnimationFrame`, no latencia física medida con fotodiodo. Depende de este ordenador, navegador y carga. El ensayo corto de Firefox realizado simultáneamente con otras pruebas registró p95 de 50 ms; no se elimina ni se presenta como equivalente al ensayo sostenido. La medición sostenida independiente de Firefox duró 64,7 s en el circuito cerrado: 3.722 cuadros, p95 de 16,68 ms, ocho cuadros superiores a 50 ms y ocho respuestas con p95 de 32 ms. Se registra en `performance-firefox.json` y debe interpretarse por separado.

## Publicación, conservación y recuperación

La versión pública 0.7.0 se preservó antes de sustituirla en `qa-private/public-web-backup-20261014-cycle6/`: ZIP de la rama publicada, 36 archivos descargados por HTTP, comparación SHA-256, manifiesto y `RESTORE.txt`. Los 36 coincidían con la distribución `1a1246e3431640a6612018271178230fc463f92b`. La preparación de actualización deja un perfil sintético con historial no vacío y una carrera de protocolo 3 pendiente, incluido un error, para comprobar la conservación después del despliegue.

El estado efectivo de publicación, los commits, la ejecución Pages, los hashes públicos y la actualización verificada se registran al finalizar en `qa-web-0.8.0/publication.json`. No inferir publicación de la mera existencia de esta documentación. Los recursos offline incluyen los módulos compartidos, la biblioteca local y el arte. Las salas por enlace requieren internet aunque los archivos estén disponibles offline.

## Deficiencias pendientes y juicio de calidad

Sendero incorpora funciones que no se observaron en Grand Prix: dos personas en una pantalla, cooperación, selección de tres trazados y pausa común. La evidencia sustenta esas diferencias concretas, no una superioridad global. Grand Prix conserva una operación pública más madura; Sendero depende de conexión directa y no tiene TURN propio, migración de anfitrión ni recuperación automática de salas tras una desconexión definitiva. La ventana de empate compensa parcialmente incertidumbre temporal, sin garantizar neutralidad absoluta de red ni resistencia frente a un anfitrión manipulado.

Permanecen pendientes revisión docente independiente, prueba con estudiantes, conectividad entre redes distintas, un teléfono físico, validación de las reglas adaptativas y transferencia a tareas externas. La amplitud del banco no demuestra cobertura curricular completa. El atractivo y la preferencia requieren evaluación humana; el audio permanece sin modificar ni analizar en este turno.

Las capturas están en `output/playwright/ciclo-web-6-20261014/`; el visor local en `qa-private/ciclo-web-6-20261014/comparacion.html`. El código de prueba está en `scripts/qa-web-circuit-*.js`, `qa-web-social-*.js`, `audit-game-design.mjs` y `tests/`. Las fuentes externas consultadas tienen URL, copia local y hash en `qa-web-0.8.0/sources.json`.

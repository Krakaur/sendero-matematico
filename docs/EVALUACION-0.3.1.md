# Evaluación técnica de Sendero 0.3.1

## Resultado

La corrección del avance de cálculo y del registro temporal superó 22 pruebas Node, seis pruebas Java y cuatro pruebas instrumentadas en cada una de las API 34, 35 y 36. Compilación y verificación final: [ejecución 35046952836](https://github.com/Krakaur/sendero-matematico/actions/runs/35046952836), fuente Android `2bcbe2e1f8c76577ef5422a682c6d9ae25e788bd`. Lint: cero errores y siete advertencias. La ejecución inicial detectó un conflicto falso de duplicados por representación numérica JSON; se corrigió la igualdad numérica y se repitieron las pruebas. No se publicaron los paquetes de la ejecución fallida.

## Interacción y registro

La prueba web completó ocho operaciones sin botón adicional entre aciertos. Un error mantuvo visible la solución y se corrigió sin sumar un acierto inicial. Una pausa y recarga offline conservaron la sesión e invalidaron el tiempo interrumpido. El resumen de esa secuencia contuvo siete tiempos utilizables, seis aciertos iniciales y una exclusión; la precisión del conjunto completo se conserva separada de la precisión de la muestra temporal.

La prueba con reloj virtual simuló 61 segundos de inactividad, verificó su exclusión de rapidez y comprobó que un doble clic no respondiera la siguiente pregunta. La solicitud de pista también excluyó su ejercicio de rapidez. Las pruebas unitarias verificaron que los errores iniciales aportaran tiempo al denominador, que una corrección de larga duración no cambiara el tiempo inicial y que las tasas se obtuvieran sumando tiempos antes de dividir.

El modo de razonamiento completó una sesión offline conservando su explicación, la corrección, el historial y el problema reservado. Los informes resultantes pasaron la validación estructural y matemática. En Android se verificaron el avance automático, la solución visible, recreación, orientación y texto ampliado, además de perfiles, importación y separación de datos.

## Presentación y distribución

Se inspeccionaron capturas web a 390×844 y 1280×900, ausencia de desbordamiento a 320 píxeles y los controles de cálculo a 320×640. Tras enfocar la nueva operación, las cuatro respuestas quedaron visibles con 67 píxeles de altura. La aplicación Windows empaquetada completó ocho respuestas y mostró sus estadísticas mediante recursos locales, sin errores de página.

La APK ocupa 389 594 bytes. El análisis de paquete confirma ausencia de referencias a WebView, bibliotecas nativas adicionales y permisos solicitados. Los ensayos instrumentados se ejecutaron con Chrome y los proveedores WebView deshabilitados en los emuladores. La actualización comprobada de 0.2.0 a 0.3.1 conservó firma, perfil, contraseña y respuesta pendiente en las tres versiones Android. La firma también coincide con la publicación 0.3.0; no se ejecutó una segunda matriz independiente de actualización desde 0.3.0.

Los tamaños y hashes de APK, AAB y Windows se encuentran en `RELEASE-0.3.1.json`. Las capturas y resultados sintéticos están en `qa-0.3.1/`. No contienen datos de niños. Sus tasas automatizadas no representan desempeño humano.

## Límites

No se realizaron pruebas físicas ni con niños. El flujo de cálculo continúa siendo práctica adaptativa de ocho ejercicios, no una prueba estandarizada de duración fija. La dificultad y la composición de operaciones pueden variar; los resultados deben interpretarse junto con precisión, tamaño de muestra, ayudas y exclusiones. No se verificó la fórmula interna de Arcademics. El análisis y las mejoras metodológicas pendientes se detallan en `ARCADEMICS-FLUIDEZ-Y-MEDICION.md`.

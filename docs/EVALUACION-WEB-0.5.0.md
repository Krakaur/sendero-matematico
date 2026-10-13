# Web 0.5.0: bosque ilustrado y rivales variables

13 de octubre de 2026. Segundo incremento del ciclo web. La publicación está autorizada por el autor, condicionada a respaldar localmente la web actual y comprobar el incremento. La publicación efectiva se registra por separado en `qa-web-0.5.0/publication.json` una vez verificada. Los paquetes Android y Windows permanecen en 0.4.0.

## Comportamiento

La web incorpora la dirección artística elegida en la primera entrega: bosque y río en capas, cuatro personajes, escena persistente, animación y sonido local. Este incremento modifica la competencia. Nube tiene una salida ágil, Rayo alterna impulsos y Chispa concentra más avance hacia la llegada. El remado y la estela representan cambios de esfuerzo. Al ganar posiciones, aparecen un mensaje y un motivo sonoro específico, además del indicador numérico.

Cada carrera nueva guarda una semilla, tres tiempos finales y tres curvas de ritmo. La trayectoria depende sólo del tiempo activo y de esos parámetros. No consulta respuestas futuras ni modifica los rivales para forzar un resultado. El movimiento no acumula incrementos por cuadro: consultar el mismo instante produce la misma posición, con independencia de cuántas actualizaciones se hayan realizado. La suavidad efectiva del navegador exige una medición distinta.

La referencia es la mediana de hasta 24 primeras respuestas elegibles del mismo contenido y nivel, con al menos cinco observaciones; en ausencia de ellas se usan seis segundos. El tiempo central equivale a ocho respuestas y se limita a 24–160 segundos. Cada rival recibe un tiempo entre el 86 % y el 114 % de esa referencia. Se retira el margen previo de 20 % que hacía que sostener la mediana sin errores tendiera a asegurar la victoria. Son parámetros de diseño provisionales, no una calibración educativa validada.

Las curvas normalizadas combinan un término de salida o remate y una oscilación de ritmo; sus derivadas permanecen positivas. Los rivales avanzan continuamente, sin retroceder, y alcanzan exactamente la meta en su tiempo guardado. Los informes y carreras pendientes de protocolo 1 conservan su cálculo lineal anterior. El protocolo 2 sólo se aplica a carreras nuevas. La aritmética, la adaptación de nivel y la definición de las métricas educativas no cambian.

## Evidencia técnica

Las pruebas Node incluyen reproducibilidad después de serializar, avance monótono, límites y llegada exacta, cambios de orden, comparación emparejada de respuestas y compatibilidad con carreras antiguas. El informe reproducible `qa-web-0.5.0/rival-scenarios.json` cubre diez semillas y tres patrones, con 3, 6 y 10 segundos por respuesta: 30 escenarios. Aparecen los seis órdenes posibles de llegada de NPC y 38 cambios de orden durante muestreos de un segundo anteriores a la primera llegada. Este último valor depende de la frecuencia de muestreo; no cuenta todos los cruces continuos posibles. En cada semilla, mejorar el tiempo de respuesta no empeora la posición en los puntos comparados.

Los recorridos del navegador usan perfiles sintéticos. Comprueban ocho retos, un error y recuperación, conservación de la escena, ausencia de cambios de ritmo durante la carrera y disparo de las seis funciones sonoras: salida, acierto, error, recuperación, adelantamiento y llegada. Las preferencias, pausa, recarga offline y cuatro viewports se recogen en `qa-web-0.5.0/browser-verification.json`. La prueba de actualización pública conserva un perfil con una carrera antigua y una corrección pendiente, completa esa carrera y abre una nueva con protocolo 2.

Las grabaciones y los registros extensos están en `output/playwright/ciclo-web-2-20261013/`, excluido del repositorio. El vídeo no contiene pista de audio; la muestra WAV se renderiza por separado con el sintetizador de producción. No se presenta ese conjunto como una captura audiovisual sincronizada.

## Respaldo y restauración

Antes de sustituir la web se preservó localmente `gh-pages` en `qa-private/public-web-backup-20261013-1819/published-branch.zip` y se descargaron los 26 archivos públicos. Todos coincidieron byte a byte con `d344d0c130e86088d65f358261f62f8b62d1b494`. El manifiesto guarda URL, tamaño, SHA-256 y cabeceras de cada archivo. `RESTORE.txt` describe la reposición mediante un nuevo commit de `gh-pages`, sin reescribir historia. Este respaldo corresponde a los recursos de la web; los perfiles permanecen en cada navegador.

## Límites y siguiente revisión

La publicación no equivale a terminar las veinte jornadas ni a aprobar todas las rúbricas. Siguen pendientes la valoración estética y sonora, justicia percibida, prueba física, latencia y cuadros según el protocolo del plan, observación de uso y evaluación infantil. Las simulaciones no acreditan diversión ni aprendizaje. La siguiente revisión debe examinar el arco de la carrera, la llegada y la invitación a repetir, además de escuchar una partida completa en el dispositivo de referencia.

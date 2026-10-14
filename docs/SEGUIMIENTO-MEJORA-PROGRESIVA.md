# Seguimiento de la mejora progresiva

Plan asociado: [PLAN-MEJORA-PROGRESIVA.md](PLAN-MEJORA-PROGRESIVA.md). Preparado el 13 de octubre de 2026. Presupuesto acordado: 20 jornadas de 90 minutos, 30 horas. Estado: quinto incremento web 0.7.0 publicado y comprobado técnicamente; registro de publicación en `qa-web-0.7.0/publication.json`. El autor eligió desarrollar el bosque ilustrado y autorizó la publicación después del siguiente incremento y su respaldo local. Algunas tareas posteriores se adelantaron durante estas entregas; sus números no representan jornadas de 90 minutos ya consumidas.

## Registro del quinto incremento

La instrucción del autor prioriza estética, cromática, complejidad de figuras, velocidad del jugador, entorno y rivales; reserva el análisis sonoro para otro turno. Se renovó el arte con ilustraciones originales, se incorporó cámara con varios planos, se sustituyó el salto CSS del jugador por impulso continuo y se corrigió la calibración de NPC. El análisis comparativo contiene dieciséis factores y distingue observación directa, comprobación lógica y aceptación perceptiva.

Las evidencias de 0.7.0 incluyen 47 pruebas Node, 4.800 configuraciones de competición, 24.000 llegadas simuladas, cinco viewports en Chromium y Firefox, contraste funcional mínimo muestreado de 5,43:1, continuidad offline y regresión de modos alternativos. En tres carreras prolongadas de Chromium el p95 entre cuadros fue 17,0–17,1 ms; cuarenta respuestas dieron p95 de respuesta visual de 20,3 ms. Conservar por separado los registros de arranque y escena estable en Firefox. La rúbrica del autor, preferencia infantil, teléfono físico y sonido no se consideran aprobados por estos resultados. Ver `EVALUACION-WEB-0.7.0.md`.

## Tablero de jornadas

Las fechas se completan al trabajar. Los minutos corresponden al tiempo real, no al presupuesto. Los tokens quedan N/D cuando la herramienta no permite atribuirlos a la jornada. No sustituir ausencia de medida por cero. Estados: pendiente, en curso, candidata, comprobada o aceptada por el autor. «Comprobada» describe la verificación documentada del criterio; no sustituye la aceptación perceptiva.

| Jornada | Entrega principal | Estado | Fecha | Minutos reales | Tokens | Evidencia y resultado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Línea base audiovisual | Parcial | 2026-10-13 | Ver registro de jornada 1 | N/D | Visual y mecánica registradas; escucha de referencia pendiente |
| 2 | Dirección artística | Dirección elegida | 2026-10-13 | Ver registro de jornada 1 | N/D | Bosque ilustrado elegido expresamente por el autor |
| 3 | Primera escena ilustrada | Candidata | 2026-10-13 | Ver registro de jornada 1 | N/D | Paisaje original y cuatro personajes integrados |
| 4 | Primer conjunto sonoro | Candidata | 2026-10-13 | Ver registro de jornada 1 | N/D | Cinco motivos, ambiente y controles; valoración sonora pendiente |
| 5 | Revisión audiovisual inicial | Pendiente | — | — | N/D | Sin valorar |
| 6 | Continuidad de escena | Comprobada | 2026-10-13 | Ver registro de jornada 1 | N/D | Escena y animación conservadas en 7/7 cambios y tras error |
| 7 | Desplazamiento | Parcial | 2026-10-13 | Ver registro de incremento 2 | N/D | Trayectorias continuas según tiempo activo; rendimiento físico pendiente |
| 8 | Identidad y reacciones | Candidata | 2026-10-13 | Ver registro de jornada 1 | N/D | Zorra, conejo, nutria y tortuga; reacción de acierto y recuperación |
| 9 | Entorno animado | Candidata | 2026-10-13 | Ver registro de jornada 1 | N/D | Agua, nubes, estelas y remos animados |
| 10 | Revisión de movimiento y sonido | Pendiente | — | — | N/D | Sin valorar |
| 11 | Modelo de rivales | Comprobada | 2026-10-13 | Ver registro de incremento 2 | N/D | Tres perfiles y 30 escenarios reproducibles |
| 12 | Variación de rivales | Comprobada | 2026-10-13 | Ver registro de incremento 2 | N/D | Seis órdenes finales entre diez semillas; conservación al recargar |
| 13 | Adelantamiento y recuperación | Comprobada | 2026-10-13 | Ver registro de incremento 2 | N/D | Señales visual y sonora; mejorar tiempos no empeora posición emparejada |
| 14 | Carrera completa | Comprobada técnicamente | 2026-10-13 | Ver registro de incremento 4 | N/D | Preparación, salida, desarrollo, llegada y repetición; valoración perceptiva pendiente |
| 15 | Revisión de competencia | Pendiente | — | — | N/D | Sin valorar |
| 16 | Pantalla pequeña y dispositivo | Parcial | 2026-10-13 | Ver registro de incremento 4 | N/D | Cinco viewports en Chrome y Firefox, desde 320 × 568; teléfono físico pendiente |
| 17 | Mezcla y accesibilidad | Parcial | 2026-10-13 | Ver registro de incremento 4 | N/D | Captura PCM de carrera, contraste de preparación y controles; valoración sonora y revisión completa pendientes |
| 18 | Observación de uso | Pendiente | — | — | N/D | Sin observar |
| 19 | Corrección y regresión | Parcial | 2026-10-13 | Ver registro de jornada 1 | N/D | Regresión inicial y recarga offline comprobadas |
| 20 | Pulido y evaluación final | Pendiente | — | — | N/D | Sin valorar |

## Registro de métricas

Identificar cada captura y no mezclar medidas de distintos dispositivos. La rúbrica del autor y la del implementador se guardan por separado. Cuando existan varias personas observadoras, conservar los resultados individuales y el tamaño de la muestra.

| Dimensión o indicador | Línea base | J5 | J10 | J15 | J20 | Meta |
| --- | --- | --- | --- | --- | --- | --- |
| Visual: color / composición / personajes / entorno | NO MEDIDO | — | — | — | — | Cada criterio ≥3/4 |
| Movimiento: continuidad / reacción / posición / expresividad | NO MEDIDO | — | — | — | — | Cada criterio ≥3/4 |
| Sonido: correspondencia / sincronía / timbre / mezcla | NO MEDIDO | — | — | — | — | Cada criterio ≥3/4 |
| Jugabilidad: objetivo / respuesta / competencia / recuperación | NO MEDIDO | — | — | — | — | Cada criterio ≥3/4 |
| Reinicios visuales involuntarios por carrera | NO MEDIDO | — | — | — | — | 0 |
| Intervalo entre cuadros, p95 por captura/dispositivo | NO MEDIDO | — | — | — | — | ≤33,4 ms |
| Respuesta visual, p95 | NO MEDIDO | — | — | — | — | ≤100 ms; n≥30 |
| Señales sonoras comprobadas | NO MEDIDO | — | — | — | — | 6 funciones y rúbrica aprobada |
| Silencio / volúmenes / movimiento reducido | NO MEDIDO | — | — | — | — | Controles comprobados |
| Reproducibilidad / variación / justicia de NPC | NO MEDIDO | — | — | — | — | Escenarios del plan superados |
| Tareas de uso sin ayuda, por persona | NO MEDIDO | — | — | — | — | ≥4/5; inicio y error obligatorios |
| Tiempo hasta primer reto | NO MEDIDO | — | — | — | — | ≤30 s en condiciones definidas |
| Contraste del texto funcional | NO MEDIDO | — | — | — | — | ≥4,5:1 |
| Regresiones educativas, datos y offline | NO MEDIDO | — | — | — | — | 0 detectadas |
| Preferencia infantil y repetición voluntaria | PENDIENTE | — | — | — | — | Evaluación posterior con población destinataria |

## Registro breve por jornada

Al finalizar una jornada, añadir un párrafo con fecha, número, versión inicial y candidata, criterio abordado, cambio realizado, evidencia local, resultado y limitación. A continuación registrar minutos reales, tokens o N/D, decisión y la única siguiente acción que deba iniciarse. No copiar el historial completo de herramientas.

En jornadas de revisión, añadir las puntuaciones por criterio, quién las emitió, escenas que las justifican y decisión: continuar, corregir antes de ampliar o mantener pendiente de valoración. La aceptación del autor se registra sólo cuando existe una manifestación explícita.

## Próxima acción y decisiones pendientes

Próxima acción: valorar el recorrido completo y la comparación visual de 0.7.0, con puntuaciones separadas de composición, materiales, identidad, continuidad del movimiento, control y justicia percibida. Hay vídeo de una carrera completa con error y recuperación y comparación de Grand Prix, Sendero 0.6.0 y 0.7.0. La revisión sonora queda reservada para otro turno por indicación expresa del autor. Continúan pendientes el teléfono físico de referencia y la observación de usuarios destinatarios.

Dirección artística resuelta: desarrollar este bosque ilustrado. Permanecen pendientes las puntuaciones perceptivas por criterio, la revisión de cada hito y la disponibilidad de una persona no familiarizada para observar el uso.

## Historial de cambios del plan

13 de octubre de 2026, registro inicial: establecido un primer ciclo de 20 jornadas de 90 minutos, con arte y sonido desde la primera semana, criterios de aceptación independientes y mediciones inicialmente pendientes. En el momento de establecer el plan todavía no se había ejecutado ninguna jornada.

## Primera jornada: entrega web candidata

13 de octubre de 2026. Se preservó la fuente 0.4.0 antes de modificarla, se completó una carrera privada de Grand Prix y se grabaron recorridos controlados de ocho retos en Sendero antes y después. La entrega incorpora paisaje, personajes, movimiento ambiental, motivos sonoros y conservación de la escena al responder. La elección artística del autor no equivale a aprobación final de todas las rúbricas. Evidencia, resultados y límites: [EVALUACION-CICLO-WEB-1.md](EVALUACION-CICLO-WEB-1.md). Tokens atribuibles a la jornada: N/D. El intervalo de tiempo instrumentado se registra en el manifiesto local; la preparación anterior al primer registro de reloj no fue cronometrada.

## Segundo incremento: competencia y publicación web

13 de octubre de 2026. El autor autorizó el siguiente incremento y la sustitución de la web pública después de respaldarla localmente. Se preservaron los 26 archivos públicos y la rama publicada, todos coincidentes por contenido. Se implementaron rivales con semilla, personalidad de ritmo, señales de adelantamiento y calibración centrada en la mediana previa. Se preservan las carreras antiguas. Las comprobaciones incluyen 35 pruebas Node, 30 escenarios y recorridos del navegador; véase [EVALUACION-WEB-0.5.0.md](EVALUACION-WEB-0.5.0.md). La publicación efectiva y la prueba de conservación de datos están en `qa-web-0.5.0/publication.json`. Tokens: N/D; intervalo instrumentado en el manifiesto local de este incremento. Esta autorización de publicación no sustituye las valoraciones perceptivas pendientes del ciclo.

## Tercer incremento: llegada y repetición

13 de octubre de 2026. Publicada la web 0.5.1 después de respaldar los 29 archivos de 0.5.0. El cierre reúne escena ilustrada y repetición en la primera vista; la posición vertical del botón pasa de 1901,7 a 381,5 píxeles en 1280 × 800. Llegada de 650 ms con guardado previo y alternativa sin movimiento. Pasaron 38 pruebas Node, cuatro viewports, conservación al recargar durante la llegada, repetición offline y actualización pública con historial no vacío y partida pendiente. Los 30 archivos publicados coinciden con Git. Evidencia: [EVALUACION-WEB-0.5.1.md](EVALUACION-WEB-0.5.1.md). Intervalo instrumentado: 24.27 minutos; excluye preparación anterior al primer reloj y cierre documental posterior. Tokens atribuibles: N/D. No se consume convencionalmente una jornada completa de 90 minutos. La siguiente implementación aborda preparación y salida; las rúbricas perceptivas siguen pendientes.

## Cuarto incremento: preparación, salida y verificación del recorrido

13 de octubre de 2026. El autor pidió desarrollar a fondo la siguiente intervención, con el referente competitivo de Arcademics. La web 0.5.1 se respaldó antes de modificarla: ZIP, 30 archivos públicos coincidentes con Git y restauración. La candidata 0.6.0 incorpora muelle ilustrado, presentación de cuatro personajes, movimiento ambiental y parpadeo, reglas breves, cuenta de 2,1 s con sonido y salida directa con movimiento reducido. Esperar, cancelar y volver al perfil conserva la primera respuesta sin tiempo consumido. Se corrigió el doble clic que podía cancelar involuntariamente la salida.

Se aprobaron 42 pruebas Node, recorridos en Chrome y Firefox, cinco viewports, contraste mínimo 5,426:1 en la preparación, alias máximo, controles, offline y modos alternativos. La captura PCM documenta la salida y una carrera completa con error y recuperación. Las tres muestras activas de rendimiento y la actualización pública con historial y partida pendiente se registran en [EVALUACION-WEB-0.6.0.md](EVALUACION-WEB-0.6.0.md) y sus JSON asociados. El registro de este incremento complementa la tabla de métricas; no se rellenan retrospectivamente las rúbricas J5/J10/J15 sin valoración humana.

Tiempo instrumentado y publicación: `qa-web-0.6.0/publication.json`. Tokens atribuibles: N/D. La intervención no equivale convencionalmente a una jornada completa de 90 minutos. La siguiente acción es la revisión audiovisual con puntuaciones por criterio y corrección del defecto dominante. La publicación autorizada y las comprobaciones técnicas no equivalen a una aceptación estética ni demuestran preferencia infantil.

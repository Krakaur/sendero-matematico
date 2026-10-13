# Plan de mejora progresiva de Sendero Matemático

Fecha: 13 de octubre de 2026. Dedicación acordada: 90 minutos por jornada. Primer ciclo: 20 jornadas, 30 horas. Estado: cuarto incremento web 0.6.0 comprobado técnicamente; publicación y conservación de datos registradas en `qa-web-0.6.0/publication.json`. Preparación, salida, llegada y repetición implementadas. La aceptación perceptiva y las metas restantes siguen pendientes. Fuente de partida inspeccionada: `76c3cb3b20676047fff1b56054cd451af43e1115`, versión 0.4.0.

## Propósito y resultado esperado

Convertir la carrera de multiplicación en una experiencia con identidad gráfica, movimiento expresivo, retroalimentación sonora y competencia comprensible contra tres rivales virtuales. El resultado del primer ciclo será una carrera completa candidata a evaluación: entrada, preparación, desarrollo, error y recuperación, llegada y repetición. El referente es la experiencia dentro de [Grand Prix Multiplication](https://www.arcademics.com/games/grand-prix), no la página que lo aloja.

El horizonte de 30 horas organiza el trabajo; no garantiza equivalencia con Arcademics. La aprobación dependerá de evidencias y valoración humana. Veinte jornadas equivalen a cuatro semanas si se trabajan cinco jornadas semanales. No se fija una fecha final ni se programa una ejecución automática.

La primera entrega se concentrará en la regata de multiplicación web, en escritorio y navegador móvil. Mantener el río y los personajes de Sendero permite mejorar una identidad propia. Por decisión del autor del 13 de octubre, este ciclo se desarrolla exclusivamente por la vía web. La APK de Android y los paquetes de escritorio quedan fuera de la ejecución actual. La expansión a otras operaciones y modalidades seguirá a la aceptación de esta experiencia completa.

## Diagnóstico de partida y límites de la comparación

La aplicación ya tiene carrera de cuatro participantes, perfiles, funcionamiento sin conexión, adaptación y tonos básicos de respuesta. El problema no se reduce a añadir esas funciones de nuevo: requiere mejorar cómo se perciben y cómo se articulan durante una partida.

En `web/race.js`, el avance del jugador se deriva de retos completados entre ocho y los rivales usan tiempos finales con multiplicadores fijos. Para una misma carrera, sus ritmos mantienen un orden relativo fijo antes de llegar. Los cuatro personajes comparten el mismo dibujo con cambios de color. En `web/app.js`, el cambio de pregunta vuelve a renderizar el contenido principal. Estos hechos justifican revisar identidad de personajes, variedad competitiva y continuidad de escena; por sí solos no cuantifican atractivo ni demuestran un defecto perceptivo concreto.

La inspección anterior de Arcademics incluyó recursos del cliente y pantallas previas a la carrera. No produjo una evaluación audiovisual completa de una partida. La jornada 1 debe obtener esa referencia. Si el juego no es accesible, se registrará la limitación: el trabajo con Sendero puede continuar, pero la comparación con Grand Prix permanecerá pendiente.

El marco MDA distingue implementación, comportamiento durante el juego y experiencia emocional. Aquí se conservará esa distinción, pero arte visual y sonido tendrán criterios explícitos separados para evitar que las verificaciones de código sustituyan su evaluación. La acepción de «estética» en MDA es más amplia que la belleza gráfica. Fuente: Hunicke, LeBlanc y Zubek, [MDA](https://users.cs.northwestern.edu/~hunicke/MDA.pdf), páginas internas 2–3.

## Objetivos y metas de aceptación

| Dimensión | Objetivo al finalizar el ciclo | Evidencia exigida |
| --- | --- | --- |
| Arte y color | Composición coherente, personajes reconocibles y entorno con profundidad; alcanzar al menos 3/4 en cada criterio visual | Escenas de inicio, carrera y llegada al tamaño real; valoración del autor y observaciones concretas |
| Movimiento | Escena persistente, avance legible y reacciones vinculadas a acontecimientos | Vídeo continuo de ocho retos, incluyendo error, acierto, adelantamiento y llegada |
| Sonido | Identidad sonora coherente, acciones distinguibles y mezcla tolerable durante una partida completa | Captura con audio, escucha en altavoces y auriculares, valoración separada y controles comprobados |
| Competencia | Tres rivales diferenciados, variación entre carreras y resultados sensibles al desempeño | Trazas reproducibles de escenarios y observación de partidas completas |
| Uso y comprensión | Entender cómo empezar, quién es el jugador, su posición, cómo corregir un error y cómo repetir | Cinco tareas observadas sin instrucciones adicionales; registrar ayuda y tiempo |
| Integridad educativa | Conservar corrección, adaptación entre carreras y significado de las métricas educativas | Pruebas de regresión pertinentes y revisión de registros sintéticos |
| Coste | Una mejora acotada por jornada, dentro de 90 minutos, con contexto reutilizable | Tiempo real, evidencia breve, decisión siguiente y consumo de tokens si está disponible |

Las metas numéricas de este plan son criterios de proyecto propuestos. No son resultados ya obtenidos, umbrales clínicos ni pruebas de eficacia educativa. Los indicadores sin evidencia se registran como «NO MEDIDO», nunca como cero por ausencia de datos. Las comprobaciones de la primera candidata se detallan en EVALUACION-CICLO-WEB-1.md; no sustituyen las puntuaciones perceptivas del autor.

## Secuencia de 20 jornadas

Cada jornada tiene un resultado principal. Si no cabe en 90 minutos, se divide y se reprograma explícitamente; no se elimina la revisión visual o sonora para conservar la fecha.

| Jornada | Trabajo principal | Entrega y comprobación |
| --- | --- | --- |
| 1 | Establecer la línea base audiovisual | Una partida completa de Sendero con perfil sintético y, si es accesible, una de Grand Prix; mismas condiciones de captura, inventario de diferencias y tres prioridades observables |
| 2 | Elegir dirección artística | Dos pequeñas propuestas de una misma escena, con paleta, personaje y jerarquía; selección del autor al tamaño de uso. Si la selección queda pendiente, avanzar sólo trabajo independiente |
| 3 | Integrar la primera escena ilustrada | Un escenario de regata con fondo, plano de acción y primer plano, más un protagonista reconocible; comprobar que operación y respuestas conservan legibilidad |
| 4 | Integrar el primer conjunto sonoro | Sonidos coherentes para salida, acierto, error y llegada, con control de silencio; probarlos durante una carrera, no como archivos aislados |
| 5 | Primera revisión y corrección | Comparación audiovisual con la línea base; corregir el defecto dominante y registrar puntuaciones visuales y sonoras iniciales |
| 6 | Mantener continuidad de escena | Separar actualización de pregunta y escena de carrera; comprobar ocho cambios de reto sin reinicio visual de personajes o efectos |
| 7 | Mejorar el desplazamiento | Movimiento interpolado según tiempo y respuesta, con salida y llegada legibles; verificar que velocidad y desplazamiento no dependan de la tasa de cuadros |
| 8 | Diferenciar personajes y reacciones | Protagonista y tres rivales identificables por silueta o rasgo, además del color; reacciones pequeñas de acierto, esfuerzo y recuperación |
| 9 | Dar vida al entorno | Un sistema acotado de movimiento ambiental y estela, sincronizado con la acción; incorporar o ajustar un ambiente sonoro discreto |
| 10 | Segunda revisión y corrección | Carrera completa con escena estable; revisar atractivo, claridad del movimiento, sonido y fatiga, y corregir el problema de mayor impacto |
| 11 | Definir el comportamiento de rivales | Tabla de tres personalidades y límites de ritmo; escenarios reproducibles de jugador lento, medio y rápido, sin alterar retrospectivamente la calibración educativa |
| 12 | Implementar variación de rivales | Ritmos variables con semilla reproducible y orden de llegada no fijado permanentemente; guardar trazas por escenario |
| 13 | Afinar adelantamientos y recuperación | Ajustar curvas de ritmo y retroalimentación de posición; comprobar que mejorar las respuestas mejora el resultado bajo la misma semilla |
| 14 | Completar el arco de la carrera | Preparación breve, salida, desarrollo, llegada y repetición; integrar señales de adelantamiento y recuperación sin sobrecargar el cálculo |
| 15 | Tercera revisión y corrección | Revisar justicia percibida, tensión y comprensión en carreras completas; corregir el defecto dominante y actualizar las rúbricas |
| 16 | Ajustar uso en pantalla pequeña | Comprobar un escritorio y un teléfono físico identificados; operación, respuestas y posición accesibles sin desplazamientos que interrumpan la tarea |
| 17 | Afinar mezcla y accesibilidad | Volúmenes de música/ambiente y efectos, silencio persistente y movimiento reducido; verificar contraste del texto funcional y señales que no dependan sólo del sonido o color |
| 18 | Observar comprensión de uso | Autor y, si está disponible, una persona no familiarizada realizan las cinco tareas; registrar incidencias y priorizar las que impiden jugar |
| 19 | Reserva para corregir y verificar | Resolver el problema principal de la observación; ejecutar comprobaciones pertinentes de lógica, datos, funcionamiento offline y conservación de la partida web |
| 20 | Reserva para pulido y evaluación final | Comparación con la versión inicial, puntuación por dimensión, incidencias pendientes y decisión de aceptar o prolongar el ciclo |

Las jornadas 5, 10, 15, 19 y 20 contienen tiempo de corrección. Si una revisión revela una deficiencia importante, consume esa reserva o desplaza alcance posterior. No se acumulan correcciones indefinidamente para una supuesta fase final de embellecimiento.

## Rúbricas de calidad perceptiva

El autor valora cada criterio con el mismo anclaje: 0 = ausente o impide la experiencia; 1 = provisional o incoherente; 2 = coherente, pero con defectos claramente perceptibles; 3 = consistente, claro y expresivo en la partida completa; 4 = pulido también en situaciones exigentes, sin defectos relevantes detectados. «NO MEDIDO» es una categoría distinta. Una puntuación exige señalar una escena o instante que la justifique.

| Rúbrica | Criterios que se puntúan de forma independiente | Meta final |
| --- | --- | --- |
| Visual | Armonía cromática; composición y jerarquía; identidad y expresión de personajes; profundidad y detalle del entorno | Cada criterio ≥3/4 |
| Movimiento | Continuidad; relación entre acción y reacción; legibilidad de posición; expresividad sin distracción | Cada criterio ≥3/4 |
| Sonido | Correspondencia entre evento y sonido; sincronía perceptiva; coherencia tímbrica; mezcla y ausencia de fatiga relevante | Cada criterio ≥3/4 |
| Jugabilidad | Claridad del objetivo; sensación de respuesta; competencia comprensible; recuperación tras error | Cada criterio ≥3/4 |

No se calculará un promedio global para aprobar. Un 4 en rendimiento no compensa un 1 en arte o sonido. La autoevaluación de quien implementa se registra aparte de la evaluación del autor y no la reemplaza. Si falta esta última, el resultado sigue siendo candidato.

La comparación final utilizará escenas equivalentes de la versión inicial y la candidata, con el mismo dispositivo, tamaño y volumen. Se valorarán ambos materiales por separado antes de expresar preferencia. Se espera una mejora de al menos un punto en cada criterio inicialmente inferior a 3, además de alcanzar la meta final. Los criterios ya satisfactorios deben conservarse. Para Arcademics se compararán los mismos tipos de evento, sin interpretar posiciones o tiempos de juegos diferentes como resultados educativos equivalentes.

## Métricas operativas y protocolo de medida

| Indicador | Meta propuesta | Cómo medir y límite de interpretación |
| --- | --- | --- |
| Continuidad de escena | Cero reinicios visibles involuntarios durante los ocho retos | Captura completa más comprobación de persistencia de la escena; pasar una prueba de estructura no demuestra calidad de animación |
| Intervalo entre cuadros | Percentil 95 ≤33,4 ms en cada una de tres capturas activas de 60 s por dispositivo de referencia | Medir intervalos de cuadros con la pestaña visible, anotar equipo, navegador, versión y viewport; no confundir con FPS garantizados ni ocultar pausas largas |
| Respuesta visual | Percentil 95 ≤100 ms desde el evento de entrada hasta la primera confirmación visual en al menos 30 respuestas sintéticas | Instrumentación del navegador; no equivale a latencia física de pantalla o de audio. Sin instrumento adecuado queda NO MEDIDO |
| Cobertura sonora | Salida, acierto, error, adelantamiento, recuperación y llegada tienen una señal apropiada | Matriz de seis funciones; pueden reutilizar motivos. Contar sonidos no mide su calidad: también deben superar la rúbrica |
| Control sensorial | Silencio persistente, control separado de efectos y ambiente/música, y reducción de movimiento | Activar, salir y volver; completar una carrera sin audio y otra con movimiento reducido, conservando la información necesaria |
| Competencia reproducible | Misma semilla y mismas entradas producen el mismo resultado | Simulación determinista; diez semillas por cada patrón de respuesta lento, medio y rápido |
| Variación y justicia | Al menos dos órdenes de llegada de NPC entre las diez semillas y ausencia de ventaja arbitraria contra entradas mejores | Comparar trazas emparejadas por semilla; una mejora del patrón del jugador no debe empeorar su resultado. La percepción de justicia requiere además valoración humana |
| Comprensión | Completar al menos cuatro de cinco tareas sin ayuda; empezar y corregir un error son obligatorias | Tareas: iniciar, identificar personaje, interpretar posición, recuperarse de error y repetir. Registrar éxito, ayuda y tiempo por persona; informar n y no convertir muestras pequeñas en porcentajes poblacionales |
| Inicio accesible | Llegar al primer reto en ≤30 s desde la pantalla preparada de selección | Excluir descarga inicial y creación de perfil de esta medida, registrándolas aparte si se observan; meta provisional, no estándar universal |
| Legibilidad | Texto funcional de operación, respuestas y controles con contraste ≥4,5:1 | Medir colores efectivos en estados normal, foco, acierto y error; esta comprobación aislada no acredita conformidad completa con WCAG |
| Integridad de datos | Cero regresiones detectadas en corrección, primera respuesta, pistas, interrupciones, adaptación y conservación del perfil | Ejecutar las pruebas afectadas y un recorrido con datos sintéticos; los puntos de carrera permanecen separados de precisión y rapidez educativas |
| Tiempo y tokens | ≤90 min por jornada; consumo registrado cuando sea observable | Registrar minutos reales y tokens informados por la herramienta. Si no se dispone de contabilidad por jornada, anotar N/D, sin estimarlos a partir de caracteres |

El contraste de 4,5:1 procede del criterio de texto normal de [WCAG 2.2, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Las decisiones de control de audio y movimiento toman como referencias [control de audio](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) y [animación por interacciones](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html); este último es un criterio AAA. El proyecto adopta controles de comodidad propios sin afirmar una certificación global de accesibilidad.

El atractivo infantil y el deseo de volver a jugar no quedan validados mediante revisión adulta. Tras superar el ciclo, una prueba formativa con niños, preparada por separado con autorización de sus responsables, permitirá observar comprensión, preferencia y repetición voluntaria. Hasta entonces, esos resultados se marcarán «PENDIENTES DE EVALUACIÓN CON POBLACIÓN DESTINATARIA». No se activa recogida para investigación ni se infiere aprendizaje a partir de satisfacción, rapidez o victorias.

## Organización de los 90 minutos

| Bloque | Minutos | Resultado |
| --- | --- | --- |
| Recuperar contexto y elegir criterio | 10 | Leer la última fila del seguimiento y reproducir el defecto concreto |
| Producir una mejora | 50 | Un cambio acotado de arte, sonido, interacción o comportamiento |
| Jugar y comprobar | 20 | Recorrido pertinente, evidencia antes/después y resultado del criterio |
| Cerrar y preparar continuidad | 10 | Registrar resultado, tiempo, limitación y siguiente acción precisa |

En jornadas de revisión puede redistribuirse el tiempo, conservando el límite de 90 minutos y un cierre documentado. Se mantiene una sola tarea en curso y un máximo de tres acciones siguientes priorizadas. La prioridad responde al defecto observado que más limita la experiencia, con preferencia por recuperar dimensiones que no alcanzan su umbral.

La implementación corresponde al asistente durante jornadas activadas; la selección artística y la aceptación perceptiva corresponden al autor. Una persona observadora puede contribuir a la prueba de uso. Si falta una valoración necesaria, se continúa trabajo independiente y se mantiene pendiente la decisión; el silencio no se interpreta como aceptación.

## Control del coste y continuidad

REA permanece como herramienta local bajo demanda, sin servidor MCP cargado de forma permanente. Se empleará para una pregunta técnica delimitada cuando la lectura de un fragmento no sea suficiente. El análisis anterior del cliente completo de Grand Prix agotó memoria en la fase semántica; no debe repetirse diariamente ni tratarse como análisis completo satisfactorio. La referencia reutilizable será el extracto pertinente y su conclusión acotada.

Cada jornada recuperará el plan, la última entrada del seguimiento y sólo los archivos afectados. Las capturas se limitarán a los estados que permitan decidir; el vídeo completo se reservará para la línea base y los hitos. Los recursos artísticos y sonoros tendrán autoría o licencia registrada y se reutilizarán entre estados cuando tenga sentido. No se copiarán gráficos, sonidos ni código de Arcademics. La generación de recursos, cuando proceda, partirá de la dirección artística elegida, con lotes pequeños.

El límite de tokens no puede fijarse de forma fiable antes de observar las primeras cinco jornadas y conocer la contabilidad disponible. En la jornada 5 se revisarán consumo, tiempo y mejoras aceptadas. Se reducirá contexto repetido y análisis redundante antes de recortar arte, sonido o comprobación perceptiva. Los créditos de servicios de generación, si se utilizan, se registrarán aparte de los tokens del asistente.

## Decisiones de avance

En la jornada 5 se decide si la dirección visual y sonora merece desarrollarse. En la 10 se exige una escena estable con movimiento y retroalimentación perceptibles. En la 15 se revisa una carrera completa con competencia comprensible. En la 20 se aplican todas las metas finales.

Cada revisión termina en una de tres decisiones: continuar, corregir antes de ampliar o mantener como candidata pendiente de valoración. Una entrega sólo se acepta cuando supera las comprobaciones pertinentes y la revisión humana que le corresponde. La aceptación de este ciclo no equivale a publicación, paridad con Android ni eficacia educativa demostrada.

Si el ciclo no supera sus criterios, se asignan las siguientes jornadas al criterio fallido con mayor impacto y se registra la nueva estimación. Si los supera, se propone un segundo ciclo de mejora web y evaluación con la población destinataria. Cualquier reanudación del trabajo en APK o paquetes nativos dependerá de una decisión posterior del autor.

El registro operativo es [SEGUIMIENTO-MEJORA-PROGRESIVA.md](SEGUIMIENTO-MEJORA-PROGRESIVA.md). Este plan complementa el estado publicado recogido en [HANDOFF.md](HANDOFF.md), sin reemplazarlo por funciones todavía previstas.

## Fuentes y trazabilidad

Las fuentes externas utilizadas son el juego de referencia, el artículo MDA y los tres documentos de W3C enlazados junto a sus afirmaciones. El artículo se inspeccionó como PDF completo de cinco páginas; los documentos W3C como copias HTML. Las copias locales de estos cuatro documentos y su relación URL, archivo, versión y SHA-256 están en `qa-private/plan-mejora-20261013/sources-manifest.json`, con fecha de consulta 13 de octubre de 2026. Este directorio de evidencia local está excluido del control de versiones; los enlaces públicos permanecen disponibles en el plan.

La evidencia nueva de partidas debe identificar versión o commit, dispositivo, navegador, viewport, condiciones de sonido, fecha, persona evaluadora y carácter real o sintético de los datos. Las puntuaciones siempre conservarán su observación justificativa y no se trasladarán automáticamente a una versión posterior.

# Banco de situaciones y aprendizaje — 0.3.0

## Alcance y estado editorial

Esta versión incorpora 6 270 enunciados distintos, procedentes de 128 situaciones originales y 16 familias matemáticas. Hay 4 696 ejercicios de práctica y 1 574 reservados. Las cantidades se generan durante la construcción con restricciones y semilla fija. La aplicación utiliza el banco terminado; no contiene ni descarga modelos de IA, no consulta servicios generativos y no requiere internet para seleccionar actividades.

Las situaciones fueron elaboradas con asistencia de IA durante el desarrollo y revisadas internamente en su redacción, aritmética y coherencia. Se examinó el conjunto de 128 situaciones fuente; las comprobaciones automáticas recorren todas las variantes. Esta revisión no sustituye una revisión independiente de especialistas, un pilotaje con niños ni la validación psicométrica. No hay aval de la SEP.

El objetivo es apoyar a niños de aproximadamente 5–10 años con extensión opcional. Los cuatro niveles son bandas internas de dificultad, no equivalencias certificadas con edad o grado. En niños que aún no leen se necesita acompañamiento para leer el enunciado sin indicar la operación. Esta edición no incluye narración de voz ni todas las representaciones gráficas que necesitaría un recurso autónomo para prelectores.

## Dos trayectorias

Los caminos de sumas, restas, multiplicación hasta el 10, tablas ampliadas hasta el 20 y razonamiento conservan estados de dificultad diferentes. En tablas ampliadas los máximos de factores son 10, 12, 15 y 20; ambos factores incluyen el 1. Es una extensión optativa.

La práctica de cálculo registra cada pareja de operandos por camino. Después de un error o pista, programa revisión a partir de dos ejercicios posteriores; los aciertos independientes desplazan la revisión a 5, 10, 20, 35 y 60 ejercicios. Cuando hay revisiones vencidas del nivel actual, existe una probabilidad de 0,65 de elegir la más antigua; por ello esos intervalos son mínimos y no fechas garantizadas. Se intercalan preguntas nuevas. El tiempo no decide la dificultad.

La dificultad de cálculo sube tras tres respuestas iniciales correctas sin pista; en razonamiento se requieren seis. Dos actividades consecutivas con apoyo reducen un nivel. Son reglas de navegación del prototipo, no umbrales empíricos de dominio. El contenido de distintas familias puede tener dificultades diferentes aun dentro de la misma banda.

## Diversidad y repetición

Cada problema tiene identificador, situación fuente, familia, contexto, dimensión, nivel, solución, explicación y opciones. Se selecciona sin reemplazo dentro de cada combinación de nivel y conjunto. Se favorece una situación fuente diferente de las ocho recientes, un contexto distinto de los cuatro recientes y una familia distinta de las dos recientes, en ese orden de prioridad. Estas preferencias ceden cuando no hay alternativas; no prometen novedad indefinida.

El historial se conserva por perfil Android o por instalación web. Al agotar un conjunto comienza otro ciclo y los ejercicios dejan de marcarse como nuevos. La cantidad total del banco no equivale a su cantidad de estructuras: muchas entradas son variaciones controladas de una misma situación. La repetición de vocabulario matemático accesible es deliberada.

La última actividad de cada camino de razonamiento utiliza un conjunto de situaciones fuente reservado, separado de las seis situaciones de práctica de cada familia. No se reutilizan esas redacciones en la práctica ordinaria. Se muestran como retos nuevos mientras no se haya agotado el conjunto. Las pistas siguen disponibles y se registran; una respuesta con pista o error no cuenta como resolución independiente. Esta reserva permite observar desempeño ante situaciones no practicadas, pero no constituye una prueba validada de transferencia: no se garantiza equivalencia de dificultad entre familias.

## Cobertura curricular explícita

El banco se vincula con contenidos de Saberes y Pensamiento Científico; no reproduce problemas oficiales. Referencias: [programa de Fase 3, p. 45](https://educacionbasica.sep.gob.mx/wp-content/uploads/2025/Plan_y_programas_de_estudio_2025/WEB%20FASE%203-2025.pdf#page=47), [Fase 4, p. 50](https://educacionbasica.sep.gob.mx/wp-content/uploads/2025/Plan_y_programas_de_estudio_2025/WEB%20FASE%204-2025.pdf#page=52) y [Fase 5, pp. 49–51](https://educacionbasica.sep.gob.mx/wp-content/uploads/2025/Plan_y_programas_de_estudio_2025/WEB%20FASE%205-2025.pdf#page=51).

Reunir, quitar, completar y comparar ejercitan relaciones aditivas, incógnitas y diferencias. Grupos, reparto y agrupamiento trabajan relaciones multiplicativas y división exacta. Dos pasos requiere combinar acciones; representar pide elegir una expresión. Perímetro y área distinguen borde y superficie en rectángulos. Fracción trabaja una parte de un reparto equitativo; tiempo usa duraciones enteras en el mismo día. Datos pide seleccionar categorías; patrones usa incrementos constantes y dato faltante pide reconocer información insuficiente.

La cobertura es parcial. Quedan fuera, entre otros, cálculo decimal, operaciones generales con fracciones, porcentajes y proporcionalidad sistemática, geometría tridimensional, construcción geométrica, conversiones amplias de unidades, gráficos interactivos y argumentación abierta. Tampoco se ha realizado una correspondencia exhaustiva entre cada actividad y todos los procesos de desarrollo de aprendizaje por grado. No debe publicitarse como currículo SEP completo.

## Evaluación y exportación

Los informes conservan la primera respuesta, los intentos, pistas, solución mostrada y tiempo de interacción. Razonamiento añade barras por dimensión y una barra para las situaciones reservadas nuevas. Las dimensiones describen las tareas, no facultades generales validadas. La app no observa ayudas externas, explicaciones orales ni cooperación presencial; una respuesta sin pista del software no demuestra autonomía fuera del dispositivo.

El formato nuevo es `sendero.report.v2`; se siguen importando informes v1. Los problemas del banco se contrastan con el contenido original al importar, incluidas soluciones y opciones. Esta comprobación detecta inconsistencias, pero no acredita autoría de respuestas, identidad o autenticidad del expediente. Los receptores anteriores a 0.3.0 deben actualizarse para abrir v2. JSON conserva los problemas completos y CSV incluye actividad, versión del banco, dimensión, reserva, enunciado y explicación.

Android mantiene sus ocho perfiles y contraseñas locales. Web y Windows conservan el modelo previo de un perfil por instalación; no se han añadido contraseñas a esas ediciones. La copia de informes sigue siendo manual; no hay recogida de datos para investigación ni sincronización automática.

## Construcción y ampliación

`python scripts/build-bank.py` reconstruye determinísticamente el banco a partir de las situaciones completas en ese archivo. Produce la base SQLite de lectura y el módulo de datos web, además de `BANK-MANIFEST.json` con cantidades y hash. `npm test` verifica todo el banco y el comportamiento de selección. Las pruebas Android usan la misma base incluida en el paquete.

La base de contenido está separada de la base de perfiles. Android consulta SQLite por nivel y conjunto, leyendo el texto elegido en lugar de cargar todos los problemas en memoria. El tamaño instalado incluye la copia de esa base, además del paquete. La web carga un módulo de texto de unos pocos megabytes y lo guarda en su caché sin conexión.

Para ampliar el banco se revisan nuevas situaciones, se asigna una versión nueva, se preservan los identificadores de contenido anterior y se añaden verificaciones y soporte de importación para versiones conservadas. La distribución actual es mediante actualización de la app o del sitio, no mediante paquetes arbitrarios importables por niños. Las versiones publicadas de un banco deben permanecer inmutables; las revisiones candidatas previas a publicación no se distribuyen como versiones finales.

## Hallazgos de la revisión interna

Se eliminó una coincidencia sistemática entre la categoría irrelevante y la solución en la familia de datos. Se diversificó la selección de expresiones para que esa familia no consistiera únicamente en elegir suma. Se añadió preferencia por contextos diferentes, además de redacciones diferentes. Se separaron las repeticiones después del agotamiento de los retos todavía nuevos. Son correcciones de diseño; no sustituyen la observación de estrategias reales de niños.

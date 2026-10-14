# Grand Prix y Sendero: arte, movimiento y competencia

13 de octubre de 2026, Chihuahua. Comparación del juego Grand Prix Multiplication ejecutado dentro de su contenedor, Sendero web 0.6.0 y candidata 0.7.0. La revisión sonora queda expresamente fuera de esta intervención.

## Qué se observó y qué puede concluirse

Se inspeccionó el juego de [Grand Prix Multiplication](https://www.arcademics.com/games/grand-prix), incluidos preparación, salida, respuesta incorrecta, aceleración, cambio de orientación del circuito y resultados. Se utilizaron partidas privadas con oponentes identificados por la interfaz como Computer; no se interactuó con personas desconocidas. Se conservaron capturas y vídeo de la ejecución. No se extrajo ni reprodujo su código, sus imágenes ni sus personajes.

Una partida privada terminó mostrando 48,40 s para el participante automatizado y 52,30, 52,70 y 56,93 s para los tres oponentes; la interfaz indicó 98 % de precisión y 68 respuestas/min. Es un caso observado, con una respuesta errónea deliberada, no una estimación de dificultad infantil ni una identificación del algoritmo de los NPC. El último intento de pulsar una respuesta ocurrió después de que aparecieran los resultados y produjo un error de automatización; el estado final se recuperó por separado. No se presentan los registros incompletos de ese controlador como una traza completa de respuestas.

La línea base local de Sendero se copió antes de intervenir: web 0.6.0, despliegue `176cd61ae9ba4dee65a2aafe198d5fdb2decc32a`. La comparación de imágenes corresponde a estados distintos de partida: sirve para revisar composición y representación, no para equiparar tiempos ni rendimiento educativo.

Tampoco se equipararon los rangos de operaciones. Sendero limita los factores de Multiplicación a 3, 5, 8 y 10 según el nivel; Tablas ampliadas utiliza límites de 10, 12, 15 y 20. En Grand Prix se observaron productos fuera del primer nivel de Sendero. Comparar directamente sus segundos de carrera o respuestas por minuto, sin controlar los ejercicios, sería metodológicamente incorrecto.

La conclusión principal es que Sendero tenía una dirección cromática coherente, pero la ejecución seguía pareciéndose a una ficha con indicadores de avance. Grand Prix comunica mejor la acción de competir mediante vehículos claramente separados del fondo, movimiento relativo y continuidad del circuito. Su escenario observado utiliza formas bastante sencillas; atribuir toda su ventaja a una supuesta complejidad gráfica superior sería inexacto. La articulación entre imágenes y acción explica una parte importante de la diferencia.

## Deficiencias y decisiones de implementación

| Factor | Grand Prix observado | Sendero 0.6.0: deficiencia concreta | Sendero 0.7.0: intervención |
| --- | --- | --- | --- |
| Cromática y jerarquía | Vehículos saturados sobre pista gris; operación blanca sobre negro; respuestas azules | Muchos planos verdes, crema y turquesa de peso parecido; poca diferenciación material | Bosque esmeralda y río turquesa; interfaz crema de alto contraste; Luma y respuestas cálidas. El detalle se concentra en la escena, no detrás de los números |
| Volumen y materiales | Carrocerías con luces, neumáticos y sombras; retrato expresivo | Figuras construidas con pocas superficies planas; agua, madera y vegetación poco diferenciadas | Personajes originales con pelaje, caparazón, tela, madera y sombreado; paisaje con roca, vegetación, reflejos y luz dirigida |
| Identidad de competidores | Cuatro colores muy reconocibles; silueta de vehículo compartida | Animales diferentes, pero pequeños y de construcción facial semejante | Zorra, conejo, nutria y tortuga diferenciados por silueta, material, accesorio y color; nombres persistentes |
| Composición del juego | Campo de acción dominante; consola matemática compacta | Escritorio dividido en dos columnas; escena semejante a una tabla de posiciones | Escenario panorámico dominante y consola inferior con cuatro respuestas en una fila; controles adaptados a cinco tamaños |
| Profundidad | Vehículos sobre pista y elementos periféricos; lectura espacial clara | Planos ilustrados, pero prácticamente inmóviles respecto del avance | Paisaje desplazable, agua con reflejos móviles y primer plano a distinta velocidad; sombras y estelas |
| Respuesta del jugador | Acierto ligado al avance del vehículo y a la marcha del escenario | Salto de una octava parte del recorrido con transición CSS de 0,52 s; posterior detención | Impulso con aceleración y desaceleración continuas, conservación de velocidad y cámara que acompaña a Luma |
| Tiempo y movimiento | Continuidad de marcha perceptible | Player interpolado por CSS y NPC actualizados cada 120 ms con sistemas distintos | Proyección común del mundo y actualización visual por requestAnimationFrame; dinámica del impulso independiente de 30, 60 o 120 cuadros/s |
| Lectura de posición | Desplazamiento relativo y pequeño mapa del circuito | Posición y progreso claros, pero con apariencia de barras | Posición conforme a los barcos representados, minimapa de los cuatro participantes y flechas cuando un rival queda fuera del encuadre |
| Variedad del recorrido | Cambios reales de orientación y curvas | Un mismo panel de agua para toda la prueba | Cámara, tres referencias de recorrido y panorama continuo. No se implementa todavía un circuito con curvas físicas; aquí Grand Prix conserva una ventaja |
| Equilibrio inicial | En el caso observado fue posible ganar; el algoritmo interno es desconocido | Base de 6 s por pregunta para todos los niveles; tres tiempos de llegada entre 0,86 y 1,14 veces la referencia | Referencias iniciales explícitas por nivel y tres intensidades competitivas seleccionables antes de salir |
| Calibración individual | No puede inferirse de dos partidas | Podían entrar tiempos de primera respuesta rápida aunque fuese incorrecta; límite total de 160 s | Se utiliza tiempo activo hasta resolver correctamente, incluida la corrección; se excluyen ayudas e interrupciones; margen hasta 120 s por pregunta |
| Autonomía | Elección y entrada a partida; competición social disponible | Nivel matemático y velocidad de rivales poco distinguibles para quien juega | Paseo, Carrera y Desafío modifican solo la competencia; la operación, el nivel y las preguntas permanecen intactos |
| Error y recuperación | En el episodio observado se mostró la respuesta correcta y desaparecieron alternativas | La explicación pedagógica ya existía; respuesta escénica limitada | Se conserva la explicación, se destaca la corrección y se añaden reacción visible y salpicadura al recuperar; no se resta distancia ya ganada |
| Meta y reconocimiento | Resultado de carrera, precisión y ritmo | Salida y llegada ya implementadas, pero con ilustración básica | Nuevo arte en preparación, desarrollo y cierre; avance en ocho hitos y resultados educativos separados del reconocimiento de juego |
| Accesibilidad y continuidad | No se realizó auditoría completa del referente | Había controles y persistencia que debían conservarse | Respuestas táctiles comprobadas, teclado, movimiento reducido, pausa, recarga, perfiles y arte disponible offline |
| Dimensión social | La interfaz permite partidas públicas y privadas | Solo competidores simulados | Se mantiene la competición con NPC. No se atribuye a Sendero la experiencia social de un multijugador humano |

## Por qué estas decisiones responden al diseño de videojuegos

El marco MDA distingue reglas y datos, comportamiento durante la interacción y experiencia producida en el jugador. También relaciona el interés competitivo con adversarios, condiciones de victoria claras y posibilidad percibida de ganar. Esto justifica evaluar conjuntamente imagen, respuesta motriz y competencia, sin confundir la presencia de funciones con una experiencia atractiva. Se utiliza como marco de diseño, no como prueba de eficacia educativa. Fuente: Hunicke, LeBlanc y Zubek (2004), [MDA: A Formal Approach to Game Design and Game Research](https://users.cs.northwestern.edu/~hunicke/MDA.pdf), páginas internas 2–3 del PDF de cinco páginas.

La implementación concreta adopta objetivos legibles, relación visible entre acción y consecuencia, margen de recuperación, elección de intensidad, competencia reproducible y reconocimiento del progreso. Son decisiones de diseño sometidas a verificación y revisión; no se presentan como una fórmula universal de diversión. Los puntos no se convierten en calificación, las rachas no se castigan con pérdida de progreso y las pistas continúan disponibles.

La complejidad gráfica debe tener una función. Texturas y sombreado diferencian materiales y personajes; el contraste orienta la atención; las estelas y el desplazamiento comunican velocidad. Añadir partículas indiscriminadas, insignias o recompensas aleatorias aumentaría la carga visual sin resolver necesariamente las deficiencias identificadas.

## Modelo de velocidad y justicia competitiva

Cada acierto conserva su valor educativo y concede exactamente un octavo del recorrido. Una respuesta equivocada no concede distancia. La representación se aproxima a la distancia ya ganada mediante una respuesta críticamente amortiguada: conserva velocidad entre impulsos, no retrocede y no rebasa el objetivo concedido. La cámara comparte una misma transformación para los cuatro competidores. La animación no altera tiempos registrados ni resultado final.

Los NPC siguen curvas monótonas de velocidad variable: salida enérgica, alternancia de impulsos y remate. La semilla, los tiempos finales y los parámetros quedan almacenados antes de la salida. No existe aceleración reactiva para impedir que el jugador gane. Las carreras de protocolos 1 y 2 conservan sus trayectorias históricas.

La referencia inicial es de 8, 10, 12 y 15 segundos por pregunta para los niveles 1–4. Son parámetros de diseño, no baremos normativos. Con cinco resoluciones elegibles se utiliza la mediana de hasta las últimas 24 del mismo contenido y nivel. Si faltan observaciones suficientes, se recurre al nivel adyacente con un factor de 1,2 por nivel; si tampoco hay muestra suficiente, se conserva la referencia inicial. No se mezclan operaciones. Se documenta el origen de la referencia dentro de la carrera.

Para un tiempo de referencia total T, los multiplicadores centrales de llegada son 1,25/1,36/1,51 en Paseo; 1,04/1,12/1,23 en Carrera; y 0,93/1,01/1,11 en Desafío, con variación acotada de ±0,02 y asignación reproducible a los personajes. Por construcción, resolver al ritmo de referencia permite ganar Paseo y Carrera; reducir el tiempo total un 10 % permite ganar Desafío. Resolver más despacio puede llevar al cuarto puesto. La posibilidad de ganar no equivale a prometer victoria con cualquier actuación ni acredita que el ajuste sea óptimo para toda la población infantil.

## Valoración y siguiente criterio de aceptación

La mejora comprobable está en la riqueza material de las imágenes, diferenciación de personajes, relación entre movimiento y respuesta, amplitud del escenario, control de intensidad y corrección de la calibración. Son cambios sustanciales frente a la línea base. Persisten diferencias a favor de Grand Prix en geometría del circuito y juego social. No sería riguroso declarar superioridad global en atractivo y jugabilidad a partir de inspección del implementador y pruebas automatizadas.

La aceptación perceptiva requiere observar si una persona identifica a Luma, comprende qué produce un impulso, distingue un adelantamiento, recupera un error y decide repetir sin ayuda. Para contrastar preferencia con Grand Prix se propone una evaluación posterior con orden de presentación alternado, tareas equivalentes y registro separado de atractivo visual, control percibido, justicia, esfuerzo y repetición voluntaria. No se inventan participantes, puntuaciones de niños ni resultados de esa evaluación.

## Evidencia conservada

Las capturas y grabaciones se encuentran en `output/playwright/ciclo-web-5-20261014/`; la comparación local, en `qa-private/ciclo-web-5-20261014/comparacion.html`. Los archivos de control y observaciones distinguen ejecuciones válidas, fallos de automatización y pruebas sintéticas de visibilidad. La referencia bibliográfica tiene copia íntegra local en `qa-private/ciclo-web-5-20261014/sources/Hunicke-2004-MDA.pdf`, SHA-256 `f024c53fde7d44d340fc34a29edb96c1524d806dd56d74449f9e33ae28251773`.

El respaldo de la versión pública anterior está en `qa-private/public-web-backup-20261014-0015/`, con ZIP completo, 32 archivos recuperados por HTTP, manifiesto y restauración mediante un nuevo commit. El estado efectivo de promoción y las métricas finales se registran en `EVALUACION-WEB-0.7.0.md` y `qa-web-0.7.0/publication.json`; la existencia de este análisis por sí sola no confirma publicación.

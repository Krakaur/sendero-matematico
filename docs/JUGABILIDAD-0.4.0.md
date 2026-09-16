# Jugabilidad y métricas de Sendero 0.4.0

## Referencia y criterio de diseño

La inspección de [Jumping Aliens](https://www.arcademics.com/games/jumping-aliens) mostró clasificación de llegada con jugadores identificados como Computer, tiempo de llegada, Accuracy, Rate por minuto y preguntas falladas. La página distingue puntos, power ups, insignias, mejores tiempos y rachas. Estas observaciones no permiten reconstruir la fórmula interna del rival ni demostrar equivalencia entre su Rate y nuestras medidas.

Sendero adopta competencia visible y respuestas directas, con ilustraciones y código propios. Nube, Rayo y Chispa están identificados como rivales virtuales. No representan conexiones, usuarios reales ni una clasificación mundial.

## Categorías revisadas y decisiones

**Competencia y objetivo.** Cuatro carriles, meta a ocho ejercicios, posición calculada a partir del avance, tiempo activo y resultado de llegada. La carrera no termina la oportunidad de aprender cuando un rival llega primero: el niño completa sus ejercicios. Existe una alternativa sin competición y el razonamiento conserva un ritmo deliberado.

**Fricción y velocidad.** Una respuesta correcta avanza directamente en cálculo. Después del error, la solución permanece centrada y destacada hasta que el niño selecciona la respuesta correcta. Los intentos erróneos quedan registrados. El tiempo de una corrección no se cuenta como otro primer intento.

**Reto adaptativo.** En la carrera, el nivel matemático permanece fijo durante ocho retos. Siete u ocho respuestas iniciales correctas sin pista suben un nivel para la siguiente carrera; cuatro o menos lo reducen; cinco o seis lo conservan. Límites: niveles 1–4. Es una heurística transparente, pendiente de validación pedagógica.

**Calibración de rivales.** La mediana de hasta 24 tiempos elegibles del mismo contenido y nivel estima el ritmo; se requieren cinco observaciones. Con menos datos se utiliza una referencia de seis segundos por ejercicio. El tiempo de referencia para ocho ejercicios se acota a 24–160 segundos y los tres rivales usan factores 1.22, 1 y 0.82. Los rivales no aceleran ocultamente para impedir ganar. No se recalibran durante la carrera. Cambiar cantidades y posiciones de respuestas no sustituye la diversidad conceptual del banco de razonamiento.

**Recompensas.** Cada ejercicio completado aporta diez puntos y cada acierto inicial sin ayuda cinco adicionales. Se muestra la racha de la carrera en web. No hay pérdida de puntos, cobros, anuncios, tablas públicas con datos de menores ni penalizaciones por no volver un día. Los puntos expresan reglas del juego, no una nota escolar. Insignias duraderas, coleccionables y otras mecánicas de recompensa siguen siendo posibles ampliaciones, no funciones implementadas.

**Estética y legibilidad.** Agua azul, carriles definidos, personajes vectoriales, colores distintos por rival y opciones de respuesta con bordes diferenciados. El error combina texto, contraste y forma; el color no es el único indicador. La escena web usa SVG/CSS; Android usa Canvas nativo. No se descargan texturas, vídeos ni bibliotecas de juegos.

**Interrupciones y accesibilidad.** Las pausas y la ocultación de la aplicación detienen el tiempo activo. La inactividad se limita a 60 segundos entre interacciones. Esto es tiempo de interacción estimado, no atención observada. Web respeta movimiento reducido en transiciones y permite voz española instalada localmente; si no hay voz informa de ello. Android todavía no incorpora lectura de enunciados. Se conserva navegación táctil y por teclado; no se afirma una auditoría completa de accesibilidad.

## Medidas que no deben confundirse

La posición depende de rivales calibrados y no permite comparar estudiantes. Los puntos no equivalen a dificultad ni aprendizaje. El tiempo de carrera incorpora correcciones y ayudas mientras está activa; la fluidez educativa usa únicamente el tiempo válido hasta la primera respuesta, incluidos errores iniciales en el denominador. Los resultados web separan modalidad, contenido y nivel. Los paneles Android aún agregan modalidad dentro del mismo contenido/nivel; el JSON conserva la identificación de carrera.

Las pruebas automáticas verifican coherencia y funcionamiento. No sustituyen observación de jugabilidad con niños, docentes y teléfonos físicos. La motivación, comprensión del resultado y transferencia son preguntas empíricas pendientes.

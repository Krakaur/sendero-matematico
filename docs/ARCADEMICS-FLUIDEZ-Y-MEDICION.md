# Arcademics: interacción, fluidez y seguimiento

## Alcance de la revisión

Inspección del 15 de septiembre de 2026, hora de Chihuahua. Se observaron el juego público Jumping Aliens y las vistas de informes de estudiantes y asignaturas en la sesión de Chrome disponible. La cuenta se identifica como Basic y presenta una pantalla que restringe los informes a Plus. No se modificó la suscripción ni se crearon estudiantes. La partida de prueba fue anónima, privada y con contrincantes informáticos. Los resultados de esa partida corresponden a una inspección adulta mediante herramientas de control, no a un estudiante ni a una medición de rendimiento humano.

La interfaz permite verificar comportamientos y nombres de indicadores. No permite afirmar que se conocen las fórmulas internas, los tiempos excluidos por el servidor o la validación psicométrica de un indicador propietario. No se inspeccionó ni reprodujo código de Arcademics.

## Estructura observada

La respuesta es la acción de juego: en Jumping Aliens se selecciona una plataforma rotulada con una alternativa. Un acierto hace avanzar al personaje y cambia la operación sin exigir otro botón. Se observó el paso de (1b)(1b), respondido con 1b², a (-3b)(-2b). Al seleccionar erróneamente 1b en esta segunda operación, permaneció la misma pregunta; al seleccionar 6b² se pudo continuar. La animación comunica el resultado dentro de la actividad.

Al finalizar se muestran posición, tiempos de carrera, precisión, tasa por minuto y ejercicios fallados con su solución. En la prueba se hicieron dos selecciones correctas y una incorrecta; la pantalla mostró 66% de precisión y 1/min de tasa. El 66% es compatible con contar intentos correctos entre todos los intentos, incluida la respuesta corregida. El porcentaje de ejercicios resueltos inicialmente en esa secuencia sería 50%. Es evidencia de que esas dos definiciones no deben confundirse; una partida no demuestra la fórmula de todos los juegos del sitio. La tasa de 1/min no basta para identificar su numerador, su denominador o su redondeo, particularmente con pausas de inspección y cambios de foco.

Los informes accesibles muestran la estructura de seguimiento por estudiante, grupo y contenido, ventanas de 2 o 4 semanas y de 3 o 6 meses, cantidades respondidas y tiempo de uso. La vista de sumas expone un gráfico de rapidez y precisión y una matriz de operaciones individuales, desde 1+1 hasta 10+10. Su leyenda asocia bandas porcentuales y rangos por minuto. La pantalla de suscripción impide explorar datos efectivos y herramientas interactivas; no se verificaron los umbrales de clasificación, la combinación matemática de las dos variables ni su uso longitudinal. Los ceros de la vista no constituyen datos de aprendizaje.

La documentación pública describe práctica repetida para automatización y fluidez, retroalimentación inmediata, consulta de tendencias y asignación de contenidos según necesidades. Los puntos por logros también pueden depender del puesto y de desempeños perfectos a distintas velocidades. Por ello, puntos de juego, precisión, velocidad y dominio no son magnitudes intercambiables.

## Diagnóstico de Sendero 0.3.0

La respuesta correcta se guardaba al seleccionar su alternativa. El segundo toque, en “Siguiente paso” o “Siguiente reto”, avanzaba a otra pregunta. No era necesario para enviar el acierto, pero sí para mantener la secuencia de ejercicios. Esa exigencia añadía carga motora y fragmentaba la práctica de cálculo.

El contador `activeMs` ya detenía el tiempo cuando la pregunta quedaba resuelta: la espera ante ese segundo botón no se sumaba. Sin embargo, contabilizaba conjuntamente la respuesta inicial y la interacción posterior a un error, incluida la lectura de la solución antes de corregirla. En consecuencia, dividir los ejercicios completados entre ese tiempo no daba una medida limpia de rapidez inicial. Tampoco representaba una carrera continua de duración fija.

## Corrección 0.3.1

En los cuatro caminos de cálculo, una selección correcta registra la respuesta, actualiza la práctica y avanza automáticamente. No se añade una animación que bloquee la entrada durante un intervalo fijo. El último acierto completa y guarda la sesión. Tras un error se mantiene la solución centrada, destacada y con signos de exclamación; al seleccionar la respuesta correcta se avanza sin otra confirmación. Se conservan el error y el carácter asistido de esa corrección.

En razonamiento se conserva la explicación y el avance deliberado. No se le asigna una tasa de fluidez de cálculo. La lectura, la representación, la selección de estrategia y el cálculo son componentes distintos; reducirlos a un único tiempo dificultaría su interpretación.

Se incorpora un protocolo temporal explícito, versión 1, para las nuevas preguntas de cálculo. El reloj monotónico registra el tiempo de interacción visible hasta la primera respuesta; al producirse esta se guarda `firstResponseMs`, que no cambia con las correcciones. Los cambios de pantalla, la salida al fondo, la recarga y el límite de inactividad invalidan ese ejercicio para la comparación de rapidez si ocurren antes de responder. Los registros antiguos permanecen disponibles, pero no reciben retrospectivamente tiempos inventados.

Para un mismo contenido y nivel se calcula:

**Aciertos iniciales/min de respuesta = 60 × número de aciertos iniciales / suma de segundos hasta la primera respuesta.**

El denominador incluye los tiempos de los errores iniciales. Una posterior corrección no añade un acierto a este numerador. Se excluyen ejercicios con pista, interrupciones, tiempos no positivos, registros sin el protocolo nuevo y problemas del banco de razonamiento. Se muestran también precisión inicial sobre la misma muestra, número de observaciones y cantidad excluida. Por ejemplo, ocho aciertos iniciales en diez ejercicios con cuarenta segundos acumulados producen 12 aciertos/min y 80% de precisión. No se promedian las tasas individuales: se suman los aciertos y los tiempos antes de dividir.

Esta tasa describe respuesta inicial durante práctica con retroalimentación. **No es una tasa de carrera continua ni se ha demostrado equivalente a “Rate” de Arcademics.** La recuperación, las transiciones y el tiempo fuera de la actividad quedan fuera. Las exclusiones pueden sesgar una comparación si una sesión contiene muchas más interrupciones o ayudas; por eso se muestra su cantidad. La adaptación continúa dependiendo de los aciertos independientes y de los apoyos, sin usar velocidad.

Los tiempos y la marca de interrupción se exportan en JSON y CSV. En web y Windows se muestran además las últimas cinco sesiones con observaciones de cada contenido y nivel. Android presenta el resumen por contenido y nivel y conserva el detalle exportable; no se implementa todavía una gráfica temporal equivalente.

## Qué significa observar avance

Un aumento de rapidez acompañado de precisión estable, bajo condiciones comparables, es compatible con mayor fluidez en esas operaciones. Un aumento de rapidez con más errores no demuestra mejora. Resolver preguntas más complejas con menor tasa tampoco demuestra retroceso. Las opciones múltiples incorporan reconocimiento visual, discriminación de distractores y respuesta motora; no equivalen a producir una respuesta numérica libre.

La dificultad adaptativa cambia la mezcla de ejercicios. Separar por nivel reduce una fuente de confusión, pero no garantiza equivalencia entre muestras ni entre dispositivos. La latencia de pantalla, la lectura, el tamaño de los controles, la familiaridad con el teléfono y una ayuda externa no observada siguen influyendo. Ocho ejercicios constituyen una muestra breve; ni sus tasas ni las bandas de color son umbrales validados de dominio.

La siguiente extensión metodológica aconsejable es una breve comprobación de fluidez con distribución de contenidos y dificultad constantes, duración o longitud predefinida, familiarización previa y registro de interrupciones. Debe distinguirse de la práctica adaptativa cotidiana. Para valorar retención y transferencia se requieren observaciones posteriores y situaciones nuevas; el progreso dentro de la aplicación, por sí solo, no identifica una mejora causal del aprendizaje general.

## Fuentes y límites

[Arcademics: How It Works](https://www.arcademics.com/how-it-works) sustenta su orientación declarada hacia automatización, repetición, retroalimentación y tendencias. [Preguntas frecuentes](https://www.arcademics.com/faq) distingue puntos de logro y funciones de informes. [Modalidades de acceso](https://www.arcademics.com/get-started) confirma que Basic no incluye análisis de datos. [Jumping Aliens](https://www.arcademics.com/games/jumping-aliens) es el juego observado. La matriz y la estructura docente se observaron en [informes de sumas](https://plus.arcademics.com/reports/subjects/addition), con acceso restringido y sin datos de estudiantes utilizables.

La revisión no demuestra eficacia de Sendero ni verifica el algoritmo interno de Arcademics. Las pruebas de software comprueban que interacción, registro y fórmulas de Sendero corresponden al contrato aquí descrito. La evaluación con niños y teléfonos físicos continúa pendiente.

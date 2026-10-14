# Sendero y Grand Prix: evaluación global y decisiones de mejora

13 de octubre de 2026, Chihuahua; registros UTC del 14 de octubre. Línea base: Sendero web 0.7.0, fuente `0bbd14f1057031336813729295e763425885e170`. Intervención: web 0.8.0. Atractivo percibido, preferencia y análisis sonoro quedan fuera del alcance por instrucción del autor.

## Objeto y límites de la comparación

Se compara el juego Grand Prix Multiplication con la carrera aritmética de Sendero, y se examina además el conjunto de Sendero: acceso, contenidos, práctica tranquila, razonamiento, ayudas, adaptación, informes, persistencia, competición y cooperación. Las prestaciones declaradas para Arcademics Plus se distinguen de las observadas en Grand Prix gratuito. No se atribuye al juego gratuito todo lo anunciado para la plataforma de pago, ni se compara un solo juego de multiplicación con todo Sendero como si sus objetivos fueran idénticos.

La evidencia combina inspección del juego, capturas, lectura de las fuentes propias, documentación oficial, análisis determinista y recorridos automatizados. La inspección cualitativa corresponde al desarrollador; no representa entrevistas, observación infantil ni acuerdo entre evaluadores independientes. Las pruebas de navegador utilizan participantes automatizados y perfiles sintéticos. No se identificó el algoritmo interno de Grand Prix, no se copiaron sus recursos y no se accedió a información de terceros.

Se conserva la comparación anterior de dieciséis factores en `ANALISIS-ARCADEMICS-WEB-0.7.0.md`. Esta revisión amplía el análisis a la coherencia del sistema completo y a la experiencia compartida. Los resultados técnicos efectivos y el estado de publicación deben consultarse en `EVALUACION-WEB-0.8.0.md` y `qa-web-0.8.0/`; un informe de diseño no sustituye una comprobación de funcionamiento.

## Análisis holístico: qué experiencia produce el sistema

Grand Prix tiene un objetivo delimitado y una relación fácil de interpretar entre responder, acelerar, adelantar y terminar. Su especialización reduce las decisiones previas. Sendero dispone de una arquitectura educativa más amplia, pero esa amplitud introduce transiciones entre perfiles, contenidos, formas de práctica y resultados. Una ventaja de cobertura puede convertirse en coste de orientación si se presenta sin una jerarquía clara. La nueva entrada «Jugar juntos» permite acceder a la experiencia compartida sin crear expedientes ni contraseñas para invitados; la práctica individual conserva sus perfiles.

En Sendero 0.7.0 seguía existiendo una discordancia entre la promesa de recorrer un río y la geometría efectiva: el escenario se desplazaba, pero todos los barcos avanzaban horizontalmente. También había una discordancia entre la promesa social de competir y la presencia exclusiva de NPC. Ambas diferencias afectaban a la mecánica y a la experiencia espacial, no solo a la apariencia. La 0.8.0 incorpora trayectorias curvas reales y participantes humanos que responden de manera independiente.

La experiencia educativa debe considerar el ciclo completo: elegir una tarea, comprenderla, responder, recibir información, corregir, consolidar y decidir qué practicar después. La carrera resolvía bien el inicio y la respuesta inmediata, pero su cierre daba mayor protagonismo a posición, puntos y repetición que a la estrategia matemática. La nueva revisión posterior recupera los ejercicios corregidos o asistidos, ofrece una representación o descomposición y propone explicar el procedimiento. Esto abre una oportunidad didáctica; no demuestra que el usuario la aproveche ni que produzca transferencia.

## Comparación particular de calidad y funcionalidad

| Dimensión | Grand Prix: evidencia disponible | Sendero 0.7.0 | Decisión en 0.8.0 y valoración |
| --- | --- | --- | --- |
| Propósito | Práctica de fluidez multiplicativa, declarada y observada | Cuatro contenidos aritméticos y razonamiento | Mantener especialización de la carrera; no convertir rapidez en diagnóstico general |
| Entrada al juego | Alias y sala, sin cuenta obligatoria en el acceso gratuito | Perfil local antes de practicar | Acceso directo a juego compartido, sin contaminar el expediente individual |
| Correspondencia acción–resultado | Acierto impulsa vehículo | Acierto concede un octavo del recorrido | Se conserva la regla; las curvas no conceden progreso por sí mismas |
| Trayectoria espacial | Circuito con giros y cambio de orientación | Desplazamiento horizontal | Dos trazados de meandros y una vuelta de 360°, con geometría propia, cámara y minimapa coherentes |
| Variación del recorrido | Un circuito en la inspección; no se verificó selector | Un río fijo | Tres circuitos elegibles sin cambiar operación ni nivel |
| Distancia y velocidad | Algoritmo interno no identificado | Progreso educativo e interpolación visual separados | Interpolación por longitud de arco en cada carril; igualdad de fracción educativa, no metros físicos idénticos |
| Juego simultáneo humano | Sala pública/privada y hasta cuatro plazas observadas | Ausente | Dos participantes en un dispositivo; de dos a cuatro por enlace privado |
| Modalidad cooperativa | No observada en este juego | Ausente | Meta conjunta sin clasificación; todos completan sus propios retos |
| Condiciones matemáticas entre participantes | No se pudo establecer identidad de las secuencias | Solo comparación con NPC | Mismos ocho enunciados y nivel; posiciones de respuesta distintas por persona |
| Inicio y consentimiento de participación | Sala con estado de preparación | Salida individual | Todos deben confirmar; no se inicia con una persona pendiente o desconectada |
| Pausa y continuidad social | No se acreditó una pausa común | Pausa del participante y NPC | Pausa para todos y nueva confirmación conjunta para continuar |
| Cierre cuando hay rezago | En una ejecución sin respuestas, terminó mostrando 0 % y cuarta posición | Se completaban los ocho retos individuales | La primera llegada no cierra los retos de las demás personas |
| Desconexión | No se ensayó controladamente | No aplicable a humanos | Se detiene la carrera; no se convierte una pérdida de conexión en una victoria |
| Justicia temporal en red | No se identificó su compensación de latencia | No aplicable | Recepción de respuestas en anfitrión y margen explícito para llegadas próximas; uso amistoso, no competición certificada |
| Retroalimentación inmediata | Corrección visible observada | Solución y nuevo intento | Se conserva el error; la corrección no pasa a contarse como acierto inicial |
| Calidad de alternativas | Inspección funcional, sin auditoría completa del generador | Alternativas aritméticas cercanas al resultado, normalmente ±5 | Alternativas relacionadas con operación y productos vecinos, con respaldo numérico para casos con pocas opciones distintas |
| Representación matemática | No se evaluaron las lecciones de Plus | Grupos y descomposición básica | Recta para suma/resta, matrices pequeñas y partición de productos; evitar centenares de puntos en tablas grandes |
| Reflexión posterior | Resultado, precisión, ritmo y preguntas falladas observados | Predominio de resumen y repetición | Revisión de estrategias en ejercicios con error o ayuda, también en juego compartido |
| Adaptación | Personalización anunciada para Plus, no auditada | Reglas transparentes, todavía no validadas educativamente | Se conservan; el juego entre personas fija un nivel común elegido antes de salir |
| Cooperación y medición | No se ensayó su tratamiento de ayuda informal | Expedientes individuales | Resultados compartidos separados del expediente y de los indicadores individuales de fluidez |
| Interpretación de informes | Informes avanzados anunciados para Plus | Métricas desagregadas; algunas bandas textuales inconsistentes | Se corrigen etiquetas a 0–49 %, 50–79 % y 80–100 %, acordes con los umbrales efectivos |
| Accesibilidad funcional | Declaración del proveedor; no auditoría independiente completa | Pausa, controles sensoriales y respuestas táctiles | Controles por teclado para ambas personas, objetivos táctiles y cámara fija con movimiento reducido |
| Persistencia | Progreso con cuenta anunciado por el proveedor | Perfil, historial, respaldo y partida pendiente locales | Se conserva el flujo individual; la partida compartida local se recupera pausada tras recargar |
| Conectividad | Infraestructura pública de partidas observada | Práctica individual offline | Juego local compartido offline; por enlace requiere señalización y conexión entre navegadores |
| Operación y madurez | Servicio público consolidado en uso; carga no medida | Distribución estática y receptor docente no público | Se amplían capacidades, pero no se acredita operación escolar a escala ni disponibilidad garantizada |

La [página del juego](https://www.arcademics.com/games/grand-prix), la [descripción de funcionamiento](https://www.arcademics.com/how-it-works) y las [preguntas frecuentes](https://www.arcademics.com/faq) sustentan la delimitación entre práctica gratuita, multijugador y prestaciones de Plus. Las afirmaciones promocionales de mejora del aprendizaje no se toman como resultados experimentales de esta comparación.

## Análisis pedagógico y didáctico

La guía del What Works Clearinghouse de 2021 reúne instrucción sistemática, lenguaje matemático, representaciones, recta numérica, problemas y actividades temporizadas dentro de una intervención más amplia. Aquí se utiliza para justificar una combinación de apoyos y práctica, no para presentar Sendero como una intervención validada ni trasladar automáticamente conclusiones de una población a otra. Fuente primaria: [Assisting Students Struggling with Mathematics: Intervention in the Elementary Grades](https://ies.ed.gov/ncee/wwc/PracticeGuide/26).

La precisión al primer intento, la resolución sin ayuda, la recuperación de errores y la rapidez describen desempeños diferentes. Que una persona seleccione la respuesta destacada después de verla no acredita comprensión independiente. Por ello se conserva el primer error y se distingue la revisión explicada de la recuperación de un hecho sin apoyo. En las partidas compartidas puede haber conversación y ayuda externa; incorporar esos resultados al expediente individual habría introducido una comparación de contextos distintos. La 0.8.0 evita esa mezcla.

El banco de razonamiento contiene 6.630 enunciados únicos, 148 plantillas y 21 etiquetas de familia; 4.966 pertenecen a práctica y 1.664 a situaciones reservadas. Las etiquetas no son constructos psicométricos independientes y algunas tienen proximidad conceptual. Cambiar cantidades o contexto no produce necesariamente una nueva demanda cognitiva. La existencia de un conjunto reservado limita la repetición literal, pero no demuestra transferencia a situaciones auténticas. La cobertura curricular sigue siendo parcial y la revisión docente independiente permanece pendiente.

La dificultad matemática individual responde a pocas observaciones consecutivas o a una carrera de ocho retos. Esto permite reaccionar con rapidez, pero también introduce sensibilidad al azar, a la familiaridad de los hechos y a las ayudas. No sería justificable cambiar los umbrales y calificarlos de óptimos sin observación educativa. Se mantienen las reglas existentes y se explicita su carácter inicial. En juego compartido se usa un nivel común: igualdad de tareas no equivale a igualdad de capacidad previa. La cooperación y la elección consensuada de dificultad ofrecen alternativas al enfrentamiento directo.

Los nuevos distractores representan resultados compatibles con confundir una operación, omitir o añadir un grupo y errores cercanos de cálculo. Son candidatos para diseñar mejores alternativas; seleccionar uno no identifica de manera unívoca una concepción errónea del estudiante. No se añaden etiquetas diagnósticas automáticas. Para productos pequeños se utiliza una matriz de cantidades verificable; para productos grandes se evita llenar la interfaz de cientos de elementos y se ofrece descomposición simbólica. La expresión verbal sigue requiriendo una persona o actividad externa que la escuche y valore.

## Análisis de gamificación y competencia

Se diferencian objetivos del juego y objetivos de aprendizaje. La posición premia completar el recorrido antes; el informe educativo conserva precisión, ayudas y correcciones. El modo cooperativo cambia la condición de victoria: la meta pertenece al equipo cuando todos terminan. No se simula cooperación mediante una barra común en la que una sola persona pueda responder por todas desde su propia consola.

La autonomía se concreta en elegir operación, nivel, circuito y carrera o cooperación. La competencia se apoya en reglas visibles, rivales reproducibles para el modo individual y participantes reales en las salas. La relación social se habilita mediante presencia y objetivos compartidos, sin abrir chat público ni añadir recompensas aleatorias. No se midieron motivación, pertenencia o diversión; son hipótesis de diseño que requieren otro tipo de estudio.

En las salas todos reciben el mismo conjunto de ocho hechos, sin repetición exacta dentro del recorrido; se desplazan las posiciones de las opciones para que compartir teclado no convierta la imitación de una tecla en la tarea principal. Las respuestas entrantes se validan contra participante, pregunta actual y alternativas, y no se acepta que un cliente envíe directamente su puntuación o distancia. Esto reduce errores y manipulaciones triviales; el anfitrión sigue siendo un navegador controlado por una persona, no un árbitro independiente resistente a modificaciones deliberadas.

La igualdad temporal absoluta no está garantizada por la red. Se conserva el tiempo de recepción del anfitrión y se agrupan llegadas próximas con un margen relacionado con el viaje de ida y vuelta observado, de al menos 150 ms en línea y hasta 1.000 ms. Latencias altas o ausencia de conexión provocan pausa. Ese margen no elimina toda asimetría ni sustituye un servidor autoritativo. La clasificación se restringe a la partida amistosa, sin tabla pública ni acreditación.

## Análisis cuantitativo y de ingeniería

La auditoría estructural es reproducible mediante `scripts/audit-game-design.mjs` y la copia preservada de 0.7.0. En 1.600 configuraciones —cuatro contenidos, cuatro niveles y cien semillas— los recorridos compartidos contienen 12.800 ejercicios, sin repeticiones exactas dentro de cada grupo de ocho ni alternativas inválidas. El generador aleatorio previo, evaluado aisladamente con esas semillas, produjo 907 repeticiones exactas adicionales dentro de los grupos. Esta comparación no reproduce la memoria de práctica espaciada del modo individual ni estima un efecto de aprendizaje.

Cada circuito contiene 641 muestras por carril y se interpola según distancia acumulada. Las pruebas comprueban posición finita, progreso monótono, separación entre carriles, continuidad angular y llegada exacta. El circuito cerrado cambia de orientación a lo largo de una vuelta completa; su cámara comparte la transformación del escenario y de los participantes. Con movimiento reducido se presenta el recorrido completo desde una cámara fija. El jugador no necesita conducir, introducir giros ni repartir atención entre un volante y la operación matemática.

La diferencia de longitud geométrica entre carriles no determina la cantidad de trabajo: resolver ocho ejercicios completa cualquier carril. No se presenta la velocidad en metros por segundo ni se atribuye a los carriles una física competitiva equivalente. Los NPC existentes conservan tiempos y trayectorias lógicas; la presentación curva no modifica retrospectivamente el resultado de una partida guardada.

El modo por enlace utiliza [PeerJS](https://peerjs.com/client/getting-started) para señalización y [WebRTC](https://webrtc.org/getting-started/peer-connections) para los datos entre navegadores. Se carga el cliente local al elegir la modalidad en línea. No se solicita cámara ni micrófono. La invitación contiene identificadores aleatorios y una llave que se transmite en el fragmento de la URL, no en su consulta HTTP. El servicio de señalización y los servidores STUN reciben metadatos técnicos de conexión; los historiales personales no forman parte de los mensajes de partida.

No se contrata alojamiento ni se despliega un servicio docente público. La ausencia de un servidor TURN propio implica que algunas redes con restricciones no podrán conectar directamente. Un ensayo satisfactorio en varios navegadores del mismo equipo no demuestra conectividad entre redes distintas, protección integral frente a abuso, escalabilidad o disponibilidad sostenida. Esta es una diferencia operativa que todavía favorece al servicio de Arcademics.

## Juicio global y prioridades restantes

Sendero adquiere ventajas funcionales específicas frente a lo observado en Grand Prix: juego simultáneo en una pantalla, cooperación sin clasificación, elección entre tres trazados, pausa compartida y continuidad de la resolución hasta que todas las personas completan sus retos. La afirmación se refiere a funciones implementadas y a su verificación, no a superioridad demostrada del aprendizaje, satisfacción o calidad profesional integral.

Grand Prix mantiene una experiencia de entrada especializada y una infraestructura pública operativa cuyo alcance supera al ensayo de conexión directa realizado aquí. Sendero aporta mayor amplitud de prácticas dentro de esta comparación y trazabilidad local de reglas y resultados; persisten validación didáctica independiente, observación en dispositivos físicos, comprobación entre redes heterogéneas, administración de salas más robusta y evaluación educativa de la adaptación. No se asigna una puntuación global mediante pesos arbitrarios que oculten estas diferencias.

La siguiente evaluación debe conservar esas separaciones. El atractivo y la preferencia necesitan observación de usuarios; el audio requiere escucha comparada; la eficacia educativa requiere tareas equivalentes, medición previa y posterior y control del contexto. Ninguno de esos resultados se infiere de la presencia de ilustraciones, del número de pruebas aprobadas o de una conexión de red satisfactoria.

## Trazabilidad

`qa-web-0.8.0/structural-audit.json` contiene los conteos y medidas; `sources.json` relaciona URL, copia local completa y SHA-256 de las fuentes consultadas. Los originales están en `qa-private/ciclo-web-6-20261014/sources/`. Las capturas y registros de navegador se conservan en `output/playwright/ciclo-web-6-20261014/`. El respaldo de la distribución pública anterior está en `qa-private/public-web-backup-20261014-cycle6/`: rama publicada, 36 archivos HTTP, manifiesto y procedimiento de restauración. Las limitaciones de cada prueba se documentan junto a su resultado.

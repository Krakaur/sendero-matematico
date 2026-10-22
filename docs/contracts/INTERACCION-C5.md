# C5: oportunidad de corrección y composición de la interfaz

Las tareas nuevas conservan sendero.assignment.v2 y su contenido inmutable, pero registran taskProtocol=2 como condición de interacción. Después de la octava respuesta, correcta o incorrecta, el alumno decide «Terminar tarea». Puede corregir un error antes de cerrar o dejarlo registrado. No se exige acertar para terminar. Una recarga conserva la tarea pendiente; no debe transformar una respuesta en cierre o envío.

advanceAssignedSession representa una acción explícita de avance. En la última posición del protocolo2 añade completionAction={kind:'finish-task',at}, con la misma fecha del cierre, y valida antes de modificar la sesión. Esta evidencia declara la acción del cliente; no verifica la identidad del alumno ni prueba voluntad humana frente a un cliente manipulado. La interfaz sólo llama a esa operación final desde el control de terminación.

Las sesiones históricas con protocolo1 siguen válidas, conservan sus bytes y su limitación de corrección final. No reciben marcadores retrospectivos. El informe muestra el protocolo y las series de precisión/ritmo separan tarea, versión, contenido y protocolo. La cobertura por destinatario puede integrar ambos protocolos porque cuenta recepción, no compara rendimiento.

Tres trayectorias con siete aciertos previos: error y terminar produce inicial7/8, independiente7/8, final7/8; error, solución y corrección produce7/8,7/8,8/8; pista previa y primera respuesta correcta produce8/8,7/8,8/8. También se comprueban recarga, acierto final sin autocierre, terminación sin respuesta rechazada, idempotencia y validación del marcador.

El ajuste visual conserva bosque, circuito, personajes y movimiento reducido. Su objetivo verificable es ver la operación y las cuatro respuestas junto a la carrera en ventanas de escritorio, sin reducir controles por debajo de48px. En pantallas pequeñas se conserva lectura y desplazamiento accesible; no se oculta ayuda para cumplir una medida de velocidad. No se añaden activos ni se modifica audio. El cambio no demuestra preferencia infantil, aumento de soluciones por minuto, retención ni transferencia.

La cabecera docente distingue conexión pausada de consulta automática habilitada. «Restablecer filtros» describe una acción que no borra registros. El backend usa los mismos validadores: la publicación del cliente protocolo2 debe acompañarse del backend compatible; esta candidata permanece local hasta verificar su entrega.


## Criterio adicional previo a la revisión 7

La inspección de 320×640 mostró que el jugador también podía quedar fuera del encuadre: la cámara seguía la línea media u otro carril. La aceptación se amplía antes de ejecutar: lane 0 debe conservar edge vacío y una posición realmente interior en 1170 posiciones sintéticas (3 circuitos × 3 tamaños de escena medidos × 65 progresos incluyendo salida/meta × 2 modos de movimiento). Además, se inspeccionan 20 estados UI: 18 de Cascada (salida, mitad y meta en escritorio, 320 y 390, normal y reducido), más Bosque e Islas en meta de 320 con movimiento reducido. La propuesta r6 no se aplicó: antes de ejecutar, se confirmó también jugador oculto en Bosque reducido meta de 320. La cámara fija reserva margen para la silueta; no se suprime la detección de fuera de escena. La métrica anterior de claves separadas no acreditaba este requisito. No se cambian coursePoint, distancia ganada ni resultados. Los rivales fuera de cámara son indicadores direccionales, no siluetas navegando sobre tierra.


## Reserva de mensaje, revisión 8

R7 aprobó 1170 posiciones y 20 escenas para visibilidad del jugador. La auditoría adicional de esas 20 escenas encontró dos claves intersectando el mensaje en Cascada de 320, mitad, movimiento reducido. R8 reserva 40 px inferiores para colocar las claves; conserva idénticos camera y project. Antes de ejecutar se fija la aceptación: 20/20 escenas sin intersecciones entre claves, leyenda o mensaje. No se repite el barrido1170 de lógica idéntica; se conservan tanto el fallo observado como la comprobación nueva.

# Sendero web 0.3.2: carrera de cálculo y actualización

## Problema y solución

La interfaz anterior podía permanecer en una pestaña controlada por el service worker antiguo. Además, un ejercicio aritmético resuelto en 0.3.0 conservaba la confirmación pendiente incluso al abrir 0.3.1. La captura comunicada coincide con ambos escenarios; no permite identificar cuál ocurrió en ese navegador concreto.

El service worker nuevo se activa al completar la descarga íntegra de recursos y consulta exclusivamente su caché. La interfaz detecta cambios de versión y ofrece actualizar conservando el progreso. `actualizar.html` proporciona una entrada directa para las versiones anteriores sin ese aviso; no borra ni reescribe el almacenamiento del estudiante. La migración de un ejercicio aritmético resuelto ejecuta únicamente el avance pendiente: preserva los intentos y no aplica nuevamente la adaptación.

## Interacción y presentación

La carrera del río presenta una escena SVG original con movimiento al acertar, ocho tramos y una meta. Cada selección correcta abre inmediatamente la siguiente operación; la animación no bloquea las respuestas. El error conserva una solución central destacada con signos de exclamación hasta elegir la respuesta correcta. El razonamiento mantiene la explicación y su avance deliberado.

La pantalla prioriza operación y respuestas; Pausar permite regresar a los demás apartados. Los cuatro botones permanecen visibles en las dimensiones ensayadas. Se respeta la preferencia de movimiento reducido. La carrera es individual: no se simulan participantes ni competencia en línea.

## Medición

Se mantiene el protocolo 1 de 0.3.1: tasa = 60 × aciertos iniciales / segundos hasta la primera respuesta, incluyendo los tiempos de los errores iniciales y excluyendo pistas, interrupciones y registros antiguos. El contador de rapidez corresponde al nivel actual y muestra cuántos ejercicios aportan tiempo. Al cambiar de nivel puede quedar sin observaciones; no combina niveles para simular continuidad. La precisión inicial del encabezado describe los ejercicios contestados en la sesión. La pantalla final y los informes desglosan la rapidez por nivel.

El recorrido incluye ejercicios corregidos; no equivale a aciertos independientes. La velocidad representa respuesta durante práctica, no operaciones por minuto de una carrera con reloj continuo ni una medida general de capacidad. La comparación exacta con la tasa de Arcademics sigue sin establecerse. Las cifras de las capturas proceden de automatización y no describen desempeño infantil.

## Verificación iterativa

Primera revisión: recorrido completo de ocho ejercicios, avance de una pulsación, corrección con conservación del tiempo inicial, pausa excluida de rapidez, guardado único y recarga sin conexión. Pasaron las 22 pruebas de lógica existentes.

Segunda revisión: inspección de capturas y ajuste de márgenes móviles; prueba en Chromium y Firefox con ventanas de 320 × 640, 390 × 844, 844 × 390 y 1280 × 900. Las cuatro respuestas quedaron visibles sin desplazamiento horizontal. Se verificaron movimiento reducido, llegada a la meta y ausencia de errores JavaScript. La prueba de inactividad simulada durante 61 segundos, doble clic y pista confirmó las exclusiones temporales y un solo avance.

Tercera revisión: actualización de una instalación real del código 0.3.0 en un origen de prueba, con caché antigua y ejercicio resuelto pendiente. En Firefox, la actualización y recarga conservaron perfil, sesión, respuesta y adaptación; el índice avanzó una vez. Una segunda recarga sin conexión no repitió la migración. El servidor de ensayo desactiva la comparación Last-Modified porque la fecha de extracción del archivo histórico no representa la antigüedad del código.

Scripts reproducibles: `qa-upgrade-server.py`, `qa-web-upgrade-before.js`, `qa-web-upgrade-after.js`, `qa-web-update-link.js`, `qa-web-river.js`, `qa-web-fluency.js` y `qa-web-timing.js`. Los ensayos usan perfiles aislados y datos sintéticos.

El enlace directo de actualización se probó además en Chromium desde esa misma versión 0.3.0: conservó identidad, intento y adaptación; avanzó exactamente una vez y admitió recarga offline. Una solicitud incidental de favicon ausente motivó incorporar el icono explícito en esa entrada.

## Alcance y próximas versiones

Esta revisión corresponde a la web. Las descargas de Android y Windows siguen siendo 0.3.1 y no incorporan esta escena. No se ha realizado una prueba física en el teléfono del usuario ni una evaluación con niños.

La estética se tratará como una dimensión de jugabilidad: legibilidad, jerarquía visual, respuesta inmediata a la acción, continuidad del movimiento, identidad de personajes y coherencia entre sonido y animación. La siguiente evaluación deberá observar errores de pulsación, tiempo para comprender la acción y deseo de repetir, además de rendimiento en teléfonos modestos. Incorporar un motor gráfico o Canvas se decidirá según la interacción necesaria; JavaScript ya controla las reglas, adaptación y registros actuales. HTML, CSS y SVG no impiden por sí mismos una presentación dinámica.

Pendientes: prueba de fluidez con dificultad fija, revisión docente, comparación entre dispositivos y mecanismos de actualización de los paquetes nativos. No se afirma equivalencia con Arcademics ni eficacia educativa validada.

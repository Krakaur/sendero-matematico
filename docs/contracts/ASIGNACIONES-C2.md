# C2: tareas, partidas y recepción docente

La integración conecta el contrato con el motor de práctica, almacenamiento local, transporte de aula, receptor Node/SQLite y Worker/D1. La matriz de aceptación es cuatro perfiles de prueba 000101–000104 por dos tareas de la misma ruta: ocho episodios asignados, identificables por aula, tarea y versión. Los datos son sintéticos; ejecutar el motor y los receptores reales en un entorno local no convierte las pruebas en observación de alumnos humanos ni en prueba de eficacia educativa.

## Contrato y alcance

Se preserva el demostrador C1. El transporte ejecutable usa `sendero.assignment.v2`, el informe `sendero.report.v3` y `taskProtocol: 1`. El nuevo protocolo añade eventos de respuesta, pista solicitada y solución automática; no reconstruye esos eventos para informes antiguos. Cada sesión almacena id, versión y snapshot sin lista de destinatarios. Los informes v1 y v2 continúan siendo admitidos como legado; compartir ruta no permite atribuirles tareas retrospectivamente.

El primer contenido es `multiply-fixed-table@1`: tabla 1–12, multiplicadores 1–8, cuatro opciones, sin cronómetro competitivo ni adaptación. El cierre exige ocho ítems respondidos, no ocho aciertos. Tras un error se muestra la solución y se permite corregir o continuar; el octavo ítem cierra la tarea y conserva el resultado incorrecto. La pantalla de cierre muestra la solución si el último resultado fue erróneo. Este ciclo integra la práctica asignada; carreras, multijugador, restantes rutas y taller siguen funcionando como actividades libres, sin afirmar que ya cumplen este contrato.

La primera respuesta puede haber recibido una pista. Por eso se distinguen acierto inicial, acierto a la primera sin apoyo, acierto final, pista solicitada y solución mostrada automáticamente. Corregir después de ver una solución no cuenta como respuesta independiente. El último reto no ofrece el mismo reintento que los siete anteriores: los aciertos finales no son comparables por posición como medida de igualdad de oportunidad. Uniformar esa revisión queda como mejora didáctica prioritaria posterior. Son observaciones de ejecución, no diagnósticos de comprensión, dominio ni causalidad pedagógica.

## Historial, recepción y privacidad

Cada revisión publicada crea una versión consecutiva; versiones y destinatarios previos son inmutables. El servidor compara `expectedRevision` con la revisión vigente para evitar pérdida de una edición concurrente. No se elimina el historial mediante omisión. El estudiante recibe sólo sus tareas y su propio identificador en destinatarios. En la primera conexión se vincula el perfil mediante enrollment antes de recuperar tareas. La invitación y el rol autorizan el acceso; no verifican por sí mismos la identidad humana.

El receptor valida el snapshot contra su catálogo, el aula y el destinatario. Un reenvío canónicamente idéntico no duplica la partida; reutilizar el id con contenido diferente devuelve conflicto y no sobrescribe ni confirma una aceptación inexistente. El acuse y la comprobación docente de persistencia se guardan fuera del contenido de la sesión. `confirmedAt` indica cuándo se consultó el servidor, no cuándo se produjo la primera recepción. Un nuevo intento pendiente no borra el acuse anterior. Las sesiones de otra aula permanecen locales, sin enviarse a la invitación actual.

El informe presenta tarea/versión, denominador de destinatarios, estado de recepción y secuencia por ítem. La ausencia de informe no demuestra ausencia de trabajo. Los archivos importados se identifican como tales, sin equipararlos a una confirmación del servidor. Los datos recibidos de otras versiones o fuera del catálogo no se agregan por coincidencia de ruta.

## Criterios de aceptación previos

La matriz de ocho episodios debe conservar sus referencias al cerrar, serializar, recibir y consultar. Crear A v2 no altera A v1 ni sus ocho episodios junto con B v1. Se exige cero duplicados en reenvíos idénticos, rechazo de conflictos, aislamiento de aula/rol/perfil y cero destinatarios ajenos en la respuesta estudiantil. Profesor y crítico deben poder contestar qué tarea y versión se realizó, qué cierre o recepción consta y qué evidencia sostiene una intervención docente. Se conserva cualquier desacuerdo metodológico; no se promueve otro ciclo por consenso aparente.

Las pruebas son secuenciales, con bases transitorias en memoria y bundle de Worker sin salida de compilación a disco. Se registran recursos antes/después y los bytes lógicos del harness, que no equivalen a la E/S física total. Si el panel de Cloudflare no está autenticado, la cuota permanece desconocida y no se realizan pruebas públicas ni despliegue. La validación local no acredita una publicación ni mide CPU real de Workers.

La interfaz conserva la creación docente de prácticas orientativas para todas las rutas: su rótulo explica que los resultados no se atribuyen al encargo. Las asignaciones verificables se abren desde Explorar o Mi progreso, además del aula. El último error muestra su solución sin pedir una pulsación inexistente.

# C3: entrega recuperable y aviso de investigación

El ciclo distingue cierre local, intento de envío y acuse del servidor. No modifica sesiones cerradas para añadir metadatos de transporte. Los metadatos están bajo classroom.deliveryAttempts y classroom.confirmations, por aula/perfil/intento. El inicio de un envío no demuestra transmisión, persistencia remota, lectura docente ni aprendizaje.

La aplicación guarda el evento previo al POST y comprueba la persistencia antes de permitir el envío. Tras validar la respuesta guarda una copia del estado actualizado antes de presentarla. Si cambia el vínculo durante la operación, no aplica la respuesta al vínculo nuevo. Los reintentos de transporte conservan el mismo contenido y el mismo identificador del cierre, sin obligar al estudiante a repetir la partida. Las sesiones anteriores no versionadas conservan compatibilidad con sus marcas históricas, sin elevarlas a acuses verificables.

## Escenarios y métricas predefinidas

Se usan cuatro perfiles sintéticos 000101–000104, tres tareas versionadas y doce cierres. Los cortes son: antes del POST; después del commit y antes de recibir acuse; después de validar el acuse y antes de persistir el estado del cliente. Se reinicia desde la copia durable en cada caso. Objetivos: 12/12 cierres únicos recibidos, cero filas adicionales tras doce reenvíos, 3/3 recuperaciones. Se prueba Node/SQLite en memoria mediante HTTP local con el cliente de producción. Ninguna prueba requiere una llamada al servicio público. No se extrapola la CPU local a Workers.

Se comprueba el aviso en cinco casos: navegador nuevo, reconocimiento persistido, versión anterior, datos malformados y almacenamiento bloqueado. El reconocimiento no es consentimiento, no demuestra lectura o comprensión y no se incluye en informes. Se comprueban además aviso y una entrega conectada en el navegador. Las preguntas docentes se fijaron antes de conocer los resultados.

## Aviso y términos

El responsable identificado por el usuario es Dr. Hans Krakaur Floranes. El contacto autorizado y verificado es dirk.krakaur6506@alumnos.udg.mx. El proyecto no tiene adscripción institucional; el correo no demuestra respaldo de UdG. La primera capa se abre al iniciar el juego individual y multijugador; puede cerrarse y consultarse de nuevo. El recordatorio es por navegador, no una autorización por alumno o tutor. La página de condiciones funciona sin JavaScript y se precarga para consulta sin conexión.

Los registros educativos operativos se describen separados de un futuro uso investigativo: no se activa estudio, reclutamiento, telemetría investigativa ni consentimiento genérico. Los códigos junto con datos escolares no se califican de anónimos. Se explican envío al aula, copia cifrada, salas por enlace, proveedores y límites de borrado/retención. No se afirma que borrar datos locales retire informes ya recibidos. Antes del uso con estudiantes reales siguen pendientes plazos de conservación y responsabilidades, revisión del aviso aplicable y protocolo/revisión ética para cada investigación.

Como referencia metodológica, la política de UNICEF enfatiza revisión ética, consentimiento/asentimiento, privacidad y gestión de datos; se toma como orientación, sin afirmar que este proyecto esté bajo UNICEF o haya sido aprobado: https://www.unicef.org/documents/policy-ethics-evidence-activities-involving-people-as-participants-subjects (consulta 2026-10-21). La referencia no sustituye el análisis normativo del despliegue concreto.

## Límites heredados

Se conserva el P1 de oportunidad desigual de corrección en el octavo ítem. La atribución versionada sigue limitada a multiplicación; las demás rutas mantienen orientación. No se acredita eficacia, usabilidad humana ni equivalencia global con Arcademics. Las revisiones de profesor y crítico son de agentes sobre evidencia sintética, no participantes humanos.

La exclusión de sincronización duplicada de la interfaz opera en una pestaña. Las pruebas de respuestas superpuestas no equivalen a coordinación transaccional entre dos pestañas que escriben el mismo perfil en localStorage; ese caso permanece sin validar. El profesor ve fecha de consulta del aula, distinta del acuse de envío del alumno.

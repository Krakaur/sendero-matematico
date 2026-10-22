# Recepción explícita de retroalimentación

Esta utilidad recibe observaciones para una implementación posterior. Es una candidata local independiente de `improvement_harness.py`: no cambia ese harness, sus reglas, límites, allowlists o recibos. No es un servicio residente, un watcher ni un hook de Codex. Cada ejecución debe ser solicitada explícitamente por el agente que coordina el trabajo autorizado. El cierre de una consulta puede registrar una observación o un aplazamiento sin producir cambios en el producto.

`validate` comprueba un documento sin crear el almacén. `import` conserva sus bytes originales y agrega revisiones por identificador estable. `propose` prepara un fragmento de hallazgos para que el principal construya posteriormente un plan concreto del harness existente. Ninguna de estas operaciones aplica candidatos, ejecuta pruebas, publica, crea permisos, consulta la red o aprueba revisiones.

## Entrada y trazabilidad

El documento utiliza `schema: sendero.feedback.v1` o el formato de propuesta ya existente, `sendero.feedback-intake-proposal.v1`, con una lista `entries`. Cada observación necesita `id`, `sources`, `evidence`, `claim`, `priority`, `scope`, `metric`, `status`, `decision` y `resolution`. `author`, cuando existe, conserva al autor original del documento. `--actor` identifica a quien registra la observación y no sustituye a sus autores o revisores.

Las clases de evidencia admitidas son `code_observed`, `execution`, `ui_observed`, `document` y `expert_hypothesis`. La utilidad conserva esa clasificación: una opinión no pasa a ser ejecución por registrarse. `claim` distingue hecho, inferencia y propuesta. La métrica requiere unidad, criterio de aceptación o condición previa de línea base y un denominador explícito o una rúbrica cualitativa. No se inventan cifras para una hipótesis ni se interpreta una prioridad como autorización.

La fuente de entrada siempre necesita un SHA-256 esperado. El hash se verifica sobre sus bytes exactos antes de interpretar JSON. Una evidencia local con `path` y `sha256` también se verifica; si el hash difiere, la importación se rechaza. Una ruta sin hash conserva su falta de vínculo a una versión: no se considera evidencia actual verificada. Las URL se conservan como localizadores, no se visitan. Se rechazan URL con credenciales y clases de evidencia desconocidas. Los hashes detectan diferencias de bytes; no autentican a un actor ni prueban la verdad de su afirmación.

El original se conserva en `sources/<sha256>.json`. Cada revisión se guarda en `records/<id>/<número>.json` con el actor de registro, fecha de registro, autor original, clase de evidencia, registro completo, SHA del registro, localizador `entries[n]`, SHA de la fuente y SHA de la revisión anterior. No se reescriben revisiones anteriores. Las fuentes y desacuerdos históricos permanecen en esas revisiones aunque una revisión posterior los reformule. El sistema no fusiona observaciones semánticamente semejantes ni decide que dos actores sostienen la misma posición: esa conciliación requiere una decisión documentada del principal.

Reimportar el mismo contenido ya retenido no crea otra revisión. Una nueva serialización del documento original se conserva, pero no crea una revisión espuria si el registro canónico no cambió. Los identificadores que sólo difieren en mayúsculas se rechazan para evitar colisiones en Windows. No se admiten claves JSON duplicadas, números no finitos ni identificadores de dispositivos reservados.

## Estados de decisión

Se admiten `proposed`, `triaged`, `selected`, `implemented`, `verified`, `resolved`, `deferred`, `rejected` y `reopened`. Una decisión de selección exige una razón y `decision.authorization_refs` referidas a una autorización que ya exista. Esas referencias son declarativas: intake no determina si son suficientes, no las convierte en permisos y no amplía el ámbito del harness.

Un aplazamiento o rechazo exige `decision.reconsideration`. Una observación resuelta o rechazada debe pasar explícitamente a `reopened` antes de una nueva revisión sustantiva. Para registrar `implemented`, `verified` o `resolved`, se requieren artefactos concretos con ruta y SHA y una declaración de límites. Las afirmaciones de verificación o resolución también necesitan referencias de evidencia. Se almacenan como afirmaciones vinculadas a una candidata, no como recibos emitidos o aprobados por esta utilidad. Implementar no demuestra eficacia; registrar una resolución tampoco cierra un ciclo del harness.

El modo de triaje es una nueva entrada con el mismo ID y una decisión actualizada, importada como revisión. No hay un comando que sobrescriba el estado anterior ni un botón de aprobación general. Toda salida declara `authority_effect: none`.

## Invocación

Los argumentos `--source` y `--store` son rutas relativas a una raíz existente. El almacén debe ser un subdirectorio dedicado de `qa-private`; la utilidad no escribe resultados en el producto. Ejemplo de validación:

```powershell
python tools/feedback_intake.py --root 'C:\Mamá ITLP 2026 Ago-Dic\sendero-matematico' --store qa-private/ciclo-c5-20261021/feedback validate --source qa-private/ciclo-c4-20261021/feedback-intake-propuesta.json --source-sha256 SHA256_REAL
```

Para importar se sustituye `validate` por `import` y se añade `--actor /root`. Para preparar una propuesta:

```powershell
python tools/feedback_intake.py --root 'C:\Mamá ITLP 2026 Ago-Dic\sendero-matematico' --store qa-private/ciclo-c5-20261021/feedback propose --ids C2-FINAL-ITEM DESIGN-FRICTION-01 --objective 'Intervención acotada previamente autorizada' --name siguiente-implementacion
```

La propuesta se crea únicamente en `proposals/siguiente-implementacion.json` dentro del almacén. Contiene `findings` con los campos `id`, `disposition` y `reason` que utiliza el plan existente, más los vínculos a revisiones, observaciones originales, fuentes, métricas propuestas, ámbito y desacuerdos. Una observación `selected` produce una disposición propuesta `implement`; las demás producen `defer`. Esa disposición no ejecuta nada. El archivo declara `executable_plan: false` y no contiene `changes`, allowlists ni recibos.

Antes de usar esos hallazgos, el principal debe confirmar la autorización y el ámbito vigente, completar cambios concretos, hashes de precondición y candidata, artefactos para revisión y umbrales de validación. Las fuentes del defecto se conservan con su versión de intake; la propuesta indica que no las ha actualizado. Un cambio posterior puede exigir una nueva revisión. El harness existente conserva sus propios controles de aplicación, verificación y revisión independiente.

## Escritura, recuperación y límites

Un bloqueo exclusivo permite un escritor de intake por almacén. Las fuentes, revisiones, transacciones y commits se escriben como archivos inmutables para esta utilidad. `head.json` es un puntero pequeño al último commit y se reemplaza atómicamente después de escribirlo. Si existe un archivo inmutable con bytes diferentes, la operación se detiene: no lo repara sobrescribiendo la historia.

La transacción prepara el contenido de las revisiones y el commit antes de publicar HEAD. Al reintentar una importación, intake comprueba la siguiente transacción por su ruta exacta. Antes de promover cualquier archivo, coteja cada registro con `entries[n]` de la fuente conservada y verifica su hash, el hash de la revisión, el vínculo con la revisión anterior, el actor, el localizador, las clases de evidencia y los hashes de los destinos ya existentes. Reconstruye el mapa esperado de registros a partir del HEAD previo más las revisiones y exige coincidencia exacta con el commit: no permite perder identidades anteriores, omitir cambios ni incorporar otras. También valida los enlaces parent y la contabilidad de bytes antes de continuar. Esta comprobación es histórica; no relee un archivo de evidencia mutable para presentar su versión actual como si fuera la observada originalmente. Una interrupción anterior a preparar la transacción puede dejar una fuente original sin referencia; se conserva y un reintento puede reutilizarla. La utilidad no recorre directorios ni elimina huérfanos automáticamente.

Una excepción manejada libera el bloqueo. Una terminación abrupta del proceso puede dejar `writer.lock`: intake se detiene en vez de inferir que el escritor murió. Sólo después de comprobar que el proceso anterior se detuvo debe retirarse ese archivo exacto y reintentarse la importación. La prueba de recuperación utiliza una excepción controlada antes de publicar HEAD; no acredita resistencia ante un fallo físico del disco ni una caída completa del sistema operativo. El reemplazo atómico y el bloqueo del proceso tampoco impiden que otra aplicación ajena al protocolo modifique archivos. Los hashes permiten detectar los cambios en los archivos leídos, sin releer todo el historial en cada invocación.

Cada fuente admite hasta 1 MiB; cada observación canónica, 128 KiB; cada lote, 50 entradas; cada almacén, 200 IDs estables; cada propuesta, 20 IDs y 256 KiB de salida. Se limitan las lecturas lógicas a 8 MiB y las escrituras lógicas a 4 MiB por invocación, con reserva conservadora del lote y de la recuperación antes de promover contenido. Se contabilizan los bytes de datos de intake, incluidos los del bloqueo; no son E/S física, metadatos del sistema de archivos o actividad de otros procesos. El contador conservador de datos de importaciones comprometidas tiene un límite de 32 MiB; no pretende medir el espacio físico total del directorio, las propuestas ni posibles archivos huérfanos. La salida de consola está limitada a 8 KiB.

Las lecturas se hacen en bloques de hasta 64 KiB y sólo sobre rutas explícitas. Se rechazan traversal, rutas absolutas en argumentos relativos, flujos alternativos de Windows, componentes reservados, `.git`, archivos `.env`, symlinks y puntos de reanálisis. Las comprobaciones no constituyen aislamiento frente a un proceso adversario que cambie rutas durante una llamada del sistema operativo; el almacén debe permanecer bajo control del proyecto. No se ejecutan comandos del contenido ni se importan plugins externos.

## Validación dirigida prevista

La suite contiene 14 pruebas con fixtures pequeños en un directorio temporal: validación de sólo lectura; original exacto e idempotencia; revisión enlazada sin sobrescritura; nueva serialización sin revisión espuria; selección y aplazamiento como fragmento no ejecutable; hashes discordantes; traversal y rutas de Windows; clases, estados e IDs inválidos; detección de revisión alterada; recuperación de una promoción interrumpida; exclusión mutua y presupuesto; resolución documentada y reapertura; rechazo de symlink cuando el entorno permite crearlo; y rechazo de una transacción pendiente internamente inconsistente antes de avanzar HEAD o promover sus revisiones. Este último caso altera por separado una afirmación, la preservación de un registro anterior, el parent del commit, los bytes contabilizados y el localizador de origen. La prueba de symlink puede quedar omitida por las capacidades de Windows; una omisión debe informarse, no contabilizarse como aprobada.

Los tests no modifican el producto, no consultan la nube y no necesitan builds, instalaciones ni procesos residentes. El principal realiza una única tanda secuencial tras el registro de recursos y cuota. Se recomienda `PYTHONDONTWRITEBYTECODE=1` para evitar cachés de Python. `FEEDBACK_METRICS_FILE` permite guardar el resultado compacto del runner y los bytes lógicos observados; no incluye datos de producto ni credenciales. Las cuotas públicas se registran en el ledger correspondiente y no se infieren de esta suite. El mero hecho de que estos archivos existan no acredita que las pruebas se hayan ejecutado ni que los revisores hayan aceptado la candidata.

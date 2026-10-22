# Contrato C4: conciliación de cierres y procedencia

Estado de este contrato: candidato para revisión docente y crítica. La existencia del archivo y de las pruebas preparadas no acredita su ejecución ni autoriza el siguiente ciclo. C4 calcula recuentos de evidencia disponible; no introduce una calificación de aprendizaje, una precisión global ni una comparación de capacidades personales.

## Universo y unidad

La unidad del panel es un cierre admisible único. Se distinguen tres tipos: `session` (partida individual), `project` (construcción individual) y `participation` (participación de un perfil en una partida multijugador). Una partida con preguntas de varios niveles sigue siendo un cierre. Una participación cooperativa que contiene una construcción sigue siendo una participación; no se añade otro cierre por su proyecto interno. Cuatro participantes no equivalen a cuatro partidas compartidas: este contrato cuenta sus cuatro participaciones.

En perspectiva docente, las entradas proceden de `state.teacher`, las construcciones de cada grupo de `state.teacherProjects` y `state.teacherMultiplayer`. En perspectiva local proceden de `state.sessions`, `state.workshopHistory` con `state.profile` y `state.multiplayerHistory`. Un contenedor presente pero malformado genera una entrada inválida identificada por su ruta. Un contenedor ausente o una lista vacía aportan cero entradas. Los grupos de proyectos se expanden una sola vez por construcción, nunca por misión o nivel.

La identidad canónica es la serialización JSON de `[classId, profile, kind, id]`. El aula proviene de la instantánea de la asignación, de un `classId` explícito conservado en el registro o grupo, o de metadatos de recepción o importación que coinciden con la clave de sesión y el perfil. Si estas fuentes discrepan, la entrada es inválida. El aula vinculada actualmente al dispositivo no se utiliza para completar historiales. Cuando no consta un ámbito, `classId` es `null`; esto constituye un ámbito desconocido, no un aula real ni una identidad global del alumno. La deduplicación en ese ámbito sólo compara los campos que se conservaron y puede no distinguir episodios históricos de aulas distintas que perdieron su contexto.

Las construcciones y participaciones históricas no conservan necesariamente aula o procedencia. C4 hace visible esta ausencia sin atribuir retrospectivamente la sincronización de una sesión individual a los demás tipos.

## Validación, duplicación y exclusión

La identidad básica debe ser admisible. Después se distingue la ausencia de fecha de cierre de una fecha malformada. Una entrada con identidad y sin cierre se clasifica como incompleta. Para cierres declarados se reutilizan `validateReport`, `validWorkshop` y `validateMultiplayerRecord`. Un contenido que esos validadores no admiten se excluye como formato o contenido incompatible con esta versión, conservando su código original en el ledger. No se interpreta esta incompatibilidad como error del alumno.

La comparación canónica ordena claves de objetos, conserva el orden de los arrays y considera el contenido completo del registro. No se compara el orden incidental de las claves JSON. La deduplicación ocurre antes de cualquier clasificación por ítems, niveles o categorías. Una propiedad adicional `project` en una partida individual no se interpreta como construcción: sólo las participaciones pueden aportar un proyecto anidado validado. Un fallo inesperado de clasificación conserva todas las entradas afectadas como exclusiones explícitas, sin interrumpir todo el panel ni descartarlas silenciosamente.

Si todas las copias admisibles de una identidad contienen el mismo payload, se incluye una y se omiten las demás como duplicadas. Si la misma identidad tiene payloads distintos, todas sus variantes se clasifican como conflictivas, incluidas las copias equivalentes a una variante: no se elige una ganadora por fecha ni orden. Esta regla también impide conservar silenciosamente una variante válida junto a otra malformada de la misma identidad. Las copias idénticas que ya eran inválidas o incompletas siguen teniendo esa exclusión; no se elevan a cierres por duplicación.

El ledger contiene una fila por entrada de origen y conserva la igualdad:

`inputEntries = canonicalEntries + duplicates + incomplete + invalid + conflicting`.

Los filtros se aplican después de construir el universo canónico y no borran filas del ledger:

`canonicalEntries = visibleEntries + filteredOut`.

## Particiones y pertenencias

Las cinco particiones exclusivas son `group`, `student`, `game`, `content` y `source`. Cada cierre pertenece exactamente a una categoría de cada partición. Todas incluyen la opción `__unknown__`, rotulada «Sin clasificar», incluso si su recuento es cero. Cada suma de categorías debe coincidir con `visibleEntries`.

El grupo usa la instantánea normalizada de escuela, grado y grupo conservada en el cierre, junto con el aula conocida o desconocida. Si falta uno de esos tres datos escolares, se utiliza «Sin clasificar» y se conservan los datos parciales en `record.enrollment`. No se sustituye la instantánea por la matrícula actual, no se fusionan escuelas por semejanza y no se ignoran diferencias de escritura que podrían pertenecer a grupos distintos. La normalización elimina únicamente diferencias de formato admitidas por `normalizeEnrollment`.

`student` identifica `[classId, profile]`. `totals.profiles` es el número de perfiles contextualizados visibles, no el número verificado de personas. Un mismo código de perfil en dos aulas conocidas cuenta como dos perfiles contextualizados. La suma de `profileCount` entre grupos históricos no es un total de alumnos: un mismo perfil puede aparecer en varios grupos. `memberships.groups` informa el total de pertenencias, la unión de perfiles y los solapamientos.

Las modalidades exclusivas son `assigned`, `race`, `free-write`, `free-choice`, `construction`, `multiplayer-race` y `multiplayer-coop`. Una tarea asignada tiene prioridad como modalidad, conservando el resto del registro para examinar sus condiciones. El contenido primario se toma únicamente del `trail` explícito reconocido por el catálogo. Una construcción válida sin un `trail` primario queda en «Sin clasificar»; no se elige el primer tipo de misión como categoría curricular. Un `trail` incompatible que invalida el formato queda en el ledger de exclusiones.

`memberships.content` conserva los tipos de misión de las construcciones o el contenido explícito de las partidas; `memberships.levels` conserva todos sus niveles. Son conjuntos de pertenencias con unión de claves de cierres, recuento de pertenencias y exceso de pertenencias sobre cierres únicos. No son particiones: no se suman sus filas como si fueran episodios distintos.

## Procedencia

`server-read` corresponde a una consulta docente con metadatos `source: server-read` y `confirmedAt`. `server-observed` corresponde a `client-observed-server-read`: consta la consulta, pero la fecha fue observada por el cliente. `server-acknowledgement` conserva un acuse del alumno con `receivedAt`; no se convierte en consulta docente. `manual-import` usa el marcador real del importador, `teacherConfirmations[sessionKey].source: manual-file`, con su fecha y ámbito. El código `local-store` significa únicamente que el cierre está disponible en el estado local de este perfil que recibe la función. Ese estado puede estar sólo en memoria: el cálculo no comprueba `setItem` ni acredita persistencia, autoría o envío. Cuando no existe un marcador admisible en perspectiva docente, se utiliza `__unknown__`.

Los marcadores de recepción se comprueban por clave de sesión, perfil, aula, clase de fuente y fecha. Son evidencia conservada por la aplicación, no atestaciones firmadas ni una prueba independiente de integridad histórica. Estar en `state.teacher` no basta para clasificar una entrada como recibida del servidor. Un timestamp de consulta tampoco es la fecha de primera recepción.

## API del cálculo puro

`summarizeReconciliation(state, teacher = false, filters = {})` no escribe en `state`, no accede a almacenamiento o red y no ejecuta temporizadores. Los filtros admitidos son `group`, `student`, `game` y `content`; cada valor es una clave textual obtenida de `options`. La cadena vacía representa «Todos». `__unknown__` selecciona «Sin clasificar». Un valor válido sin coincidencias produce cero observaciones y conserva las opciones para salir del filtro.

El resultado contiene `totals`, `partitions`, `ledger`, `options`, `records`, `allRecords`, `filters`, `diagnostics` y `memberships`. `records` contiene los cierres canónicos visibles y `allRecords` el universo anterior a filtros. Cada registro contiene `key`, `kind`, `classId`, `profile`, `id`, `sourceRecord`, `enrollment`, `provenance`, `dimensions`, `labels`, `contentMemberships` y `levels`. `sourceRecord` es una copia separada de la fuente; modificarla no modifica el estado de la aplicación. `labels` contiene texto para cada una de las cinco dimensiones, que la vista debe escapar al producir HTML.

`partitions[dimension]` es una lista de `{value, label, count, denominator, profileCount, keys}`. Su denominador es siempre el número de cierres visibles, no los perfiles. `options[dimension]` es una lista de `{value, label, count}` calculada sobre el universo canónico previo a filtros. `totals.kinds` y `totals.canonicalKinds` tienen las claves `session`, `project` y `participation` para los conjuntos visible y global, respectivamente.

`ledger` devuelve `{index, path, kind, key, classId, profile, id, originalTrail, status, reason, visible, canonicalIndex?}` sin payload. Los estados son `included`, `duplicate`, `incomplete`, `invalid` y `conflicting`. `RECONCILIATION_STATUS_LABELS` exporta sus etiquetas. Un cierre filtrado conserva `status: included` y `visible: false`; no se transforma en entrada inválida.

`diagnostics` contiene `conservationDifference`, `inclusionDifference`, `partitionDifferences`, `unknownClassClosures`, `noObservations` y `limits`. Las diferencias deben ser cero, pero esa igualdad no sustituye la verificación del conjunto exacto de claves ni demuestra que la fuente original estuviera completa. `unknownClassClosures` se refiere al universo global. Los registros ausentes de los arrays recibidos son desconocidos para este cálculo.

`totals.evidenceUnits` cuenta elementos realmente presentes: preguntas de partidas individuales, preguntas de participaciones, misiones de construcciones individuales, misiones cooperativas y sus comprobaciones respectivas. Las comprobaciones incluyen las de verificación posterior cuando existen. Se mantienen seis contadores independientes; no se suman preguntas, misiones y comprobaciones como un denominador común. No se calculan porcentajes, medias de porcentajes, dominio curricular ni rendimiento global. Cero denominador significa «sin observaciones».

## Métricas previas a validación

La matriz base contiene exactamente cuatro perfiles por tres tareas asignadas: 12 entradas, 12 cierres, cuatro perfiles contextualizados y 96 preguntas realmente enumeradas. El conjunto de claves debe coincidir exactamente con el esperado. El escenario mixto contiene 16 cierres: 14 partidas, una construcción y una participación; cinco perfiles contextualizados por la segunda aula. Debe conservar cuatro cierres con el mismo ID distribuidos por aula o tipo y un cierre adicional de práctica libre con cuatro niveles, sin multiplicarlo. Ese escenario contiene 112 preguntas individuales, ocho preguntas de participación, ocho misiones de construcción y ocho comprobaciones de construcción; las otras unidades tienen cero observaciones.

Doce reenvíos equivalentes elevan las entradas a 24, conservando 12 cierres y 12 duplicados. Una identidad con una variante discrepante y una copia adicional produce 14 entradas, 11 cierres y tres entradas conflictivas. El escenario de ausencias y formatos inválidos contiene 17 entradas: 12 cierres, una incompleta y cuatro inválidas. El escenario de contexto desconocido contiene tres cierres admitidos, todos sin aula; dos sin grupo completo y uno sin contenido primario. El conjunto vacío tiene cero entradas y cero denominadores.

Las cinco diferencias de particiones, la diferencia de conservación y la diferencia de inclusión deben ser cero en todos los escenarios. Los filtros deben conservar las exclusiones, el universo y las opciones globales, producir el conjunto exacto previsto y permitir una selección vacía. Los tests comprueban que la entrada y los filtros no cambian y que las copias devueltas no comparten el payload con el estado original.

La suite utiliza el formato de metadatos que produjo C3 como fixture autónomo. `C4_C3_EVIDENCE_FILE` permite añadir una comprobación con un único archivo absoluto explícito, de hasta 512 KiB, que contenga `teacherEvidence`; no se busca en directorios y CI no depende de archivos privados de QA. `C4_METRICS_FILE` permite guardar un informe compacto de ejecución, sin credenciales ni payloads. El informe no sustituye el resultado del runner: ante una prueba fallida puede contener escenarios parciales y debe interpretarse junto con ese resultado.

## Alcance y revisión

El profesor y el crítico coinciden en conservar desconocidos, separar tipos de evidencia, no sumar perfiles históricos ni porcentajes y conciliar por conjuntos antes de desglosar. La observación docente sobre `trail` desconocido se precisó durante el diseño: «Sin clasificar» corresponde a registros admisibles sin categoría primaria; un formato que el validador no admite permanece visible como exclusión, sin considerarlo error del alumno. Se mantiene como límite que la identidad histórica sin aula no puede reconstruirse con la vinculación actual.

Las pruebas las ejecuta el agente principal en una tanda local secuencial, después de la observación de recursos y el registro de cuota. No se añade tráfico al backend público, no se mide la cuota de Cloudflare desde esta función y no se exige una compilación adicional para verificar el cálculo. La integración visual, el CSV canónico y su validación corresponden al paquete de vista de C4 y requieren evidencia propia. El cierre del ciclo exige revisión docente y crítica de los resultados reales; este contrato no la presupone.

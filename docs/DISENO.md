# Diseño y límites técnicos

## Propósito

Ofrecer práctica matemática con dificultad gradual, ayudas comprensibles y registro de resultados durante periodos sin conectividad. La versión 0.1.0 demuestra el ciclo local y una transferencia manual por archivo. No se presenta como una solución completa de evaluación escolar remota.

## Arquitectura

HTML, CSS y módulos JavaScript sin dependencias de ejecución web. Todas las imágenes son SVG o PNG locales. Un service worker instala un conjunto cerrado de recursos y los sirve desde caché. La información de práctica se conserva en `localStorage` bajo `sendero.state.v1`; una excepción de escritura muestra un aviso persistente. El tamaño de los registros es adecuado para un prototipo pequeño, pero está sujeto a cuotas del navegador. Una edición de mayor escala debe migrar a IndexedDB o SQLite con transacciones y recuperación.

La edición Windows empaqueta los mismos archivos con Electron. Node está desactivado en el renderer; se habilitan aislamiento de contexto y sandbox. Se rechazan permisos y solicitudes HTTP/HTTPS desde la aplicación. Los enlaces externos no se abren en esa edición; su documentación identifica los destinos para consulta desde un navegador. No hay carga remota de código ni actualizador.

## Adaptación e indicadores

Las sumas y restas utilizan operandos entre 1 y 5, 10, 20 o 50 según el nivel. Las restas no producen números negativos. La multiplicación utiliza factores entre 2 y 3, 5, 8 o 10. El nivel describe el rango numérico, no un grado escolar. No modela todas las dificultades conceptuales, como llevar o reagrupar, y no debe confundirse con una escala psicométrica.

La adaptación usa aciertos iniciales sin ayuda y necesidad de apoyo. Los tiempos no intervienen. Cada ejercicio conserva su nivel, operandos, opciones, intentos, pista y tiempo estimado. Se preservan versión del software y fechas. Las preguntas son generadas localmente y no constituyen formas equivalentes de una prueba estandarizada.

La corrección al segundo intento debe interpretarse dentro de un sistema de respuesta múltiple: descartar opciones también puede facilitar la respuesta. No demuestra aprendizaje, retención ni transferencia a otro contexto.

## Transferencia manual

El archivo JSON contiene `schema`, `version`, `profile`, `exportedAt` y `sessions`. La importación limita tamaño y cantidad de sesiones, valida estructura y aritmética, y deduplica por identificador de sesión. No contiene firma criptográfica: un archivo alterado de forma consistente puede pasar la validación. No debe usarse como comprobante de autoría o examen supervisado.

## Evolución hacia sincronización protegida

Una futura versión requerirá vinculación segura entre estudiante y docente, almacenamiento local transaccional, una cola de envíos pendientes, confirmaciones del servidor, reintentos idempotentes y separación entre fecha de actividad y fecha de recepción. El panel distinguirá resultados no recibidos de falta de actividad; no deducirá asistencia a partir de conectividad. Las nuevas asignaciones y la retroalimentación también deberán poder descargarse para periodos prolongados.

Un canal de investigación deberá extraer exclusivamente variables autorizadas, con minimización y revisión del riesgo de reidentificación. Retirar nombres no convierte automáticamente los registros longitudinales en anónimos. Esta funcionalidad no está activa en el prototipo.

## Evidencia curricular

El repositorio, una versión publicada, su licencia, los archivos fuente, las pruebas y la evaluación técnica constituyen documentación del desarrollo. No acreditan por sí solos validación en campo, transferencia institucional, eficacia educativa ni aceptación en una convocatoria. La asignación de un nivel TRL o de una categoría curricular deberá apoyarse en evidencia adicional y en la normativa aplicable.

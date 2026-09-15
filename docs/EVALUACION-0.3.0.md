# Evaluación de Sendero 0.3.0

## Alcance

Revisión técnica y editorial interna del banco, la selección adaptativa, la interfaz y la distribución. No es un estudio con niños ni una validación de eficacia, atractivo o alineación curricular completa. El estado de la publicación y los artefactos se registra en `RELEASE-0.3.0.json`.

## Ciclo 1: contenido y funcionamiento

Se construyeron las situaciones originales y su banco parametrizado; se integraron la selección sin reemplazo, los conjuntos reservados y los informes v2. La ejecución Android `35026690103` pasó compilación, pruebas unitarias, lint y cuatro pruebas integradas por API 34, 35 y 36. Incluyó corrección visible, recreación de pantalla, persistencia, perfiles, contraseñas e importación deduplicada. Chrome y WebView permanecieron deshabilitados durante las pruebas.

La inspección editorial detectó que una categoría irrelevante coincidía sistemáticamente con el resultado en los problemas de datos. Se hizo independiente. También se amplió la familia de representación a suma, resta y multiplicación, y se añadió preferencia por contextos diferentes. El número final de variantes se determina después de esas correcciones, no por la primera construcción.

## Ciclo 2: diversidad, repaso y revisión visual

Se incorporó repaso programado de operaciones con dificultad independiente de razonamiento. La revisión visual verificó legibilidad, respuesta centrada con exclamaciones y acceso mediante desplazamiento en pantalla pequeña. Las pruebas web completaron una aventura, conservaron un error al recargar sin conexión, validaron el informe y comprobaron anchos de 320 y 1280 píxeles.

La ejecución Android `35027166123` aprobó las pruebas funcionales, pero falló la automatización adicional de actualización: los botones de los diálogos se exponían en mayúsculas y las coordenadas de los campos cambiaban al abrir el teclado. Se corrigió el procedimiento para comparar etiquetas sin distinguir mayúsculas y recorrer los campos mediante foco. Ese fallo no se presenta como una actualización aprobada.

## Ciclo 3: candidato final

Se corrigió una explicación que mencionaba la tercera categoría aunque la categoría descartada podía aparecer en otra posición. La elección de expresiones multiplicativas se retiró del nivel inicial. El banco final tiene 6 270 enunciados únicos, 128 situaciones fuente, 16 familias, 4 696 problemas de práctica y 1 574 reservados.

Las 18 pruebas Node aprobadas recorren todos los problemas, comprueban respuestas y opciones, separación de situaciones reservadas, agotamiento sin repetición, conservación de historial, aislamiento, detección de contenido alterado, adaptación y repaso. Las cinco pruebas Java recorren 16 000 ejercicios aritméticos y comprueban el contrato de informes y adaptación. Lint final: cero errores y siete advertencias.

La ejecución final de Android es [35027880412](https://github.com/Krakaur/sendero-matematico/actions/runs/35027880412), compilada desde `d38c3ce`. Pasaron cuatro pruebas integradas por API 34, 35 y 36, doce en total. En los tres emuladores se instaló la APK sobre 0.2.0 conservando un perfil sintético, su contraseña y una respuesta pendiente. Las evidencias están en `qa-0.3.0/api*/`. RAM configurada: 2 048 MiB por emulador, sin equivalencia automática con un teléfono físico económico. El PSS observado al abrir la edición de publicación fue de 19 290, 15 742 y 19 430 KiB, respectivamente; son observaciones puntuales, no consumos máximos.

La prueba web final se ejecutó mediante `scripts/qa-web-bank.js`, usando un perfil sintético. La prueba de Windows `scripts/qa-windows.cjs` abrió el motor empaquetado desde `file:`, cargó una pregunta del banco y aceptó su respuesta sin errores de página. Se comprobó que todos los archivos web incluidos en `app.asar` coinciden con los del directorio de construcción.

## Tamaño, arquitectura y límites

La APK final ocupa 386 882 bytes e incluye SQLite de contenido; el verificador no encontró WebView, bibliotecas por arquitectura ni permisos solicitados. La base de contenido sin comprimir ocupa 3 899 392 bytes y se copia al espacio privado al preparar la aplicación. El tamaño del APK no equivale al espacio instalado ni a memoria RAM. El ejecutable Windows ocupa aproximadamente 100 MB al incluir Electron, y permanece sin firma comercial.

Las capturas son de perfiles sintéticos. Persisten las limitaciones de evaluación física, ayudas externas no observables, lectura inicial, contraste entre familias de dificultad distinta, revisión docente y cobertura curricular parcial. El registro de respuestas no mide asistencia, cooperación ni argumentación oral. No se abrió un canal de investigación ni un servicio de sincronización.

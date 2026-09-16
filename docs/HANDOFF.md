# Estado de continuidad

## Auditoría de alcance posterior a 0.3.2

Leer primero `AUDITORIA-DE-ALCANCE.md`. Web/Windows no tienen todavía perfiles múltiples ni login. La transferencia docente es manual, no existe recogida anonimizada para investigación y la cobertura curricular es parcial. El bloque de resultados requiere una revisión de comprensión. Esta auditoría no implementa esas funciones; explicita las diferencias entre lo solicitado, lo publicado y lo validado. No presentar la disponibilidad de artefactos como cumplimiento integral del alcance.

## Web 0.3.2: carrera y recuperación de versiones anteriores

La escena de cálculo cambia a una carrera individual por un río, con movimiento no bloqueante, precisión inicial y rapidez del nivel actual. Se migra automáticamente el ejercicio aritmético resuelto que 0.3.0 dejó pendiente; no se repite la adaptación. Queda superada la excepción histórica descrita abajo que permitía conservar ese botón. El service worker activa la caché nueva completa y la interfaz ofrece aviso de actualización. `actualizar.html` permite actualizar desde una interfaz antigua sin borrar datos.

Leer `EVALUACION-WEB-0.3.2.md`. Pasaron 22 pruebas de lógica, interacción y layouts en Chromium/Firefox, migración 0.3.0 a 0.3.2 en Firefox, y actualización por enlace directo en Chromium con conservación del perfil, respuesta y adaptación y recarga offline. Los ensayos usan perfiles sintéticos. Las descargas nativas y Windows siguen en 0.3.1. La estética debe evaluarse como parte de la jugabilidad; no hay todavía validación con niños o prueba física en el teléfono del usuario.

## Versión 0.3.1: fluidez e interacción

El cálculo avanza al acertar sin confirmar “Siguiente”. La corrección visible continúa hasta seleccionar el resultado correcto; razonamiento conserva el avance deliberado. Leer `ARCADEMICS-FLUIDEZ-Y-MEDICION.md` y `EVALUACION-0.3.1.md` antes de modificar estadísticas. `timingProtocol: 1` y `firstResponseMs` distinguen la primera respuesta; las interrupciones, pistas y registros antiguos se excluyen de rapidez. La tasa es de respuesta durante práctica, no de carrera continua ni de capacidad matemática general. Los datos anteriores no se recalculan retrospectivamente. Un ejercicio ya resuelto antes de actualizar puede conservar su botón de avance pendiente.

Workflow final aprobado: `35046952836`; fuente nativa `2bcbe2e1f8c76577ef5422a682c6d9ae25e788bd`; APK 389 594 bytes, versionCode 3, misma firma. Pasaron 22 pruebas Node, seis Java y cuatro instrumentadas por Android 14/15/16; también actualización desde 0.2.0, web offline y Windows empaquetado. La igualdad de números JSON se normaliza al deduplicar informes Android. No hay cambios en banco, perfiles, permisos ni protocolo de transferencia manual. Los hashes constan en `RELEASE-0.3.1.json`.

La inspección directa de Arcademics confirmó avance con una selección y distinción entre precisión de intentos y acierto inicial; la cuenta Basic impidió verificar algoritmos y datos detallados de Plus. No se modificó la cuenta ni se incorporaron expedientes de estudiantes. Siguen pendientes prueba de fluidez con condiciones fijas, análisis por operación, armonización de bandas cromáticas entre plataformas y validación física/educativa.

## Versión 0.3.0: banco sin IA en el dispositivo

La versión 0.3.0 incorpora un banco de 6 270 enunciados, 128 situaciones y 16 familias, con 1 574 problemas reservados. Android, web y Windows incluyen el mismo contenido, selección sin reemplazo y preferencia por redacciones y contextos recientes diferentes. Cálculo y razonamiento tienen estados independientes; las tablas ampliadas llegan al 20 y el cálculo incorpora revisión programada. No se incorpora IA offline ni un servicio generativo.

El banco se construye con `scripts/build-bank.py`. La base SQLite de contenido está separada de los perfiles; no cambiar el contenido de una versión publicada. Una ampliación futura debe preservar identificadores y soportar informes de bancos anteriores. Leer `BANCO-Y-APRENDIZAJE.md`, `EVALUACION-0.3.0.md`, `BANK-MANIFEST.json` y `RELEASE-0.3.0.json`. La cobertura SEP sigue siendo parcial; no presentar la revisión interna como revisión docente independiente ni validación educativa.

Android conserva paquete y firma de 0.2.0, ahora con versionCode 2. Workflow aprobado `35027880412`, fuente compilada `d38c3ce`. APK 386 882 bytes, sin permiso de internet ni WebView. Pasaron 18 pruebas Node, cinco pruebas Java y cuatro pruebas instrumentadas por API 34/35/36. Se comprobó actualizar desde la APK pública 0.2.0 manteniendo perfil, contraseña y respuesta pendiente. Se comprobó una aventura web offline y apertura del banco en Windows empaquetado. Pruebas físicas y con niños siguen pendientes.

Informes nuevos: `sendero.report.v2`; se admite v1 al importar. Los receptores anteriores deben actualizarse para recibir v2. Android tiene perfiles con contraseña; web y Windows conservan un perfil por instalación. Sin backend ni investigación activa. El catálogo CSV de revisión está disponible como `Banco-Sendero-0.3.0.zip` en Releases; no es un paquete importable por la app.

Los apartados siguientes son históricos y no sustituyen estas decisiones.

## Continuación: Android nativo 0.2.0

Publicación experimental disponible en `https://github.com/Krakaur/sendero-matematico/releases/tag/v0.2.0`. APK: 50 848 bytes; Android mínimo 14/API 34, objetivo 16/API 36. Workflow aprobado: `35018784587`, fuente compilada `39878e2c0c4814d4bbc7b9eaa1ddfbf0a648bbc6`. La web ofrece esta APK y conserva Windows 0.1.1. El SHA-256 de la descarga pública coincide con el del paquete de CI. Pruebas físicas pendientes.

La decisión posterior amplía el alcance: `native-android/` implementa una edición sin WebView, con ocho perfiles locales protegidos por contraseña y SQLite. El paquete es `org.krakaur.sendero.nativo`; no sustituye ni migra automáticamente la edición híbrida. Leer `ANDROID-NATIVO.md` y `EVALUACION-NATIVA.md` para conocer sus límites y resultados efectivos. La instrucción histórica de posponer la implementación nativa, conservada abajo, queda superada por esta continuación. iOS continúa pendiente.

No hay backend ni investigación activa. Las contraseñas controlan el acceso local, pero no cifran toda la base ni los informes exportados. La recuperación remota de claves, copia integral protegida, identidad docente y entrega con confirmación siguen pendientes. Los informes recibidos se mantienen separados de la práctica propia.

## Versión 0.1.1

Fuentes, juego, documentación y pruebas en `main`. La publicación web utiliza `gh-pages`. Windows, APK y AAB se distribuyen en la publicación de versión. No hay backend, credenciales de estudiantes, analítica ni canal de investigación activo. La APK usa WebView del sistema, con recursos incorporados y sin permiso de internet; no es una edición completamente nativa.

## Decisiones implementadas

Navegación móvil prioritaria, tres contenidos, ocho pasos por aventura, cuatro niveles de cantidades, ajuste por aciertos independientes y apoyos, tiempo excluido de la adaptación, almacenamiento local, exportación JSON/CSV, importación deduplicada e indicadores descriptivos multidimensionales. Las ilustraciones son originales y se incluyen localmente.

La transferencia docente de esta versión es manual por archivo. No debe describirse como sincronización automática ni como anonimización. El perfil es un código persistente local y las fechas dependen del reloj del dispositivo. La evaluación se limita a sesiones completas.

## Continuación recomendada

La edición Android sin WebView queda pendiente como candidata para 2.0; iOS también queda pendiente, según `IOS-PENDIENTE.md`. No ampliar esta entrega con esas implementaciones. El análisis técnico está en `ANDROID-ARQUITECTURA.md`; compilación, firma y requisitos de tienda en `ANDROID-DISTRIBUCION.md`. La clave privada Android no está en Git: mantener la misma identidad para futuras actualizaciones y proteger su copia local y los secretos de compilación. Nunca adjuntar claves a publicaciones o informes.

Revisar primero la experiencia con adultos docentes y en equipos Android/Windows reales. Para una evolución institucional, sustituir el almacenamiento del prototipo por una base transaccional, diseñar vinculación e identidad, proteger expedientes y probar entrega diferida con confirmaciones y reintentos. La investigación requiere protocolo independiente. No asignar nivel TRL ni afirmar eficacia o transferencia institucional basándose solamente en la publicación.

Las ideas de difusión están en `DIFUSION.md`. No se han publicado mensajes en redes ni realizado solicitudes a catálogos externos.

El análisis de certificados, reputación, tiendas y alternativas de bajo coste está en `FIRMA-Y-DISTRIBUCION.md`. No hay compras, cuentas nuevas ni solicitudes de tiendas realizadas. Los tiempos verificables y prioridades están en `TIEMPO-Y-RETOS.md`.

> Documento histórico anterior a 0.4.0. Para el estado actualizado, consultar AVANCE-SECUENCIAL.md y EVALUACION-0.4.0.md.

# Auditoría del alcance solicitado y del estado implementado

Estado revisado sobre la fuente `8ed95ef`: web 0.3.2 y paquetes Android/Windows 0.3.1. Esta auditoría describe las funciones actuales y sus límites; no declara implementadas las correcciones pendientes. La publicación y las pruebas técnicas no equivalen al cumplimiento del alcance educativo completo.

## Perfiles y acceso

Android nativo permite hasta ocho perfiles locales con alias y contraseña. Web y Windows mantienen un registro local único: carecen de selector de estudiantes y de login. Su código de perfil identifica el registro para los informes, pero no representa un usuario autenticado. Por tanto, en esas ediciones, dos niños que usen el mismo almacenamiento del navegador o instalación pueden mezclar su práctica.

No hay cuentas en línea, vinculación entre dispositivos, recuperación remota de contraseña ni administración de una escuela. En Android las contraseñas controlan el acceso desde la interfaz; no cifran íntegramente la base ni los informes exportados. La separación de perfiles en web y Windows es un requisito previamente solicitado que no se implementó en esas plataformas.

## Entrega al docente y trabajo con grupos

Se exportan e importan informes JSON/CSV manualmente y se evitan duplicados compatibles. Falta el envío diferido automático al recuperar conectividad, una bandeja docente con recepción confirmada, reintentos de entrega y vinculación estudiante-docente. Tampoco hay roles autenticados de alumno y profesor, gestión de grupos, asignación de actividades por docente o panel institucional comparable con Arcademics Plus.

Los informes recibidos permiten consulta local. Un archivo exportado no acredita entrega, identidad del alumno ni autoría de sus respuestas. El progreso puede conservarse sin conexión, pero eso no implica sincronización posterior entre equipos.

## Resultados, progreso y evaluación

Se registran intentos, primera respuesta, ayudas, tiempos y sesiones completadas; existen barras multidimensionales y desglose por contenido y dificultad. La captura del bloque de fluidez evidencia una presentación demasiado técnica: porcentajes sin encabezados suficientemente claros, notación `n`, exclusiones temporales y fórmula en primer plano. Falta una lectura inmediata que identifique estudiante, periodo, actividad, aciertos, errores y evolución, con los detalles metodológicos en un segundo nivel.

La tasa actual es de aciertos iniciales por tiempo hasta la primera respuesta. No se ha establecido su equivalencia con la tasa de Arcademics. Las sesiones adaptativas pueden contener distintos niveles; no constituyen todavía una prueba de rapidez con condiciones fijas. Las bandas cromáticas tampoco están completamente armonizadas entre plataformas ni validadas como umbrales de dominio.

El registro describe práctica en la aplicación. No mide asistencia escolar, atención, cooperación, argumentación oral ni mejora causal del aprendizaje. Los informes incluyen sesiones completas; la actividad pendiente se conserva localmente, pero no funciona como expediente integral exportable.

## Contenido y cobertura curricular

Se implementaron cálculo adaptativo, tablas ampliadas hasta el 20 y un banco de 6 270 enunciados derivados de 128 situaciones y 16 familias. La selección evita repetir entradas hasta agotar el conjunto y favorece variedad reciente. No es un banco de 6 270 estructuras narrativas independientes y no elimina indefinidamente la repetición léxica.

La cobertura SEP/NEM es parcial. Falta el mapeo exhaustivo por grado y proceso de desarrollo de aprendizaje, así como completar los contenidos ausentes descritos en `BANCO-Y-APRENDIZAJE.md`. Los problemas de contexto social no implementan por sí mismos cooperación entre estudiantes. La revisión del contenido ha sido interna; faltan revisión docente independiente y pilotaje. Para niños que todavía no leen faltan narración y apoyos suficientes para uso autónomo.

## Investigación

No hay canal de recopilación para investigación, anonimización implementada ni estudio iniciado. Los identificadores persistentes y las fechas de los informes actuales permiten vincular registros: se trata de datos seudonimizados, no de un conjunto anónimo. Faltan un protocolo separado, decisiones de acceso y conservación, procedimiento de participación y revisión ética aplicable. La posibilidad de investigar fue un objetivo adicional, no una función entregada.

## Distribución, compatibilidad y conservación

Existen web publicada, ejecutable Windows, APK y AAB firmados. Android nativo funciona sin WebView y se ensayó en emuladores Android 14, 15 y 16. No hay publicación en Play Store, App Store ni Microsoft Store. Windows continúa sin firma Authenticode y sin resolución demostrada de las barreras de reputación en equipos de destino.

iOS está documentado como trabajo futuro; no existe una compilación de Sendero para iPhone. Fue un aplazamiento explícitamente aceptado. La experiencia visual del río de web 0.3.2 no se ha trasladado a los paquetes Android/Windows 0.3.1.

Faltan pruebas físicas en teléfonos de gama baja y evaluación con usuarios. Las pruebas de navegador, escritorio y emuladores son evidencia técnica útil, pero no sustituyen esos ensayos. También falta una copia integral protegida que restaure perfiles, contraseñas, adaptación y partidas: importar un informe de sesiones no proporciona esa restauración.

## Difusión y documentación académica

Existen metadatos web básicos, documentación pública y propuestas de difusión. No se han ejecutado campañas, publicaciones en redes ni solicitudes de inclusión en catálogos. No hay un mecanismo implementado de donación o apoyo equivalente a los considerados inicialmente.

El código y su documentación aportan evidencia de desarrollo de software. No se ha confirmado una incorporación al CVU ni deben presentarse la descarga pública o las pruebas automatizadas como adopción institucional, transferencia tecnológica o eficacia educativa.

## Referente Arcademics: alcance de la inspección

Se observaron selección de respuestas, avance inmediato, resultados de partida y la estructura de informes por estudiantes, grupos y materias. La revisión del 16 de septiembre de 2026 UTC volvió a mostrar indicadores de ejercicios contestados y tiempo, representación conjunta de precisión y rapidez y una matriz por operación con leyenda cromática. La cuenta mostraba el aviso de Arcademics Basic sin informes; no se verificaron con expedientes completos los algoritmos de dominio ni toda la experiencia autenticada de un estudiante. No corresponde afirmar que Sendero ya reproduce ese sistema.

## Prioridad de corrección

La primera corrección funcional debe separar estudiantes en web/Windows y hacer visible el perfil activo sin perder los datos existentes. La presentación de resultados debe distinguir un resumen comprensible de los detalles técnicos, manteniendo las fórmulas y las exclusiones auditables. Después corresponde definir e implementar la recepción docente diferida. La cobertura curricular completa y el protocolo de investigación constituyen trabajos adicionales de alcance mayor.

Fuentes de comprobación: `web/app.js`, `web/core.js`, `web/fluency.js`, `native-android/app/src/main/java/org/krakaur/sendero/nativo/MainActivity.java`, `Store.java`, `docs/HANDOFF.md`, `docs/BANCO-Y-APRENDIZAJE.md`, `docs/EVALUACION-WEB-0.3.2.md`, `docs/RELEASE-0.3.1.json`, `docs/FIRMA-Y-DISTRIBUCION.md`, `docs/IOS-PENDIENTE.md` y `docs/DIFUSION.md`.

# Intervención secuencial del catálogo · Sendero web 0.9.0

14 de octubre de 2026. Base: web 0.8.0, fuente `545fc4a`, sitio publicado desde `42681384a74c790a55a8d450fb5e17459c24e98e`. Objetivo: corregir primero el desequilibrio entre la carrera y el razonamiento; después, abordar las deficiencias funcionales restantes del análisis. La publicación efectiva y sus hashes se registran en `qa-web-0.9.0/publication.json` cuando concluye la comprobación pública.

## Primera pasada: diversidad de acciones matemáticas

El catálogo original tenía cinco rutas: sumas, restas, multiplicación, tablas ampliadas y razonamiento. Las cuatro primeras compartían una mecánica aritmética; los 6.630 problemas y variantes de razonamiento no eran 6.630 juegos diferentes. Esta intervención conserva el banco y añade ocho diseños manipulables: equilibrio de cantidades, reparto equitativo, arreglos de filas y columnas, partes iguales, perímetro y superficie, selección de datos, regularidades y planificación de trayectos. Los cuatro niveles modifican cantidades; no equivalen a cuatro grados escolares ni garantizan una progresión curricular completa.

El ciclo nuevo exige construir un modelo válido y seleccionar una explicación que corresponda a su relación matemática. Un error, una pista o una explicación incorrecta activan una segunda construcción con cantidades diferentes: copiar el modelo resuelto anterior no basta para pasarla. Las notas libres son opcionales y se conservan sin calificación automática. La validación de una explicación elegida entre opciones es limitada; no se presenta como prueba de argumentación autónoma, comprensión general o transferencia lejana.

La evidencia guarda por separado modelos comprobados, errores, explicaciones elegidas, ayuda, comprobación posterior y nota. La recarga conserva la construcción pendiente; completar y recargar no duplica el historial. El respaldo protegido incluye estos registros. El servidor docente solo recibe proyectos y notas cuando se activa expresamente ese envío. La exportación y recepción docente mediante archivo funcionan sin servidor, deduplican proyectos y rechazan sustituciones incompatibles. Los proyectos compartidos se mantienen fuera del expediente individual porque pueden involucrar colaboración.

## Segunda pasada: correcciones del resto del sistema

| Problema observado | Cambio aplicado | Comprobación y límite |
| --- | --- | --- |
| La práctica tranquila repetía selección de opciones y la escena anterior | Respuesta escrita, modelos explorables y escena de progreso integrada con el bosque en las cuatro rutas aritméticas | Se completaron ocho ejercicios por ruta, conservando error escrito, ayuda y corrección; no se afirma preferencia infantil |
| Las métricas podían mezclar acciones de respuesta diferentes | Grupos separados para carrera, práctica histórica con opciones y nueva práctica escrita | Prueba de tasas distintas en tres series; se conserva la comparación por contenido y nivel |
| El banco revelaba la respuesta tras el primer error | Orientación inicial y apertura explícita de la solución explicada | Recorrido completo; solicitar solución queda registrado como ayuda |
| Navegación fija sobre las ayudas de razonamiento | Navegación en el flujo del documento | Comprobación a 1280 × 720; controles y desbordamiento revisados desde 320 px |
| Razonamiento excluido del juego compartido | Cooperación con los ocho proyectos, dos personas en una pantalla o dos a cuatro por enlace | Dos recorridos locales y uno por red de cuatro participantes; sin posición ni columna de tiempo en el cierre |
| Un invitado saliente bloqueaba la sala | Liberación de plazas en espera y sustitución de participantes desconectados | Salida, liberación y entrada de otra persona comprobadas |
| Recargar perdía identidad o avance de la sala | Identidad de reconexión, recuperación del anfitrión y pausa conjunta antes de reanudar | Carrera completa tras recargar ambos extremos y proyecto recuperado por enlace; depende de conservar la sesión de esa pestaña |
| Abandono permanente durante una partida | Nuevo recorrido explícito con quienes continúan conectados | No se adjudica una victoria ni se transforma el abandono en un resultado individual |
| No había continuidad remota del perfil | Copia cifrada por invitación, recuperación con contraseña y rechazo de revisión obsoleta | Receptor HTTP local y navegador con instalaciones aisladas; no es sincronización automática ni cuenta pública |
| Panel docente insuficiente | Recepción de proyectos, emisión y revocación de invitaciones, tareas de razonamiento | Probado con datos sintéticos; el alojamiento público y la administración escolar permanecen pendientes |

## Verificación reproducible

`npm test` aprobó 74 pruebas. Incluyen 3.200 configuraciones matemáticas factibles, 640 comprobaciones posteriores que exigen una construcción distinta, integridad de respaldos, aislamiento de invitaciones, rechazo de escrituras obsoletas, deduplicación, entrega voluntaria de proyectos y separación de formatos de respuesta. Las 3.200 configuraciones no son 3.200 niños, partidas observadas ni actividades pedagógicamente independientes.

Los scripts `qa-web-workshop.js`, `qa-web-catalog.js`, `qa-web-shared-projects.js`, `qa-web-network-projects.js`, `qa-web-room-recovery.js` y `qa-web-cloud-ui.js` recorren la interfaz con perfiles sintéticos. El catálogo y la cooperación local se comprobaron en Chromium y Firefox. La sala por enlace completó 32 proyectos —ocho por participante— con resultados coincidentes y reconexión de un invitado. La prueba aritmética comprobó la recarga del anfitrión y del invitado. La señalización y los canales WebRTC fueron reales, pero los navegadores estaban en un solo equipo físico; eso no valida NAT, redes escolares, dispositivos móviles o conexiones de distinta calidad.

La prueba del aula en Firefox verificó guardado cifrado, recuperación en otra instalación aislada, conservación de proyecto pendiente e historial, conflicto de escritura, recepción docente, emisión y revocación de invitación y creación de tarea. El receptor usó exclusivamente datos sintéticos en memoria y loopback. No constituye un despliegue público ni una auditoría independiente de seguridad.

Se revisaron controles, desbordamiento y capturas a 1280 × 800, 1280 × 720, 390 × 844, 320 × 568 y 854 × 480 según el flujo. Los controles de proyecto se comprobaron con un mínimo de 43 px por lado, tolerancia de medida respecto al objetivo de 44 px. El enlace de salto situado fuera de pantalla puede aparecer en capturas de página completa desplazada; su estado normal se verificó sin foco y con `top: -80px`. No se sustituyó una prueba con lector de pantalla por esta inspección.

## Respaldo, publicación y límites pendientes

Antes de sustituir la web se preservó `qa-private/public-web-backup-20261014-cycle7/`: 46 archivos HTTP coincidentes con la rama publicada, ZIP completo, hashes y procedimiento de restauración. El ZIP tiene 48 entradas contando directorios y no presenta errores de CRC. Los datos de perfiles están en cada navegador; este respaldo del sitio no copia esos datos personales. Una instalación sintética 0.8.0 con historial y carrera pendiente se preparó para verificar la actualización pública a 0.9.0, conservación de intentos y funcionamiento sin conexión.

La web estática puede publicarse en GitHub Pages. Un aula remota requiere otro servidor, HTTPS, almacenamiento persistente y administración; no se ha contratado ni desplegado ese servicio. La implementación disponible permite prepararlo, pero no convierte una dependencia pendiente en una función pública operativa. Las cuentas con correo, recuperación administrativa, fusión automática de progreso, migración del anfitrión y TURN propio siguen ausentes.

La intervención mejora acciones matemáticas y continuidad funcional; no demuestra superioridad global sobre Arcademics. Permanecen pendientes observación con niños, revisión didáctica independiente, cobertura curricular completa, aprendizaje y retención medidos, dispositivos físicos y redes diferentes. Atractivo, preferencia y audio se reservaron para otro turno. Android y Windows distribuidos continúan en 0.4.0.

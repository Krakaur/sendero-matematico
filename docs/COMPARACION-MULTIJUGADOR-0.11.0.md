# Multijugador, perfiles escolares y seguimiento docente

Fecha: 14 de octubre de 2026. Versión evaluada: Sendero web 0.10.0; intervención: 0.11.0. Referente: Grand Prix Multiplication y, por separado, las funciones de aula documentadas de Arcademics Plus.

## Alcance y evidencia

La inspección directa del juego ejecutado dentro de su iframe confirmó el recorrido PLAY → alias de jugador → lobby, con acceso rápido, pestañas pública y privada y un formulario de creación de sala que distingue juegos públicos y privados mediante contraseña. No se entró a partidas de terceros. La documentación oficial describe el alta docente de estudiantes, sus credenciales, asignaciones, seguimiento de resultados, secciones e importación masiva. No se accedió a un aula autenticada de Arcademics Plus: sus funciones se consideran documentadas por el proveedor, no ensayadas en esta evaluación. La ausencia de un campo en el flujo gratuito no demuestra su ausencia en Plus.

La evaluación de Sendero se basa en el código, pruebas automatizadas y recorridos con datos sintéticos. No constituye un estudio con alumnos ni acredita preferencia, eficacia didáctica o equivalencia de conexión entre redes. Audio y atractivo quedan fuera de este ciclo.

## Comparación funcional

| Dimensión | Arcademics: evidencia disponible | Sendero antes de la intervención | Cambio o limitación de 0.11.0 |
|---|---|---|---|
| Entrada al multijugador | Alias breve y lobby público/privado observados en Grand Prix | Dos personas en una pantalla; salas privadas por enlace para 2–4 | Se conserva el acceso como invitado; se añade asociación privada con perfiles. No hay búsqueda pública de rivales |
| Continuidad del perfil | Plus documenta credenciales docentes y acceso desde distintos dispositivos | Perfiles locales y copias cifradas de aula; partidas compartidas fuera del expediente | Registro separado de la participación de cada perfil, exportable y sincronizable. Cambiar de equipo sigue requiriendo recuperar una copia; no hay inicio de sesión central equivalente a Plus |
| Adscripción escolar | Plus documenta secciones e importación de estudiantes; no se verificaron sus campos internos | Sin escuela, grado, grupo ni número de lista | Cuatro campos opcionales en alta y edición; no se pide nombre personal. Registro histórico por actividad |
| Organización del aula | Plus documenta secciones, asignaciones específicas y acceso compartido entre docentes | Invitaciones individuales y tareas comunes de aula | Filtros por escuela, grado, grupo, número de lista y contexto. Falta importación de matrícula, catálogo institucional y validación docente de adscripciones |
| Resultados | Plus documenta tendencias, informes de desempeño y PDF | Análisis individual y de proyectos; resultados compartidos efímeros | Participaciones separadas de sesiones individuales; resúmenes por nivel/contenido/modalidad y CSV detallado/agregado |
| Cooperación y razonamiento | El Grand Prix observado se presenta como carrera de multiplicación; no se evaluó el catálogo completo | Carrera o cooperación; construcción y justificación en ocho proyectos | Se conserva evidencia de construcción cooperativa sin mezclarla con fluidez individual. Las notas libres del juego compartido no se envían |
| Identidad ante compañeros | Alias de jugador observado | Personajes predeterminados | Alias local, escuela y número de lista permanecen fuera del estado de sala; no hay chat, cámara ni micrófono |
| Conexión y autoridad | Servicio multijugador alojado; documentación de configuración de red | WebRTC/PeerJS, anfitrión en navegador, pausa/reconexión | El aula persiste en Workers/D1; el servidor de aula no dirige las carreras. No se añade TURN ni migración de anfitrión |

El déficit principal era la desconexión entre partida compartida y seguimiento escolar. Se corrige la persistencia y organización del registro, pero no la dependencia del anfitrión ni la administración escolar completa. La nueva tabla estadística no vuelve equivalente a Sendero con una plataforma de aula consolidada.

## Modelo de datos y análisis

Cada perfil conserva una adscripción actual y cada actividad nueva incorpora una copia de ella. Un cambio posterior de grupo no modifica el pasado. Los registros antiguos sin adscripción siguen sin ella; no se les atribuye retrospectivamente la matrícula actual. El número de lista acepta enteros de 1 a 999 y no es una clave global: puede repetirse entre escuelas o grupos. La identidad técnica del perfil sostiene la deduplicación. Las diferencias de mayúsculas, espacios y normalización Unicode se homogeneizan para agrupar; nombres institucionales realmente distintos no se fusionan mediante conjeturas.

El nivel de cantidades del juego (1–4) y el grado escolar son variables diferentes. Los resultados se separan por escuela, grado, grupo, contenido, nivel, contexto y modalidad de conexión. Se distinguen práctica individual, rivales digitales, escritura, construcción, competición entre personas y cooperación. No se calcula fluidez individual a partir de una partida compartida.

El porcentaje por ejercicio es 100 × aciertos iniciales / ejercicios observados. La media por estudiante es el promedio de ese porcentaje calculado primero dentro de cada perfil; evita que quien practica más domine por completo el resumen. N cuenta perfiles, no personas verificadas. No se deben sumar filas de niveles diferentes para obtener alumnos únicos. El indicador «sin ayuda» significa sin pista registrada y con respuesta inicial correcta; no detecta ayuda humana externa. En construcción, exige además completar la justificación al primer intento.

Los datos sirven para descripción y seguimiento. No bastan para atribuir aprendizaje al juego: faltan diseño de investigación, condiciones comparables, verificación de participantes y control de exposición y ayuda. Los informes multijugador son declaraciones de clientes, no ejecuciones certificadas por un servidor autoritativo. Los CSV están destinados al docente autorizado y contienen identificadores indirectos; no son archivos anonimizados para publicación científica.

## Privacidad, acceso y operación

Escuela, grado, grupo y número de lista pueden identificar indirectamente a un alumno. Por ello no se incluyen en mensajes WebRTC, invitaciones de partida, personajes ni clasificaciones públicas. Se conservan localmente y pueden enviarse al aula privada vinculada. Compartir participaciones multijugador requiere activar una opción específica. Cada estudiante solo envía su participación; la misma pantalla admite dos perfiles distintos, sin necesidad de compartir sus contraseñas con el otro dispositivo.

El servidor comprueba rol, aula, perfil asociado a la invitación, formato, tamaño e inmutabilidad de cada informe. Los reenvíos idénticos no duplican resultados; una modificación con el mismo identificador se rechaza. La adscripción actual puede actualizarse, pero no altera informes anteriores. Las copias cifradas incluyen los nuevos datos; el almacenamiento activo del navegador no está cifrado. Las invitaciones siguen siendo credenciales privadas.

El envío de adscripción solo se repite al cambiarla. Cada ciclo de sincronización envía como máximo una participación compartida y recibe como máximo cuatro por página. Se conservan los límites diarios del servicio y el retroceso temporal ante errores de cuota. No se activan productos de pago. El anfitrión sigue necesitando mantener abierta la pestaña de la partida; el backend de aula no convierte esa partida en una sesión independiente de los navegadores.

## Validación y prioridades siguientes

La batería de pruebas incluye normalización, campos inválidos, escape de HTML y fórmulas CSV, dos expedientes separados, conservación histórica, respaldo cifrado, ausencia de datos escolares en el estado transmitido, proyectos cooperativos, medidas estadísticas, autorización por aula, envío voluntario, paginación, idempotencia y rechazo de cambios de informes ya recibidos. El acta local de validación registra ejecución, comprobaciones de interfaz, despliegue y consumos observados; no contiene datos de alumnos reales.

La siguiente prioridad funcional es simplificar el acceso entre dispositivos y disponer de una matrícula revisable por el docente. Después corresponde evaluar conectividad en redes escolares reales, recuperación cuando el anfitrión abandona y sesiones coordinadas por el aula. Un lobby público no debe añadirse solo para reproducir Grand Prix: requiere decisiones específicas sobre acceso, moderación y población participante. La comparación de experiencia con niños y la evaluación de aprendizaje requieren estudios propios; no pueden sustituirse por una puntuación arbitraria de calidad.

## Fuentes

[Grand Prix Multiplication](https://www.arcademics.com/games/grand-prix): inspección del iframe y flujo de entrada, 14/10/2026.

[How It Works](https://www.arcademics.com/how-it-works): alta, asignaciones y reportes de Plus, consulta 14/10/2026.

[Frequently Asked Questions](https://www.arcademics.com/faq): modalidad gratuita, importación masiva, secciones, acceso docente compartido y reportes PDF, consulta 14/10/2026.

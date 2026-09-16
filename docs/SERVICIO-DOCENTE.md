# Receptor docente: implementación y operación pendiente

El receptor Node 24 utiliza SQLite y claves de invitación separadas para docente y estudiante. La clave de estudiante queda vinculada al identificador del primer informe aceptado. El servidor confirma los identificadores de sesiones recibidas, deduplica reintentos idénticos y rechaza cambios incompatibles en una sesión ya recibida. Cada clave docente accede solamente a su aula. Las tareas del aula indican contenido y título; orientan práctica adaptativa, no acreditan cumplimiento curricular o una evaluación supervisada.

La web guarda la lista de confirmaciones y reintenta al terminar una aventura, al recuperar conexión y cada minuto mientras la aplicación permanece abierta y visible. Un navegador cerrado no ejecuta esos reintentos. Desvincular la invitación detiene nuevos envíos; no elimina lo ya recibido. El receptor no recibe alias ni contraseñas locales. Sí recibe identificadores, fechas y respuestas, que constituyen registros vinculables, no anónimos.

## Prueba local y puesta en marcha

Requiere Node 24 con `node:sqlite`. `node server/cli.mjs` abre el receptor en 127.0.0.1:4180. El directorio de datos predeterminado es `server/private`, excluido de Git. Se puede sustituir mediante `SENDERO_DATA`. Con `SENDERO_ENDPOINT` definido, `node server/cli.mjs create-class "Nombre del grupo"` crea un aula y guarda una invitación docente y ocho invitaciones individuales en el directorio privado. Una invitación estudiantil es para un solo perfil, no para compartir entre toda la clase. No publicar esos archivos ni incorporarlos a una captura o informe público.

La persona adulta importa la invitación en «Docentes → Vincular con un aula» y confirma el servidor de destino. El tipo de invitación debe coincidir con el perfil local. En el servicio de producción se define `SENDERO_ORIGINS` con los orígenes web autorizados; la edición Windows requiere valorar y permitir explícitamente el origen `null` de archivos empaquetados. El ejecutable permite únicamente solicitudes HTTPS del tipo usado por la aplicación; mantiene bloqueados scripts y navegación externa.

Producción requiere administrador, dominio HTTPS, proxy inverso, almacenamiento persistente, copias protegidas y procedimiento de revocación. No existe un receptor público desplegado. GitHub Pages no ejecuta este servidor: [documentación oficial](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). La API SQLite utilizada está descrita en [Node 24](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).

El administrador puede revocar una invitación eliminando su registro de acceso en la base, conservando el informe recibido para tratamiento conforme a la política del centro. Antes de uso real faltan interfaz de administración, rotación de claves, recuperación de acceso, borrado trazable, paginación y pruebas de carga/abuso. La posesión de una invitación autentica el permiso técnico, no la identidad civil ni la condición profesional de docente.

## Evidencia

`tests/classroom.test.js` inicia un receptor HTTP real sobre una base temporal: crea aula, publica tarea, transmite informe válido, comprueba confirmación y deduplicación, impide lectura estudiantil de expedientes, impide modificación de tareas por alumnos y verifica revocación. Son datos sintéticos. Esta prueba no equivale a despliegue HTTPS, evaluación independiente de seguridad ni recepción en el teléfono de un docente.

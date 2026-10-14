# Servicio de aula en Cloudflare

## Estado de esta migración

Servicio desplegado el 14 de octubre de 2026 en `https://sendero-aula.dirkhans.workers.dev`, con D1 `sendero-aula-db`. La prueba remota sintética completó 23 solicitudes, 143 filas leídas y 70 escritas registradas por D1: entrega docente, recuperación cifrada, separación de roles y revocación. Estas cifras son de un ensayo, no una proyección de capacidad. El cliente 0.10.0 está publicado en GitHub Pages; sus 52 archivos coinciden byte a byte con Git. La publicación automática del backend sigue pendiente de la validación final.

En las 35 invocaciones de los dos primeros ensayos, el panel de Workers registró CPU mediana de 3,726 ms, percentil 90 de 6,321 ms y percentil 99 de 8,709 ms, sin errores ni excesos de CPU. La duración de pared mediana fue 179 ms. La muestra es pequeña y no incluye carga concurrente representativa; no extrapolar un máximo de estudiantes o partidas.

El frontend se conserva en GitHub Pages. Workers ejecuta únicamente la API docente y sirve una pequeña interfaz administrativa; D1 conserva tareas, informes y copias cifradas. El navegador sigue ejecutando el juego y cifrando/descifrando las copias. No hace falta mantener una computadora como servidor. Las partidas entre dispositivos siguen usando WebRTC/PeerJS: la pestaña anfitriona debe permanecer abierta; esta migración no incorpora un servidor dedicado de partidas ni TURN.

## Publicación reproducible

La configuración está en `cloudflare/wrangler.jsonc`, y el esquema inicial en `cloudflare/migrations/0001_classroom.sql`. Wrangler está fijado por versión y archivo de dependencias. El identificador D1 debe corresponder a la base creada en la cuenta del titular. No utilizar cuentas temporales de vista previa. El flujo propuesto en `.github/workflows/web.yml` publica desde `main` mediante GitHub Actions: primero pruebas y empaquetado, después migraciones aditivas de D1 y Worker, y finalmente GitHub Pages. Utiliza Node 24 y `ELECTRON_SKIP_BINARY_DOWNLOAD=1`.

La credencial de despliegue necesita exclusivamente Workers Scripts (editar), D1 (editar) y Account Settings (leer), restringidos a la cuenta de destino. Su valor se conserva como secreto cifrado `CLOUDFLARE_API_TOKEN` del repositorio, sujeto a autorización del titular; nunca como archivo versionado. Solo se entrega al paso que publica, después de instalar dependencias, y nunca a una ejecución de pull request. El identificador de cuenta es metadato no secreto. No habilitar Workers Builds además de Actions: produciría despliegues duplicados. El panel de Builds ofrecía crear un token con permisos adicionales innecesarios; esa opción no se activó.

La acción GitHub `Web and classroom checks` ejecuta las pruebas y el empaquetado del Worker en las propuestas. En `main`, publica únicamente `web/` mediante GitHub Pages después de pasar. No incluye `server/private`, archivos de investigación, respaldos, claves ni datos de estudiantes. Pages debe usar GitHub Actions como origen de publicación. La autorización de publicación del titular permanece vigente.

El secreto `ADMIN_TOKEN_HASH` contiene exclusivamente SHA-256 de una clave aleatoria de 256 bits. La clave original se conserva en un archivo privado `sendero.admin.v1`, con `endpoint` y `token`, fuera del repositorio. La interfaz administrativa recibe ese archivo, mantiene la clave en memoria de la pestaña y permite crear aulas y descargar invitaciones docentes. No existe recuperación de claves por correo. Para cambiar el acceso administrativo se sustituye el secreto en Cloudflare y se entrega otro archivo al titular; las aulas existentes permanecen.

## Límites y conservación

Mantener Workers Free y D1 Free. No activar Workers Paid, R2, Containers ni servicios con cargos variables. El límite del proveedor corta el servicio; una alerta de presupuesto de un plan de pago no equivale a un corte. Las cuotas gratuitas de Workers/D1 son compartidas por la cuenta, no exclusivas de Sendero.

La aplicación añade límites conservadores: 10.000 solicitudes autenticadas por día UTC y 1.000 por invitación. Al alcanzarlos devuelve 429 con la espera hasta el siguiente día. No constituyen una medición completa de facturación: accesos no autenticados, errores y preconsultas CORS también pueden consumir Workers. Los contadores no sustituyen el panel del proveedor. Un error de almacenamiento devuelve 503 y el cliente espera antes de reintentar; el juego local conserva su información. `SERVICE_ENABLED=false` permite detener la API conservando la base.

Los informes se entregan y reciben por lotes de hasta cuatro registros. Los índices por aula y secuencia permiten consultas incrementales. Las copias siguen cifrándose en el navegador con AES-256-GCM/PBKDF2; se transmiten en fragmentos de 64 KiB, con límite de 9 MiB de texto cifrado. La confirmación cambia atómicamente la versión visible. Un guardado desactualizado, incompleto o de otro perfil no sustituye la copia actual. Se conservan temporalmente cargas inconclusas y una versión anterior; se recogen durante usos posteriores. Las invitaciones revocadas no acceden y se eliminan sus copias, pero permanecen los informes ya entregados.

No migrar automáticamente perfiles reales de los navegadores. Su titular debe guardar una copia o vincularse al aula de forma explícita. La nube no implica sincronización continua de todos los perfiles: los informes completos se transfieren con invitación y las copias cifradas requieren guardar/recuperar deliberadamente. Las notas de proyectos siguen sujetas a la opción de compartirlas.

## Verificación y reversión

`npm test` incorpora pruebas contra workerd/Miniflare y D1 local: aislamiento entre aulas, permisos, paginación, idempotencia y conflicto de registros, recuperación cifrada, carga superior a 2 MB, guardado incompleto, escritores simultáneos, revocación y cuota agotada. D1 local no demuestra latencia ni CPU de producción.

Antes y después de cada prueba remota, consultar consumo de Workers y D1 y registrar el intervalo, número de peticiones, respuestas, encabezados `X-D1-Rows-Read`/`X-D1-Rows-Written` y métricas disponibles del proveedor. Utilizar exclusivamente datos sintéticos, pocas peticiones y sin bucles de reintentos. Distinguir CPU, duración de pared y duración de la partida. No inferir eficacia educativa ni capacidad masiva de una prueba funcional.

Antes de cambiar la web se conserva `qa-private/public-web-backup-20261014-cloudflare/`, con ZIP de la rama publicada, 52 archivos HTTP, hashes y guía de restauración; todos coincidieron con `28938f73c98a1fdae6e9a0b762b7073c297177ef`. Para revertir el frontend, restaurar los archivos del respaldo en `web/` mediante un nuevo commit, sin reescribir la historia. Para revertir el Worker usar una versión anterior compatible con el esquema o pausar el servicio; no borrar la base. La migración inicial es aditiva y no reemplaza una base remota previa.

El dominio personalizado es independiente del servicio. Las direcciones de GitHub Pages y `workers.dev` no dependen de renovar ese dominio. Los importes y renovaciones de la cuenta se conservan en el registro privado, no en el código público.

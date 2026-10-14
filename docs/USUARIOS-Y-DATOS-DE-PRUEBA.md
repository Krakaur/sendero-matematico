# Ubicación de los datos y usuarios de prueba

La web pública se aloja en GitHub Pages. El código fuente y el esquema SQL de `cloudflare/migrations/` pueden documentarse en el repositorio público, pero una carpeta llamada `hidden`, un archivo sin enlace o una regla `robots.txt` no proporcionan autorización de acceso. GitHub Pages publica archivos estáticos; no es el alojamiento de una base de datos privada. Véase la [documentación oficial de Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

El servicio privado del aula usa Cloudflare Workers y la base D1 `sendero-aula-db`. Las invitaciones autorizan el acceso a una sola aula y a un rol. Los perfiles web todavía se crean localmente; únicamente los perfiles vinculados al aula envían los registros habilitados. Esto no constituye aún un registro central con inicio de sesión automático desde cualquier dispositivo. El diseño pendiente está en `CONTINUIDAD-MULTIJUGADOR.md`.

La administración está en `https://sendero-aula.dirkhans.workers.dev/`; su interfaz no contiene la base de datos y sus operaciones requieren autenticación. Los administradores también pueden usar el panel autenticado de Cloudflare. La documentación pública no incluye credenciales, invitaciones, expedientes ni volcados de D1. `server/private/`, `.wrangler/` y `qa-private/` están excluidos del repositorio; ninguno forma parte del directorio `web/` publicado por Pages.

## Identificación de pruebas

Desde esta intervención, los perfiles sintéticos nuevos usan el código textual de seis posiciones `000001`, `000002`, etc., hasta `000999`. En la interfaz actual este código se introduce como alias. Se conserva como texto, con ceros iniciales, y se mantiene separado del número de lista escolar, que es numérico. El UUID interno sigue siendo independiente: los códigos no son contraseñas, no otorgan acceso y no deben utilizarse como clave única entre aulas.

Cada corrida conserva un manifiesto privado con su identificador, fecha, entorno, código de prueba, UUID real del perfil y aula o acceso, cuando exista. Las pruebas unitarias usan `qa-000001`, etc., como identificadores sintéticos en almacenamiento efímero. La comprobación de navegador de la versión 0.12.0 usa los alias `000001` a `000004` únicamente en localhost, sin invitación de aula ni envío al servidor público.

## Eliminación posterior

La limpieza se prepara a partir del manifiesto de una corrida concreta y de su entorno, mostrando los registros afectados antes de ejecutar el borrado. Un prefijo por sí solo no basta para borrar datos: un usuario podría haber elegido un alias similar. También se debe comprobar la correspondencia exacta con el UUID y, en D1, con el aula.

Revocar una invitación impide el acceso, pero no equivale necesariamente a eliminar todos los informes históricos. La limpieza debe comprobar por separado accesos, matrícula, informes individuales, proyectos, participaciones multijugador y copias cifradas, respetando las relaciones del esquema. Antes de una eliminación definitiva, conservar el respaldo autorizado y verificar que no se incluye ningún perfil real. Esta intervención identifica los perfiles de prueba; no ejecuta su eliminación ni publica un volcado de usuarios.

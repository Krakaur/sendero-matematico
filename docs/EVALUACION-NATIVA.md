# Evaluación de Sendero Nativo 0.2.0

## Estado

**Candidata experimental publicada, con validación técnica en emuladores Android 14, 15 y 16.** No se ha realizado una prueba física con un teléfono ni una evaluación con niños. Las capturas emplean perfiles sintéticos. Código compilado: `39878e2c0c4814d4bbc7b9eaa1ddfbf0a648bbc6`; [ejecución aprobada](https://github.com/Krakaur/sendero-matematico/actions/runs/35018784587). El manifiesto `NATIVE_BUILD_MANIFEST.json` conserva hashes, tamaños y evidencias.

## Tres ciclos de revisión

El primer ciclo comprobó aritmética, ajuste de dificultad, contraseñas, separación de perfiles, persistencia y transacciones de importación. Se corrigieron tres errores de constantes de orientación detectados por lint. El segundo añadió rotación y texto al 150 %; las pruebas funcionales pasaron en Android 6 y 16, pero la auditoría mostró que un comando de desactivación consumía la lista de paquetes y dejaba activo el proveedor WebView en Android 16. Se corrigió el procedimiento y se impuso una comprobación de todos los paquetes. El tercero conservó capturas para revisión visual y añadió una apertura del APK firmado. La inspección encontró una etiqueta partida con texto ampliado; se ajustaron tamaño y denominación de navegación, se incorporaron botones redondeados con respuesta táctil y se eliminó una asignación de memoria dentro del dibujo. La comprobación final se concentra en el rango solicitado Android 14–16.

Estos ciclos son revisiones técnicas y heurísticas; no equivalen a validación pedagógica ni a estudios de atractivo con el público destinatario. La ilustración es vectorial y local; los controles son nativos. Se prioriza legibilidad y respuesta sobre animaciones persistentes.

## Incidencias y límites de la exploración previa

La exploración API 23 produjo dos ejecuciones funcionales aprobadas y posteriormente un cierre del proceso de instrumentación con crecimiento del heap y mensajes del gestor de baja memoria. No se determinó una causa única; no se presenta como compatibilidad certificada con Android 6. La edición publicada declara Android 14 como mínimo, conforme al rango solicitado. Una ejecución API 36 falló al descargar el emulador (archivo ZIP inválido); las siguientes pudieron ejecutarse. Esas incidencias se distinguen de fallos de lógica del juego.

La automatización verifica lógica, almacenamiento y navegación; la protección al volver del segundo plano y el selector de archivos real forman parte del protocolo físico que sigue. Los informes no constituyen copia integral del perfil.

## Protocolo para el teléfono Android disponible

Registrar modelo, versión Android, memoria si se conoce, tamaño del APK y espacio instalado mostrado por el sistema. La persona adulta instala desde el enlace de la publicación y anota cualquier aviso. La primera apertura debe funcionar en modo avión; no se debe solicitar configurar un navegador ni descargar actividades.

Crear dos perfiles con alias ficticios y contraseñas distintas. Completar un camino con el primero, salir y entrar con el segundo: su avance debe estar vacío y comenzar en nivel 1. Probar una contraseña incorrecta y cambiar la correcta desde el perfil autenticado. Pasar a otra aplicación y regresar debe bloquear el acceso; girar la pantalla debe conservar la partida abierta.

Responder mal deliberadamente: la solución completa debe aparecer centrada, destacada y con signos de exclamación. Cerrar la aplicación, reiniciarla y volver a entrar debe conservar esa corrección y el intento. Completar el camino, ampliar el texto desde Android y verificar que los controles y las cifras siguen accesibles.

Exportar JSON y CSV, comprobar que pueden abrirse con herramientas disponibles, y recibir el JSON desde el otro perfil. Importarlo otra vez no debe duplicar sesiones. Los registros recibidos no deben modificar la dificultad ni la práctica del receptor. Anotar cómo se entrega realmente el archivo al docente y si necesita conectividad.

Finalmente comprobar una actualización firmada con el mismo identificador y clave cuando exista una segunda versión nativa. No desinstalar ni borrar datos para actualizar: eliminar la aplicación borra los perfiles. El informe exportado conserva sesiones completas para consulta, pero no es una copia integral para recuperar contraseñas o partidas.

Los problemas deben reportarse con versión, pasos y datos sintéticos. No adjuntar contraseñas, expedientes ni información de menores a issues públicos.

## Resultados finales

Cinco pruebas unitarias aprobadas, incluidas 12 000 preguntas generadas; dos pruebas integradas aprobadas por versión de Android (seis ejecuciones), más instalación y apertura del APK de publicación en cada emulador. Lint: cero errores y siete avisos (cinco sobre versiones de dependencias de prueba y dos sobre comprobaciones de SDK que ahora son redundantes). Las once pruebas del motor web anterior también pasaron; no representan una prueba de la interfaz Android.

| Android | API | RAM configurada | Pruebas integradas | Apertura fría del APK | PSS inicial |
| --- | --- | --- | --- | --- | --- |
| 14 | 34 | 2048 MiB | 2/2 | 1346 ms | 18 608 KiB |
| 15 | 35 | 2048 MiB | 2/2 | 893 ms | 16 306 KiB |
| 16 | 36 | 2048 MiB | 2/2 | 1668 ms | 18 507 KiB |

Son observaciones únicas en emuladores acelerados, sin perfiles en la apertura del APK; no son máximos de memoria ni mediciones de teléfonos económicos. PSS atribuye proporcionalmente memoria compartida al proceso. Los informes conservan también RSS y otras categorías; no debe confundirse el tamaño del APK con la memoria o espacio instalado.

La inspección del APK encontró 50 848 bytes, ausencia de permisos solicitados, recursos web y bibliotecas nativas por arquitectura. No existe referencia a `android.webkit.WebView` en el DEX y el proceso reportó cero WebViews. El AAB ocupa 38 924 bytes y fue validado estructuralmente con bundletool. La firma del APK fue verificada y los hashes publicados se comprobaron localmente.

En los tres emuladores se comprobaron Chrome y el proveedor de WebView deshabilitados. En API 35/36, el servicio conserva el nombre del paquete preferido, pero su propio informe indica que no está instalado/habilitado para todos los usuarios; no se interpreta ese nombre conservado como un proveedor utilizable. En API 34 el paquete actual aparece nulo. Véanse los archivos `qa-native/api*/`.

La revisión visual final confirma la corrección centrada y destacada, botones redondeados, orientación horizontal con desplazamiento y navegación legible al 150 %. La atracción visual y comprensión por niños siguen sin evaluación empírica. Las comprobaciones de cierre de sesión en segundo plano, archivos mediante el selector de cada fabricante y actualizaciones sucesivas permanecen en el protocolo físico.

![Inicio nativo](qa-native/api36/sendero-01-home.png)

![Solución visible después de un error](qa-native/api36/sendero-02-correction.png)

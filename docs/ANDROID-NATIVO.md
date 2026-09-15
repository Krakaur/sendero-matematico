# Sendero Nativo: compatibilidad y decisión de arquitectura

## Alcance

La edición 0.2.0 implementa los ejercicios y la interfaz mediante componentes del sistema Android, con almacenamiento SQLite. No incorpora WebView, HTML, JavaScript, Chromium ni un motor gráfico descargable. Funciona desde la instalación sin conexión; el selector de documentos del sistema permite exportar e importar archivos. No solicita permisos de red, ubicación, contactos o acceso general al almacenamiento.

Se distribuye con identificador `org.krakaur.sendero.nativo`, diferente de la edición híbrida `org.krakaur.sendero`. Ambas pueden coexistir. Instalar la edición nativa no transforma ni borra los datos de la anterior. Un informe JSON de sesiones completas puede recibirse para consulta; esa importación no restablece una partida ni convierte registros de otro perfil en práctica propia.

## Compatibilidad hacia equipos antiguos y recientes

La configuración establece Android 6/API 23 como mínimo y Android 16/API 36 como objetivo, sin versión máxima. El mínimo define dónde se permite instalar; el objetivo declara el comportamiento moderno que debe respetar la aplicación. Un objetivo reciente no exige que todos los usuarios tengan esa versión del sistema. Esta distinción está descrita en la documentación de [uses-sdk](https://developer.android.com/guide/topics/manifest/uses-sdk-element) y en los [requisitos de API objetivo](https://developer.android.com/google/play/requirements/target-sdk).

La aplicación no contiene bibliotecas nativas dependientes de una arquitectura de procesador. Los controles emplean tamaños independientes de densidad y texto escalable; el contenido se desplaza, admite orientación horizontal y respeta las áreas ocupadas por las barras del sistema. No hay límite máximo de versión, bloqueo de orientación ni descarga de fuentes o imágenes. Esto reduce barreras previsibles, pero no constituye una garantía para todos los fabricantes, tamaños o versiones futuras.

Las pruebas automatizadas incluyen un emulador API 23 con 1 GB configurado y otro API 36 con 2 GB. Un emulador acelerado en un servidor no reproduce la velocidad de un teléfono económico; esa configuración comprueba comportamiento funcional, no rendimiento físico. El protocolo y los resultados efectivos se registran en `EVALUACION-NATIVA.md`.

## Alternativas consideradas y selección

| Alternativa | Beneficio | Coste o limitación para este alcance | Decisión |
| --- | --- | --- | --- |
| PWA o WebView con recursos locales | Reutilización inmediata del juego web | Dependencia de un motor web y de sus versiones; almacenamiento y preparación variables | Conservar 0.1.1 como alternativa existente |
| Framework Views de Android y SQLite | Dependencias mínimas, controles accesibles, almacenamiento transaccional, independencia de navegador | Interfaz específica de Android y mayor responsabilidad sobre consultas y migraciones | Implementar 0.2.0 |
| Jetpack Compose y Room | Herramientas modernas de interfaz y persistencia | Añaden bibliotecas y superficie de actualización; más de lo necesario para tres operaciones y pocas tablas | Reconsiderar si crecen contenidos o complejidad |
| Flutter | Una base de interfaz para varias plataformas | Motor adicional y tamaño superior; no resuelve por sí solo privacidad ni validación | Reservar para una necesidad multiplataforma comprobada |
| Godot u otro motor de videojuegos | Animación y escenas complejas | Coste de tamaño, memoria y mantenimiento sin una necesidad equivalente en este juego | No adoptarlo en esta etapa |
| Dos versiones distintas según potencia | Permite efectos específicos | Duplica pruebas y puede fragmentar informes y reglas pedagógicas | Preferir una interfaz adaptable común |

SQLite directo es una decisión acotada, no una recomendación general contra Room. Android recomienda Room para abstraer y verificar consultas; aquí se mantienen pocas tablas, parámetros enlazados, un ejecutor de entrada/salida y transacciones explícitas. Una ampliación sustancial exige reevaluar esta elección. Véase [almacenamiento SQLite](https://developer.android.com/training/data-storage/sqlite).

## Perfiles en teléfonos compartidos

Hasta ocho perfiles locales mantienen alias, contraseña, dificultad, partida actual, sesiones completas e informes recibidos separados. No se solicitan nombres reales, correo ni matrícula. Las contraseñas tienen entre 6 y 128 caracteres; se conserva una derivación PBKDF2-HMAC-SHA1 de 256 bits con sal aleatoria de 128 bits y 210 000 iteraciones, nunca el texto de la contraseña. La selección de esta primitiva conserva compatibilidad con API 23. La derivación se ejecuta fuera del hilo de interfaz. Después de cinco intentos fallidos se aplica una espera local de un minuto.

La aplicación bloquea el acceso al pasar a segundo plano y al reiniciarse; la rotación conserva la sesión abierta. Cada usuario puede cambiar su contraseña conociendo la anterior. No existe recuperación remota: una persona adulta debe custodiar la clave si el niño necesita ayuda. Antes de extender su uso deben observarse la carga de recordar contraseñas y las demoras de derivación en teléfonos reales. Una futura cuenta de tutor con recuperación requiere diseño explícito, no una contraseña universal.

Este control evita acceso casual entre usuarios de la aplicación; no cifra toda la base SQLite ni protege frente a un dispositivo comprometido, rooteado o una contraseña compartida. El retardo local tampoco es una defensa frente a un atacante que extraiga la base. Los informes exportados son legibles, sin contraseña, y contienen identificadores persistentes y fechas. Son seudónimos, no anónimos. La edición solicita protección de capturas y excluye copias automáticas de Android, pero eso no sustituye la seguridad del dispositivo ni un protocolo institucional. No se debe desplegar como gestor de expedientes escolares sensibles.

## Persistencia y evaluación

La respuesta se guarda antes de mostrar la siguiente pantalla. Completar un camino escribe la sesión y actualiza el perfil en una misma transacción. Los perfiles no comparten dificultad ni resultados. Las importaciones se validan antes de escribirse; los duplicados idénticos no se contabilizan otra vez y un identificador con contenido contradictorio cancela la transacción completa.

La dificultad sube después de tres respuestas independientes y baja después de dos respuestas apoyadas. El tiempo no participa en esa decisión. Un error muestra la solución centrada y destacada con signos de exclamación; acertar después no se registra como resolución independiente. Los cuatro indicadores tienen proporciones, barras y colores con texto. La recuperación después de error y el uso de pistas son descriptivos; no se interpretan como déficit ni se combinan en una nota global.

El registro temporal suma intervalos de interacción, limita cada intervalo a 60 segundos y excluye el segundo plano. Es aproximado: no mide atención, asistencia ni exposición completa. Los informes muestran únicamente caminos completos. La evaluación formal, la identidad verificada, el cifrado institucional y la investigación siguen siendo alcances diferentes.

## Compilar y distribuir

Se requieren JDK 17, Gradle 8.13, Android SDK 36 y Build Tools 35.0.0. Desde la raíz:

```sh
gradle -p native-android testDebugUnitTest assembleDebug lintDebug
gradle -p native-android connectedDebugAndroidTest
```

La publicación firmada se produce con el workflow `Native Android`; utiliza los secretos de firma ya configurados y no conserva la clave privada en el repositorio. Genera APK, AAB, metadatos, comprobación de firma y sumas SHA-256. El verificador impone un presupuesto de 1 MiB y rechaza permisos, recursos web o referencias a WebView en el APK. Las bibliotecas de prueba no forman parte del paquete de producción.

La firma y el AAB no equivalen a aprobación de Google Play. La audiencia infantil, las declaraciones de datos, clasificación, ficha y pruebas de la cuenta siguen pendientes. iOS requiere su propia implementación y compilación, descritas en `IOS-PENDIENTE.md`. Windows conserva su edición existente.

## Próximas soluciones con mayor valor

La siguiente inversión debe comprobar instalación, respuesta y conservación del progreso en el teléfono Android disponible, incluyendo el selector de archivos real. Después conviene diseñar una recuperación de acceso controlada por un tutor, una copia de seguridad protegida y un procedimiento de actualización conservando perfiles. Un sistema de recepción diferida con confirmación, deduplicación y vínculo docente sería posterior: requiere un destinatario autenticado y un protocolo, no solo detectar internet.

Para circulación rural, la APK puede entregarse mediante descarga previa, memoria USB o transferencia local entre dispositivos, acompañada de una guía breve para la persona adulta. La instalación externa conserva los avisos del sistema; el niño no debe tener que modificar políticas de seguridad. Una tienda puede simplificar instalación y actualizaciones, con sus propios requisitos. No se han enviado mensajes a comunidades ni realizado trámites en tiendas.

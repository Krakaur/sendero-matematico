# Compilación y distribución Android

La nueva edición **Sendero Nativo 0.2.0**, con perfiles locales y sin WebView, se compila desde `native-android/`. Declara Android 14 como mínimo y Android 16 como objetivo. Su identificador es `org.krakaur.sendero.nativo`. Consultar [su guía](ANDROID-NATIVO.md) y [evaluación](EVALUACION-NATIVA.md). La sección siguiente corresponde a la edición híbrida anterior y conserva su identidad de actualización.

Sendero 0.1.1 tiene un proyecto Android con identificador `org.krakaur.sendero`, `versionCode=2`, `minSdk=23`, `targetSdk=36` y `compileSdk=36`. El mínimo de instalación no demuestra compatibilidad con todas las versiones de WebView: véase la [evaluación de arquitectura](ANDROID-ARQUITECTURA.md).

## Paquetes y firma

La APK sirve para instalación directa; el AAB es el paquete preparado para una futura carga en Google Play y no se instala directamente. Ambos usan la misma identidad de aplicación y una clave de firma persistente. La clave privada y su contraseña no forman parte del repositorio ni de las descargas. Cambiar la clave o perderla puede impedir actualizar las instalaciones directas existentes; la futura configuración de Play App Signing debe considerar esa continuidad. La firma Android identifica continuidad de publicación; no representa validación educativa ni aprobación de una tienda.

La compilación se ejecuta desde el flujo `Android package`, con JDK 17, Gradle 8.13 y Android Gradle Plugin 8.11.1. Se generan APK y AAB de release, se reduce código y recursos no utilizados y se ejecuta Android Lint. Las fuentes web se incluyen como assets sin descargar actividades en el primer arranque. El script de verificación compara sus bytes con las fuentes, rechaza bibliotecas nativas inesperadas, comprueba la ausencia de permisos declarados y fija un límite de 5 MB para la APK.

Para reproducir la compilación, configura el SDK Android y JDK 17, y ejecuta `gradle -p android assembleRelease bundleRelease lintRelease` con Gradle 8.13. La firma se obtiene de las variables `SENDERO_KEYSTORE` y `SENDERO_STORE_PASSWORD`; nunca deben incorporarse a comandos publicados, archivos de proyecto o registros. El flujo de GitHub usa los secretos `SENDERO_KEYSTORE_BASE64` y `SENDERO_STORE_PASSWORD`. Sin la clave de publicación pueden generarse paquetes de prueba, pero no actualizaciones compatibles con la firma distribuida.

## Instalación y uso acompañado

Una persona adulta descarga la APK de la publicación oficial. El instalador puede solicitar autorización para instalar desde esa fuente; si una política del equipo lo impide, debe intervenir quien administra el dispositivo. No se requieren configuraciones de Chrome ni opciones de desarrollador. Antes de entregar el teléfono al estudiante conviene probar inicio, una actividad, cierre y reapertura sin conexión.

La APK utiliza el motor WebView del sistema. Un teléfono que necesita actualizar ese componente no cumple todavía la preparación operativa, aunque acepte instalar la APK. La comprobación debe hacerse en el punto de conectividad y no trasladarse al niño. Los informes se guardan con el selector de documentos de Android; después un adulto puede trasladarlos por un medio autorizado. La aplicación no envía datos por internet.

Esta versión admite un perfil de estudiante por instalación/usuario del sistema. Una familia que comparte un solo usuario Android entre varios niños no dispone todavía de perfiles separados dentro del juego. No deben mezclarse registros ni atribuirse a una persona sin control docente. Antes de desinstalar o borrar datos, deben exportarse los informes necesarios.

## Preparación para Google Play

Compilar una APK no demuestra cumplimiento integral ni garantiza aceptación. Se preparan un AAB, identificador estable, versión, firma, recursos incluidos, ausencia de publicidad y ausencia de permiso de internet. La política de nivel objetivo consultada exige API 36 para nuevas aplicaciones y actualizaciones desde el 31 de agosto de 2026. Los requisitos deben revisarse de nuevo en la fecha efectiva de envío. [Nivel objetivo de API](https://developer.android.com/google/play/requirements/target-sdk), [distribución de app bundles](https://developer.android.com/guide/app-bundle).

Antes de publicar faltan la cuenta y verificación del desarrollador, la configuración de Play App Signing, ficha y capturas, declaración de audiencia, clasificación de contenido, revisión de Seguridad de los datos y política de privacidad acorde al comportamiento efectivo. También debe revisarse si corresponden pruebas cerradas según la fecha y tipo de cuenta. El prototipo está dirigido a niños; no puede eludir las obligaciones de Familias simplemente declarándolo como aplicación para adultos. Los enlaces externos y la exportación de informes requieren revisión específica del flujo para adultos. [Políticas de Familias](https://support.google.com/googleplay/android-developer/answer/9893335?hl=es), [pruebas para cuentas personales nuevas](https://support.google.com/googleplay/android-developer/answer/14151465?hl=es).

El uso de WebView no concede ni impide automáticamente la aceptación: deben evaluarse funcionalidad, contenido, experiencia y cumplimiento completo. Sendero incorpora actividades, progreso local y transferencia de documentos; la revisión de la tienda sigue siendo independiente. No se ha enviado esta versión a Google Play ni se declara aprobada.

Para App Store de Apple se necesita una aplicación iOS y su proceso de compilación, firma, pruebas y revisión. Ni la APK ni el AAB pueden publicarse como aplicaciones iOS.

## Verificación pendiente en campo

La evaluación debe cubrir al menos teléfonos reales representativos del entorno: memoria limitada, almacenamiento lento o casi lleno, distintas versiones de WebView, ausencia de red desde la primera apertura, cierre forzado, cambio de orientación, texto ampliado y uso del selector de archivos. Deben medirse tamaño instalado, memoria, arranque y latencia de respuesta. El peso de descarga y las pruebas en emulador no bastan para afirmar funcionamiento satisfactorio en toda la gama baja.

El análisis complementario de certificados, reputación, costes y canales está en [Firma y distribución](FIRMA-Y-DISTRIBUCION.md). La consulta es preparatoria: no se han tramitado cuentas, certificados comerciales o envíos a tiendas.

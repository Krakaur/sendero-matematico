# iPhone y iOS: adaptación y compilación pendientes

Estado: planificación técnica para una versión posterior. No existe todavía un proyecto Xcode, una compilación iOS ni un archivo IPA de Sendero. El repositorio actual contiene web, Windows y el proyecto Android. No es posible convertir directamente su APK o AAB en una aplicación para iPhone.

## Alcance propuesto

La edición Android sin WebView queda como candidata para una versión 2.0. La adaptación iOS puede evaluarse en esa misma etapa, según demanda y disponibilidad de dispositivos. No se incorpora ahora una segunda implementación móvil.

Para iOS deben compararse dos alternativas: reutilizar los recursos web en una aplicación con WKWebView o implementar las pantallas y el almacenamiento con componentes nativos de Apple. La primera conserva código, pero mantiene dependencia del motor web asociado al sistema; la segunda exige rehacer interfaz e integración. La independencia del navegador elegido por la familia no equivale a independencia de un motor web interno. Las reglas matemáticas, los indicadores y el esquema de informes deben permanecer equivalentes entre versiones y verificarse mediante casos compartidos.

## Entorno necesario

Se requiere un Mac o un entorno de compilación macOS autorizado, Xcode con un SDK aceptado por App Store Connect y un iPhone para pruebas físicas. El SDK de compilación y la versión mínima de iOS son decisiones diferentes: utilizar un SDK reciente no obliga por sí solo a excluir todos los iPhone anteriores. La versión mínima debe elegirse a partir de dispositivos representativos y APIs efectivamente utilizadas. Los requisitos de envío cambian; deben consultarse al implementar, sin fijar hoy una promesa de compatibilidad. [Requisitos de envío de Apple](https://developer.apple.com/app-store/submitting/).

La distribución mediante TestFlight o App Store requiere la participación correspondiente en Apple Developer Program, una identidad de aplicación, certificados y perfiles de firma de Apple. La clave de Android no sirve para firmar iOS. Las credenciales deben administrarse en el llavero o en secretos del sistema de compilación, nunca dentro del repositorio. [Distribución para pruebas y publicación](https://developer.apple.com/documentation/xcode/distributing-your-app-for-beta-testing-and-releases).

## Procedimiento que deberá implementarse

Primero se creará un proyecto Xcode y un target para iPhone, con identificador, versión, número de compilación, iconos, recursos en español y requisitos mínimos explícitos. Después se implementarán persistencia local, pausa y restauración, importación y exportación mediante los servicios de documentos de iOS. Si se elige WKWebView, deberán incorporarse todos los recursos y restringirse navegación y mensajes hacia código nativo; los puentes Java de Android no son reutilizables.

Con el target implementado se ejecutarán pruebas de lógica y de interfaz en simulador, seguidas de pruebas en dispositivos físicos. La edición Release se archivará en Xcode mediante Product → Archive, se validará en Organizer y se distribuirá a App Store Connect para TestFlight. Solo después de revisar resultados, ficha y requisitos se solicitará revisión de App Store. Este procedimiento describe trabajo futuro; no es una receta ejecutable en el repositorio actual porque faltan el proyecto y el target. [Pruebas de una compilación de release](https://developer.apple.com/documentation/xcode/testing-a-release-build).

Una automatización futura con `xcodebuild` deberá fijar proyecto, scheme, destino y configuración reales, registrar la versión de Xcode y exportar el archivo firmado con opciones apropiadas. No se incluye un comando con nombres ficticios que pudiera confundirse con una compilación ya reproducible.

## Condiciones de aceptación

La prueba deberá comenzar con modo avión desde la primera apertura tras instalar, sin una carga previa del sitio. Debe cubrir cierre forzado, restauración, pérdida de espacio, texto ampliado, VoiceOver, áreas seguras de pantalla, selector de archivos y recepción de informes. También debe verificar continuidad de datos al actualizar, antes de recomendar la aplicación para periodos prolongados sin conexión.

La revisión para público infantil exige valorar contenido, privacidad, clasificación de edad y acciones reservadas a adultos. Un aviso que diga «para adultos» no demuestra por sí solo una barrera parental suficiente. Los enlaces a GitHub, exportación de información y cualquier futura donación deben evaluarse expresamente. [Diseño de experiencias para niños](https://developer.apple.com/kids/), [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Distribución desde la web

La página de Sendero puede enlazar en el futuro a TestFlight o App Store. Alojar un IPA no equivale a ofrecer una instalación universal como ocurre con una APK: la instalación depende del método autorizado, firma, dispositivos y región. No se promete una descarga directa para todos los iPhone. Mientras no exista una compilación iOS probada, la web debe indicar únicamente la disponibilidad de la experiencia web y sus límites de almacenamiento y funcionamiento sin conexión.

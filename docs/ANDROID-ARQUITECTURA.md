# Android: independencia, compatibilidad y decisión técnica

Fecha de revisión: 15 de septiembre de 2026. Estado: decisión de prototipo, sujeta a pruebas en teléfonos reales.

Decisión de alcance: la implementación Android completamente nativa queda pendiente como candidata para la versión 2.0. Esta entrega conserva WebView con recursos incorporados. La adaptación y compilación para iPhone también quedan [documentadas como trabajo posterior](IOS-PENDIENTE.md).

## Qué significa «independiente»

Una APK es un formato de instalación; no determina cómo se dibuja o ejecuta una aplicación. Sendero 0.1.1 empaqueta su código, actividades e ilustraciones, y usa Android System WebView para presentar la interfaz. No abre el navegador predeterminado ni descarga la web al iniciarse. Sin embargo, no es una implementación completamente nativa: necesita un proveedor WebView funcional y compatible. En determinadas versiones de Android, Chrome puede actuar como proveedor; esto es distinto de elegir Chrome como navegador predeterminado. [Arquitectura de Android WebView](https://www.chromium.org/developers/androidwebview/).

La independencia debe distinguirse en tres dimensiones: recursos del juego disponibles sin red, independencia del navegador elegido por la familia e independencia del motor web del sistema. Esta edición ofrece las dos primeras; no ofrece la tercera. Ninguna aplicación es independiente del sistema operativo y del hardware.

## Archivos locales y opciones de seguridad

La APK no ejecuta un `index.html` mediante `file://`. Los archivos incorporados se resuelven dentro de la aplicación usando `WebViewAssetLoader`, bajo el origen virtual `https://appassets.androidplatform.net/assets/`. Esa dirección no representa una descarga: el contenido procede del paquete. Esto evita las restricciones de origen de los archivos locales sin relajar las opciones de seguridad del navegador. Es el mecanismo recomendado por Android para este tipo de contenido. [Carga de contenido incluido](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content).

El juego bloquea las solicitudes que no correspondan a recursos incorporados. No declara permiso de internet; desactiva el acceso directo a archivos, el acceso universal desde archivos y el contenido mixto. La selección y escritura de informes pasan por el selector de documentos del sistema. No se exige activar opciones de desarrollador, cambiar flags de Chrome, instalar extensiones ni desactivar protecciones. El código docente y el progreso pertenecen a los datos privados de la aplicación, separados del navegador.

La instalación directa de una APK sí puede pedir a una persona adulta autorización para instalar desde esa fuente. Esta fricción pertenece al canal de distribución y también existiría con una APK completamente nativa. Una publicación en Google Play simplificaría ese paso en equipos que tengan acceso a la tienda. No se debe pedir a niños que resuelvan ajustes de seguridad ni que ignoren advertencias del sistema.

## Problemas que conserva WebView

El navegador alternativo que utilice la familia no cambia el motor de Sendero. En cambio, un WebView deshabilitado, antiguo o no disponible puede impedir el inicio. Las actualizaciones del motor pueden introducir diferencias de comportamiento; el soporte del sistema operativo tampoco garantiza que su WebView siga recibiendo actualizaciones. [Compatibilidad de la plataforma WebView](https://github.com/chromium/chromium/blob/main/android_webview/docs/web-platform-compatibility.md), [ciclo de soporte y cambios](https://www.chromium.org/blink/launching-features/webview-deprecations/).

El manifiesto admite Android 6 o posterior, pero este valor solo controla la instalación: no demuestra compatibilidad funcional con el motor originalmente instalado en cada teléfono. El código usa módulos JavaScript y APIs modernas; la combinación concreta de sistema, proveedor y versión del motor debe probarse. No se debe anunciar «funciona en cualquier Android 6» a partir de `minSdk=23`.

El peso de la APK no incluye el motor web ya instalado ni equivale a RAM consumida. La separación en procesos, el DOM y el motor JavaScript añaden coste. La edición evita vídeos, fuentes remotas, bibliotecas de interfaz y desenfoques de fondo en Android; estas decisiones reducen carga, pero no sustituyen la medición de arranque, memoria y respuesta táctil. Un emulador no representa térmicas, batería, almacenamiento lento ni presión de memoria de un teléfono económico.

Ante un fallo de inicio, el mensaje debe dirigirse a la persona adulta y conservar los datos. La preparación en un centro educativo debe incluir abrir, jugar, cerrar y volver a abrir sin red. Una exigencia de actualizar WebView durante esa preparación sigue siendo una barrera real, aunque no requiera configurar Chrome.

## Comparación de alternativas

**Web instalable.** Reutiliza toda la implementación y ofrece acceso inmediato por enlace. Depende del navegador, de una primera carga correcta y de las políticas de conservación de datos. Es adecuada para demostrar el recurso, pero la instalación y el almacenamiento varían entre navegadores. Es la opción con más incertidumbre operativa para una distribución rural sin acompañamiento.

**APK con WebView y recursos incorporados.** Reutiliza el juego, asegura la presencia de las actividades desde la instalación y permite integración nativa con documentos. Evita que el niño manipule archivos HTML o configuraciones del navegador. Mantiene la dependencia de un motor web externo a la APK y requiere una matriz de compatibilidad. Es una solución proporcionada para evaluar el prototipo con rapidez, siempre que esa dependencia se declare.

**APK nativa con vistas Android y almacenamiento SQLite.** Elimina la dependencia de HTML, CSS y JavaScript y permite controlar mejor restauración, accesibilidad, perfiles y consumo de recursos. Para un juego aritmético pequeño no parece necesario un motor 3D ni una infraestructura compleja. Su contrapartida es reimplementar presentación, adaptación, informes y pruebas, y mantener la equivalencia con la web. Un cambio de tecnología no garantiza por sí solo menor memoria, ausencia de errores ni aceptación en tiendas: esas ventajas deben medirse.

**APK que incorpora un navegador completo.** Fija la versión del motor, pero aumenta descarga, instalación, memoria y responsabilidad de actualizarlo. No es la alternativa preferida para esta población objetivo.

## Ponderación y recomendación

Para el experimento de difusión de uno o dos días, la APK con recursos incorporados conserva valor: permite probar la experiencia y entregar un artefacto pequeño sin reconstruir el juego. No debe promocionarse como una solución ya validada para teléfonos de bajos recursos.

Para una distribución sostenida en comunidades con teléfonos antiguos y periodos largos sin actualización, **sí merece la pena evaluar una edición nativa**. La dependencia residual de WebView contradice parcialmente el propósito de mínima intervención técnica. En ese escenario, la robustez del primer inicio y la conservación de los registros tienen más peso que la reutilización inmediata del código web.

La decisión de migrar debe apoyarse en una prueba comparativa: misma aventura, mismos dispositivos, arranque en frío, proceso detenido, modo avión desde el primer inicio, pausa prolongada, exportación/importación, espacio ocupado y memoria. Los criterios iniciales propuestos son: instalación sin cambios de seguridad ajenos al permiso normal del instalador, ningún ajuste técnico durante el juego, primer inicio sin red, recuperación del progreso tras cerrar y abrir, y controles utilizables con texto ampliado. Los límites numéricos de tiempo y memoria deben fijarse tras identificar el parque real de teléfonos.

Hasta disponer de esa evidencia, el resultado correcto es «APK híbrida funcional en las combinaciones documentadas». No corresponde afirmar independencia total del navegador interno ni compatibilidad general con dispositivos de gama baja.

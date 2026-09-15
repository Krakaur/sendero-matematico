# Sendero 0.1.1 — Android y corrección para aprender

[Jugar en la web](https://krakaur.github.io/sendero-matematico/) · [Guía](https://github.com/Krakaur/sendero-matematico/blob/main/docs/GUIA.md) · [Evaluación](https://github.com/Krakaur/sendero-matematico/blob/main/docs/EVALUACION.md)

Juego de sumas, restas y multiplicación con cuatro niveles adaptativos, aventuras de ocho pasos, pistas visuales y progreso local. Después de un error, muestra la solución correcta centrada y destacada, con signos de exclamación y una explicación breve. Conserva el intento y registra que la solución fue mostrada.

Los informes incluyen barras y colores para precisión inicial, resolución sin ayuda, uso de pistas y corrección al segundo intento. La transferencia docente se realiza mediante archivos JSON; también se exporta CSV. No hay sincronización automática ni recopilación para investigación.

## Descargar para Android y Windows

`Sendero-0.1.1-Android.apk` ocupa 175716 bytes, aproximadamente 0,18 MB. Incluye las actividades desde la instalación y utiliza Android System WebView. No necesita abrir el navegador predeterminado, configurar Chrome ni descargar ejercicios al iniciar. Su compatibilidad depende del motor del sistema; admitir la instalación desde Android 6 no acredita funcionamiento con todos sus WebView. La instalación inicial debe acompañarla una persona adulta. Esta versión tiene un perfil por instalación/usuario del sistema.

`Sendero-0.1.1-Android.aab` es el paquete preparado para una futura publicación en Google Play. No se instala directamente ni representa aceptación de la tienda. Ambos paquetes Android están firmados con una identidad persistente; no se publica ninguna clave privada.

`Sendero-0.1.1-Windows-x64.exe` es una aplicación portátil que incluye el motor de escritorio y todos los recursos. Ocupa aproximadamente 100 MB y no requiere descargar actividades al abrirse. Los datos se guardan por usuario en el equipo; no dentro del ejecutable.

La compilación Windows no tiene firma digital comercial. Las políticas de Windows o del centro educativo pueden impedir su apertura. El archivo `SHA256SUMS.txt` permite comprobar que la descarga coincide con el artefacto publicado. La edición Windows se ha compilado y sus fuentes empaquetadas se han cotejado; la evaluación de interacción se realizó sobre la base web compartida, no mediante una sesión completa dentro del ejecutable.

## Validación y alcance

Tres ciclos de evaluación técnica y heurística de la versión inicial, once pruebas de lógica aprobadas y una revisión visual de la nueva corrección. La compilación Android verificó firma, recursos incorporados y ausencia de permisos; Lint no detectó errores e informó cuatro dependencias con versiones posteriores disponibles. El registro de evaluación declara la cobertura efectiva de las pruebas de interfaz. No hay evaluación de eficacia con niños ni validación diagnóstica. La disponibilidad del software no acredita por sí sola transferencia institucional o aceptación curricular.

La edición Android completamente nativa queda pendiente para una posible versión 2.0. La adaptación y compilación iOS están documentadas como trabajo futuro; no se distribuye IPA. No se ha publicado en Google Play ni App Store.

Consulta la [guía Android](https://github.com/Krakaur/sendero-matematico/blob/main/docs/ANDROID-DISTRIBUCION.md), la [comparación WebView/nativa](https://github.com/Krakaur/sendero-matematico/blob/main/docs/ANDROID-ARQUITECTURA.md), la [adaptación iOS pendiente](https://github.com/Krakaur/sendero-matematico/blob/main/docs/IOS-PENDIENTE.md) y la [política de privacidad](https://github.com/Krakaur/sendero-matematico/blob/main/docs/PRIVACIDAD.md).

## Colaboración

Se invita a revisar usabilidad, contenido y pertinencia en contextos de conectividad intermitente. Las propuestas pueden abrirse como issues. No se deben publicar datos personales o informes reales de estudiantes en el repositorio.

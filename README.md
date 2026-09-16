# Sendero

## Versión 0.3.1: cálculo con un toque

[Jugar](https://krakaur.github.io/sendero-matematico/) · [APK nativa Android 14–16](https://github.com/Krakaur/sendero-matematico/releases/download/v0.3.1/Sendero-Nativo-0.3.1.apk) · [Windows x64](https://github.com/Krakaur/sendero-matematico/releases/download/v0.3.1/Sendero-0.3.1-Windows-x64.exe)

Cada acierto en cálculo avanza automáticamente. Después de un error se conserva la solución visible para aprender. Los informes distinguen el tiempo hasta la primera respuesta y muestran aciertos iniciales por minuto junto con precisión y cantidad de observaciones, por contenido y nivel. Las correcciones, pistas, interrupciones y registros antiguos no se convierten en una medida de rapidez equivalente. En razonamiento se conserva el avance deliberado para leer la explicación.

La APK ocupa aproximadamente 390 kB y mantiene el banco de 0.3.0, perfiles, firma y funcionamiento sin WebView. Consulta el [análisis de Arcademics y contrato de medición](docs/ARCADEMICS-FLUIDEZ-Y-MEDICION.md) y las [notas de versión](docs/RELEASE-NOTES-0.3.1.md). La tasa describe fluidez durante práctica; no equivale a una carrera continua ni acredita capacidad matemática general. Las secciones siguientes describen versiones anteriores.

## Nueva versión 0.3.0

[Juego actualizado](https://krakaur.github.io/sendero-matematico/) · [APK nativa Android 14–16](https://github.com/Krakaur/sendero-matematico/releases/download/v0.3.0/Sendero-Nativo-0.3.0.apk) · [Windows x64](https://github.com/Krakaur/sendero-matematico/releases/download/v0.3.0/Sendero-0.3.0-Windows-x64.exe)

La versión 0.3.0 incorpora **6 270 enunciados distintos, 128 situaciones fuente y 16 familias matemáticas**. El banco se produce antes de distribuir la app: no hay IA en el teléfono ni llamadas a servicios generativos. Las variantes numéricas tienen restricciones y soluciones comprobadas; el teléfono selecciona contenido ya incluido.

Cálculo y razonamiento mantienen progresiones distintas. Hay revisión programada de operaciones y tablas ampliadas opcionales con ambos factores del 1 al 20. El historial evita repetir un problema antes de agotar su conjunto y favorece redacciones y contextos diferentes de los recientes. Se reservan 1 574 problemas para situaciones no practicadas; al agotar un conjunto, las repeticiones se identifican como repaso.

Los informes incorporan barras por dimensiones de actividad e identificadores del banco. El formato nuevo es `sendero.report.v2`; se siguen importando informes v1. Para recibir informes nuevos hay que actualizar el receptor. Los colores describen las respuestas y no acreditan dominio, razonamiento general ni eficacia educativa.

Android conserva sus ocho perfiles con contraseña, SQLite y funcionamiento sin navegador ni WebView. Actualiza instalando la APK sobre la edición nativa 0.2.0, sin borrar los datos. Web y Windows conservan un perfil por instalación, sin las contraseñas de Android. La entrega de informes sigue siendo manual.

El contenido tiene revisión matemática y editorial interna; la revisión docente independiente y las pruebas con niños siguen pendientes. La cobertura curricular SEP es parcial. Para niños que aún no leen se necesita acompañamiento en la lectura; no hay narración de voz. Consulta el [banco y sus límites](docs/BANCO-Y-APRENDIZAJE.md) y la [evaluación de 0.3.0](docs/EVALUACION-0.3.0.md).

Para reconstruir el contenido: `python scripts/build-bank.py`. Para verificarlo: `npm test`. Los hashes y cantidades están en `docs/BANK-MANIFEST.json`. Los apartados siguientes conservan la descripción histórica de las versiones anteriores; prevalecen las condiciones y enlaces de esta sección para 0.3.0.

## Matemáticas que van contigo

[Abrir el juego](https://krakaur.github.io/sendero-matematico/) · [Android 14–16: APK nativa](https://github.com/Krakaur/sendero-matematico/releases/download/v0.2.0/Sendero-Nativo-0.2.0.apk) · [Windows](https://github.com/Krakaur/sendero-matematico/releases/download/v0.1.1/Sendero-0.1.1-Windows-x64.exe) · [Guía de uso](docs/GUIA.md) · [Evaluación](docs/EVALUACION.md)

![Luma explora un sendero entre montañas](web/social.png)

Sendero es un juego gratuito de práctica matemática, desarrollado por Dirk Hans Krakaur Floranes. Está orientado a primaria, con navegación móvil y funcionamiento en laptop. Las aventuras de ocho ejercicios ofrecen sumas, restas y multiplicación, pistas visuales y cuatro niveles de dificultad adaptativa. El juego no impone un límite de tiempo ni penaliza la solicitud de ayuda. Después de un error, muestra la solución correcta centrada y destacada, con una explicación breve; conserva ese intento como práctica apoyada.

## Estado de la versión 0.1.1

**Nueva edición Android nativa 0.2.0:** desarrollo independiente de navegador y WebView, con perfiles locales protegidos por contraseña, almacenamiento SQLite e informes separados. La [guía nativa](docs/ANDROID-NATIVO.md) explica la arquitectura, compatibilidad y límites. Las comprobaciones y el estado de distribución se documentan en [evaluación nativa](docs/EVALUACION-NATIVA.md). Las características siguientes describen la edición web/Windows e híbrida 0.1.1; esas ediciones todavía no tienen perfiles con contraseña.

Prototipo funcional con evaluación técnica y heurística. No es un instrumento diagnóstico validado y no se ha demostrado su eficacia educativa. No incluye cuentas, expedientes remotos, sincronización automática ni recogida de datos para investigación. La continuidad sin conexión y la entrega diferida de archivos están implementadas; la sincronización protegida entre dispositivos es trabajo futuro.

Los informes muestran precisión inicial, resolución sin ayuda, uso de pistas y corrección al segundo intento mediante barras, colores, proporciones y definiciones. Una tabla separa contenido y dificultad. Las bandas cromáticas son descriptivas y no constituyen umbrales de dominio educativo.

## Usar sin conexión

En navegador, abre el juego con internet y espera «Lista sin conexión». Instálalo desde Chrome o Edge si el navegador ofrece esa opción. Los recursos se conservan mediante un service worker; los resultados se guardan localmente. Conviene exportarlos periódicamente: el navegador puede eliminar almacenamiento, y borrar datos o cambiar de dispositivo puede perder el progreso.

La edición Windows x64 se publica en [Releases](https://github.com/Krakaur/sendero-matematico/releases). Es un ejecutable portátil que incluye los recursos del juego y un motor de escritorio; no necesita descargar actividades al iniciarse. El ejecutable no está firmado con un certificado comercial. Consulta la guía de instalación y las comprobaciones disponibles antes de distribuirlo en equipos escolares. La APK Android incluye las actividades desde la instalación y utiliza Android System WebView; no necesita abrir Chrome ni cambiar sus ajustes. Su compatibilidad depende del motor del sistema. Consulta la [guía Android](docs/ANDROID-DISTRIBUCION.md) y la [comparación con una edición nativa](docs/ANDROID-ARQUITECTURA.md).

## Informes para docentes

Un estudiante puede exportar JSON para abrirlo en la sección Docentes de otro dispositivo, o CSV para analizarlo en una hoja de cálculo. La importación valida la estructura y la aritmética de los registros y evita duplicar sesiones por identificador. Esa validación no acredita identidad, autenticidad del archivo ni condiciones de aplicación. El archivo representa un perfil local, no una persona verificada.

Los datos no se transmiten automáticamente. Un archivo con un identificador persistente no se considera anónimo. No publiques expedientes ni archivos reales de estudiantes en este repositorio. El alojamiento web puede registrar datos técnicos de acceso conforme a las políticas de GitHub.

## Desarrollo reproducible

Requiere Node.js y npm. Las versiones exactas de las dependencias quedan fijadas en `package-lock.json`.

```sh
npm ci
npm test
npm start
npm run build:windows
```

Para desarrollo web, sirve `web/` con un servidor HTTP local, por ejemplo `python -m http.server 4173 --bind 127.0.0.1 --directory web`. El modo sin conexión requiere HTTPS o localhost. Al modificar archivos estáticos hay que cambiar la versión de caché en `web/sw.js`; cierra las pestañas del juego para activar una actualización pendiente.

La rama `main` conserva fuentes, pruebas y documentación. La rama `gh-pages` contiene únicamente el sitio estático. Las descargas de Android y Windows se distribuyen mediante Releases para mantener ligera la web.

## Documentación y colaboración

[Guía de familias y docentes](docs/GUIA.md), [diseño y límites técnicos](docs/DISENO.md), [tres ciclos de evaluación](docs/EVALUACION.md), [estrategia de difusión](docs/DIFUSION.md), [privacidad](docs/PRIVACIDAD.md), [arquitectura Android](docs/ANDROID-ARQUITECTURA.md), [iOS pendiente](docs/IOS-PENDIENTE.md), [tiempo y retos](docs/TIEMPO-Y-RETOS.md), [firma y distribución](docs/FIRMA-Y-DISTRIBUCION.md) y [citación](CITATION.cff).

Las propuestas de colaboración pueden abrirse como issues en este repositorio. Interesan especialmente la revisión docente del contenido, las pruebas en dispositivos de recursos limitados y el trabajo en comunidades con conectividad intermitente. No incluyas información personal de menores en las conversaciones públicas.

Licencia MIT para el código y las ilustraciones originales incluidas. La implementación no utiliza código, imágenes ni otros recursos de Arcademics. La referencia funcional a juegos educativos no implica afiliación o aval.

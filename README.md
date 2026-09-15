# Sendero

## Matemáticas que van contigo

[Abrir el juego](https://krakaur.github.io/sendero-matematico/) · [Descargas Android y Windows](https://github.com/Krakaur/sendero-matematico/releases/latest) · [Guía de uso](docs/GUIA.md) · [Evaluación](docs/EVALUACION.md)

![Luma explora un sendero entre montañas](web/social.png)

Sendero es un juego gratuito de práctica matemática, desarrollado por Dirk Hans Krakaur Floranes. Está orientado a primaria, con navegación móvil y funcionamiento en laptop. Las aventuras de ocho ejercicios ofrecen sumas, restas y multiplicación, pistas visuales y cuatro niveles de dificultad adaptativa. El juego no impone un límite de tiempo ni penaliza la solicitud de ayuda. Después de un error, muestra la solución correcta centrada y destacada, con una explicación breve; conserva ese intento como práctica apoyada.

## Estado de la versión 0.1.1

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

[Guía de familias y docentes](docs/GUIA.md), [diseño y límites técnicos](docs/DISENO.md), [tres ciclos de evaluación](docs/EVALUACION.md), [estrategia de difusión](docs/DIFUSION.md), [privacidad](docs/PRIVACIDAD.md), [arquitectura Android](docs/ANDROID-ARQUITECTURA.md), [iOS pendiente](docs/IOS-PENDIENTE.md), [tiempo y retos](docs/TIEMPO-Y-RETOS.md) y [citación](CITATION.cff).

Las propuestas de colaboración pueden abrirse como issues en este repositorio. Interesan especialmente la revisión docente del contenido, las pruebas en dispositivos de recursos limitados y el trabajo en comunidades con conectividad intermitente. No incluyas información personal de menores en las conversaciones públicas.

Licencia MIT para el código y las ilustraciones originales incluidas. La implementación no utiliza código, imágenes ni otros recursos de Arcademics. La referencia funcional a juegos educativos no implica afiliación o aval.

# Estado de continuidad

## Versión 0.1.1

Fuentes, juego, documentación y pruebas en `main`. La publicación web utiliza `gh-pages`. Windows, APK y AAB se distribuyen en la publicación de versión. No hay backend, credenciales de estudiantes, analítica ni canal de investigación activo. La APK usa WebView del sistema, con recursos incorporados y sin permiso de internet; no es una edición completamente nativa.

## Decisiones implementadas

Navegación móvil prioritaria, tres contenidos, ocho pasos por aventura, cuatro niveles de cantidades, ajuste por aciertos independientes y apoyos, tiempo excluido de la adaptación, almacenamiento local, exportación JSON/CSV, importación deduplicada e indicadores descriptivos multidimensionales. Las ilustraciones son originales y se incluyen localmente.

La transferencia docente de esta versión es manual por archivo. No debe describirse como sincronización automática ni como anonimización. El perfil es un código persistente local y las fechas dependen del reloj del dispositivo. La evaluación se limita a sesiones completas.

## Continuación recomendada

La edición Android sin WebView queda pendiente como candidata para 2.0; iOS también queda pendiente, según `IOS-PENDIENTE.md`. No ampliar esta entrega con esas implementaciones. El análisis técnico está en `ANDROID-ARQUITECTURA.md`; compilación, firma y requisitos de tienda en `ANDROID-DISTRIBUCION.md`. La clave privada Android no está en Git: mantener la misma identidad para futuras actualizaciones y proteger su copia local y los secretos de compilación. Nunca adjuntar claves a publicaciones o informes.

Revisar primero la experiencia con adultos docentes y en equipos Android/Windows reales. Para una evolución institucional, sustituir el almacenamiento del prototipo por una base transaccional, diseñar vinculación e identidad, proteger expedientes y probar entrega diferida con confirmaciones y reintentos. La investigación requiere protocolo independiente. No asignar nivel TRL ni afirmar eficacia o transferencia institucional basándose solamente en la publicación.

Las ideas de difusión están en `DIFUSION.md`. No se han publicado mensajes en redes ni realizado solicitudes a catálogos externos.

El análisis de certificados, reputación, tiendas y alternativas de bajo coste está en `FIRMA-Y-DISTRIBUCION.md`. No hay compras, cuentas nuevas ni solicitudes de tiendas realizadas. Los tiempos verificables y prioridades están en `TIEMPO-Y-RETOS.md`.

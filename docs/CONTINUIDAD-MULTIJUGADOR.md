# Continuidad multijugador y entre dispositivos

Estado de diseño: 14 de octubre de 2026. Propuesta técnica; no desplegada en la versión 0.12.0.

## Diagnóstico comprobado

`web/room-link.js` establece canales WebRTC con PeerJS. `web/together.js` ejecuta las reglas en la pestaña anfitriona y envía instantáneas. Recuperar esa pestaña permite reanudar, pero otro participante no sustituye automáticamente al anfitrión. El servidor Workers/D1 existente recibe expedientes y copias cifradas; no coordina las partidas.

`web/cloud.js` y `web/cloud-view.js` guardan y recuperan explícitamente copias cifradas, con control de revisión para evitar sobrescrituras. La contraseña del perfil es local y no constituye una cuenta autenticada en la nube. Tener una copia remota no equivale a sincronización automática.

## Coordinación independiente del anfitrión

Un Durable Object con almacenamiento SQLite por sala puede conservar el estado autorizado de la partida. Cada dispositivo envía acciones numeradas por WebSocket; el servidor verifica identidad de plaza, fase, pregunta y límites antes de aceptar la respuesta. El cliente interpola el movimiento visual sin transmitir cada fotograma. La API de hibernación evita mantener el coordinador activo mientras espera una respuesta.

La sala debe persistir las acciones aceptadas y su revisión antes de confirmarlas. La reconexión utiliza una credencial de plaza distinta del enlace compartido, reenvía únicamente acciones no confirmadas y descarta duplicados. Cerrar al creador no elimina la sala. El control de preparar otra ronda puede transferirse a un participante conectado, mientras la autoridad sobre las respuestas permanece en el servidor.

Es necesario distinguir pérdida de conexión de abandono. Durante una desconexión breve, pausar preserva condiciones comparables. Después de un plazo explícito, los participantes pueden continuar con las plazas presentes; el informe conserva el número inicial, los abandonos y los estados incompletos, sin convertirlos en respuestas incorrectas ni mezclar carreras incomparables. También debe definirse una caducidad para las salas inactivas y una política de borrado de sus datos temporales.

La aceptación requiere pruebas con cuatro clientes, cierre del creador, reconexión, reinicio o hibernación del coordinador, mensajes repetidos o fuera de orden, rechazo de un quinto participante y rechazo de acciones enviadas con la credencial de otra plaza. Una prueba desde pestañas de la misma computadora no sustituye las pruebas en redes y dispositivos distintos.

## Acceso a un perfil desde otro dispositivo

Se necesita una identidad aleatoria estable y un acceso emitido por el docente, con secreto individual revocable, sesiones de duración limitada y protección frente a intentos repetidos. Escuela, grado, grupo y número de lista son metadatos de análisis: no autentican al estudiante y pueden coincidir entre escuelas, ciclos o grupos.

Después del acceso, el sistema debe descargar los resultados confirmados y sincronizar nuevos registros mediante identificadores únicos. Los ejercicios terminados son registros inmutables que pueden fusionarse; dos ejercicios pendientes divergentes deben conservarse como ramas o exigir una elección explícita, sin reemplazar silenciosamente uno con otro. El registro debe identificar la versión del juego y el contexto individual o multijugador. El modo sin conexión conserva una cola local y reintenta con espera creciente al recuperar la conexión.

La recuperación de contraseña debe diseñarse junto con el cifrado. Si la única clave de descifrado depende de un secreto perdido, un restablecimiento administrativo no recupera los datos cifrados. Debe elegirse una recuperación mediante código de reserva o una clave de recuperación controlada por el docente, con alcance y consentimiento definidos, antes de prometer recuperación completa. Las copias actuales seguirían siendo una vía adicional de protección durante la migración.

Las pruebas de aceptación deben usar dos dispositivos para el mismo perfil: acceso, recuperación sin archivo manual, sincronización bidireccional de sesiones terminadas, trabajo sin conexión, conflictos, cierre de sesión, revocación y separación de expedientes entre estudiantes y aulas.

## Capacidad y control del consumo

La documentación oficial consultada el 14 de octubre de 2026 incluye Durable Objects con SQLite en Workers Free. Sus cuotas son distintas de las del Worker frontal: 100 000 solicitudes y 13 000 GB-s de duración diarios; el almacenamiento SQL incluye 5 millones de filas leídas, 100 000 escritas por día y 5 GB totales. Si se supera una cuota gratuita, las operaciones afectadas fallan. No se debe activar Workers Paid ni productos facturables para implementar este diseño.

Una partida aritmética de cuatro estudiantes contiene al menos 32 respuestas correctas; errores, pistas, conexiones, pausas y reconexiones agregan eventos. Esa cifra no equivale a 32 solicitudes facturadas: los WebSockets tienen reglas de medición específicas y las consultas y escrituras deben contarse por separado. El taller de razonamiento produce más acciones por reto. La duración y CPU reales se deben medir después de construir el prototipo local y antes de estimar partidas diarias.

El diseño debe limitar salas por aula y por día, estudiantes por sala, mensajes por conexión, tamaño de mensajes, reintentos, retención y duración de partidas. Ante falta de cuota debe detener la función en línea con un aviso recuperable y conservar los datos locales. El registro de cuotas antes y después de cada corrida se describe en `CONTROL-CUOTAS-PRUEBAS.md`.

Fuentes: [precio y límites gratuitos de Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/), [WebSockets e hibernación](https://developers.cloudflare.com/durable-objects/best-practices/websockets/), [límites de Workers](https://developers.cloudflare.com/workers/platform/limits/) y [cuotas de D1](https://developers.cloudflare.com/d1/platform/pricing/).

# Guía de uso

## Celular y laptop

Abre [Sendero](https://krakaur.github.io/sendero-matematico/) con conexión y espera que aparezca «Lista sin conexión». En Android con Chrome puedes utilizar la opción Instalar aplicación o Añadir a pantalla de inicio del menú. En laptop, Chrome y Edge pueden ofrecer instalación desde su barra o menú. Si no aparece, la versión web sigue siendo utilizable. La disponibilidad de instalación depende del navegador.

Antes de salir de un punto de conectividad, cierra y vuelve a abrir el juego sin internet para comprobar su disponibilidad en ese dispositivo. No basta con haber visto la portada una vez si la preparación no terminó. La primera carga siempre necesita conexión; las ediciones Windows y APK Android incluyen los recursos desde la descarga.

## Edición descargable Windows

Descarga `Sendero-0.1.1-Windows-x64.exe` desde la [publicación oficial del repositorio](https://github.com/Krakaur/sendero-matematico/releases/latest). Guarda el archivo en una carpeta y ábrelo. Es una edición portátil: no requiere asistente de instalación ni cuenta. Los resultados se conservan en los datos locales de la aplicación del usuario de Windows; no viajan dentro del ejecutable al copiarlo a otro equipo.

Esta compilación no tiene firma digital comercial. Windows o las políticas de un centro educativo pueden advertir sobre un editor desconocido o impedir su ejecución. No cambies las protecciones del equipo para usarla: la alternativa es la web instalable o la revisión por el administrador del centro. El archivo de sumas SHA-256 de la publicación permite comprobar integridad; no equivale a un certificado de seguridad ni a una validación pedagógica.

El paquete contiene Electron y por ello es mayor que la web. Una vez descargado, se puede transferir por un medio local autorizado. No tiene actualizador automático: cada versión se distribuye explícitamente. Se requiere un sistema Windows x64 compatible con la versión de Electron fijada; la cobertura de sistemas probados se declara en la evaluación.

## La aventura

Elige sumas, restas o multiplicación. Cada camino comienza en nivel 1. La dificultad aumenta un nivel después de tres ejercicios consecutivos correctos al primer intento sin abrir una pista. Dos ejercicios consecutivos con errores o pistas reducen un nivel. El intervalo permitido es 1 a 4. Estas reglas ajustan la práctica; no diagnostican capacidad ni sustituyen decisiones docentes.

La pista representa las cantidades con grupos visuales o propone una descomposición. Desde la versión 0.1.1, una respuesta incorrecta muestra inmediatamente la operación resuelta, centrada, destacada y entre signos de exclamación, con una explicación breve. El estudiante toca después la respuesta correcta. Todos los intentos se conservan y el informe registra si se mostró la solución. Ese reintento es guiado y no representa resolución autónoma. La recompensa corresponde a completar los ocho pasos, independientemente de la cantidad de pistas. Pausar conserva el ejercicio; continuar recupera sus respuestas y ayudas. Cambiar de camino con una aventura pendiente pide confirmación para abandonar esa aventura incompleta.

El sonido es opcional y empieza desactivado. Los botones se pueden operar con teclado. Las barras tienen etiquetas y valores además de color; se respeta la preferencia de movimiento reducido del sistema.

## Entregar y recibir resultados

Desde Mi progreso o Docentes, exporta un informe JSON. Llévalo al docente mediante un medio autorizado. En el otro dispositivo, el docente abre Sendero, entra a Docentes e importa el archivo. Reimportar el mismo informe no duplica sus sesiones. El CSV contiene una fila por ejercicio para análisis externo. La exportación no confirma que el docente haya recibido el archivo.

No hay transmisión automática, portal central, verificación de identidad ni gestión de grupos autenticados en esta versión. Un perfil local debe corresponder a un solo estudiante; en equipos compartidos usa perfiles separados de navegador o cuentas distintas de Windows. Las correspondencias entre códigos y nombres deben mantenerse bajo control de la institución y fuera del repositorio público.

## Interpretar el mapa de práctica

Precisión inicial es la proporción de primeras respuestas correctas, incluso si se abrió una pista. Resolución sin ayuda exige además no consultar la pista. Uso de pistas describe la proporción de ejercicios con apoyo; no es una penalización. Corrección al segundo intento describe cuántos ejercicios con error inicial se resolvieron en la siguiente respuesta. No se calculan esas proporciones cuando su denominador es cero.

Las bandas de precisión y resolución sin ayuda son 0–59%, 60–84% y 85–100%. Solo ayudan a leer las proporciones: no equivalen a insuficiente, aprobado o dominio. Azul y violeta distinguen dimensiones de apoyo y corrección, sin ordenarlas como buenas o malas. La tabla por dificultad debe acompañar cualquier comparación.

La duración se estima durante la interacción, se pausa al ocultar la app y después de 60 segundos sin interacción. No equivale a atención, asistencia ni tiempo efectivo de estudio validado. Las fechas proceden del reloj del dispositivo y pueden ser incorrectas. Solo se exportan sesiones completas: un análisis de esos archivos no permite estimar por sí solo abandono o retención.

## Conservación y privacidad

Exporta copias periódicas. El almacenamiento privado, la falta de espacio, el borrado de datos o un cambio de equipo pueden causar pérdida. El juego avisa si no puede guardar. El botón para solicitar almacenamiento persistente no garantiza que el navegador lo conceda.

Los informes tienen códigos persistentes y fechas, por lo que no son datos anónimos. No se solicitan nombres, correo ni escuela; no hay analítica incorporada. Una investigación futura requiere propósito, revisión ética, consentimiento y medidas de protección específicas antes de su activación.

## APK Android

Consulta las instrucciones, compatibilidad, firma y límites en la [guía de distribución Android](ANDROID-DISTRIBUCION.md). La APK incluye las actividades y utiliza WebView del sistema. No necesita Chrome como navegador predeterminado ni configuraciones para ejecutar archivos locales. La primera instalación y la comprobación sin conexión corresponden a una persona adulta. En esta versión hay un perfil por instalación/usuario Android.

# Avance secuencial del alcance

La solicitud es realizar un intento verificable en cada frente y continuar cuando se alcance una dependencia externa real. No convertir una dificultad de implementación en un bloqueo artificial. Cada cierre debe distinguir fuente, prueba, distribución y dependencia restante.

## 1. Perfiles y acceso — implementado en candidato web/Windows

Separar estudiantes y perfiles docentes locales en web/Windows; conservar el registro anterior y hacer explícito el perfil activo. Las cuentas en línea y la recuperación remota pertenecen al servicio de entrega; no se simularán con el almacenamiento del navegador.

Implementados hasta ocho perfiles con contraseña derivada, migración preservando el registro original, cambio de alias/contraseña y cierre de sesión. Pasaron pruebas unitarias de migración, contraseñas y aislamiento y un recorrido de navegador con dos perfiles y partida reanudada offline. La prueba del nuevo paquete Windows corresponde al frente de distribución. El control local no cifra la base.

## 2. Entrega docente y grupos — receptor y cliente implementados; falta alojamiento público

Receptor con SQLite, invitaciones por aula y rol, tareas, envío/reintento y confirmación por sesión, probado mediante HTTP real con datos sintéticos. La web importa invitaciones y consulta tareas/informes. Leer `SERVICIO-DOCENTE.md`. El usuario confirmó que no dispone de alojamiento y solicitó preparar el servicio sin contratar nada. No se contrataron servicios ni se enviaron registros reales. La administración escolar completa y el endurecimiento para producción siguen pendientes, diferenciados de esta prueba funcional.

## 3. Investigación — protocolo candidato y herramienta de minimización; sin estudio activo

Preparados `research/PROTOCOLO-BORRADOR.md`, agregador y comando de exportación deliberada. La prueba utiliza cinco perfiles sintéticos y comprueba supresión de cohortes pequeñas, deduplicación y ausencia de identificadores/fechas. No se conecta el juego a un canal de investigación. Falta institución responsable, revisión y decisiones de participación/conservación; no pueden suplirse generando un consentimiento ficticio. El agregado no se presenta como anonimato garantizado.

## 4. Cobertura educativa — ampliación y mapa; cobertura completa pendiente

Contrastados programas SEP 2025 y preparada matriz por ámbitos. Se incorporan 360 problemas adicionales de cinco familias sin alterar los 6 270 anteriores; banco combinado web/Android 6 630. Añadida lectura con voces españolas locales y cuatro actividades cooperativas con rúbrica de observación humana. Revisión independiente y pilotaje pendientes. La cobertura total no se resuelve sumando reactivos de opción múltiple: quedan modalidades de construcción, manipulación y argumentación. Leer `COBERTURA-Y-COOPERACION.md`.

## 5. Resultados y evaluación — presentación reorganizada en candidato

Resultados web con alias, filtros de periodo/contenido, tarjetas de aciertos/errores/ritmo, barras, evolución por nivel y metodología desplegable. Las muestras pequeñas se identifican. Se armonizan los cortes descriptivos de precisión en 50/80% y se simplifica el texto de resultados Android. La prueba separa precisión de la muestra válida de velocidad. La validez educativa y la equivalencia con Arcademics no se afirman. La prueba con condiciones fijas y los puntos de carrera se resuelven en el frente de jugabilidad.

## 6. Conservación y seguridad — respaldos implementados; protección local limitada

Web/Windows y Android tienen copias completas cifradas con recuperación mediante nueva contraseña. Se probaron clave equivocada, alteración, continuidad de partida e identidad. Android rechaza reemplazar un perfil existente. No hay cifrado de los datos activos, recuperación remota ni administración institucional de credenciales. No se presenta este acceso local como protección frente al control físico o técnico del dispositivo. Leer `COPIAS-Y-RECUPERACION.md`.

## 7. Compatibilidad y experiencia — carrera implementada y tres ciclos web

Revisión de competencia, fricción, estética, ritmo, adaptación, recompensas y resultados. Se incorpora carrera opcional contra tres rivales virtuales en web/Windows y Android nativo; nivel fijo por carrera, calibración del ritmo, posición y puntos separados de medidas educativas. Tres ciclos web en móvil normal, móvil compacto y Firefox/laptop identificaron y corrigieron desbordamiento del sonido y altura excesiva. Se mantienen práctica tranquila, corrección visible y funcionamiento offline. Leer `JUGABILIDAD-0.4.0.md` y `EVALUACION-0.4.0.md` para evidencia y límites.

La compilación inicial pasó Android 14–16 con navegador y WebView deshabilitados. La revisión visual motivó un ajuste adicional de altura nativa, sometido de nuevo al flujo completo. La prueba física en un teléfono de gama baja y la observación con niños siguen pendientes; los emuladores no las sustituyen.

## 8. Distribución, difusión y documentación académica — paquetes y documentación

Se publicaron APK/AAB firmados y Windows portátil en 0.4.0, página pública para docentes, metadatos/sitemap, material de difusión y expediente descriptivo del software. La publicación efectiva y hashes se registran en las notas de versión. No se han publicado mensajes en redes ni contactado a terceros; se prepararon textos y estrategias. No se contrataron servicios, certificados o cuentas de tiendas. La publicación en tiendas y el registro curricular no se afirman realizados.

El usuario decidió expresamente preparar el servicio sin contratar alojamiento. Esa dependencia no impide las pruebas locales ni la transferencia manual, pero la entrega automática entre hogares y docentes continúa sin servicio público. Quedan además trabajos de ingeniería posibles —paridad de informes Android, narración nativa, más modalidades curriculares, administración docente y endurecimiento del servidor— que no deben describirse como bloqueos exclusivamente externos. El alcance íntegro no queda cerrado por publicar esta versión.

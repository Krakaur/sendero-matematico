# Sendero Matemático · Web 0.7.0

[Jugar](https://krakaur.github.io/sendero-matematico/) · [Actualizar conservando datos](https://krakaur.github.io/sendero-matematico/actualizar.html) · [Android 14–16](https://github.com/Krakaur/sendero-matematico/releases/download/v0.4.0/Sendero-Nativo-0.4.0.apk) · [Windows x64](https://github.com/Krakaur/sendero-matematico/releases/download/v0.4.0/Sendero-0.4.0-Windows-x64.exe) · [Para docentes](https://krakaur.github.io/sendero-matematico/docentes.html)

Juego gratuito en español para practicar matemáticas con conectividad intermitente. Incluye cálculo, tablas ampliadas hasta el 20 y 6 630 problemas y variantes. No utiliza IA en el dispositivo. Desarrollo: Dirk Hans Krakaur Floranes. Código e ilustraciones originales con licencia MIT; sin afiliación con Arcademics.

## Carrera y aprendizaje

La regata web transcurre en un bosque ilustrado con personajes, remos, estelas y ambiente sonoro originales. Nube destaca en la salida, Rayo alterna impulsos y Chispa acelera hacia el final. Sus tiempos y ritmos varían entre carreras y se fijan al comenzar; no reaccionan al desempeño posterior del jugador. Los adelantamientos tienen una señal visual y sonora. El silencio, los volúmenes y la reducción de movimiento se conservan por perfil.

La web 0.7.0 incorpora paisaje y personajes con textura y volumen, una cámara que acompaña a Luma y movimiento continuo por impulsos. Antes de salir se puede elegir Paseo, Carrera o Desafío sin cambiar el nivel matemático. La calibración usa el tiempo necesario para resolver correctamente, incluidas las correcciones; una respuesta errónea rápida no acelera a los rivales. Las nuevas ilustraciones se descargan una vez y se conservan para jugar sin conexión.

La copa del río comienza en un muelle ilustrado: presenta a Luma, los rivales y las reglas antes de una cuenta de tres pulsos con sonido opcional. La espera no consume tiempo de respuesta. La salida se puede cancelar; con movimiento reducido es directa. Las carreras ya empezadas se reanudan sin repetir la preparación.

La carrera tiene posición, tiempo y puntos; su referencia de ritmo se calibra con la práctica anterior. El nivel permanece fijo durante ocho retos y se adapta para la siguiente carrera. Cada acierto en cálculo avanza con un toque. El error muestra la solución centrada y destacada hasta seleccionarla correctamente. También existe práctica tranquila; el razonamiento permite leer y explicar sin carrera. Las carreras guardadas en versiones anteriores conservan sus rivales originales.

Al terminar los ocho retos, la canoa alcanza la meta y aparece un cierre ilustrado con posición, puntos y tiempo. Se puede volver al río o elegir otro camino sin recorrer un informe largo. El detalle de la carrera y los resultados educativos se despliega por separado; los rivales que aún no llegaron se muestran como «En el río».

Esta entrega corresponde a la **web 0.7.0**. Las descargas Android y Windows permanecen en **0.4.0**. [Cambios, pruebas y límites de la web](docs/EVALUACION-WEB-0.7.0.md) · [Comparación de arte y jugabilidad](docs/ANALISIS-ARCADEMICS-WEB-0.7.0.md).

Los puntos son recompensas de juego. El informe educativo distingue precisión inicial, resolución sin ayuda, pistas, correcciones y ritmo de respuesta. La web separa evolución por modalidad, contenido y nivel. Una posición, porcentaje o color no acredita aprendizaje ni equivale a calificación escolar.

## Perfiles, respaldo y conexión

Web, Windows y Android permiten hasta ocho perfiles locales con contraseña. Las copias protegidas conservan historial, adaptación y partida. Android y web/Windows tienen formatos de respaldo diferentes; los informes educativos JSON siguen siendo compatibles. El almacenamiento activo no está cifrado por la aplicación. [Copias y recuperación](docs/COPIAS-Y-RECUPERACION.md).

En web, abre una vez con internet y espera «Lista sin conexión». Android incluye los recursos desde la instalación y funciona sin navegador ni WebView. Windows incluye su motor y recursos; es más pesado y no tiene certificado comercial. Borrar datos o desinstalar puede eliminar el progreso: guarda copias y comprueba su recuperación.

La exportación docente manual está disponible en las tres ediciones. Web/Windows incorporan un cliente de entrega por invitación y un receptor local probado; **no existe servidor público ni se contrató alojamiento**. Android continúa con entrega manual. La administración escolar completa y el endurecimiento para producción siguen pendientes. [Servicio docente](docs/SERVICIO-DOCENTE.md).

## Estado educativo y colaboración

La cobertura SEP es parcial. La [matriz curricular](docs/MAPA-CURRICULAR-0.4.0.csv) y las [actividades cooperativas](docs/COBERTURA-Y-COOPERACION.md) distinguen lo implementado de lo faltante. Los lectores iniciales necesitan acompañamiento; la voz web requiere una voz española instalada. Android todavía no incorpora narración.

Las pruebas técnicas no sustituyen un pilotaje: **no se ha demostrado eficacia educativa ni realizado una evaluación con niños**. La investigación está desactivada. Existe un [protocolo candidato](research/PROTOCOLO-BORRADOR.md) y un agregador sujetos a decisiones institucionales. Los informes individuales son seudónimos, no anónimos.

Pueden proponerse revisiones de situaciones, pruebas de uso y colaboración mediante [Issues](https://github.com/Krakaur/sendero-matematico/issues). No publiques datos ni expedientes de menores.

## Desarrollo y evidencia

```sh
npm ci
npm test
python -m http.server 4173 --bind 127.0.0.1 --directory web
npm run build:windows
```

El proyecto Android está en `native-android/`; la compilación, firma, lint y pruebas en API 34–36 están en `.github/workflows/native-android.yml`. La clave se administra fuera del repositorio. `main` conserva fuentes, `gh-pages` publica el sitio y Releases distribuye paquetes. Al cambiar recursos web debe renovarse la caché de `web/sw.js`.

[Evaluación 0.4.0](docs/EVALUACION-0.4.0.md) · [Jugabilidad y métricas](docs/JUGABILIDAD-0.4.0.md) · [Avance y pendientes](docs/AVANCE-SECUENCIAL.md) · [Distribución y expediente](docs/DISTRIBUCION-Y-EXPEDIENTE-0.4.0.md) · [Privacidad](docs/PRIVACIDAD.md) · [iOS pendiente](docs/IOS-PENDIENTE.md) · [Tiempo y retos](docs/TIEMPO-Y-RETOS.md) · [Historia de versiones](docs/HISTORIAL-README.md)

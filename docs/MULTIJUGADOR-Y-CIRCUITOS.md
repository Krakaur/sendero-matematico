# Juego compartido y circuitos · web 0.8.0

## Uso

«Jugar juntos» permite entrar sin perfil. Se elige contenido, nivel de cantidades, circuito y carrera amistosa o cooperación. En un dispositivo juegan dos personas con zonas táctiles independientes o teclas A/S/D/F y J/K/L/Ñ. Por enlace juegan entre dos y cuatro personas; quien crea la sala comparte la invitación completa y da la salida después de la confirmación de todos. Se conserva la sala para una revancha con nuevos ejercicios.

La pausa detiene el tiempo de todos y exige nuevas confirmaciones. Ocultar una pestaña durante el recorrido pide esa pausa. La primera llegada no termina los ejercicios pendientes de otras personas. En cooperación no hay clasificación: el objetivo se completa cuando cada participante resuelve ocho retos. Las explicaciones entre participantes son compatibles con esta modalidad; sus datos quedan separados del expediente individual.

## Reglas y autoridad

`room.js` contiene el protocolo 1 y las transiciones puras; `together.js` enlaza interfaz, controles y representación; `room-link.js` gestiona transporte. El anfitrión valida cada respuesta contra el identificador de conexión, índice actual y alternativas. No recibe puntuaciones o posiciones calculadas por los invitados. Hay límites de cuatro participantes, ocho preguntas, tamaño de mensaje y frecuencia de entrada. Se validan instantáneas recibidas y se descartan revisiones antiguas de una misma partida.

Todos reciben el mismo conjunto de ocho hechos, sin repetición exacta en la muestra auditada de 1.600 configuraciones. Las posiciones de respuesta varían por asiento y pregunta. La semilla fija el contenido de cada partida. No se adapta la dificultad de una persona a mitad del recorrido compartido: el nivel común se acuerda antes.

La clasificación utiliza el tiempo activo del anfitrión. La ventana para llegadas compartidas crece con el mayor viaje de ida y vuelta observado, entre 150 y 1.000 ms en línea. Cada grupo de empate se forma respecto a su primera llegada; no encadena indefinidamente llegadas próximas. Las posiciones posteriores usan clasificación de competición, por ejemplo 1, 1, 3, 3. El margen es una aproximación para juego amistoso, sin árbitro independiente ni protección integral contra modificaciones del anfitrión.

Se envía una instantánea ante cambios y cada 900 ms; el pulso de conexión ocurre cada dos segundos. Siete segundos sin respuesta o latencia superior a 1.500 ms durante la carrera provocan pausa. Una desconexión no concede una victoria. No se implementan migración de anfitrión ni reconexión automática con recuperación de identidad; se prepara una nueva sala. Los resultados ya completos se conservan en pantalla si se cierra la conexión.

## Dependencias y despliegue

La distribución es estática y sigue alojada en GitHub Pages. El cliente PeerJS 1.5.5 se conserva localmente con licencia MIT y registro de integridad en `qa-web-0.8.0/vendor.json`. Se ejecuta solo al elegir crear o entrar en una sala. PeerServer Cloud y STUN de Google son servicios externos; no hay TURN propio ni garantía de disponibilidad. Las redes que impiden conexión directa pueden necesitar otro acceso a internet. La modalidad en la misma pantalla conserva funcionamiento offline.

No se solicitan permisos audiovisuales. El fragmento de la invitación contiene sala y llave; el historial individual no se serializa en el transporte. Consultar `PRIVACIDAD.md` para los límites de conservación por participantes y metadatos externos. No introducir credenciales TURN en el repositorio si se amplía la infraestructura.

## Geometría

`circuit.js` construye dos cursos de meandros y un circuito cerrado. Cada carril tiene 641 muestras, distancia acumulada y tangentes continuas; la posición se interpola por longitud de arco. Los carriles tienen diferentes longitudes geométricas. Ocho aciertos completan cualquier carril: la igualdad se refiere a trabajo matemático y fracción del circuito, no a metros recorridos.

La cámara transforma juntos escenario y embarcaciones. El minimapa muestra la geometría real. En movimiento reducido la cámara permanece fija y muestra el circuito completo. Las curvas son presentación espacial, no una prueba adicional de conducción. Los tiempos y trayectorias lógicas de NPC antiguos permanecen intactos. Las partidas individuales que no guardaban circuito utilizan el bosque.

## Verificación y límites

Consultar `EVALUACION-WEB-0.8.0.md` y los JSON de `qa-web-0.8.0/`. Los ensayos de red conectan navegadores aislados mediante señalización pública real, en un solo equipo físico. No sustituyen una matriz de redes escolares, domésticas y móviles, ni evaluación con estudiantes. No se atribuye superioridad educativa o preferencia a una lista de prestaciones.

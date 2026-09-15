# Evaluación de Sendero: ciclos 0.1.0 y actualización 0.1.1

Estado: tres ciclos de revisión técnica y heurística completados. Prototipo funcional; pendiente de evaluación con población destinataria. Las pruebas de software no equivalen a una evaluación con niñas, niños o docentes, ni a validación de eficacia educativa.

## Ciclo 1 — Primera interacción y presentación móvil

Se inspeccionaron la portada en escritorio y en una ventana de 390 × 844, el inicio de una aventura, una respuesta incorrecta y la apertura de una pista. Las opciones son controles táctiles amplios; la corrección no elimina intentos anteriores ni usa penalizaciones temporales. La ilustración es vectorial, original y está incluida localmente.

Hallazgos: la ilustración de portada retrasaba la llegada al selector en móvil; la animación de entrada se repetía al contestar. Cambios: menor altura de portada móvil y eliminación de la animación en el ejercicio. Se incorporó un perfil de evaluación multidimensional con colores, barras, valores y definiciones explícitas. Los umbrales de color son descriptivos y no representan niveles de dominio validados.

## Ciclo 2 — Recorrido, adaptación y transferencia

Se completó una aventura de ocho sumas mediante interacción con el navegador. El primer ejercicio recibió una respuesta incorrecta y una pista; los siete restantes se resolvieron al primer intento. La recarga conservó la pregunta, el error y la ayuda. Se observó el avance desde nivel 1 a nivel 2 y después nivel 3. El informe mostró ocho ejercicios, siete aciertos iniciales (88% redondeado), una pista y desglose de 4, 3 y 1 ejercicios por nivel.

Se descargó el informe JSON, se importó en el panel docente y se repitió la importación. La primera incorporó una sesión y la segunda cero, sin duplicar registros. Las barras expusieron etiquetas accesibles y valores numéricos.

Hallazgos: una dimensión de corrección final resultaba poco informativa en actividades que exigen acertar para avanzar; además, dos pestañas podían conservar estados diferentes. Cambios: definición de corrección al segundo intento y actualización mediante el evento de almacenamiento entre pestañas. Se actualizó también el estado visible después de exportar. Se añadieron documentación, metadatos sociales y acceso a Windows desde la portada. Una comprobación sintáctica detectó y permitió corregir un escape de salto de línea introducido durante la edición.

## Ciclo 3 — Pantallas estrechas y continuidad sin servidor

Se inspeccionó una ventana de 320 × 740 y se redujo la tipografía de portada y ejercicios para ese ancho. Las opciones de respuesta midieron aproximadamente 110 × 67 píxeles en ese tamaño; el ancho total del documento fue 305 píxeles con una ventana de 320, sin desbordamiento horizontal general. Las tablas amplias conservan desplazamiento dentro de su contenedor. La comprobación de escritorio utilizó una ventana de 1536 píxeles, además de la revisión móvil de 390 × 844 del primer ciclo. Son tamaños simulados en Chrome de escritorio, no dispositivos físicos Android.

Se detuvo el proceso del servidor HTTP local de prueba y se verificó que dejó de responder. Con ese origen indisponible, el navegador recargó el juego desde sus recursos almacenados, recuperó la aventura de multiplicación, abrió una pista de grupos iguales, corrigió una respuesta y avanzó al siguiente ejercicio. El estado siguió indicando disponibilidad sin conexión. Esta prueba demuestra independencia inmediata del servidor; no demuestra conservación durante un mes ni resistencia al borrado por el sistema operativo.

Se importó el archivo del ciclo anterior en un segundo origen local, con perfil distinto, mientras el servidor seguía detenido. Se verificaron el perfil recibido, las cuatro dimensiones individuales y el desglose por nivel. Se revisaron visualmente las barras en 320 píxeles. Los valores de la aventura sintética fueron 7/8 en precisión inicial, 7/8 en resolución sin ayuda, 1/8 en uso de pistas y 1/1 en corrección al segundo intento.

Cambios finales: menor tipografía en 320 píxeles, control de sonido sin compresión en ese tamaño, informes importados desglosados por perfil, comprobación de recursos de caché antes de afirmar disponibilidad sin conexión y apertura restringida de documentación desde la edición Windows.

## Pruebas automatizadas y paquete Windows

Diez pruebas automatizadas pasan. Incluyen 12 000 ejercicios generados con semilla reproducible para comprobar aritmética, opciones únicas, valores no negativos y rangos por dificultad; reglas de aumento y reducción de nivel; límites de la adaptación; diferencias entre precisión, independencia, pistas y corrección al segundo intento; ausencia de observaciones; transferencia de informes; rechazo de registros inválidos; deduplicación y conservación tras serializar.

Se verificó la sintaxis de los módulos y se compiló la edición Windows x64 con las dependencias fijadas. Los hashes de los archivos distribuidos acompañan la publicación. La interacción se evaluó en Chrome sobre la base compartida; no se ha realizado una sesión completa de pruebas de interfaz dentro del ejecutable Windows ni una matriz de versiones de Windows. El ejecutable carece de firma digital comercial. La publicación 0.1.0 no incluyó APK; la incorporación Android se registra a continuación.

## Actualización 0.1.1: corrección visible y Android

Después de un error, la solución aparece centrada dentro de un recuadro amarillo con borde, tipografía prominente y signos de exclamación. Se muestra una explicación de la operación y se destaca la opción correcta. La revisión visual a 390 × 844 confirmó el ejemplo «¡3 + 3 = 6!» y la respuesta seleccionable resaltada. El intento incorrecto se conserva; la respuesta posterior no pasa a considerarse independiente. Se registra `solutionShown` para distinguir la exposición a la solución.

La suite de lógica pasó 11 pruebas, incluida una regresión que conserva el error y la solución mostrada durante serialización y no cuenta la respuesta posterior como independiente. La edición Windows se recompiló y se cotejaron los archivos incorporados con las fuentes. No se añaden pruebas físicas de Windows a las declaradas anteriormente.

La APK de release mide 175716 bytes y el AAB 186437 bytes. La firma Android se verificó con los esquemas v1 y v2. La APK incluye los recursos web exactos de su commit de origen, no contiene bibliotecas nativas empaquetadas ni declara permisos. Android Lint concluyó con cero errores y cuatro avisos de versiones de dependencias más recientes. Se mantuvieron versiones fijas; actualizar dependencias requiere revisar compatibilidad mínima. El peso no incluye WebView del sistema ni representa memoria de ejecución.

Las verificaciones de compilación, firma y correspondencia de recursos proceden del flujo [Android package](https://github.com/Krakaur/sendero-matematico/actions/workflows/android.yml). Los resultados de integración Android se conservarán con la ejecución concreta. No se atribuyen al emulador resultados de pruebas en teléfonos físicos, ni se afirma validación en toda la gama baja.

## Límites de esta evaluación

No se ha medido atractivo con población infantil, retención de uso, cambio de aprendizaje ni accesibilidad mediante usuarios de tecnologías de apoyo. La estética se revisó por legibilidad, coherencia gráfica, jerarquía y espacio táctil; no mediante preferencias medidas en usuarios. Los registros de pruebas son sintéticos. No hay sincronización remota de expedientes ni recogida para investigación. El uso simultáneo intenso, las cuotas de almacenamiento y la conservación durante semanas requieren pruebas adicionales antes de uso institucional con expedientes reales.

En la ejecución [35013263529](https://github.com/Krakaur/sendero-matematico/actions/runs/35013263529), la prueba de integración pasó en emulador Android 15 / API 35, x86_64, con 2048 MB de RAM configurados. Comprobó primer inicio con recursos locales, respuesta incorrecta, solución destacada, ausencia de desbordamiento horizontal, recarga y conservación de la solución y de los dos intentos. Se ejecutó sobre la variante Debug; la variante Release se compiló, firmó e inspeccionó por separado. No se probaron todavía los selectores nativos de exportación/importación ni un teléfono físico.

Una comprobación inicial de recarga consultó el documento anterior antes de completarse la navegación y falló; se corrigió la espera de la prueba para identificar el nuevo documento. La publicación web también fuerza la renovación de recursos al instalar una nueva caché, evitando incorporar respuestas antiguas de la caché HTTP del navegador.

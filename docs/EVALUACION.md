# Evaluación de Sendero 0.1.0

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

Se verificó la sintaxis de los módulos y se compiló la edición Windows x64 con las dependencias fijadas. Los hashes de los archivos distribuidos acompañan la publicación. La interacción se evaluó en Chrome sobre la base compartida; no se ha realizado una sesión completa de pruebas de interfaz dentro del ejecutable Windows ni una matriz de versiones de Windows. El ejecutable carece de firma digital comercial. No se distribuye APK.

## Límites de esta evaluación

No se ha medido atractivo con población infantil, retención de uso, cambio de aprendizaje ni accesibilidad mediante usuarios de tecnologías de apoyo. La estética se revisó por legibilidad, coherencia gráfica, jerarquía y espacio táctil; no mediante preferencias medidas en usuarios. Los registros de pruebas son sintéticos. No hay sincronización remota de expedientes ni recogida para investigación. El uso simultáneo intenso, las cuotas de almacenamiento y la conservación durante semanas requieren pruebas adicionales antes de uso institucional con expedientes reales.

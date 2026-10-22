import {REASONING_C9_FAMILIES,reasoningC9Items} from './reasoning-c9.js';

// New supported condition. C9@2 remains immutable and keeps interaction 3.
export const REASONING_SUPPORT_VERSION='reasoning-supported-pack@1';
export const REASONING_SUPPORT_PROTOCOL=6;
export const REASONING_SUPPORT_SOURCE=Object.freeze({contentId:'reasoning-fixed-pack',contentVersion:2,
  sha256:'57e1042273140e0601cbba3e5e0b2c62a169ef8e1d068917469ea794ddfd48b1',sha256Encoding:'utf8-lf',
  scaffoldsSha256:'fb20545f3c193854294c35b5bf823babc8739f2687e41c5dc2d773bf50355618'});
const SCAFFOLDS = {"c9-comparacion_inversa-L2-V1-01":{"type":"comparison","title":"Dos cajas de semillas","description":"Esquema, no a escala. Se muestran las cantidades de las dos cajas y la diferencia preguntada.","unit":"semillas","rows":[{"label":"Primera caja","value":17,"unit":"semillas"},{"label":"Segunda caja","value":9,"unit":"semillas"},{"label":"Diferencia preguntada","value":null,"unit":"semillas"}],"questionMark":"¿Cuántas más contiene la primera caja?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V1-02":{"type":"comparison","title":"Antes y después del préstamo","description":"Esquema, no a escala. Se prestaron libros y quedaron otros; no hubo otras entradas ni pérdidas.","unit":"libros","rows":[{"label":"Antes del préstamo","value":null,"unit":"libros"},{"label":"Libros prestados","value":7,"unit":"libros"},{"label":"Libros que quedaron","value":18,"unit":"libros"}],"questionMark":"¿Cuántos libros había antes?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V1-03":{"type":"comparison","title":"Los dos equipos","description":"Esquema, no a escala. El equipo A tiene cinco fichas más que el equipo B.","unit":"fichas","rows":[{"label":"Equipo A","value":14,"unit":"fichas"},{"label":"Diferencia: A tiene más que B","value":5,"unit":"fichas"},{"label":"Equipo B","value":null,"unit":"fichas"}],"questionMark":"¿Cuántas fichas reunió B?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V1-04":{"type":"comparison","title":"Completar la colección","description":"Esquema, no a escala. Se distinguen la cantidad necesaria, la disponible y lo que falta.","unit":"fichas","rows":[{"label":"Cantidad necesaria","value":23,"unit":"fichas"},{"label":"Cantidad disponible","value":15,"unit":"fichas"},{"label":"Cantidad que falta","value":null,"unit":"fichas"}],"questionMark":"¿Cuántas fichas faltan?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V2-01":{"type":"comparison","title":"Cuadernos en dos estantes","description":"Esquema, no a escala. Los rótulos mantienen los datos de los dos estantes y dejan abierta la diferencia.","unit":"cuadernos","rows":[{"label":"Primer estante","value":28,"unit":"cuadernos"},{"label":"Segundo estante","value":19,"unit":"cuadernos"},{"label":"Diferencia preguntada","value":null,"unit":"cuadernos"}],"questionMark":"¿Cuántos más hay en el primer estante?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V2-02":{"type":"comparison","title":"Antes y después de subir","description":"Esquema, no a escala. Ocho personas subieron al autobús y nadie bajó.","unit":"personas","rows":[{"label":"Antes de que subieran","value":null,"unit":"personas"},{"label":"Personas que subieron","value":8,"unit":"personas"},{"label":"Después de que subieran","value":21,"unit":"personas"}],"questionMark":"¿Cuántas personas había antes?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V2-03":{"type":"comparison","title":"Dos cintas","description":"Esquema, no a escala. La cinta corta mide cuatro centímetros menos que la otra.","unit":"cm","rows":[{"label":"Cinta corta","value":12,"unit":"cm"},{"label":"Diferencia entre las cintas","value":4,"unit":"cm"},{"label":"Otra cinta","value":null,"unit":"cm"}],"questionMark":"¿Cuánto mide la otra cinta?","scale":"not-to-scale"},"c9-comparacion_inversa-L2-V2-04":{"type":"comparison","title":"Tizas en dos cajas","description":"Esquema, no a escala. El total corresponde a las dos cajas juntas; sólo se conoce el contenido de una.","unit":"tizas","rows":[{"label":"Total de las dos cajas","value":31,"unit":"tizas"},{"label":"Una caja","value":14,"unit":"tizas"},{"label":"La otra caja","value":null,"unit":"tizas"}],"questionMark":"¿Cuántas tizas hay en la otra caja?","scale":"not-to-scale"},"c9-patrones-L2-V1-01":{"type":"sequence","title":"Una regla para cada paso","description":"Regla indicada: sumar 4 en cada paso.","unit":"número","rows":[{"label":"Primer número","value":3,"unit":"número"},{"label":"Segundo número","value":7,"unit":"número"},{"label":"Tercer número","value":11,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V1-02":{"type":"sequence","title":"Duplicar en cada paso","description":"Regla indicada: duplicar el número en cada paso.","unit":"número","rows":[{"label":"Primer número","value":2,"unit":"número"},{"label":"Segundo número","value":4,"unit":"número"},{"label":"Tercer número","value":8,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V1-03":{"type":"sequence","title":"Dos acciones que se repiten","description":"Regla indicada: sumar 2 y luego sumar 5; repetir esas dos acciones en ese orden.","unit":"número","rows":[{"label":"Primer número","value":1,"unit":"número"},{"label":"Segundo número","value":3,"unit":"número"},{"label":"Tercer número","value":8,"unit":"número"},{"label":"Cuarto número","value":10,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V1-04":{"type":"sequence","title":"Dos pasos desde el inicio","description":"El contador empieza en 64. Regla indicada: dividir entre 2 en cada paso. Se pregunta por exactamente dos pasos.","unit":"número","rows":[{"label":"Inicio","value":64,"unit":"número"},{"label":"Después del primer paso","value":null,"unit":"número"},{"label":"Después del segundo paso","value":null,"unit":"número"}],"questionMark":"¿Qué marca después del segundo paso?","scale":"none"},"c9-patrones-L2-V2-01":{"type":"sequence","title":"Sumar en cada paso","description":"Regla indicada: sumar 3 en cada paso.","unit":"número","rows":[{"label":"Primer número","value":4,"unit":"número"},{"label":"Segundo número","value":7,"unit":"número"},{"label":"Tercer número","value":10,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V2-02":{"type":"sequence","title":"Triplicar en cada paso","description":"Regla indicada: triplicar la cantidad en cada paso.","unit":"número","rows":[{"label":"Primer número","value":1,"unit":"número"},{"label":"Segundo número","value":3,"unit":"número"},{"label":"Tercer número","value":9,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V2-03":{"type":"sequence","title":"Repetir un par de acciones","description":"Regla indicada: sumar 4 y luego sumar 1; repetir esas dos acciones en ese orden.","unit":"número","rows":[{"label":"Primer número","value":2,"unit":"número"},{"label":"Segundo número","value":6,"unit":"número"},{"label":"Tercer número","value":7,"unit":"número"},{"label":"Cuarto número","value":11,"unit":"número"},{"label":"Número siguiente","value":null,"unit":"número"}],"questionMark":"¿Qué número sigue?","scale":"none"},"c9-patrones-L2-V2-04":{"type":"sequence","title":"Tres pasos desde el inicio","description":"La cantidad empieza en 72. Regla indicada: dividir entre 2 en cada paso. Se pregunta por exactamente tres pasos.","unit":"número","rows":[{"label":"Inicio","value":72,"unit":"número"},{"label":"Después del primer paso","value":null,"unit":"número"},{"label":"Después del segundo paso","value":null,"unit":"número"},{"label":"Después del tercer paso","value":null,"unit":"número"}],"questionMark":"¿Qué cantidad hay después del tercer paso?","scale":"none"},"c9-medida_espacio-L3-V1-01":{"type":"rectangle","title":"Filas y cuadrados","description":"Esquema, no a escala. El rectángulo está cubierto por filas de cuadrados de un centímetro cuadrado.","unit":"filas, cuadrados y cm²","rows":[{"label":"Número de filas","value":6,"unit":"filas"},{"label":"Cuadrados en cada fila","value":4,"unit":"cuadrados"},{"label":"Área de cada cuadrado","value":1,"unit":"cm²"},{"label":"Área del rectángulo","value":null,"unit":"cm²"}],"questionMark":"¿Cuál es el área?","scale":"not-to-scale"},"c9-medida_espacio-L3-V1-02":{"type":"rectangle","title":"Largo, ancho y borde","description":"Esquema, no a escala. Se conocen el largo y el ancho del rectángulo; se pregunta por todo su borde.","unit":"cm","rows":[{"label":"Largo","value":7,"unit":"cm"},{"label":"Ancho","value":3,"unit":"cm"},{"label":"Todo el borde","value":null,"unit":"cm"}],"questionMark":"¿Cuánto mide todo el borde?","scale":"not-to-scale"},"c9-medida_espacio-L3-V1-03":{"type":"rectangle","title":"Un lado por encontrar","description":"Esquema, no a escala. Se conoce el área del rectángulo y la medida de su ancho.","unit":"cm y cm²","rows":[{"label":"Área","value":30,"unit":"cm²"},{"label":"Ancho","value":5,"unit":"cm"},{"label":"Largo","value":null,"unit":"cm"}],"questionMark":"¿Cuál es el largo?","scale":"not-to-scale"},"c9-medida_espacio-L3-V1-04":{"type":"rectangle","title":"El borde y un lado","description":"Esquema, no a escala. Se conoce la medida de todo el borde y la del ancho.","unit":"cm","rows":[{"label":"Todo el borde","value":26,"unit":"cm"},{"label":"Ancho","value":5,"unit":"cm"},{"label":"Largo","value":null,"unit":"cm"}],"questionMark":"¿Cuánto mide el largo?","scale":"not-to-scale"},"c9-medida_espacio-L3-V2-01":{"type":"rectangle","title":"Una superficie por filas","description":"Esquema, no a escala. La superficie rectangular está cubierta por filas de cuadrados de un centímetro cuadrado.","unit":"filas, cuadrados y cm²","rows":[{"label":"Número de filas","value":8,"unit":"filas"},{"label":"Cuadrados en cada fila","value":3,"unit":"cuadrados"},{"label":"Área de cada cuadrado","value":1,"unit":"cm²"},{"label":"Área del rectángulo","value":null,"unit":"cm²"}],"questionMark":"¿Cuál es el área?","scale":"not-to-scale"},"c9-medida_espacio-L3-V2-02":{"type":"rectangle","title":"La cerca del jardín","description":"Esquema, no a escala. La cerca debe rodear exactamente todo el borde del jardín rectangular.","unit":"m","rows":[{"label":"Largo","value":9,"unit":"m"},{"label":"Ancho","value":4,"unit":"m"},{"label":"Todo el borde","value":null,"unit":"m"}],"questionMark":"¿Cuántos metros de cerca se necesitan?","scale":"not-to-scale"},"c9-medida_espacio-L3-V2-03":{"type":"rectangle","title":"Área conocida","description":"Esquema, no a escala. Se conocen el área y el ancho del rectángulo.","unit":"cm y cm²","rows":[{"label":"Área","value":42,"unit":"cm²"},{"label":"Ancho","value":6,"unit":"cm"},{"label":"Largo","value":null,"unit":"cm"}],"questionMark":"¿Cuánto mide el largo?","scale":"not-to-scale"},"c9-medida_espacio-L3-V2-04":{"type":"rectangle","title":"Perímetro conocido","description":"Esquema, no a escala. El perímetro indica la medida de todo el borde del rectángulo.","unit":"cm","rows":[{"label":"Perímetro","value":30,"unit":"cm"},{"label":"Ancho","value":4,"unit":"cm"},{"label":"Largo","value":null,"unit":"cm"}],"questionMark":"¿Cuál es el largo?","scale":"not-to-scale"},"c9-datos_decisiones-L2-V1-01":{"type":"table","title":"El registro de frutas","description":"El registro conserva las tres clases de fruta. La pregunta se refiere a manzanas y peras juntas.","unit":"frutas","rows":[{"label":"Manzanas","value":7,"unit":"frutas"},{"label":"Peras","value":5,"unit":"frutas"},{"label":"Limones","value":9,"unit":"frutas"}],"questionMark":"¿Cuántas manzanas y peras hay juntas?","scale":"zero"},"c9-datos_decisiones-L2-V1-02":{"type":"table","title":"Lectura de dos días","description":"La tabla muestra las páginas leídas cada día. Se compara el martes con el lunes.","unit":"páginas","rows":[{"label":"Lunes","value":8,"unit":"páginas"},{"label":"Martes","value":13,"unit":"páginas"}],"questionMark":"¿Cuántas páginas más se leyeron el martes?","scale":"zero"},"c9-datos_decisiones-L2-V1-03":{"type":"table","title":"Lo que se sabe de las cajas","description":"Hay cinco cajas idénticas con lápices. La cantidad de lápices que contiene cada caja no está indicada.","unit":"según el rótulo","rows":[{"label":"Cajas","value":5,"unit":"cajas"},{"label":"Lápices en cada caja","value":null,"unit":"lápices"},{"label":"Lápices en total","value":null,"unit":"lápices"}],"questionMark":"¿Qué conclusión sobre el total está justificada?","scale":"none"},"c9-datos_decisiones-L2-V1-04":{"type":"table","title":"Libros y estantes","description":"Se conocen el total de libros y el número de estantes. No se informa cómo se repartieron.","unit":"según el rótulo","rows":[{"label":"Libros en total","value":24,"unit":"libros"},{"label":"Estantes","value":4,"unit":"estantes"},{"label":"Forma de reparto","value":"No indicada","unit":""},{"label":"Libros en cada estante","value":null,"unit":"libros"}],"questionMark":"¿Qué conclusión está justificada por estos datos?","scale":"none"},"c9-datos_decisiones-L2-V2-01":{"type":"table","title":"Carteles por momento del día","description":"Se conservan los datos de mañana, tarde y noche. La pregunta pide mañana y noche en total, sin contar los carteles de la tarde.","unit":"carteles","rows":[{"label":"Mañana","value":6,"unit":"carteles"},{"label":"Tarde","value":4,"unit":"carteles"},{"label":"Noche","value":8,"unit":"carteles"}],"questionMark":"¿Cuántos carteles de mañana y noche hay en total?","scale":"zero"},"c9-datos_decisiones-L2-V2-02":{"type":"table","title":"Hojas recogidas","description":"La tabla conserva las cantidades recogidas el jueves y el viernes.","unit":"hojas","rows":[{"label":"Jueves","value":9,"unit":"hojas"},{"label":"Viernes","value":15,"unit":"hojas"}],"questionMark":"¿Cuántas hojas más se recogieron el viernes?","scale":"zero"},"c9-datos_decisiones-L2-V2-03":{"type":"table","title":"Bolsas con botones","description":"Hay tres bolsas iguales. No se conoce cuántos botones contiene cada bolsa.","unit":"según el rótulo","rows":[{"label":"Bolsas","value":3,"unit":"bolsas"},{"label":"Botones en cada bolsa","value":null,"unit":"botones"},{"label":"Botones en total","value":null,"unit":"botones"}],"questionMark":"¿Qué se puede afirmar sobre el total?","scale":"none"},"c9-datos_decisiones-L2-V2-04":{"type":"table","title":"Agua en tres jarras","description":"Cada medida de agua tiene la misma capacidad. Se repartieron las dieciocho medidas entre tres jarras sin derramar agua; no se indica la cantidad de cada jarra.","unit":"según el rótulo","rows":[{"label":"Agua en total","value":18,"unit":"medidas iguales"},{"label":"Jarras","value":3,"unit":"jarras"},{"label":"Medidas en cada jarra","value":null,"unit":"medidas iguales"}],"questionMark":"¿Qué dato adicional permitiría conocer la cantidad de cada jarra?","scale":"none"},"c9-planificacion-L3-V1-01":{"type":"choices","title":"Dos condiciones para el recorrido","description":"Condiciones: como máximo 12 pasos y al menos 5 semillas. Las propuestas se conservan en su orden original.","unit":"pasos y semillas","rows":[{"label":"Propuesta 1","value":"13 pasos y 7 semillas","unit":""},{"label":"Propuesta 2","value":"8 pasos y 4 semillas","unit":""},{"label":"Propuesta 3","value":"10 pasos y 5 semillas","unit":""},{"label":"Propuesta 4","value":"14 pasos y 3 semillas","unit":""}],"questionMark":"¿Qué propuesta cumple ambas condiciones?","scale":"none"},"c9-planificacion-L3-V1-02":{"type":"table","title":"Cajas y capacidad del viaje","description":"Cada viaje puede llevar como máximo cinco cajas. El último viaje puede llevar menos. Se busca el menor número de viajes que permita llevar todas las cajas.","unit":"según el rótulo","rows":[{"label":"Cajas que hay que transportar","value":17,"unit":"cajas"},{"label":"Máximo por viaje","value":5,"unit":"cajas por viaje"},{"label":"Número de viajes buscado","value":null,"unit":"viajes"}],"questionMark":"¿Cuál es el menor número de viajes?","scale":"none"},"c9-planificacion-L3-V1-03":{"type":"table","title":"Dos tareas seguidas","description":"Las tareas deben hacerse una después de la otra, sin superponerse. Se dispone de un intervalo de nueve minutos.","unit":"minutos","rows":[{"label":"Primera tarea","value":4,"unit":"minutos"},{"label":"Segunda tarea","value":6,"unit":"minutos"},{"label":"Intervalo disponible","value":9,"unit":"minutos"}],"questionMark":"¿Pueden terminarse ambas dentro del intervalo?","scale":"none"},"c9-planificacion-L3-V1-04":{"type":"choices","title":"Elegir entre recorridos","description":"Condiciones: como máximo 10 pasos y al menos 3 botellas. Entre las propuestas que cumplan, se busca la de menos pasos. Se conserva el orden de las alternativas.","unit":"pasos y botellas","rows":[{"label":"B","value":"6 pasos y 2 botellas","unit":""},{"label":"C","value":"10 pasos y 5 botellas","unit":""},{"label":"D","value":"9 pasos y 3 botellas","unit":""},{"label":"A","value":"8 pasos y 4 botellas","unit":""}],"questionMark":"¿Cuál se debe elegir?","scale":"none"},"c9-planificacion-L3-V2-01":{"type":"choices","title":"Condiciones de una ruta","description":"Condiciones: como máximo 15 pasos y al menos 7 frutos. Las propuestas se conservan en su orden original.","unit":"pasos y frutos","rows":[{"label":"Propuesta 1","value":"16 pasos y 10 frutos","unit":""},{"label":"Propuesta 2","value":"14 pasos y 8 frutos","unit":""},{"label":"Propuesta 3","value":"12 pasos y 6 frutos","unit":""},{"label":"Propuesta 4","value":"18 pasos y 4 frutos","unit":""}],"questionMark":"¿Qué propuesta satisface ambas condiciones?","scale":"none"},"c9-planificacion-L3-V2-02":{"type":"table","title":"Transportar todas las cajas","description":"En un viaje caben como máximo seis cajas, pero puede llevar menos. Se busca el menor número de viajes que transporte todas las cajas.","unit":"según el rótulo","rows":[{"label":"Cajas que hay que mover","value":22,"unit":"cajas"},{"label":"Máximo por viaje","value":6,"unit":"cajas por viaje"},{"label":"Número de viajes buscado","value":null,"unit":"viajes"}],"questionMark":"¿Cuál es el menor número de viajes?","scale":"none"},"c9-planificacion-L3-V2-03":{"type":"table","title":"Actividades sin superponerse","description":"Las dos actividades se hacen seguidas, sin coincidir en el tiempo. El intervalo disponible corresponde a las dos juntas.","unit":"minutos","rows":[{"label":"Primera actividad","value":5,"unit":"minutos"},{"label":"Segunda actividad","value":8,"unit":"minutos"},{"label":"Intervalo disponible","value":12,"unit":"minutos"}],"questionMark":"¿Pueden completarse ambas dentro del intervalo?","scale":"none"},"c9-planificacion-L3-V2-04":{"type":"choices","title":"El camino más corto que cumpla","description":"Condiciones: como máximo 14 pasos y al menos 4 semillas. Entre los caminos que cumplan se busca el más corto. Se conserva el orden de las alternativas.","unit":"pasos y semillas","rows":[{"label":"A","value":"12 pasos y 4 semillas","unit":""},{"label":"B","value":"9 pasos y 3 semillas","unit":""},{"label":"C","value":"14 pasos y 6 semillas","unit":""},{"label":"D","value":"13 pasos y 5 semillas","unit":""}],"questionMark":"¿Qué camino corresponde?","scale":"none"},"c9-proporcionalidad-L3-V1-01":{"type":"relation","title":"Plantas y agua","description":"Cada planta recibe exactamente tres vasos de agua. Todas reciben la misma cantidad.","unit":"plantas y vasos","rows":[{"label":"Cantidad de referencia","value":1,"unit":"planta"},{"label":"Agua para esa planta","value":3,"unit":"vasos"},{"label":"Plantas que se riegan","value":4,"unit":"plantas"},{"label":"Agua para esas plantas","value":null,"unit":"vasos"}],"questionMark":"¿Cuántos vasos se necesitan?","scale":"none"},"c9-proporcionalidad-L3-V1-02":{"type":"relation","title":"Paquetes del mismo tipo","description":"Todos los paquetes contienen la misma cantidad de tarjetas. Se conoce el total de cinco paquetes y se pregunta por ocho.","unit":"paquetes y tarjetas","rows":[{"label":"Paquetes del dato conocido","value":5,"unit":"paquetes"},{"label":"Tarjetas de esos paquetes","value":20,"unit":"tarjetas"},{"label":"Paquetes de la pregunta","value":8,"unit":"paquetes"},{"label":"Tarjetas de esos paquetes","value":null,"unit":"tarjetas"}],"questionMark":"¿Cuántas tarjetas contienen los ocho paquetes?","scale":"none"},"c9-proporcionalidad-L3-V1-03":{"type":"relation","title":"Semillas en bolsas","description":"Las veinticuatro semillas se distribuyen en ocho bolsas con exactamente la misma cantidad en cada una.","unit":"bolsas y semillas","rows":[{"label":"Semillas en total","value":24,"unit":"semillas"},{"label":"Bolsas","value":8,"unit":"bolsas"},{"label":"Semillas en cada bolsa","value":null,"unit":"semillas"}],"questionMark":"¿Cuántas semillas recibe cada bolsa?","scale":"none"},"c9-proporcionalidad-L3-V1-04":{"type":"relation","title":"Cantidad inicial y cambio","description":"El contador comienza con cuatro fichas y añade dos por cada semilla plantada. El dato de tres semillas y diez fichas también aparece en el problema.","unit":"según el rótulo","rows":[{"label":"Cantidad inicial","value":4,"unit":"fichas"},{"label":"Aumento por cada semilla","value":2,"unit":"fichas por semilla"},{"label":"Semillas del dato conocido","value":3,"unit":"semillas"},{"label":"Fichas de ese dato","value":10,"unit":"fichas"},{"label":"Semillas de la pregunta","value":6,"unit":"semillas"},{"label":"Fichas de la pregunta","value":null,"unit":"fichas"}],"questionMark":"¿Cuántas fichas marcará con seis semillas?","scale":"none"},"c9-proporcionalidad-L3-V2-01":{"type":"relation","title":"Agua para macetas","description":"Cada maceta necesita exactamente cuatro vasos de agua. Las cinco macetas reciben esa misma cantidad cada una.","unit":"macetas y vasos","rows":[{"label":"Cantidad de referencia","value":1,"unit":"maceta"},{"label":"Agua para esa maceta","value":4,"unit":"vasos"},{"label":"Macetas que se riegan","value":5,"unit":"macetas"},{"label":"Agua para esas macetas","value":null,"unit":"vasos"}],"questionMark":"¿Cuántos vasos hacen falta?","scale":"none"},"c9-proporcionalidad-L3-V2-02":{"type":"relation","title":"Cajas del mismo tipo","description":"Todas las cajas tienen la misma cantidad de piezas. Se conoce el total de seis cajas y se pregunta por nueve.","unit":"cajas y piezas","rows":[{"label":"Cajas del dato conocido","value":6,"unit":"cajas"},{"label":"Piezas de esas cajas","value":18,"unit":"piezas"},{"label":"Cajas de la pregunta","value":9,"unit":"cajas"},{"label":"Piezas de esas cajas","value":null,"unit":"piezas"}],"questionMark":"¿Cuántas piezas habrá en nueve cajas?","scale":"none"},"c9-proporcionalidad-L3-V2-03":{"type":"relation","title":"Botones en bolsas","description":"Los treinta y cinco botones se reparten en siete bolsas con la misma cantidad en cada una, sin que sobren botones.","unit":"bolsas y botones","rows":[{"label":"Botones en total","value":35,"unit":"botones"},{"label":"Bolsas","value":7,"unit":"bolsas"},{"label":"Botones en cada bolsa","value":null,"unit":"botones"}],"questionMark":"¿Cuántos botones tiene cada bolsa?","scale":"none"},"c9-proporcionalidad-L3-V2-04":{"type":"relation","title":"Un contador con inicio propio","description":"El contador empieza en tres puntos y suma cuatro por cada estación visitada. El dato de dos estaciones y once puntos también aparece en el problema.","unit":"según el rótulo","rows":[{"label":"Cantidad inicial","value":3,"unit":"puntos"},{"label":"Aumento por cada estación","value":4,"unit":"puntos por estación"},{"label":"Estaciones del dato conocido","value":2,"unit":"estaciones"},{"label":"Puntos de ese dato","value":11,"unit":"puntos"},{"label":"Estaciones de la pregunta","value":4,"unit":"estaciones"},{"label":"Puntos de la pregunta","value":null,"unit":"puntos"}],"questionMark":"¿Qué marcará después de cuatro estaciones?","scale":"none"}};
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const exact=(x,keys)=>!!x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join('|')===[...keys].sort().join('|');
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const require=(ok,message='Evidencia de apoyo no compatible con la condición declarada.')=>{if(!ok)throw Error(message);};
export const REASONING_SUPPORT_FAMILIES=freeze(structuredClone(REASONING_C9_FAMILIES));
const PACKS=freeze(REASONING_SUPPORT_FAMILIES.flatMap(f=>[1,2].map(variant=>({family:f.id,level:f.level,variant,
  items:reasoningC9Items({contentId:'reasoning-fixed-pack',contentVersion:2,trail:'razonar',parameters:{family:f.id,level:f.level,variant},completionRule:{kind:'answered_items',count:4}}).map(q=>{
    const scaffold=SCAFFOLDS[q.bankId];require(!!scaffold,'Falta un apoyo del catálogo congelado.');
    return {...structuredClone(q),id:q.id.replace(/^c9-/,'c10s-'),bankId:q.bankId.replace(/^c9-/,'c10s-'),bankVersion:REASONING_SUPPORT_VERSION,
      context:'c10-supported-authored',sourceBankId:q.bankId,sourceBankVersion:q.bankVersion,
      scaffoldId:`${q.bankId}-visual`,scaffoldVersion:1,scaffold:structuredClone(scaffold)};
  }),
}))));
const ITEMS=new Map(PACKS.flatMap(pack=>pack.items.map(item=>[item.bankId,item])));
const find=p=>PACKS.find(pack=>pack.family===p?.family&&pack.level===p?.level&&pack.variant===p?.variant);
function canonicalItem(item){
  const expected=ITEMS.get(item?.bankId);
  require(!!expected&&Object.keys(expected).every(key=>same(item[key],expected[key])),'El ítem o su apoyo no coincide con el contenido congelado.');
  return expected;
}
export function validReasoningSupportedTask(t){
  return !!t&&t.contentId==='reasoning-supported-pack'&&t.contentVersion===1&&t.trail==='razonar'
    &&exact(t.parameters,['family','level','variant'])&&!!find(t.parameters)
    &&exact(t.completionRule,['kind','count'])&&t.completionRule.kind==='answered_items'&&t.completionRule.count===4;
}
export function reasoningSupportedItems(t){
  if(t?.contentId!=='reasoning-supported-pack')return null;
  require(validReasoningSupportedTask(t),'Paquete de razonamiento apoyado no compatible.');
  return structuredClone(find(t.parameters).items);
}
export function reasoningSupportedDescription(t){
  if(t?.contentId!=='reasoning-supported-pack')return null;
  require(validReasoningSupportedTask(t));
  const family=REASONING_SUPPORT_FAMILIES.find(f=>f.id===t.parameters.family);
  return `${family.name} · banda de requisitos ${family.level}, sin calibración · variante ${t.parameters.variant} · apoyos visuales y retroalimentación sólo a solicitud · contenido apoyado v1 · interacción 6`;
}
export function reasoningScaffoldText(item){
  const s=canonicalItem(item).scaffold;
  return [s.title,s.description,...s.rows.map(row=>`${row.label}: ${row.value===null?'?':row.value}${row.unit?' '+row.unit:''}.`),s.questionMark,
    s.scale==='not-to-scale'?'Esquema, no a escala.':s.scale==='zero'?`Barras desde cero; unidad: ${s.unit}.`:'Organización de datos sin escala cuantitativa.'].join('\n');
}
const scaffoldEvent=q=>({type:'scaffold',scaffoldId:q.scaffoldId,scaffoldVersion:q.scaffoldVersion,
  sourceBankId:q.sourceBankId,sourceBankVersion:q.sourceBankVersion,text:reasoningScaffoldText(q)});
const feedbackEvent=(q,choice)=>({type:'feedback',bankId:q.bankId,bankVersion:q.bankVersion,feedbackVersion:1,
  correctedChoice:choice,text:q.errorFeedback[choice]});

// Full ordered replay for protocol 6; callers must ALSO validate the session,
// immutable content, recipient, snapshots and <=32 KiB transport size.
export function validateReasoningSupportEvents(item,events,{pending=false}={}){
  const q=canonicalItem(item);require(Array.isArray(events)&&events.length<=10);
  const state={attempts:[],hint:false,solutionShown:false,solutionRequested:false,done:false,scaffoldShown:false,feedbackChoices:[]};
  for(const e of events){
    require(!state.done,'No se admiten acciones después de una respuesta correcta terminal.');
    if(e?.type==='wrong'||e?.type==='correct'){
      require(exact(e,['type','value'])&&q.options.includes(e.value)&&!state.attempts.includes(e.value));
      require((e.type==='correct')===(e.value===q.answer));state.attempts.push(e.value);state.done=e.type==='correct';
    }else if(e?.type==='hint'){
      require(exact(e,['type'])&&!state.hint);state.hint=true;
    }else if(e?.type==='solution'){
      require(exact(e,['type'])&&!state.solutionShown&&state.attempts.length>0&&state.attempts.at(-1)!==q.answer);
      state.solutionShown=true;state.solutionRequested=true;
    }else if(e?.type==='scaffold'){
      require(!state.scaffoldShown&&same(e,scaffoldEvent(q)),'El apoyo presentado no corresponde al texto y versión canónicos.');state.scaffoldShown=true;
    }else if(e?.type==='feedback'){
      const choice=state.attempts.at(-1);
      require(Number.isInteger(choice)&&choice!==q.answer&&!state.feedbackChoices.includes(choice)
        &&same(e,feedbackEvent(q,choice)),'La retroalimentación no corresponde a la última elección incorrecta o ya fue registrada.');
      state.feedbackChoices.push(choice);
    }else require(false,'Evento no admitido por la interacción 6.');
  }
  require(pending||state.attempts.length>0,'Falta responder el ítem antes del cierre.');
  return {...state,first:state.attempts.length?state.attempts[0]===q.answer:null,
    final:state.attempts.length?state.attempts.at(-1)===q.answer:null,
    firstWithoutHelp:events[0]?.type==='correct'};
}
export function reasoningSupportEvent(item,events,type){
  const q=canonicalItem(item),state=validateReasoningSupportEvents(q,events,{pending:true});
  require(['scaffold','feedback'].includes(type),'Sólo se construyen eventos de apoyo o retroalimentación.');
  if(state.done)return null;
  if(type==='scaffold')return state.scaffoldShown?null:scaffoldEvent(q);
  const choice=state.attempts.at(-1);
  return !Number.isInteger(choice)||choice===q.answer||state.feedbackChoices.includes(choice)?null:feedbackEvent(q,choice);
}
export function reasoningSupportEvidence(item,events){
  const state=validateReasoningSupportEvents(item,events);
  return {answered:1,first:Number(state.first),independent:Number(state.firstWithoutHelp),final:Number(state.final),
    hints:Number(state.hint),solutions:Number(state.solutionShown),scaffolds:Number(state.scaffoldShown),
    feedbackItems:Number(state.feedbackChoices.length>0),feedbackRequests:state.feedbackChoices.length,
    condition:'reasoning-supported-pack@1 / interaction-6; requested supports; no independent-learning inference'};
}

function scaffoldValue(row){
  return esc(row.value===null?'?':row.value)+(row.unit?' '+esc(row.unit):'');
}
function scaffoldData(rows,className=''){
  return '<dl class="scaffold-data '+className+'">'+rows.map(row=>
    '<div class="scaffold-datum'+(row.value===null?' is-unknown':'')+'"><dt>'+esc(row.label)+
    '</dt><dd>'+scaffoldValue(row)+'</dd></div>').join('')+'</dl>';
}
function scaffoldArrow(){
  return '<svg class="scaffold-connector" viewBox="0 0 28 28" aria-hidden="true" focusable="false"><path d="M14 2V23M7 16L14 23L21 16" fill="none" stroke="#466447" stroke-width="2"/></svg>';
}
function comparisonDiagram(s){
  const rows=s.rows;
  if(rows.length===3&&rows[0].label.startsWith('Antes ')){
    return '<div class="scaffold-change">'+scaffoldData([rows[0]])+
      scaffoldArrow()+scaffoldData([rows[1]],'scaffold-change-event')+
      scaffoldArrow()+scaffoldData([rows[2]])+'</div>';
  }
  if(rows.length===3&&rows[0].label.startsWith('Total ')){
    return '<div class="scaffold-part-whole">'+scaffoldData([rows[0]])+
      '<svg class="scaffold-branch" viewBox="0 0 240 28" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M120 0V12M60 27V12H180V27" fill="none" stroke="#466447" stroke-width="2"/></svg>'+
      '<div class="scaffold-parts">'+rows.slice(1).map(row=>scaffoldData([row])).join('')+'</div></div>';
  }
  // A bracket groups the labelled comparison without inventing proportional lengths.
  return '<div class="scaffold-comparison"><svg class="scaffold-bracket" viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path d="M18 2H4V98H18M4 50H18" fill="none" stroke="#466447" stroke-width="2"/></svg>'+
    scaffoldData(rows)+'</div>';
}
function sequenceDiagram(s){
  return '<ol class="scaffold-sequence">'+s.rows.map((row,index)=>
    '<li>'+scaffoldData([row])+(index<s.rows.length-1?scaffoldArrow():'')+'</li>').join('')+'</ol>';
}
function rectangleDiagram(s){
  const known=label=>s.rows.find(row=>row.label===label&&typeof row.value==='number'),
    horizontal=known('Largo')||known('Cuadrados en cada fila'),
    vertical=known('Ancho')||known('Número de filas');
  const short=row=>row.label==='Cuadrados en cada fila'?esc(row.value)+' por fila':
    row.label==='Número de filas'?esc(row.value)+' filas':scaffoldValue(row);
  const svg='<svg class="scaffold-dimensions" viewBox="0 0 240 175" aria-hidden="true" focusable="false">'+
    '<rect x="76" y="49" width="145" height="106" fill="#eef3e7" stroke="#36593b" stroke-width="2"/>'+
    (horizontal?'<path d="M76 43V33H221V43" fill="none" stroke="#466447"/><text x="148" y="24" text-anchor="middle" font-size="18" fill="#203b2a">'+short(horizontal)+'</text>':'')+
    (vertical?'<path d="M69 49H61V155H69" fill="none" stroke="#466447"/><text x="29" y="107" text-anchor="middle" font-size="17" fill="#203b2a">'+short(vertical)+'</text>':'')+
    '</svg>';
  return '<div class="scaffold-rectangle">'+svg+scaffoldData(s.rows)+'</div>';
}
function dataDiagram(s){
  if(s.scale==='zero'){
    require(s.rows.length>0&&s.rows.every(row=>typeof row.value==='number'&&Number.isFinite(row.value)&&row.value>=0&&row.unit===s.rows[0].unit),'Sólo datos homogéneos conocidos admiten barras desde cero.');
    const max=Math.max(1,...s.rows.map(row=>row.value));
    return '<dl class="scaffold-chart">'+s.rows.map(row=>
      '<div><dt>'+esc(row.label)+'</dt><dd><strong>'+scaffoldValue(row)+'</strong>'+
      '<svg viewBox="0 0 240 35" aria-hidden="true" focusable="false"><path d="M10 2V23H210" fill="none" stroke="#294a36"/><rect x="10" y="4" width="'+(200*row.value/max)+'" height="15" fill="#cbdcc5" stroke="#466447"/><text x="10" y="34" font-size="13" fill="#203b2a">0</text></svg></dd></div>').join('')+'</dl>';
  }
  // Mixed units and missing information stay tabular: bar lengths would invent comparability.
  return '<table class="scaffold-table"><caption>'+esc(s.title)+'</caption><thead><tr><th scope="col">Dato</th><th scope="col">Información disponible</th></tr></thead><tbody>'+
    s.rows.map(row=>'<tr><th scope="row">'+esc(row.label)+'</th><td'+(row.value===null?' class="is-unknown"':'')+'>'+scaffoldValue(row)+'</td></tr>').join('')+'</tbody></table>';
}
function choicesDiagram(s){
  // Route metadata contain proposals, not spatial coordinates or computed feasibility.
  return '<ul class="scaffold-choices">'+s.rows.map(row=>
    '<li><strong>'+esc(row.label)+'</strong><span>'+scaffoldValue(row)+'</span></li>').join('')+'</ul>';
}
function relationDiagram(s){
  const rows=s.rows;
  if(rows.length===4||rows.length===6){
    const offset=rows.length===6?2:0;
    return (offset?scaffoldData(rows.slice(0,offset),'scaffold-relation-conditions'):'')+
      '<div class="scaffold-relations"><section><h4>Datos de referencia</h4>'+
      scaffoldData(rows.slice(offset,offset+2))+'</section>'+
      '<span class="scaffold-relation-link" aria-hidden="true">↔</span>'+
      '<section><h4>Datos de la pregunta</h4>'+scaffoldData(rows.slice(offset+2))+'</section></div>';
  }
  if(rows.length===3&&rows[2].value===null){
    return '<div class="scaffold-relation-groups">'+scaffoldData(rows.slice(0,2))+
      '<div class="scaffold-relation-question">'+scaffoldData(rows.slice(2))+'</div></div>';
  }
  return scaffoldData(rows);
}
// Nothing is exposed before a canonical scaffold event. Teacher previews can
// construct that event explicitly without inserting it into student history.
export function reasoningScaffoldHTML(item,events=[]){
  const q=canonicalItem(item);validateReasoningSupportEvents(q,events,{pending:true});
  if(!events.some(e=>e.type==='scaffold'))return '';
  const s=q.scaffold;
  if(s.scale==='zero')require(s.type==='table','Sólo tablas homogéneas usan escala desde cero.');
  const diagram={comparison:comparisonDiagram,sequence:sequenceDiagram,rectangle:rectangleDiagram,
    table:dataDiagram,choices:choicesDiagram,relation:relationDiagram}[s.type];
  require(!!diagram,'Tipo de apoyo no compatible.');
  const scale=s.scale==='not-to-scale'?'Esquema, no a escala. Los tamaños no permiten calcular cantidades.':
    s.scale==='zero'?'Barras desde cero; unidad: '+s.unit+'. Todas las categorías usan el mismo color.':
    'Organización de datos sin escala cuantitativa.';
  return '<section class="reasoning-scaffold" aria-label="Apoyo visual solicitado"><h3>'+esc(s.title)+'</h3><p>'+esc(s.description)+'</p>'+
    '<figure><figcaption>'+esc(scale)+'</figcaption>'+diagram(s)+'</figure>'+
    '<p><strong>'+esc(s.questionMark)+'</strong></p><p class="micro">? indica la cantidad por hallar o un dato no indicado, según el rótulo. El apoyo organiza datos; no se ha calculado la respuesta.</p></section>';
}
export function reasoningFeedbackHTML(item,events=[]){
  const q=canonicalItem(item);validateReasoningSupportEvents(q,events,{pending:true});
  const feedback=events.filter(e=>e.type==='feedback');
  return feedback.length?`<section class="reasoning-feedback" aria-label="Retroalimentación solicitada"><h3>Revisar mis elecciones</h3><ol>${feedback.map(e=>`<li><strong>Elegiste: ${esc(q.labels[e.correctedChoice])}</strong><p>${esc(e.text)}</p></li>`).join('')}</ol><p class="micro">Estas orientaciones se refieren a tus elecciones registradas; no califican tu forma de pensar.</p></section>`:'';
}

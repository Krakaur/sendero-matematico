// Authored fixed content: reasoning-fixed-pack@2. Candidate C9; never mutate v1.
// Labels hold mathematical meaning; a/b are unused numeric compatibility fields, not operands.
const FAMILIES = [
  {
    "id": "comparacion_inversa",
    "name": "Comparar y encontrar lo desconocido",
    "level": 2,
    "description": "Relacionar cantidades y distinguir diferencia, parte, referente y estado inicial desconocidos. Banda declarada de requisitos, sin calibración empírica."
  },
  {
    "id": "patrones",
    "name": "Seguir y distinguir reglas",
    "level": 2,
    "description": "Aplicar reglas aditivas, multiplicativas y alternadas que se indican explícitamente. La banda describe requisitos, no dificultad calibrada."
  },
  {
    "id": "medida_espacio",
    "name": "Medida y espacio",
    "level": 3,
    "description": "Distinguir área, perímetro y dimensión desconocida con datos suficientes. Banda de requisitos; no grado escolar ni escala calibrada."
  },
  {
    "id": "datos_decisiones",
    "name": "Datos para decidir",
    "level": 2,
    "description": "Seleccionar datos pertinentes y reconocer cuándo la información no determina una respuesta. Banda declarada, sin calibración."
  },
  {
    "id": "planificacion",
    "name": "Planificar con condiciones",
    "level": 3,
    "description": "Coordinar restricciones, distinguir factibilidad de optimización y justificar una decisión. Banda de requisitos, no nivel calibrado."
  },
  {
    "id": "proporcionalidad",
    "name": "Relacionar cantidades",
    "level": 3,
    "description": "Usar una razón constante explícita y distinguirla de una regla con cantidad inicial fija. Banda declarada, sin calibración."
  }
];
const PACKS = [
  {
    "family": "comparacion_inversa",
    "level": 2,
    "variant": 1,
    "items": [
      {
        "id": "c9-comparacion_inversa-L2-V1-01",
        "template": "comparacion_diferencia",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "comparacion_diferencia",
        "process": "formular",
        "prompt": "Una caja contiene 17 semillas y otra contiene 9. ¿Cuántas semillas más contiene la primera caja?",
        "hintText": "Compara las dos cantidades: busca lo que queda sin pareja, no el total reunido.",
        "explanation": "17 − 9 = 8. La diferencia cuenta las semillas de la primera caja que no tienen pareja en la segunda.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "26 semillas",
          "8 semillas",
          "9 semillas",
          "17 semillas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "8 semillas",
        "errorFeedback": [
          "Reunir las dos cantidades responde otra pregunta. Aquí se pide cuánto excede una a la otra.",
          "La elección expresa la diferencia; puedes comprobarla reconstruyendo la cantidad mayor.",
          "Esa es una cantidad de partida; compárala con la otra antes de decidir.",
          "Esa es la cantidad mayor completa; hay que considerar también la menor."
        ],
        "itemId": "item-1",
        "bankId": "c9-comparacion_inversa-L2-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V1-02",
        "template": "cambio_estado_inicial",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "cambio_estado_inicial",
        "process": "formular",
        "prompt": "Una biblioteca prestó 7 libros y le quedaron 18. No recibió ni perdió otros libros. ¿Cuántos tenía antes del préstamo?",
        "hintText": "El número inicial debe incluir tanto lo que salió como lo que quedó.",
        "explanation": "Si había 25 libros y se prestaron 7, quedan 18: 25 − 7 = 18. Para reconstruir el inicio se reúnen 18 y 7.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "11 libros",
          "18 libros",
          "7 libros",
          "25 libros"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "25 libros",
        "errorFeedback": [
          "Restar de lo que quedó simula una segunda salida, no deshace la primera.",
          "Lo que quedó no incluye los libros prestados.",
          "El préstamo es sólo una parte de los libros iniciales.",
          "La elección permite reconstruir el estado inicial; comprueba lo que queda tras el préstamo."
        ],
        "itemId": "item-2",
        "bankId": "c9-comparacion_inversa-L2-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V1-03",
        "template": "comparacion_referente",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "comparacion_referente",
        "process": "formular",
        "prompt": "El equipo A reunió 14 fichas: son 5 más que las del equipo B. ¿Cuántas reunió el equipo B?",
        "hintText": "Decide primero qué equipo tiene la cantidad mayor y qué cantidad representa la diferencia.",
        "explanation": "B debe tener 5 menos que A: 14 − 5 = 9. Se comprueba porque 9 + 5 = 14.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "9 fichas",
          "19 fichas",
          "5 fichas",
          "14 fichas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "9 fichas",
        "errorFeedback": [
          "La relación entre las dos cantidades se conserva; comprueba la diferencia.",
          "Añadir la diferencia daría a B una cantidad mayor que a A, al contrario de la consigna.",
          "La diferencia entre equipos no es la cantidad completa de B.",
          "Igualar las cantidades elimina la diferencia indicada."
        ],
        "itemId": "item-3",
        "bankId": "c9-comparacion_inversa-L2-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V1-04",
        "template": "composicion_parte_desconocida",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "composicion_parte_desconocida",
        "process": "formular",
        "prompt": "Para completar una colección se necesitan 23 fichas. Ya hay 15. ¿Cuántas faltan para llegar exactamente a 23?",
        "hintText": "Busca una cantidad que, al juntarse con la que ya hay, alcance la meta.",
        "explanation": "15 + 8 = 23. La parte que falta es 8; también se obtiene con 23 − 15.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "38 fichas",
          "15 fichas",
          "8 fichas",
          "23 fichas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "8 fichas",
        "errorFeedback": [
          "La suma de meta y cantidad actual sobrepasa la meta; no representa lo que falta.",
          "La cantidad existente no indica directamente cuánto falta.",
          "Tu elección completa la cantidad objetivo; comprueba la suma.",
          "Añadir toda la meta ignoraría lo que ya está reunido."
        ],
        "itemId": "item-4",
        "bankId": "c9-comparacion_inversa-L2-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "comparacion_inversa",
    "level": 2,
    "variant": 2,
    "items": [
      {
        "id": "c9-comparacion_inversa-L2-V2-01",
        "template": "comparacion_diferencia",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "comparacion_diferencia",
        "process": "formular",
        "prompt": "Un estante tiene 28 cuadernos y otro tiene 19. ¿Cuántos cuadernos más hay en el primero?",
        "hintText": "Empareja mentalmente los cuadernos de ambos estantes y considera sólo la diferencia.",
        "explanation": "28 − 19 = 9. Esos 9 cuadernos son los que no tienen pareja en el segundo estante.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "47 cuadernos",
          "19 cuadernos",
          "9 cuadernos",
          "28 cuadernos"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "9 cuadernos",
        "errorFeedback": [
          "Sumar los estantes da el total, no cuánto tiene uno de más.",
          "El dato menor debe compararse con el mayor; no es la diferencia por sí solo.",
          "La comparación conserva las dos cantidades y su diferencia.",
          "Contar todo el estante mayor ignora los cuadernos del otro."
        ],
        "itemId": "item-1",
        "bankId": "c9-comparacion_inversa-L2-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V2-02",
        "template": "cambio_estado_inicial",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "cambio_estado_inicial",
        "process": "formular",
        "prompt": "Subieron 8 personas a un autobús y después había 21. Nadie bajó. ¿Cuántas personas había antes de que subieran?",
        "hintText": "El número que había antes, junto con quienes subieron, debe formar el número final.",
        "explanation": "13 + 8 = 21. Por eso había 13 personas; se recupera el inicio con 21 − 8.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "13 personas",
          "29 personas",
          "8 personas",
          "21 personas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "13 personas",
        "errorFeedback": [
          "La elección reproduce el cambio descrito; comprueba el número final.",
          "Añadir otra vez a quienes subieron cuenta dos veces ese cambio.",
          "Quienes subieron no son necesariamente quienes ya estaban dentro.",
          "El estado final ya incluye a las personas que subieron."
        ],
        "itemId": "item-2",
        "bankId": "c9-comparacion_inversa-L2-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V2-03",
        "template": "comparacion_referente",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "comparacion_referente",
        "process": "formular",
        "prompt": "Una cinta corta mide 12 cm. Es 4 cm más corta que otra cinta. ¿Cuánto mide la otra cinta?",
        "hintText": "La cinta buscada debe ser más larga que la de 12 cm; la diferencia entre ambas es 4 cm.",
        "explanation": "La otra cinta mide 12 + 4 = 16 cm. Al quitarle 4 cm se obtiene la cinta corta.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "8 cm",
          "4 cm",
          "12 cm",
          "16 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "16 cm",
        "errorFeedback": [
          "Restar haría que la cinta buscada fuera aún más corta, contradiciendo la relación.",
          "La diferencia no es la longitud completa de la otra cinta.",
          "Las dos cintas no pueden medir lo mismo si se indica una diferencia.",
          "La elección respeta cuál cinta es más larga y la diferencia entre ellas."
        ],
        "itemId": "item-3",
        "bankId": "c9-comparacion_inversa-L2-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-comparacion_inversa-L2-V2-04",
        "template": "composicion_parte_desconocida",
        "family": "comparacion_inversa",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Comparar y encontrar lo desconocido",
        "structure": "composicion_parte_desconocida",
        "process": "formular",
        "prompt": "Dos cajas contienen 31 tizas en total. En una hay 14. ¿Cuántas hay en la otra?",
        "hintText": "El total reúne ambas cajas; encuentra la parte que se completa con la conocida.",
        "explanation": "14 + 17 = 31. Por eso la otra caja contiene 17 tizas.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "45 tizas",
          "17 tizas",
          "14 tizas",
          "31 tizas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "17 tizas",
        "errorFeedback": [
          "Sumar la parte al total vuelve a contar una cantidad ya incluida.",
          "La elección completa el total con la parte conocida.",
          "Las dos cajas no tienen por qué contener lo mismo.",
          "Dar todo el total a una caja dejaría fuera las tizas de la otra."
        ],
        "itemId": "item-4",
        "bankId": "c9-comparacion_inversa-L2-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "patrones",
    "level": 2,
    "variant": 1,
    "items": [
      {
        "id": "c9-patrones-L2-V1-01",
        "template": "recurrencia_aditiva",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_aditiva",
        "process": "emplear",
        "prompt": "La regla del contador es sumar 4 en cada paso. Marca 3, 7, 11. ¿Qué número debe marcar después?",
        "hintText": "Aplica al último número la misma regla que se declara en la consigna.",
        "explanation": "11 + 4 = 15. La regla explícita mantiene un incremento de 4 en cada paso.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "12",
          "16",
          "44",
          "15"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "15",
        "errorFeedback": [
          "Aumentar sólo una unidad cambia la regla del contador.",
          "Comprueba cuánto se ha añadido al último número; el incremento está fijado.",
          "Multiplicar por el incremento no es lo mismo que sumarlo.",
          "La elección mantiene la regla indicada."
        ],
        "itemId": "item-1",
        "bankId": "c9-patrones-L2-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V1-02",
        "template": "recurrencia_multiplicativa",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_multiplicativa",
        "process": "emplear",
        "prompt": "La regla es duplicar el número en cada paso. La secuencia comienza 2, 4, 8. ¿Qué número sigue según esa regla?",
        "hintText": "Duplicar significa formar dos veces la cantidad que hay ahora.",
        "explanation": "Dos veces 8 son 16. Mantener la regla requiere 8 × 2, no añadir siempre la misma diferencia.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "10",
          "16",
          "12",
          "64"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "16",
        "errorFeedback": [
          "Añadir dos no es duplicar una cantidad que ya cambió.",
          "La elección aplica la duplicación al último término.",
          "La diferencia anterior no debe fijarse como incremento; la regla es multiplicativa.",
          "Elevar al cuadrado usa el número como su propio factor, no como una cantidad que se duplica."
        ],
        "itemId": "item-2",
        "bankId": "c9-patrones-L2-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V1-03",
        "template": "recurrencia_alternada",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_alternada",
        "process": "razonar",
        "prompt": "Se repiten estas dos acciones: sumar 2 y luego sumar 5. Así se obtuvo 1, 3, 8, 10. ¿Qué número viene después?",
        "hintText": "Identifica cuál de las dos acciones produjo el último término y cuál toca ahora.",
        "explanation": "De 8 a 10 se sumó 2. Ahora corresponde sumar 5: 10 + 5 = 15.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "12",
          "13",
          "15",
          "20"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "15",
        "errorFeedback": [
          "Sumar otra vez la misma cantidad rompe la alternancia indicada.",
          "Ese incremento no es ninguna de las dos acciones del ciclo.",
          "La elección respeta la posición de la acción dentro del ciclo.",
          "Duplicar no es una de las acciones de la regla."
        ],
        "itemId": "item-3",
        "bankId": "c9-patrones-L2-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V1-04",
        "template": "iteracion_divisiva",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "iteracion_divisiva",
        "process": "emplear",
        "prompt": "Un contador empieza en 64 y en cada paso se divide entre 2. ¿Qué número marca después de exactamente dos pasos?",
        "hintText": "Cuenta las aplicaciones de la regla, sin confundir pasos con unidades que se restan.",
        "explanation": "Primer paso: 64 ÷ 2 = 32. Segundo paso: 32 ÷ 2 = 16.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "16",
          "32",
          "8",
          "62"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "16",
        "errorFeedback": [
          "Se han aplicado las dos divisiones requeridas.",
          "Esa cantidad corresponde a haber aplicado la regla una sola vez.",
          "Revisa el número de pasos: una división adicional cambia el momento pedido.",
          "Dividir entre dos no equivale a restar el número de pasos."
        ],
        "itemId": "item-4",
        "bankId": "c9-patrones-L2-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "patrones",
    "level": 2,
    "variant": 2,
    "items": [
      {
        "id": "c9-patrones-L2-V2-01",
        "template": "recurrencia_aditiva",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_aditiva",
        "process": "emplear",
        "prompt": "La regla es sumar 3 en cada paso. La secuencia es 4, 7, 10. ¿Qué número sigue según esa regla?",
        "hintText": "Usa el incremento declarado sobre el último término.",
        "explanation": "10 + 3 = 13. No cambia el incremento al avanzar un paso.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "13",
          "11",
          "14",
          "30"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "13",
        "errorFeedback": [
          "La elección conserva el incremento indicado.",
          "Avanzar un paso no significa necesariamente añadir una unidad.",
          "Comprueba el incremento que produce tu elección.",
          "Multiplicar por tres usa otra regla distinta de sumar tres."
        ],
        "itemId": "item-1",
        "bankId": "c9-patrones-L2-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V2-02",
        "template": "recurrencia_multiplicativa",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_multiplicativa",
        "process": "emplear",
        "prompt": "En cada paso se triplica la cantidad. La secuencia empieza 1, 3, 9. ¿Qué número debe ir después?",
        "hintText": "Triplicar forma tres veces la cantidad actual.",
        "explanation": "9 × 3 = 27. Se aplica el mismo factor al último término.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "12",
          "18",
          "27",
          "81"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "27",
        "errorFeedback": [
          "Sumar tres no equivale a triplicar la cantidad actual.",
          "Duplicar usa un factor diferente del indicado.",
          "La elección aplica el factor declarado.",
          "Multiplicar el número por sí mismo aplica una regla de cuadrado."
        ],
        "itemId": "item-2",
        "bankId": "c9-patrones-L2-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V2-03",
        "template": "recurrencia_alternada",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "recurrencia_alternada",
        "process": "razonar",
        "prompt": "Se repiten las acciones sumar 4 y luego sumar 1. La secuencia comienza 2, 6, 7, 11. ¿Qué número sigue?",
        "hintText": "Localiza cuál acción se acaba de usar antes de elegir la siguiente.",
        "explanation": "De 7 a 11 se sumó 4. Toca sumar 1: 11 + 1 = 12.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "15",
          "12",
          "16",
          "22"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "12",
        "errorFeedback": [
          "Repetir el último incremento no respeta la alternancia.",
          "La elección conserva el orden de las acciones.",
          "Sumar ambos incrementos de una vez salta una posición del ciclo.",
          "Duplicar no aparece entre las acciones indicadas."
        ],
        "itemId": "item-3",
        "bankId": "c9-patrones-L2-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-patrones-L2-V2-04",
        "template": "iteracion_divisiva",
        "family": "patrones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Seguir y distinguir reglas",
        "structure": "iteracion_divisiva",
        "process": "emplear",
        "prompt": "Una cantidad comienza en 72. En cada paso se divide entre 2. ¿Cuál será después de exactamente tres pasos?",
        "hintText": "Representa cada paso por separado y comprueba cuántos has realizado.",
        "explanation": "72 ÷ 2 = 36; 36 ÷ 2 = 18; 18 ÷ 2 = 9. Son tres pasos.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "18",
          "36",
          "69",
          "9"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "9",
        "errorFeedback": [
          "Esa cantidad se obtiene antes de completar todos los pasos.",
          "Esa cantidad refleja sólo el inicio del proceso repetido.",
          "Restar tres no aplica la regla de dividir en cada paso.",
          "La elección corresponde al número de aplicaciones solicitado."
        ],
        "itemId": "item-4",
        "bankId": "c9-patrones-L2-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "medida_espacio",
    "level": 3,
    "variant": 1,
    "items": [
      {
        "id": "c9-medida_espacio-L3-V1-01",
        "template": "area_rectangular",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "area_rectangular",
        "process": "formular",
        "prompt": "Un rectángulo cubre 6 filas de 4 cuadrados de 1 cm² cada uno. ¿Cuál es su área?",
        "hintText": "El área cuenta cuadrados que cubren la superficie; no cuenta sólo el borde.",
        "explanation": "6 × 4 = 24 cuadrados de 1 cm². El área es 24 cm².",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "20 cm²",
          "24 cm²",
          "10 cm²",
          "48 cm²"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "24 cm²",
        "errorFeedback": [
          "Ese número puede aparecer al calcular el borde; aquí se cuentan cuadrados interiores.",
          "La elección cuenta la superficie cubierta.",
          "Sumar las dos dimensiones no cuenta todas las filas de cuadrados.",
          "Duplicar el producto cuenta dos veces la misma superficie."
        ],
        "itemId": "item-1",
        "bankId": "c9-medida_espacio-L3-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V1-02",
        "template": "perimetro_rectangular",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "perimetro_rectangular",
        "process": "formular",
        "prompt": "Un rectángulo mide 7 cm de largo y 3 cm de ancho. ¿Cuánto mide todo su borde?",
        "hintText": "El borde recorre los cuatro lados; los lados opuestos tienen igual longitud.",
        "explanation": "7 + 3 + 7 + 3 = 20 cm. El producto 7 × 3 mide otra magnitud, el área.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "20 cm",
          "21 cm",
          "10 cm",
          "14 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "20 cm",
        "errorFeedback": [
          "La elección incluye los cuatro lados.",
          "Multiplicar las dimensiones da área; el borde se mide en longitud.",
          "Sumar un largo y un ancho recorre sólo parte del borde.",
          "Dos lados largos no completan todo el contorno."
        ],
        "itemId": "item-2",
        "bankId": "c9-medida_espacio-L3-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V1-03",
        "template": "dimension_desde_area",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "dimension_desde_area",
        "process": "formular",
        "prompt": "El área de un rectángulo es 30 cm² y su ancho es 5 cm. ¿Cuál es su largo?",
        "hintText": "Busca una longitud que, multiplicada por el ancho, produzca el área indicada.",
        "explanation": "5 × 6 = 30. Por eso el largo mide 6 cm; 30 ÷ 5 recupera esa dimensión.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "25 cm",
          "35 cm",
          "150 cm",
          "6 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "6 cm",
        "errorFeedback": [
          "Restar una longitud de un área no recupera automáticamente la otra dimensión.",
          "Sumar magnitudes con unidades diferentes no resuelve la relación del rectángulo.",
          "Multiplicar el área por el ancho vuelve a combinar un dato que ya lo contiene.",
          "La elección reproduce el área al combinarse con el ancho."
        ],
        "itemId": "item-3",
        "bankId": "c9-medida_espacio-L3-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V1-04",
        "template": "dimension_desde_perimetro",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "dimension_desde_perimetro",
        "process": "razonar",
        "prompt": "Todo el borde de un rectángulo mide 26 cm. Su ancho es 5 cm. ¿Cuánto mide su largo?",
        "hintText": "El contorno incluye dos anchos y dos largos; distingue esas cuatro partes.",
        "explanation": "Dos anchos suman 10 cm. Quedan 16 cm para los dos largos; cada uno mide 8 cm.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "21 cm",
          "16 cm",
          "8 cm",
          "13 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "8 cm",
        "errorFeedback": [
          "Restar sólo un ancho deja todavía otros lados incluidos.",
          "La cantidad restante después de los anchos corresponde a dos largos, no a uno.",
          "La elección permite reconstruir los cuatro lados y el contorno.",
          "La mitad del contorno incluye un largo y un ancho."
        ],
        "itemId": "item-4",
        "bankId": "c9-medida_espacio-L3-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "medida_espacio",
    "level": 3,
    "variant": 2,
    "items": [
      {
        "id": "c9-medida_espacio-L3-V2-01",
        "template": "area_rectangular",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "area_rectangular",
        "process": "formular",
        "prompt": "Una superficie rectangular tiene 8 filas de 3 cuadrados de 1 cm² cada uno. ¿Cuál es su área?",
        "hintText": "Distingue el número de cuadrados interiores de las longitudes del borde.",
        "explanation": "8 × 3 = 24 cuadrados. Como cada uno ocupa 1 cm², el área es 24 cm².",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "22 cm²",
          "11 cm²",
          "24 cm²",
          "48 cm²"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "24 cm²",
        "errorFeedback": [
          "El cálculo del borde no responde cuántos cuadrados cubren el interior.",
          "Sumar las dimensiones deja sin contar todas las combinaciones de filas y columnas.",
          "La elección cuenta una sola vez cada cuadrado de la superficie.",
          "Contar dos veces todas las filas duplica la superficie."
        ],
        "itemId": "item-1",
        "bankId": "c9-medida_espacio-L3-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V2-02",
        "template": "perimetro_rectangular",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "perimetro_rectangular",
        "process": "formular",
        "prompt": "Un jardín rectangular mide 9 m de largo y 4 m de ancho. ¿Cuántos metros de cerca rodean exactamente todo su borde?",
        "hintText": "Recorre los cuatro lados una sola vez; no se está pidiendo cubrir el suelo.",
        "explanation": "9 + 4 + 9 + 4 = 26 m de cerca.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "36 m",
          "13 m",
          "18 m",
          "26 m"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "26 m",
        "errorFeedback": [
          "Multiplicar largo y ancho cuenta superficie, no metros de cerca.",
          "Un largo más un ancho no completa el contorno.",
          "Faltan los lados cortos si sólo cuentas los dos largos.",
          "La elección recorre todo el borde una sola vez."
        ],
        "itemId": "item-2",
        "bankId": "c9-medida_espacio-L3-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V2-03",
        "template": "dimension_desde_area",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "dimension_desde_area",
        "process": "formular",
        "prompt": "Un rectángulo tiene un área de 42 cm² y un ancho de 6 cm. ¿Cuánto mide su largo?",
        "hintText": "La longitud buscada debe completar el producto que representa el área.",
        "explanation": "6 × 7 = 42. El largo es 7 cm.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "7 cm",
          "36 cm",
          "48 cm",
          "252 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "7 cm",
        "errorFeedback": [
          "La elección conserva la relación entre ancho, largo y área.",
          "Restar ancho a área no usa la relación multiplicativa de la superficie.",
          "Sumar esos datos mezcla longitud y área.",
          "Multiplicar otra vez por el ancho no deshace el producto que forma el área."
        ],
        "itemId": "item-3",
        "bankId": "c9-medida_espacio-L3-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-medida_espacio-L3-V2-04",
        "template": "dimension_desde_perimetro",
        "family": "medida_espacio",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Medida y espacio",
        "structure": "dimension_desde_perimetro",
        "process": "razonar",
        "prompt": "El perímetro de un rectángulo es 30 cm y su ancho es 4 cm. ¿Cuál es su largo?",
        "hintText": "Separa los dos anchos de los dos largos y comprueba el borde completo.",
        "explanation": "Los dos anchos miden 8 cm. 30 − 8 = 22 cm corresponden a los dos largos; 22 ÷ 2 = 11 cm.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "26 cm",
          "11 cm",
          "22 cm",
          "15 cm"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "11 cm",
        "errorFeedback": [
          "Restar un solo ancho no deja un único largo.",
          "La elección reconstruye el perímetro con los dos anchos y dos largos.",
          "Esa cantidad representa juntos los dos largos.",
          "La mitad del perímetro incluye todavía un ancho."
        ],
        "itemId": "item-4",
        "bankId": "c9-medida_espacio-L3-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "datos_decisiones",
    "level": 2,
    "variant": 1,
    "items": [
      {
        "id": "c9-datos_decisiones-L2-V1-01",
        "template": "agregacion_pertinente",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "agregacion_pertinente",
        "process": "interpretar",
        "prompt": "El registro indica: 7 manzanas, 5 peras y 9 limones. ¿Cuántas manzanas y peras hay juntas?",
        "hintText": "Identifica qué categorías pregunta la consigna y cuáles quedan fuera.",
        "explanation": "Se suman sólo manzanas y peras: 7 + 5 = 12. Los limones no intervienen en esta pregunta.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "21 frutas",
          "14 frutas",
          "16 frutas",
          "12 frutas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "12 frutas",
        "errorFeedback": [
          "Sumar todo el registro incluye una categoría que no se pidió.",
          "Duplicar una categoría no reemplaza la cantidad de la otra.",
          "Revisa los nombres de las categorías que estás combinando.",
          "La elección usa las categorías solicitadas."
        ],
        "itemId": "item-1",
        "bankId": "c9-datos_decisiones-L2-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V1-02",
        "template": "comparacion_de_registros",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "comparacion_de_registros",
        "process": "interpretar",
        "prompt": "El lunes se leyeron 8 páginas y el martes 13. ¿Cuántas páginas más se leyeron el martes que el lunes?",
        "hintText": "La pregunta pide comparar los días, no sumar toda la lectura.",
        "explanation": "13 − 8 = 5. Se leyeron 5 páginas más el martes.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "5 páginas",
          "21 páginas",
          "13 páginas",
          "8 páginas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "5 páginas",
        "errorFeedback": [
          "La elección expresa el cambio entre los registros.",
          "El total de ambos días responde una pregunta diferente.",
          "La cantidad del martes incluye las páginas que también podrían emparejarse con las del lunes.",
          "La cantidad del lunes es un dato de comparación, no la diferencia."
        ],
        "itemId": "item-2",
        "bankId": "c9-datos_decisiones-L2-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V1-03",
        "template": "insuficiencia_cantidad_por_grupo",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "insuficiencia_cantidad_por_grupo",
        "process": "razonar",
        "prompt": "Sólo sabemos que hay 5 cajas idénticas con lápices. No se indica cuántos lápices contiene cada caja. ¿Qué conclusión es válida sobre el total?",
        "hintText": "Comprueba si dos contenidos diferentes de las cajas serían compatibles con lo que se sabe.",
        "explanation": "Con 2 lápices por caja habría 10; con 3 habría 15. Ambos casos respetan los datos, así que no se determina un total único.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "El total es necesariamente 5 lápices.",
          "No se puede determinar un total único con esos datos.",
          "El total es necesariamente 10 lápices.",
          "El total es necesariamente 25 lápices."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "No se puede determinar un total único con esos datos.",
        "errorFeedback": [
          "Ese total supone una cantidad por caja que la consigna no proporciona.",
          "La conclusión distingue información conocida de una cantidad no fijada.",
          "Ese total puede ser posible, pero ser posible no lo hace necesario.",
          "Ese total añade una suposición sobre el contenido de cada caja."
        ],
        "itemId": "item-3",
        "bankId": "c9-datos_decisiones-L2-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V1-04",
        "template": "insuficiencia_reparto",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "insuficiencia_reparto",
        "process": "razonar",
        "prompt": "Se colocaron 24 libros en 4 estantes. No se informa cómo se repartieron. ¿Qué conclusión está justificada?",
        "hintText": "Pregunta qué condiciones de reparto están realmente declaradas; no añadas condiciones por tu cuenta.",
        "explanation": "Podrían tener 6, 6, 6, 6 libros o 5, 5, 7, 7. Ambos repartos suman 24 en 4 estantes. Conocer el total y el número de estantes no fija cada cantidad.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "Cada estante tiene necesariamente 6 libros.",
          "Cada estante tiene necesariamente 20 libros.",
          "No se conoce la cantidad exacta de libros de cada estante.",
          "Para conocer las cantidades es indispensable saber el color de los estantes."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "No se conoce la cantidad exacta de libros de cada estante.",
        "errorFeedback": [
          "Dividir de ese modo presupone una condición de reparto que no fue indicada.",
          "Comprueba si repetir esa cantidad en todos los estantes conserva el total.",
          "La elección reconoce que los datos permiten más de un reparto.",
          "La apariencia de los recipientes no determina cuántos libros se colocaron en ellos."
        ],
        "itemId": "item-4",
        "bankId": "c9-datos_decisiones-L2-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "datos_decisiones",
    "level": 2,
    "variant": 2,
    "items": [
      {
        "id": "c9-datos_decisiones-L2-V2-01",
        "template": "agregacion_pertinente",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "agregacion_pertinente",
        "process": "interpretar",
        "prompt": "Un equipo hizo 6 carteles por la mañana, 4 por la tarde y 8 por la noche. ¿Cuántos carteles hizo por la mañana y por la noche en total, sin contar los de la tarde?",
        "hintText": "Selecciona únicamente los momentos nombrados en la pregunta.",
        "explanation": "Mañana y noche suman 6 + 8 = 14. Los 4 de la tarde no pertenecen al conjunto solicitado.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "14 carteles",
          "18 carteles",
          "10 carteles",
          "12 carteles"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "14 carteles",
        "errorFeedback": [
          "La elección conserva el conjunto de momentos pedido.",
          "El total de los tres momentos incluye la tarde, que la pregunta pide excluir.",
          "Comprueba cuál de los dos momentos has combinado con la mañana.",
          "Repetir el dato de la mañana no representa la cantidad de la noche."
        ],
        "itemId": "item-1",
        "bankId": "c9-datos_decisiones-L2-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V2-02",
        "template": "comparacion_de_registros",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "comparacion_de_registros",
        "process": "interpretar",
        "prompt": "El jueves se recogieron 9 hojas y el viernes 15. ¿Cuántas hojas más se recogieron el viernes?",
        "hintText": "Compara las cantidades; la palabra «más» se refiere aquí a una diferencia.",
        "explanation": "15 − 9 = 6. El viernes hubo 6 hojas más que el jueves.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "24 hojas",
          "15 hojas",
          "9 hojas",
          "6 hojas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "6 hojas",
        "errorFeedback": [
          "Sumar los días mide lo recogido en total, no el exceso del viernes.",
          "La cantidad completa del viernes no es la diferencia.",
          "El dato del jueves sirve como referencia de la comparación.",
          "La elección compara correctamente ambos registros."
        ],
        "itemId": "item-2",
        "bankId": "c9-datos_decisiones-L2-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V2-03",
        "template": "insuficiencia_cantidad_por_grupo",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "insuficiencia_cantidad_por_grupo",
        "process": "razonar",
        "prompt": "Hay 3 bolsas iguales con botones. No sabemos cuántos botones contiene cada bolsa. ¿Qué puede afirmarse sobre el total?",
        "hintText": "Busca dos cantidades posibles por bolsa y considera si ambas respetan los datos.",
        "explanation": "Si hay 4 por bolsa, el total es 12; si hay 5, es 15. Como ambos casos son compatibles, el total no queda determinado.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "Tiene que haber exactamente 3 botones.",
          "Tiene que haber exactamente 6 botones.",
          "Los datos no determinan un total único.",
          "Tiene que haber exactamente 9 botones."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "Los datos no determinan un total único.",
        "errorFeedback": [
          "Ese total añade una cantidad por bolsa no indicada.",
          "Que ese total sea posible no significa que sea el único permitido.",
          "La elección reconoce la diferencia entre una posibilidad y una certeza.",
          "La cantidad de bolsas no fija por sí sola el contenido de cada bolsa."
        ],
        "itemId": "item-3",
        "bankId": "c9-datos_decisiones-L2-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-datos_decisiones-L2-V2-04",
        "template": "suficiencia_condicion_igualdad",
        "family": "datos_decisiones",
        "context": "c9-authored",
        "level": 2,
        "pool": "practice",
        "dimension": "Datos para decidir",
        "structure": "suficiencia_condicion_igualdad",
        "process": "razonar",
        "prompt": "Se repartieron 18 medidas iguales de agua entre 3 jarras sin derramar nada. ¿Qué dato adicional permitiría saber exactamente cuántas medidas de agua hay en cada jarra?",
        "hintText": "El dato adicional debe excluir repartos diferentes, no sólo describir una parte de ellos.",
        "explanation": "Si las tres cantidades son iguales y suman 18 medidas, cada una es 18 ÷ 3 = 6 medidas. Las otras condiciones todavía permiten varios repartos.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "Se usaron las tres jarras.",
          "Se puso la misma cantidad de agua en las tres jarras.",
          "Ninguna jarra quedó vacía.",
          "Una jarra contiene más agua que otra."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "Se puso la misma cantidad de agua en las tres jarras.",
        "errorFeedback": [
          "Usar las tres jarras todavía permite distribuir cantidades distintas.",
          "La condición elegida determina el reparto junto con el total.",
          "Tener cantidades positivas no obliga a que sean iguales ni fija cada una.",
          "Saber sólo una desigualdad deja varias distribuciones posibles."
        ],
        "itemId": "item-4",
        "bankId": "c9-datos_decisiones-L2-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "planificacion",
    "level": 3,
    "variant": 1,
    "items": [
      {
        "id": "c9-planificacion-L3-V1-01",
        "template": "factibilidad_dos_restricciones",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "factibilidad_dos_restricciones",
        "process": "razonar",
        "prompt": "Un recorrido debe tener como máximo 12 pasos y permitir recoger al menos 5 semillas. ¿Cuál de estas propuestas cumple las dos condiciones?",
        "hintText": "Comprueba las dos condiciones en cada propuesta; cumplir sólo una no basta.",
        "explanation": "10 ≤ 12 y 5 ≥ 5, por lo que esa propuesta cumple ambas condiciones. Las otras superan el recorrido máximo, no llegan al mínimo de semillas o fallan en ambos.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "13 pasos y 7 semillas",
          "8 pasos y 4 semillas",
          "10 pasos y 5 semillas",
          "14 pasos y 3 semillas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "10 pasos y 5 semillas",
        "errorFeedback": [
          "Recoger suficientes semillas no elimina el límite de longitud.",
          "Un recorrido corto puede seguir siendo insuficiente para la cantidad requerida.",
          "La elección satisface simultáneamente los dos límites.",
          "Revisa ambos límites: una ventaja no compensa incumplir una condición obligatoria."
        ],
        "itemId": "item-1",
        "bankId": "c9-planificacion-L3-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V1-02",
        "template": "minimo_viajes_capacidad",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "minimo_viajes_capacidad",
        "process": "razonar",
        "prompt": "Hay que transportar 17 cajas. En cada viaje caben como máximo 5, y el último puede llevar menos. ¿Cuál es el menor número de viajes que permite llevarlas todas?",
        "hintText": "Compara la capacidad total de varios viajes con la cantidad que debes transportar.",
        "explanation": "Tres viajes llevan como máximo 15 cajas y no bastan. Cuatro permiten llevar 5 + 5 + 5 + 2 = 17. Por eso el mínimo es 4.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "3 viajes",
          "4 viajes",
          "5 viajes",
          "17 viajes"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "4 viajes",
        "errorFeedback": [
          "Comprueba si la capacidad acumulada alcanza para todas las cajas.",
          "La elección permite transportar todo sin añadir un viaje innecesario.",
          "Ese número puede alcanzar, pero verifica si uno menor también cumple.",
          "Transportar una caja por viaje es posible, pero no aprovecha la capacidad para minimizar viajes."
        ],
        "itemId": "item-2",
        "bankId": "c9-planificacion-L3-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V1-03",
        "template": "plan_secuencial_tiempo",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "plan_secuencial_tiempo",
        "process": "razonar",
        "prompt": "Una tarea dura 4 minutos y otra 6. Deben hacerse una después de la otra, sin superponerse. ¿Pueden terminarse ambas en un intervalo de 9 minutos?",
        "hintText": "La regla de hacerlas una después de la otra determina cómo se combinan sus duraciones.",
        "explanation": "4 + 6 = 10 minutos, que exceden 9. Comparar cada duración por separado no verifica el tiempo del conjunto.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "No: juntas requieren 10 minutos.",
          "Sí: cada tarea por separado dura menos de 9 minutos.",
          "Sí: pueden comenzar al mismo tiempo.",
          "No: juntas requieren 24 minutos."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "No: juntas requieren 10 minutos.",
        "errorFeedback": [
          "La elección usa la condición temporal y comprueba el conjunto.",
          "Que cada tarea quepa sola no demuestra que quepan las dos consecutivamente.",
          "La propuesta cambia la condición explícita de no superponer tareas.",
          "Multiplicar duraciones no da el tiempo consecutivo total."
        ],
        "itemId": "item-3",
        "bankId": "c9-planificacion-L3-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V1-04",
        "template": "optimizacion_entre_factibles",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "optimizacion_entre_factibles",
        "process": "razonar",
        "prompt": "Hay que elegir un recorrido de como máximo 10 pasos que recoja al menos 3 botellas. Entre los que cumplen, se quiere el de menos pasos. ¿Cuál se debe elegir?",
        "hintText": "Primero descarta los que incumplen una condición; después compara los pasos de los restantes.",
        "explanation": "B no alcanza 3 botellas. A, C y D sí cumplen; A usa 8 pasos, menos que 10 y 9. Por eso A es la opción elegida.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "B: 6 pasos y 2 botellas",
          "C: 10 pasos y 5 botellas",
          "D: 9 pasos y 3 botellas",
          "A: 8 pasos y 4 botellas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "A: 8 pasos y 4 botellas",
        "errorFeedback": [
          "Tener menos pasos no compensa incumplir la cantidad mínima.",
          "Recoger más botellas no es el criterio que se pidió minimizar.",
          "Cumplir los límites es necesario; todavía debes comparar con las otras opciones factibles.",
          "La elección distingue cumplir las condiciones de ser la mejor bajo el criterio pedido."
        ],
        "itemId": "item-4",
        "bankId": "c9-planificacion-L3-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "planificacion",
    "level": 3,
    "variant": 2,
    "items": [
      {
        "id": "c9-planificacion-L3-V2-01",
        "template": "factibilidad_dos_restricciones",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "factibilidad_dos_restricciones",
        "process": "razonar",
        "prompt": "Una ruta debe tener como máximo 15 pasos y recoger al menos 7 frutos. ¿Qué propuesta satisface las dos condiciones?",
        "hintText": "Revisa el límite superior de pasos y el inferior de frutos por separado.",
        "explanation": "14 ≤ 15 y 8 ≥ 7. Las otras propuestas incumplen uno o los dos límites.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "16 pasos y 10 frutos",
          "14 pasos y 8 frutos",
          "12 pasos y 6 frutos",
          "18 pasos y 4 frutos"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "14 pasos y 8 frutos",
        "errorFeedback": [
          "Un número alto de frutos no autoriza superar el máximo de pasos.",
          "La elección cumple las dos restricciones al mismo tiempo.",
          "Estar por debajo del límite de pasos no asegura alcanzar el mínimo de frutos.",
          "Comprueba cada condición obligatoria, sin intercambiar una por la otra."
        ],
        "itemId": "item-1",
        "bankId": "c9-planificacion-L3-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V2-02",
        "template": "minimo_viajes_capacidad",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "minimo_viajes_capacidad",
        "process": "razonar",
        "prompt": "Se deben mover 22 cajas. Cada viaje transporta como máximo 6 y puede llevar menos. ¿Cuál es el menor número de viajes necesario?",
        "hintText": "Comprueba cuántas cajas caben en el conjunto de viajes y si puedes quitar uno sin dejar cajas pendientes.",
        "explanation": "Tres viajes sólo pueden llevar 18 cajas. Cuatro permiten 6 + 6 + 6 + 4 = 22. El mínimo es 4.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "3 viajes",
          "6 viajes",
          "4 viajes",
          "22 viajes"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "4 viajes",
        "errorFeedback": [
          "La capacidad de ese número de viajes debe alcanzar el total, no sólo acercarse.",
          "Ese número puede funcionar, pero quizá añade viajes que no son necesarios.",
          "La elección alcanza para todas las cajas y es mínima.",
          "Un viaje por caja no minimiza el número si se pueden agrupar varias."
        ],
        "itemId": "item-2",
        "bankId": "c9-planificacion-L3-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V2-03",
        "template": "plan_secuencial_tiempo",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "plan_secuencial_tiempo",
        "process": "razonar",
        "prompt": "Una actividad dura 5 minutos y otra 8. Se harán seguidas, sin coincidir en el tiempo. ¿Pueden completarse ambas en 12 minutos?",
        "hintText": "Respeta la condición de hacerlas seguidas cuando combines las duraciones.",
        "explanation": "5 + 8 = 13 minutos. Aunque cada actividad aislada dura menos de 12, juntas necesitan más tiempo.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "Sí: cada una dura menos de 12 minutos.",
          "Sí: basta con hacerlas al mismo tiempo.",
          "No: requieren 40 minutos en total.",
          "No: requieren 13 minutos en total."
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "No: requieren 13 minutos en total.",
        "errorFeedback": [
          "Comparar las actividades por separado no verifica la duración de ambas seguidas.",
          "Superponer actividades cambia la condición del problema.",
          "El producto de duraciones no representa el tiempo consecutivo requerido.",
          "La elección verifica la duración conjunta bajo la condición indicada."
        ],
        "itemId": "item-3",
        "bankId": "c9-planificacion-L3-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-planificacion-L3-V2-04",
        "template": "optimizacion_entre_factibles",
        "family": "planificacion",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar con condiciones",
        "structure": "optimizacion_entre_factibles",
        "process": "razonar",
        "prompt": "Se busca un camino de como máximo 14 pasos que permita recoger al menos 4 semillas. Entre los caminos que cumplen, se elige el más corto. ¿Cuál corresponde?",
        "hintText": "La opción más corta de todas no siempre pertenece al conjunto de opciones permitidas.",
        "explanation": "B no cumple el mínimo de semillas. Entre A, C y D, el camino A tiene menos pasos: 12 frente a 14 y 13.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "A: 12 pasos y 4 semillas",
          "B: 9 pasos y 3 semillas",
          "C: 14 pasos y 6 semillas",
          "D: 13 pasos y 5 semillas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "A: 12 pasos y 4 semillas",
        "errorFeedback": [
          "La elección considera primero factibilidad y luego longitud.",
          "El criterio de longitud sólo se aplica después de cumplir la cantidad requerida.",
          "Más semillas no es la prioridad de comparación que se fijó.",
          "Además de cumplir las condiciones, comprueba si hay otro camino permitido más corto."
        ],
        "itemId": "item-4",
        "bankId": "c9-planificacion-L3-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "proporcionalidad",
    "level": 3,
    "variant": 1,
    "items": [
      {
        "id": "c9-proporcionalidad-L3-V1-01",
        "template": "escala_razon_constante",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "escala_razon_constante",
        "process": "formular",
        "prompt": "Cada planta recibe exactamente 3 vasos de agua. Todas reciben la misma cantidad. ¿Cuántos vasos se necesitan para 4 plantas?",
        "hintText": "La cantidad por planta se repite una vez por cada planta.",
        "explanation": "4 grupos de 3 vasos suman 12: 4 × 3 = 12.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "12 vasos",
          "7 vasos",
          "3 vasos",
          "4 vasos"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "12 vasos",
        "errorFeedback": [
          "La elección conserva la cantidad fija por cada planta.",
          "Sumar número de plantas y vasos por planta mezcla papeles distintos.",
          "La cantidad para una planta no cubre necesariamente todas las plantas.",
          "Contar plantas no cuenta los vasos de agua para cada una."
        ],
        "itemId": "item-1",
        "bankId": "c9-proporcionalidad-L3-V1-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V1-02",
        "template": "tasa_unitaria_y_escala",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "tasa_unitaria_y_escala",
        "process": "formular",
        "prompt": "Cinco paquetes iguales contienen en total 20 tarjetas; todos llevan la misma cantidad. ¿Cuántas tarjetas contienen 8 paquetes del mismo tipo?",
        "hintText": "Encuentra primero la cantidad correspondiente a un paquete y conserva esa relación.",
        "explanation": "20 ÷ 5 = 4 tarjetas por paquete. Para 8 paquetes: 8 × 4 = 32 tarjetas.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "23 tarjetas",
          "32 tarjetas",
          "40 tarjetas",
          "100 tarjetas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "32 tarjetas",
        "errorFeedback": [
          "Añadir la diferencia entre números de paquetes como si fueran tarjetas mezcla unidades.",
          "La elección mantiene la cantidad por paquete al cambiar su número.",
          "Duplicar el total requiere comprobar si también se duplicó el número de paquetes.",
          "El total inicial ya incluye los cinco paquetes; multiplicarlo por ese dato cuenta nuevamente el conjunto."
        ],
        "itemId": "item-2",
        "bankId": "c9-proporcionalidad-L3-V1-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V1-03",
        "template": "unidad_desconocida",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "unidad_desconocida",
        "process": "formular",
        "prompt": "Se distribuyen 24 semillas en 8 bolsas con exactamente la misma cantidad en cada una. ¿Cuántas semillas recibe cada bolsa?",
        "hintText": "Busca una cantidad por bolsa que reconstruya el total al repetirse en todas.",
        "explanation": "8 × 3 = 24. Cada bolsa recibe 3 semillas.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "16 semillas",
          "32 semillas",
          "192 semillas",
          "3 semillas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "3 semillas",
        "errorFeedback": [
          "Restar el número de bolsas no reparte las semillas en grupos iguales.",
          "Sumar recipientes y semillas no calcula el contenido de cada recipiente.",
          "Multiplicar ambos datos aumenta el total en lugar de repartirlo.",
          "La elección conserva el total y la igualdad entre bolsas."
        ],
        "itemId": "item-3",
        "bankId": "c9-proporcionalidad-L3-V1-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V1-04",
        "template": "afine_con_cantidad_inicial",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "afine_con_cantidad_inicial",
        "process": "razonar",
        "prompt": "Un contador comienza con 4 fichas y añade 2 por cada semilla plantada. Con 3 semillas marca 10 fichas. ¿Cuántas marcará con 6 semillas?",
        "hintText": "La cantidad inicial se cuenta una sola vez; distingue esa parte de la que cambia con las semillas.",
        "explanation": "Con 6 semillas se añaden 6 × 2 = 12 fichas. Más las 4 iniciales, el contador marca 16. Duplicar semillas no duplica la parte fija.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "20 fichas",
          "12 fichas",
          "16 fichas",
          "22 fichas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "16 fichas",
        "errorFeedback": [
          "Duplicar todo el contador también duplicaría la cantidad inicial, que debe contarse una vez.",
          "La parte variable no incluye por sí sola el valor inicial del contador.",
          "La elección mantiene una sola cantidad inicial y aplica la regla variable.",
          "Partir del total ya observado y sumar como si todas las semillas fueran nuevas vuelve a contar algunas."
        ],
        "itemId": "item-4",
        "bankId": "c9-proporcionalidad-L3-V1-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  },
  {
    "family": "proporcionalidad",
    "level": 3,
    "variant": 2,
    "items": [
      {
        "id": "c9-proporcionalidad-L3-V2-01",
        "template": "escala_razon_constante",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "escala_razon_constante",
        "process": "formular",
        "prompt": "Cada maceta necesita exactamente 4 vasos de agua. Se riegan 5 macetas con esa misma cantidad cada una. ¿Cuántos vasos hacen falta?",
        "hintText": "Relaciona la cantidad que corresponde a una maceta con el número de macetas.",
        "explanation": "5 × 4 = 20 vasos. La cantidad por maceta se mantiene fija.",
        "a": 0,
        "b": 0,
        "answer": 3,
        "labels": [
          "9 vasos",
          "4 vasos",
          "5 vasos",
          "20 vasos"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "20 vasos",
        "errorFeedback": [
          "Sumar los dos datos no cuenta los grupos de vasos.",
          "Esa cantidad riega una maceta, pero falta considerar cuántas hay.",
          "El número de macetas no es directamente la cantidad de vasos.",
          "La elección repite la cantidad por maceta tantas veces como se necesita."
        ],
        "itemId": "item-1",
        "bankId": "c9-proporcionalidad-L3-V2-01",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V2-02",
        "template": "tasa_unitaria_y_escala",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "tasa_unitaria_y_escala",
        "process": "formular",
        "prompt": "Seis cajas iguales contienen en total 18 piezas; todas llevan la misma cantidad. ¿Cuántas piezas habrá en 9 cajas del mismo tipo?",
        "hintText": "Determina la cantidad por caja antes de cambiar el número de cajas.",
        "explanation": "18 ÷ 6 = 3 piezas por caja. En 9 cajas hay 9 × 3 = 27 piezas.",
        "a": 0,
        "b": 0,
        "answer": 2,
        "labels": [
          "21 piezas",
          "36 piezas",
          "27 piezas",
          "108 piezas"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "27 piezas",
        "errorFeedback": [
          "Añadir el aumento del número de cajas como si cada caja contuviera una sola pieza cambia la relación.",
          "Duplicar el total supone duplicar también el número de cajas, lo que debe verificarse.",
          "La elección conserva el contenido de cada caja.",
          "Multiplicar el total por el número inicial de cajas cuenta repetidamente el mismo conjunto."
        ],
        "itemId": "item-2",
        "bankId": "c9-proporcionalidad-L3-V2-02",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V2-03",
        "template": "unidad_desconocida",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "unidad_desconocida",
        "process": "formular",
        "prompt": "Hay 35 botones repartidos en 7 bolsas. Todas tienen la misma cantidad y no sobran botones. ¿Cuántos tiene cada bolsa?",
        "hintText": "El contenido de una bolsa debe formar el total al repetirse siete veces.",
        "explanation": "7 × 5 = 35. Por eso cada bolsa contiene 5 botones.",
        "a": 0,
        "b": 0,
        "answer": 1,
        "labels": [
          "28 botones",
          "5 botones",
          "42 botones",
          "245 botones"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "5 botones",
        "errorFeedback": [
          "Restar recipientes al total no establece el contenido de cada uno.",
          "La elección reconstruye el total mediante grupos iguales.",
          "Sumar cantidades de distinta función no equivale a repartir.",
          "Multiplicar el total por las bolsas no conserva la cantidad original de botones."
        ],
        "itemId": "item-3",
        "bankId": "c9-proporcionalidad-L3-V2-03",
        "bankVersion": "reasoning-fixed-pack@2"
      },
      {
        "id": "c9-proporcionalidad-L3-V2-04",
        "template": "afine_con_cantidad_inicial",
        "family": "proporcionalidad",
        "context": "c9-authored",
        "level": 3,
        "pool": "practice",
        "dimension": "Relacionar cantidades",
        "structure": "afine_con_cantidad_inicial",
        "process": "razonar",
        "prompt": "Un contador empieza en 3 puntos y suma 4 por cada estación visitada. Después de 2 estaciones marca 11. ¿Qué marcará después de 4 estaciones?",
        "hintText": "Separa la parte inicial de los puntos que se añaden por cada estación.",
        "explanation": "Las 4 estaciones aportan 4 × 4 = 16 puntos; con los 3 iniciales son 19. La parte inicial no aumenta al duplicar las estaciones.",
        "a": 0,
        "b": 0,
        "answer": 0,
        "labels": [
          "19 puntos",
          "22 puntos",
          "16 puntos",
          "27 puntos"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "19 puntos",
        "errorFeedback": [
          "La elección conserva la parte fija y calcula la parte que depende de estaciones.",
          "Duplicar el total observado también duplicaría el inicio del contador.",
          "El aporte de las estaciones debe combinarse con la cantidad que había al principio.",
          "Si usas el total de dos estaciones como inicio, no puedes añadir de nuevo las cuatro completas."
        ],
        "itemId": "item-4",
        "bankId": "c9-proporcionalidad-L3-V2-04",
        "bankVersion": "reasoning-fixed-pack@2"
      }
    ]
  }
];

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);
  }
  return value;
}
const exactKeys = (value, expected) => !!value && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...expected].sort().join(',');
deepFreeze(PACKS);
deepFreeze(FAMILIES);
export const REASONING_C9_FAMILIES = FAMILIES;
const findPack = p => PACKS.find(pack => pack.family === p?.family
  && pack.level === p?.level && pack.variant === p?.variant);

export function validReasoningC9Task(task) {
  return !!task && task.contentId === 'reasoning-fixed-pack'
    && task.contentVersion === 2 && task.trail === 'razonar'
    && exactKeys(task.parameters, ['family', 'level', 'variant'])
    && Number.isInteger(task.parameters.level)
    && Number.isInteger(task.parameters.variant)
    && !!findPack(task.parameters)
    && exactKeys(task.completionRule, ['kind', 'count'])
    && task.completionRule.kind === 'answered_items'
    && task.completionRule.count === 4;
}
export function reasoningC9Items(task) {
  if (task?.contentId !== 'reasoning-fixed-pack') return null;
  if (!validReasoningC9Task(task)) throw Error('Paquete de razonamiento v2 no compatible.');
  return structuredClone(findPack(task.parameters).items);
}
export function reasoningC9Description(task) {
  if (task?.contentId !== 'reasoning-fixed-pack') return null;
  if (!validReasoningC9Task(task)) throw Error('Paquete de razonamiento v2 no compatible.');
  const family = FAMILIES.find(row => row.id === task.parameters.family);
  return `${family.name} · banda de requisitos ${family.level} · variante ${task.parameters.variant} · paquete v2`;
}


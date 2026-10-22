// C8 candidate only: reasoning-fixed-pack@1. Do not silently edit published v1 content.
// Authored by /root/profesor_contraste from the existing BANK 0.3.0.
// Original item fields are retained; options are permuted with their values intact.
// Original hintText is retained. Added metadata: itemId, bankId and bankVersion.
// Numeric answer values and labels retain their original semantics.
const deepFreeze = value => {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};
const PACKS = deepFreeze([
  {
    "family": "dos_pasos",
    "level": 3,
    "variant": 1,
    "items": [
      {
        "id": "dos_pasos-1-L3-01",
        "template": "dos_pasos-1",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Hay 6 cajas con 6 lápices cada una. Prestamos 6 lápices en total. ¿Cuántos quedan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "6 × 6 = 36; 36 − 6 = 30.",
        "a": 6,
        "b": 6,
        "answer": 30,
        "options": [
          25,
          30,
          28,
          31
        ],
        "solution": "30",
        "itemId": "item-1",
        "bankId": "dos_pasos-1-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-2-L3-01",
        "template": "dos_pasos-2",
        "family": "dos_pasos",
        "context": "agua",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Se llenan 10 bandejas con 3 vasos cada una. Se rompen 10 vasos en total. ¿Cuántos quedan enteros?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "10 × 3 = 30; 30 − 10 = 20.",
        "a": 10,
        "b": 3,
        "answer": 20,
        "options": [
          18,
          19,
          23,
          20
        ],
        "solution": "20",
        "itemId": "item-2",
        "bankId": "dos_pasos-2-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-3-L3-01",
        "template": "dos_pasos-3",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Compramos 7 paquetes de 5 hojas. Usamos 7 hojas en total. ¿Cuántas quedan sin usar?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "7 × 5 = 35; 35 − 7 = 28.",
        "a": 7,
        "b": 5,
        "answer": 28,
        "options": [
          28,
          24,
          26,
          31
        ],
        "solution": "28",
        "itemId": "item-3",
        "bankId": "dos_pasos-3-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-4-L3-01",
        "template": "dos_pasos-4",
        "family": "dos_pasos",
        "context": "huerta",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Sembramos 5 filas de 9 semillas. No brotan 5 semillas en total. ¿Cuántas sí brotan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "5 × 9 = 45; 45 − 5 = 40.",
        "a": 5,
        "b": 9,
        "answer": 40,
        "options": [
          35,
          39,
          40,
          42
        ],
        "solution": "40",
        "itemId": "item-4",
        "bankId": "dos_pasos-4-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  },
  {
    "family": "dos_pasos",
    "level": 3,
    "variant": 2,
    "items": [
      {
        "id": "dos_pasos-5-L3-01",
        "template": "dos_pasos-5",
        "family": "dos_pasos",
        "context": "dos_pasos-5",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Tenemos 3 bolsas con 3 cuentas cada una. Regalamos 3 cuentas en total. ¿Cuántas conservamos?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "3 × 3 = 9; 9 − 3 = 6.",
        "a": 3,
        "b": 3,
        "answer": 6,
        "options": [
          5,
          9,
          6,
          11
        ],
        "solution": "6",
        "itemId": "item-1",
        "bankId": "dos_pasos-5-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-6-L3-01",
        "template": "dos_pasos-6",
        "family": "dos_pasos",
        "context": "compras",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "El grupo reúne 5 veces 9 pesos. Gasta 5 pesos en total. ¿Cuántos pesos conserva?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "5 × 9 = 45; 45 − 5 = 40.",
        "a": 5,
        "b": 9,
        "answer": 40,
        "options": [
          40,
          41,
          44,
          45
        ],
        "solution": "40",
        "itemId": "item-2",
        "bankId": "dos_pasos-6-L3-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-1-L3-02",
        "template": "dos_pasos-1",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Hay 3 cajas con 8 lápices cada una. Prestamos 3 lápices en total. ¿Cuántos quedan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "3 × 8 = 24; 24 − 3 = 21.",
        "a": 3,
        "b": 8,
        "answer": 21,
        "options": [
          16,
          19,
          25,
          21
        ],
        "solution": "21",
        "itemId": "item-3",
        "bankId": "dos_pasos-1-L3-02",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-2-L3-02",
        "template": "dos_pasos-2",
        "family": "dos_pasos",
        "context": "agua",
        "level": 3,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Se llenan 10 bandejas con 4 vasos cada una. Se rompen 10 vasos en total. ¿Cuántos quedan enteros?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "10 × 4 = 40; 40 − 10 = 30.",
        "a": 10,
        "b": 4,
        "answer": 30,
        "options": [
          26,
          30,
          32,
          33
        ],
        "solution": "30",
        "itemId": "item-4",
        "bankId": "dos_pasos-2-L3-02",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  },
  {
    "family": "dos_pasos",
    "level": 4,
    "variant": 1,
    "items": [
      {
        "id": "dos_pasos-1-L4-01",
        "template": "dos_pasos-1",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Hay 10 cajas con 20 lápices cada una. Prestamos 10 lápices en total. ¿Cuántos quedan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "10 × 20 = 200; 200 − 10 = 190.",
        "a": 10,
        "b": 20,
        "answer": 190,
        "options": [
          192,
          193,
          195,
          190
        ],
        "solution": "190",
        "itemId": "item-1",
        "bankId": "dos_pasos-1-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-2-L4-01",
        "template": "dos_pasos-2",
        "family": "dos_pasos",
        "context": "agua",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Se llenan 10 bandejas con 2 vasos cada una. Se rompen 10 vasos en total. ¿Cuántos quedan enteros?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "10 × 2 = 20; 20 − 10 = 10.",
        "a": 10,
        "b": 2,
        "answer": 10,
        "options": [
          8,
          10,
          11,
          14
        ],
        "solution": "10",
        "itemId": "item-2",
        "bankId": "dos_pasos-2-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-3-L4-01",
        "template": "dos_pasos-3",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Compramos 7 paquetes de 20 hojas. Usamos 7 hojas en total. ¿Cuántas quedan sin usar?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "7 × 20 = 140; 140 − 7 = 133.",
        "a": 7,
        "b": 20,
        "answer": 133,
        "options": [
          128,
          135,
          133,
          136
        ],
        "solution": "133",
        "itemId": "item-3",
        "bankId": "dos_pasos-3-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-4-L4-01",
        "template": "dos_pasos-4",
        "family": "dos_pasos",
        "context": "huerta",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Sembramos 3 filas de 13 semillas. No brotan 3 semillas en total. ¿Cuántas sí brotan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "3 × 13 = 39; 39 − 3 = 36.",
        "a": 3,
        "b": 13,
        "answer": 36,
        "options": [
          36,
          37,
          38,
          40
        ],
        "solution": "36",
        "itemId": "item-4",
        "bankId": "dos_pasos-4-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  },
  {
    "family": "dos_pasos",
    "level": 4,
    "variant": 2,
    "items": [
      {
        "id": "dos_pasos-5-L4-01",
        "template": "dos_pasos-5",
        "family": "dos_pasos",
        "context": "dos_pasos-5",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Tenemos 10 bolsas con 7 cuentas cada una. Regalamos 10 cuentas en total. ¿Cuántas conservamos?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "10 × 7 = 70; 70 − 10 = 60.",
        "a": 10,
        "b": 7,
        "answer": 60,
        "options": [
          60,
          57,
          58,
          65
        ],
        "solution": "60",
        "itemId": "item-1",
        "bankId": "dos_pasos-5-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-6-L4-01",
        "template": "dos_pasos-6",
        "family": "dos_pasos",
        "context": "compras",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "El grupo reúne 8 veces 16 pesos. Gasta 8 pesos en total. ¿Cuántos pesos conserva?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "8 × 16 = 128; 128 − 8 = 120.",
        "a": 8,
        "b": 16,
        "answer": 120,
        "options": [
          118,
          121,
          120,
          122
        ],
        "solution": "120",
        "itemId": "item-2",
        "bankId": "dos_pasos-6-L4-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-1-L4-02",
        "template": "dos_pasos-1",
        "family": "dos_pasos",
        "context": "materiales",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Hay 9 cajas con 8 lápices cada una. Prestamos 9 lápices en total. ¿Cuántos quedan?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "9 × 8 = 72; 72 − 9 = 63.",
        "a": 9,
        "b": 8,
        "answer": 63,
        "options": [
          59,
          63,
          64,
          67
        ],
        "solution": "63",
        "itemId": "item-3",
        "bankId": "dos_pasos-1-L4-02",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dos_pasos-2-L4-02",
        "template": "dos_pasos-2",
        "family": "dos_pasos",
        "context": "agua",
        "level": 4,
        "pool": "practice",
        "dimension": "Planificar",
        "prompt": "Se llenan 8 bandejas con 5 vasos cada una. Se rompen 8 vasos en total. ¿Cuántos quedan enteros?",
        "hintText": "Primero calcula el total de los grupos; después considera lo que se utiliza.",
        "explanation": "8 × 5 = 40; 40 − 8 = 32.",
        "a": 8,
        "b": 5,
        "answer": 32,
        "options": [
          30,
          33,
          34,
          32
        ],
        "solution": "32",
        "itemId": "item-4",
        "bankId": "dos_pasos-2-L4-02",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  },
  {
    "family": "dato_faltante",
    "level": 2,
    "variant": 1,
    "items": [
      {
        "id": "dato_faltante-1-L2-01",
        "template": "dato_faltante-1",
        "family": "dato_faltante",
        "context": "materiales",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Hay 6 cajas iguales con lápices, pero no sabemos cuántos lápices contiene cada caja. Para saber el total de lápices, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 6,
        "b": 3,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          0,
          2,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-1",
        "bankId": "dato_faltante-1-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-2-L2-01",
        "template": "dato_faltante-2",
        "family": "dato_faltante",
        "context": "huerta",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Se preparan 6 bolsas iguales con semillas. No se dice cuántas semillas lleva cada bolsa. Para hallar el total, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 6,
        "b": 6,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-2",
        "bankId": "dato_faltante-2-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-3-L2-01",
        "template": "dato_faltante-3",
        "family": "dato_faltante",
        "context": "huerta",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Un vivero tiene 6 filas iguales de plantas. No conocemos cuántas plantas hay en cada fila. Para contar todas las plantas, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 6,
        "b": 6,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          2,
          3,
          0
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-3",
        "bankId": "dato_faltante-3-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-4-L2-01",
        "template": "dato_faltante-4",
        "family": "dato_faltante",
        "context": "materiales",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Compramos 8 paquetes iguales de hojas. No conocemos las hojas por paquete. Para calcular todas las hojas, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 8,
        "b": 6,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          2,
          0,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-4",
        "bankId": "dato_faltante-4-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  },
  {
    "family": "dato_faltante",
    "level": 2,
    "variant": 2,
    "items": [
      {
        "id": "dato_faltante-5-L2-01",
        "template": "dato_faltante-5",
        "family": "dato_faltante",
        "context": "biblioteca",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Un álbum tiene 8 páginas llenas con la misma cantidad de estampas. Para contar las estampas, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 8,
        "b": 5,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          2,
          0,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-1",
        "bankId": "dato_faltante-5-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-6-L2-01",
        "template": "dato_faltante-6",
        "family": "dato_faltante",
        "context": "comunidad",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Formamos 6 equipos del mismo tamaño. No conocemos las personas por equipo. Para calcular todas las personas, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 6,
        "b": 4,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          2,
          3,
          0
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-2",
        "bankId": "dato_faltante-6-L2-01",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-1-L2-02",
        "template": "dato_faltante-1",
        "family": "dato_faltante",
        "context": "materiales",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Hay 8 cajas iguales con lápices, pero no sabemos cuántos lápices contiene cada caja. Para saber el total de lápices, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 8,
        "b": 6,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          0,
          1,
          2,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-3",
        "bankId": "dato_faltante-1-L2-02",
        "bankVersion": "reasoning-fixed-pack@1"
      },
      {
        "id": "dato_faltante-2-L2-02",
        "template": "dato_faltante-2",
        "family": "dato_faltante",
        "context": "huerta",
        "level": 2,
        "pool": "practice",
        "dimension": "Información suficiente",
        "prompt": "Se preparan 8 bolsas iguales con semillas. No se dice cuántas semillas lleva cada bolsa. Para hallar el total, ¿qué dato falta?",
        "hintText": "Distingue lo que ya sabes de lo que necesitas para responder.",
        "explanation": "Necesitas conocer cuántos elementos hay en cada grupo. El número de grupos por sí solo no basta.",
        "a": 8,
        "b": 6,
        "answer": 0,
        "labels": [
          "La cantidad en cada grupo",
          "El color de los objetos",
          "El nombre de quien cuenta",
          "La hora a la que empezaron"
        ],
        "options": [
          1,
          0,
          2,
          3
        ],
        "solution": "La cantidad en cada grupo",
        "itemId": "item-4",
        "bankId": "dato_faltante-2-L2-02",
        "bankVersion": "reasoning-fixed-pack@1"
      }
    ]
  }
] );
const exactKeys = (value, keys) => !!value && typeof value === 'object'
  && !Array.isArray(value)
  && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
const findPack = parameters => PACKS.find(pack => pack.family === parameters.family
  && pack.level === parameters.level && pack.variant === parameters.variant);

export function validReasoningC8Task(task) {
  return !!task && task.contentId === 'reasoning-fixed-pack'
    && task.contentVersion === 1 && task.trail === 'razonar'
    && exactKeys(task.parameters, ['family', 'level', 'variant'])
    && Number.isInteger(task.parameters.level)
    && Number.isInteger(task.parameters.variant)
    && !!findPack(task.parameters)
    && exactKeys(task.completionRule, ['kind', 'count'])
    && task.completionRule.kind === 'answered_items'
    && task.completionRule.count === 4;
}

export function reasoningC8Items(task) {
  if (task?.contentId !== 'reasoning-fixed-pack') return null;
  if (!validReasoningC8Task(task)) throw Error('Paquete de razonamiento no compatible.');
  return structuredClone(findPack(task.parameters).items);
}

export function reasoningC8Description(task) {
  if (task?.contentId !== 'reasoning-fixed-pack') return null;
  if (!validReasoningC8Task(task)) throw Error('Paquete de razonamiento no compatible.');
  const name = task.parameters.family === 'dos_pasos'
    ? 'Dos pasos' : 'Información faltante';
  return `${name} · nivel ${task.parameters.level} · variante ${task.parameters.variant} · paquete v${task.contentVersion}`;
}

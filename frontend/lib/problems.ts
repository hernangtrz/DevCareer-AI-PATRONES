// lib/problems.ts
// Banco de problemas para el módulo de Code Challenge

export type Difficulty = "easy" | "medium" | "hard";

export interface TestCase {
  input: unknown[];
  expected: unknown;
  label?: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string[];
  timeLimit: number; // minutos
  description: string;
  examples: { input: string; output: string; explanation: string }[];
  starterCode: string;
  legacySpaghettiCode?: string; // Código legacy con malos olores para comparar
  patternObjective?: string; // Patrón objetivo para refactorizar
  functionName: string; // nombre de la función a evaluar
  testCases: TestCase[];
  hints: string[];
}

export const PROBLEMS: Problem[] = [
  // ──────────────────────────────────────────
  // 1. Two Sum
  // ──────────────────────────────────────────
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    category: ["Arrays", "Hash Map"],
    timeLimit: 15,
    description: `Dado un arreglo de enteros \`nums\` y un entero \`target\`, retorna los índices de los dos números que suman \`target\`.

Puedes asumir que cada entrada tiene exactamente una solución, y no puedes usar el mismo elemento dos veces.

Puedes retornar la respuesta en cualquier orden.`,
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9",
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6",
      },
    ],
    starterCode: `function twoSum(nums, target) {
  // Escribe tu solución aquí

}`,
    functionName: "twoSum",
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
    ],
    hints: [
      "¿Qué estructura de datos te permite buscar un complemento en O(1)?",
      "Usa un Map para guardar cada número y su índice mientras recorres el arreglo.",
    ],
  },

  // ──────────────────────────────────────────
  // 2. Valid Parentheses
  // ──────────────────────────────────────────
  {
    id: "valid-parentheses",
    title: "Paréntesis Válidos",
    difficulty: "easy",
    category: ["Strings", "Stack"],
    timeLimit: 15,
    description: `Dado un string \`s\` que contiene solo los caracteres \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` y \`']'\`, determina si el string de entrada es válido.

Un string de entrada es válido si:
- Los corchetes abiertos deben cerrarse con el mismo tipo de corchete.
- Los corchetes abiertos deben cerrarse en el orden correcto.
- Cada corchete de cierre tiene un corchete abierto correspondiente del mismo tipo.`,
    examples: [
      { input: 's = "()"', output: "true", explanation: "Paréntesis simple válido." },
      { input: 's = "()[]{}"', output: "true", explanation: "Tres pares válidos." },
      { input: 's = "(]"', output: "false", explanation: "Tipos de cierre incorrectos." },
    ],
    starterCode: `function isValid(s) {
  // Escribe tu solución aquí

}`,
    functionName: "isValid",
    testCases: [
      { input: ["()"], expected: true },
      { input: ["()[]{}"], expected: true },
      { input: ["(]"], expected: false },
      { input: ["([)]"], expected: false },
      { input: ["{[]}"], expected: true },
    ],
    hints: [
      "Usa una pila (stack). Al ver un abre-corchete, empuja; al ver un cierra-corchete, compara con el top.",
      "Al final, si la pila está vacía, el string es válido.",
    ],
  },

  // ──────────────────────────────────────────
  // 3. Reverse String
  // ──────────────────────────────────────────
  {
    id: "reverse-string",
    title: "Invertir String",
    difficulty: "easy",
    category: ["Strings", "Two Pointers"],
    timeLimit: 10,
    description: `Escribe una función que invierta un string. La entrada es un arreglo de caracteres \`s\`.

Debes hacer esto **modificando el arreglo in-place** con O(1) de memoria extra.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "El arreglo se invierte en su lugar.",
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: "",
      },
    ],
    starterCode: `function reverseString(s) {
  // Modifica el arreglo in-place y retórnalo

}`,
    functionName: "reverseString",
    testCases: [
      { input: [["h", "e", "l", "l", "o"]], expected: ["o", "l", "l", "e", "h"] },
      { input: [["H", "a", "n", "n", "a", "h"]], expected: ["h", "a", "n", "n", "a", "H"] },
    ],
    hints: ["Usa dos punteros: uno al inicio y otro al final, e intercámbialos moviéndolos hacia el centro."],
  },

  // ──────────────────────────────────────────
  // 4. FizzBuzz
  // ──────────────────────────────────────────
  {
    id: "fizzbuzz",
    title: "FizzBuzz",
    difficulty: "easy",
    category: ["Math", "Strings"],
    timeLimit: 10,
    description: `Dado un entero \`n\`, retorna un arreglo de strings donde:
- Para múltiplos de 3, el elemento es \`"Fizz"\`.
- Para múltiplos de 5, el elemento es \`"Buzz"\`.
- Para múltiplos de ambos 3 y 5, el elemento es \`"FizzBuzz"\`.
- Para cualquier otro número, el elemento es el número como string.`,
    examples: [
      {
        input: "n = 3",
        output: '["1", "2", "Fizz"]',
        explanation: "3 es múltiplo de 3.",
      },
      {
        input: "n = 5",
        output: '["1", "2", "Fizz", "4", "Buzz"]',
        explanation: "5 es múltiplo de 5.",
      },
      {
        input: "n = 15",
        output: '["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"]',
        explanation: "15 es múltiplo de 3 y 5.",
      },
    ],
    starterCode: `function fizzBuzz(n) {
  // Escribe tu solución aquí

}`,
    functionName: "fizzBuzz",
    testCases: [
      { input: [3], expected: ["1", "2", "Fizz"] },
      { input: [5], expected: ["1", "2", "Fizz", "4", "Buzz"] },
      { input: [15], expected: ["1", "2", "Fizz", "4", "Buzz", "Fizz", "7", "8", "Fizz", "Buzz", "11", "Fizz", "13", "14", "FizzBuzz"] },
    ],
    hints: ["Verifica primero el caso FizzBuzz (divisible por ambos) antes de los casos individuales."],
  },

  // ──────────────────────────────────────────
  // 5. Contains Duplicate
  // ──────────────────────────────────────────
  {
    id: "contains-duplicate",
    title: "Contiene Duplicado",
    difficulty: "easy",
    category: ["Arrays", "Hash Map"],
    timeLimit: 10,
    description: `Dado un arreglo de enteros \`nums\`, retorna \`true\` si algún valor aparece al menos dos veces, y \`false\` si cada elemento es distinto.`,
    examples: [
      { input: "nums = [1,2,3,1]", output: "true", explanation: "El 1 aparece dos veces." },
      { input: "nums = [1,2,3,4]", output: "false", explanation: "Todos los elementos son distintos." },
      { input: "nums = [1,1,1,3,3,4,3,2,4,2]", output: "true", explanation: "Hay varios duplicados." },
    ],
    starterCode: `function containsDuplicate(nums) {
  // Escribe tu solución aquí

}`,
    functionName: "containsDuplicate",
    testCases: [
      { input: [[1, 2, 3, 1]], expected: true },
      { input: [[1, 2, 3, 4]], expected: false },
      { input: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
    ],
    hints: ["Un Set no permite duplicados. Compara su tamaño con el del arreglo original."],
  },

  // ──────────────────────────────────────────
  // 6. Maximum Subarray (Kadane's)
  // ──────────────────────────────────────────
  {
    id: "maximum-subarray",
    title: "Subarreglo Máximo",
    difficulty: "medium",
    category: ["Arrays", "Dynamic Programming"],
    timeLimit: 20,
    description: `Dado un arreglo de enteros \`nums\`, encuentra el subarreglo (que contenga al menos un elemento) con la suma más grande y retorna su suma.

Un subarreglo es una parte contigua de un arreglo.`,
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "El subarreglo [4,-1,2,1] tiene la suma más grande = 6.",
      },
      { input: "nums = [1]", output: "1", explanation: "Solo hay un elemento." },
      { input: "nums = [5,4,-1,7,8]", output: "23", explanation: "Todo el arreglo suma 23." },
    ],
    starterCode: `function maxSubArray(nums) {
  // Escribe tu solución aquí

}`,
    functionName: "maxSubArray",
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
    hints: [
      "El algoritmo de Kadane resuelve esto en O(n).",
      "Mantén dos variables: la suma actual del subarreglo y la máxima suma vista.",
      "Si la suma actual se vuelve negativa, reiníciala a 0 (empieza un nuevo subarreglo).",
    ],
  },

  // ──────────────────────────────────────────
  // 7. Palindrome Check
  // ──────────────────────────────────────────
  {
    id: "valid-palindrome",
    title: "Palíndromo Válido",
    difficulty: "easy",
    category: ["Strings", "Two Pointers"],
    timeLimit: 10,
    description: `Una frase es palíndromo si, después de convertir todos los caracteres en minúsculas y eliminar todos los caracteres no alfanuméricos, se lee igual hacia adelante que hacia atrás.

Dado un string \`s\`, retorna \`true\` si es un palíndromo, o \`false\` en caso contrario.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: "true",
        explanation: '"amanaplanacanalpanama" es palíndromo.',
      },
      { input: 's = "race a car"', output: "false", explanation: '"raceacar" no es palíndromo.' },
      { input: 's = " "', output: "true", explanation: "Un string vacío es palíndromo." },
    ],
    starterCode: `function isPalindrome(s) {
  // Escribe tu solución aquí

}`,
    functionName: "isPalindrome",
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false },
      { input: [" "], expected: true },
    ],
    hints: [
      "Primero limpia el string: solo letras y dígitos, todo en minúsculas.",
      "Luego usa dos punteros (inicio y fin) para comparar caracteres.",
    ],
  },

  // ──────────────────────────────────────────
  // 8. Climbing Stairs
  // ──────────────────────────────────────────
  {
    id: "climbing-stairs",
    title: "Escalera de Escalones",
    difficulty: "easy",
    category: ["Dynamic Programming", "Math"],
    timeLimit: 15,
    description: `Estás subiendo una escalera. Se necesitan \`n\` escalones para llegar arriba.

Cada vez puedes subir 1 o 2 escalones. ¿De cuántas maneras distintas puedes llegar a la cima?`,
    examples: [
      { input: "n = 2", output: "2", explanation: "1+1 o 2." },
      { input: "n = 3", output: "3", explanation: "1+1+1, 1+2, o 2+1." },
    ],
    starterCode: `function climbStairs(n) {
  // Escribe tu solución aquí

}`,
    functionName: "climbStairs",
    testCases: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [5], expected: 8 },
      { input: [10], expected: 89 },
    ],
    hints: [
      "Nota el patrón: climbStairs(n) = climbStairs(n-1) + climbStairs(n-2).",
      "Es exactamente la secuencia de Fibonacci. Puedes resolverlo con DP en O(n).",
    ],
  },

  // ──────────────────────────────────────────
  // 9. Merge Sorted Array
  // ──────────────────────────────────────────
  {
    id: "merge-sorted-array",
    title: "Unir Arreglos Ordenados",
    difficulty: "easy",
    category: ["Arrays", "Two Pointers"],
    timeLimit: 15,
    description: `Se dan dos arreglos de enteros ordenados de forma no decreciente: \`nums1\` y \`nums2\`, y dos enteros \`m\` y \`n\`, representando el número de elementos en \`nums1\` y \`nums2\` respectivamente.

Combina \`nums1\` y \`nums2\` en un solo arreglo ordenado de forma no decreciente.

El arreglo resultante no debe ser retornado sino almacenado dentro del arreglo \`nums1\`. Para acomodar esto, \`nums1\` tiene una longitud de \`m + n\`, donde los primeros \`m\` elementos denotan los elementos que deben ser fusionados, y los últimos \`n\` elementos son 0 y deben ser ignorados.`,
    examples: [
      {
        input: "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3",
        output: "[1,2,2,3,5,6]",
        explanation: "Los arreglos se unen en: [1,2,2,3,5,6].",
      },
    ],
    starterCode: `function merge(nums1, m, nums2, n) {
  // Modifica nums1 in-place

}`,
    functionName: "merge",
    testCases: [
      {
        input: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3],
        expected: [1, 2, 2, 3, 5, 6],
        label: "nums1=[1,2,3,0,0,0] m=3 nums2=[2,5,6] n=3",
      },
      {
        input: [[1], 1, [], 0],
        expected: [1],
        label: "nums1=[1] m=1 nums2=[] n=0",
      },
      {
        input: [[0], 0, [1], 1],
        expected: [1],
        label: "nums1=[0] m=0 nums2=[1] n=1",
      },
    ],
    hints: [
      "Empieza desde el final de ambos arreglos para evitar sobrescribir elementos.",
      "Usa tres punteros: uno al final de nums1, uno al final de nums2 y uno al final del resultado.",
    ],
  },

  // ──────────────────────────────────────────
  // 10. Best Time to Buy and Sell Stock
  // ──────────────────────────────────────────
  {
    id: "best-time-stock",
    title: "Mejor Momento para Comprar Acciones",
    difficulty: "easy",
    category: ["Arrays", "Greedy"],
    timeLimit: 15,
    description: `Se da un arreglo \`prices\` donde \`prices[i]\` es el precio de una acción en el día \`i\`.

Quieres maximizar tu ganancia eligiendo un solo día para comprar una acción y un día diferente en el futuro para venderla.

Retorna la ganancia máxima que puedes obtener de esta transacción. Si no puedes obtener ninguna ganancia, retorna \`0\`.`,
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Compra el día 2 (precio=1), vende el día 5 (precio=6). Ganancia = 6-1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "Los precios solo bajan. No hay ganancia posible.",
      },
    ],
    starterCode: `function maxProfit(prices) {
  // Escribe tu solución aquí

}`,
    functionName: "maxProfit",
    testCases: [
      { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { input: [[7, 6, 4, 3, 1]], expected: 0 },
      { input: [[1, 2]], expected: 1 },
    ],
    hints: [
      "Mantén el precio mínimo visto hasta ahora y calcula la ganancia actual en cada paso.",
      "La ganancia máxima es el máximo de (precio actual - precio mínimo histórico).",
    ],
  },

  // ──────────────────────────────────────────
  // 9. Strategy Pattern: Pasarela de Pagos
  // ──────────────────────────────────────────
  {
    id: "strategy-payment-processor",
    title: "Refactor con Strategy Pattern: Procesador de Pagos",
    difficulty: "medium",
    category: ["Patrones de Diseño", "Refactoring", "SOLID"],
    patternObjective: "Strategy Pattern (GoF Comportamental)",
    timeLimit: 20,
    description: `Refactoriza un procesador de pagos acoplado aplicando el **Patrón Strategy**.
Debes crear una función \`processPayment(strategyName, amount)\` que use estrategias intercambiables para calcular la comisión final y procesar el cobro:
- **"credit_card"**: Aplica un fee del 3% sobre el monto (\`amount * 1.03\`).
- **"paypal"**: Aplica un fee fijo de $2 más 2% (\`amount * 1.02 + 2\`).
- **"crypto"**: Aplica un fee fijo de $0.50 (\`amount + 0.5\`).

Si la estrategia no existe, retorna \`null\`. Redondea el resultado a 2 decimales.`,
    legacySpaghettiCode: `// ❌ Código Legacy con Malos Olores (Switch Case monolítico y violación de Open/Closed Principle)
function processPaymentBad(type, amount) {
  if (type === "credit_card") {
    // Cálculo hardcodeado acoplado
    return Number((amount * 1.03).toFixed(2));
  } else if (type === "paypal") {
    return Number((amount * 1.02 + 2).toFixed(2));
  } else if (type === "crypto") {
    return Number((amount + 0.5).toFixed(2));
  } else {
    // Si queremos agregar ApplePay o Stripe, debemos modificar este código rompiendo OCP
    return null;
  }
}`,
    examples: [
      {
        input: 'strategyName = "credit_card", amount = 100',
        output: "103.00",
        explanation: "100 * 1.03 = 103",
      },
      {
        input: 'strategyName = "paypal", amount = 100',
        output: "104.00",
        explanation: "100 * 1.02 + 2 = 104",
      },
    ],
    starterCode: `// Implementa el Patrón Strategy con estrategias desacopladas
const paymentStrategies = {
  credit_card: (amount) => Number((amount * 1.03).toFixed(2)),
  paypal: (amount) => Number((amount * 1.02 + 2).toFixed(2)),
  crypto: (amount) => Number((amount + 0.5).toFixed(2)),
};

function processPayment(strategyName, amount) {
  const strategy = paymentStrategies[strategyName];
  if (!strategy) return null;
  return strategy(amount);
}`,
    functionName: "processPayment",
    testCases: [
      { input: ["credit_card", 100], expected: 103 },
      { input: ["paypal", 100], expected: 104 },
      { input: ["crypto", 50], expected: 50.5 },
      { input: ["bitcoin", 100], expected: null },
    ],
    hints: [
      "El patrón Strategy encapsula algoritmos en objetos intercambiables para eliminar bloques switch o if-else anidados.",
      "Puedes usar un mapa o diccionario de estrategias desacopladas.",
    ],
  },

  // ──────────────────────────────────────────
  // 10. Factory Pattern: Notification Creator
  // ──────────────────────────────────────────
  {
    id: "factory-notification-dispatcher",
    title: "Factory Method: Despachador de Notificaciones",
    difficulty: "easy",
    category: ["Patrones de Diseño", "Creacionales"],
    patternObjective: "Factory Method Pattern (GoF Creacional)",
    timeLimit: 15,
    description: `Implementa una función fábrica \`createNotification(channel, recipient, message)\` basada en el **Patrón Factory Method**.
Debe retornar un objeto con el formato estandarizado según el canal:
- Si \`channel === "email"\`: \`{ channel: "email", to: recipient, content: message, status: "queued", protocol: "SMTP" }\`
- Si \`channel === "sms"\`: \`{ channel: "sms", to: recipient, content: message, status: "queued", protocol: "SMPP" }\`
- Si \`channel === "push"\`: \`{ channel: "push", to: recipient, content: message, status: "queued", protocol: "FCM" }\`
- Si el canal no es soportado, retorna \`null\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Factory (Instanciación directa y dispersa en el cliente)
function sendAlert(user, text, mode) {
  if (mode === "email") {
    const emailObj = { channel: "email", to: user, content: text, status: "queued", protocol: "SMTP" };
    // Lógica mezclada con creación
  }
}`,
    examples: [
      {
        input: 'channel = "email", recipient = "user@test.com", message = "Hola"',
        output: '{ channel: "email", to: "user@test.com", content: "Hola", status: "queued", protocol: "SMTP" }',
        explanation: "La fábrica crea la instancia correcta de Email Notification.",
      },
    ],
    starterCode: `function createNotification(channel, recipient, message) {
  // Implementa el Factory Method aquí
  
}`,
    functionName: "createNotification",
    testCases: [
      {
        input: ["email", "dev@test.com", "Bienvenido"],
        expected: { channel: "email", to: "dev@test.com", content: "Bienvenido", status: "queued", protocol: "SMTP" },
      },
      {
        input: ["sms", "+123456789", "Tu código es 4040"],
        expected: { channel: "sms", to: "+123456789", content: "Tu código es 4040", status: "queued", protocol: "SMPP" },
      },
      {
        input: ["carrier_pigeon", "Bob", "Hello"],
        expected: null,
      },
    ],
    hints: [
      "El patrón Factory desacopla la creación del objeto de su uso directo.",
      "Valida el canal solicitado y retorna la estructura correspondiente con su protocolo.",
    ],
  },

  // ──────────────────────────────────────────
  // 11. Adapter Pattern: Normalizador de Datos
  // ──────────────────────────────────────────
  {
    id: "adapter-data-normalizer",
    title: "Patrón Adapter: Adaptador de APIs de Empleo",
    difficulty: "medium",
    category: ["Patrones de Diseño", "Estructurales", "Refactoring"],
    patternObjective: "Adapter Pattern (GoF Estructural)",
    timeLimit: 20,
    description: `Crea una función adaptadora \`adaptJobOffer(rawJob, source)\` que transforme ofertas con estructuras dispares de diferentes portales a un modelo estándar:
\`{ id: string, title: string, company: string, location: string, remote: boolean, minSalary: number }\`

Fuentes soportadas:
1. **"linkedin"**: Recibe \`{ job_id, role_name, company_name, job_location, is_remote, pay_min }\`
2. **"indeed"**: Recibe \`{ id, title, employer, city, remote_work, salary_from }\`

Si la fuente no es reconocida, retorna \`null\`. Asegura que \`remote\` sea booleano y \`minSalary\` numérico (o \`0\` si falta).`,
    legacySpaghettiCode: `// ❌ Código Legacy con Incompatibilidad de Interfaces
// LinkedIn envía: role_name, job_location, pay_min
// Indeed envía: title, city, salary_from
// El cliente frontend explota si no recibe una interfaz unificada.`,
    examples: [
      {
        input: 'rawJob = { job_id: "101", role_name: "Frontend Dev", company_name: "Acme", job_location: "Remoto", is_remote: true, pay_min: 5000 }, source = "linkedin"',
        output: '{ id: "101", title: "Frontend Dev", company: "Acme", location: "Remoto", remote: true, minSalary: 5000 }',
        explanation: "El adaptador normaliza la nomenclatura de LinkedIn al formato estándar del sistema.",
      },
    ],
    starterCode: `function adaptJobOffer(rawJob, source) {
  // Implementa el Patrón Adapter aquí
  
}`,
    functionName: "adaptJobOffer",
    testCases: [
      {
        input: [
          { job_id: "lk-1", role_name: "React Developer", company_name: "Google", job_location: "Remote", is_remote: true, pay_min: 8000 },
          "linkedin",
        ],
        expected: { id: "lk-1", title: "React Developer", company: "Google", location: "Remote", remote: true, minSalary: 8000 },
      },
      {
        input: [
          { id: "ind-99", title: "Backend Engineer", employer: "Amazon", city: "Seattle", remote_work: false, salary_from: 10000 },
          "indeed",
        ],
        expected: { id: "ind-99", title: "Backend Engineer", company: "Amazon", location: "Seattle", remote: false, minSalary: 10000 },
      },
      {
        input: [{ id: "unk-1" }, "unknown_portal"],
        expected: null,
      },
    ],
    hints: [
      "El patrón Adapter convierte la interfaz de una clase o formato de datos en otra interfaz que el cliente espera.",
    ],
  },

  // ──────────────────────────────────────────
  // 12. Visitor Pattern: Auditoría de Portafolio
  // ──────────────────────────────────────────
  {
    id: "visitor-pattern-portfolio",
    title: "Patrón Visitor: Auditoría de Expediente y Métricas de Candidato",
    difficulty: "medium",
    category: ["Patrones de Diseño", "GoF Comportamental", "Refactoring", "SOLID"],
    patternObjective: "Visitor Pattern (GoF Comportamental)",
    timeLimit: 25,
    description: `Aplica el **Patrón Visitor** para desacoplar las operaciones analíticas sobre un portafolio heterogéneo de un candidato (entrevistas, retos de código y postulaciones) sin modificar la estructura de los datos.

Crea la función \`auditPortfolioWithVisitor(elements, visitorType)\`:
- Si \`visitorType === "seniority"\`:
  Calcula y retorna:
  \`{ avgTechnicalScore, codeChallengeAccuracy, totalApplications, readinessLevel }\`
  - \`avgTechnicalScore\`: promedio del \`score\` de todas las entrevistas (0 si no hay, redondeado a 1 decimal).
  - \`codeChallengeAccuracy\`: porcentaje de tests pasados \`(totalTestsPassed / totalTests) * 100\` redondeado a 1 decimal (0 si no hay).
  - \`totalApplications\`: cantidad de postulaciones de empleo.
  - \`readinessLevel\`:
    - \`"Senior"\` si \`avgTechnicalScore >= 80 && codeChallengeAccuracy >= 80\`
    - \`"Mid-Level"\` si \`avgTechnicalScore >= 60 && codeChallengeAccuracy >= 60\`
    - \`"Junior"\` en cualquier otro caso.
- Si \`visitorType === "blindspots"\`:
  Retorna un arreglo de alertas (strings):
  - Para entrevistas con \`score < 70\`: \`"Alerta: Rendimiento bajo en entrevista de \${role} (\${score}/100)"\`
  - Para retos de código donde \`testsPassed < totalTests\`: \`"Alerta: Pruebas incompletas en reto (\${testsPassed}/\${totalTests})"\`
  - Para postulaciones con \`status === "rejected"\`: \`"Alerta: Postulacion rechazada en \${company}"\`
- Si el tipo de visitante es desconocido, retorna \`null\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Visitor: Switch monolítico y violación de OCP
function auditPortfolioSpaghetti(elements, mode) {
  if (mode === "seniority") {
    let intScore = 0, intCount = 0, passed = 0, total = 0, apps = 0;
    for (const el of elements) {
      if (el.type === "interview") { intScore += el.score; intCount++; }
      else if (el.type === "code_challenge") { passed += el.testsPassed; total += el.totalTests; }
      else if (el.type === "job_application") { apps++; }
    }
  }
}`,
    examples: [
      {
        input: 'elements = [{ type: "interview", score: 85, role: "Backend Lead" }, { type: "code_challenge", testsPassed: 9, totalTests: 10 }, { type: "job_application", status: "interviewing", company: "Google" }], visitorType = "seniority"',
        output: '{ avgTechnicalScore: 85, codeChallengeAccuracy: 90, totalApplications: 1, readinessLevel: "Senior" }',
        explanation: "El visitante de Seniority recorre los elementos y computa el nivel acumulado.",
      },
    ],
    starterCode: `function auditPortfolioWithVisitor(elements, visitorType) {
  // Implementa el Patrón Visitor aquí
  
}`,
    functionName: "auditPortfolioWithVisitor",
    testCases: [
      {
        input: [
          [
            { type: "interview", score: 85, role: "Backend Lead" },
            { type: "code_challenge", testsPassed: 9, totalTests: 10 },
            { type: "job_application", status: "interviewing", company: "Google" },
          ],
          "seniority",
        ],
        expected: { avgTechnicalScore: 85, codeChallengeAccuracy: 90, totalApplications: 1, readinessLevel: "Senior" },
      },
      {
        input: [
          [
            { type: "interview", score: 65, role: "Frontend Dev" },
            { type: "code_challenge", testsPassed: 3, totalTests: 5 },
            { type: "job_application", status: "rejected", company: "Meta" },
          ],
          "blindspots",
        ],
        expected: [
          "Alerta: Rendimiento bajo en entrevista de Frontend Dev (65/100)",
          "Alerta: Pruebas incompletas en reto (3/5)",
          "Alerta: Postulacion rechazada en Meta",
        ],
      },
      {
        input: [[], "unknown_type"],
        expected: null,
      },
    ],
    hints: [
      "El patrón Visitor define operaciones sobre elementos de una estructura sin modificar sus clases.",
      "Crea un objeto visitante para 'seniority' y otro para 'blindspots' y delega la visita de cada elemento.",
    ],
  },

  // ──────────────────────────────────────────
  // 13. Builder Pattern: Fluent Interview Creator
  // ──────────────────────────────────────────
  {
    id: "builder-pattern-interview",
    title: "Patrón Builder: Constructor Fluido de Sesión de Entrevista",
    difficulty: "easy",
    category: ["Patrones de Diseño", "GoF Creacional", "Fluent API"],
    patternObjective: "Builder Pattern (GoF Creacional)",
    timeLimit: 20,
    description: `Aplica el **Patrón Builder** para simplificar la creación de objetos complejos \`InterviewSession\`.

Implementa la función \`buildInterviewSession(config)\`:
- Parámetro \`config\`: objeto con opciones de configuración:
  - \`role\`: string obligatorio. Si falta o es un string vacío, retorna \`null\`.
  - \`company\`: string opcional (por defecto \`"Confidential Tech Corp"\`).
  - \`seniority\`: string opcional (por defecto \`"Mid-Level"\`).
  - \`voiceMode\`: booleano opcional (por defecto \`true\`).
  - \`questionsLimit\`: número opcional entre 1 y 10 (por defecto \`5\`). Si se pasa un valor fuera de rango, ajústalo al límite correspondiente.
  - \`skills\`: array de strings opcional (por defecto \`["Problem Solving", "System Design"]\`). Si viene vacío, usa el valor por defecto.
- Retorna el objeto construido con la propiedad adicional \`readyForSimulation: true\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Builder: Telescoping Constructor con demasiados parámetros
function createInterviewTelescoping(role, company, seniority, voiceMode, limit, skills) {
  return { role, company, seniority, voiceMode, limit, skills };
}`,
    examples: [
      {
        input: 'config = { role: "Frontend Developer" }',
        output: '{ role: "Frontend Developer", company: "Confidential Tech Corp", seniority: "Mid-Level", voiceMode: true, questionsLimit: 5, skills: ["Problem Solving", "System Design"], readyForSimulation: true }',
        explanation: "Aplica los valores por defecto ante la ausencia de campos opcionales.",
      },
    ],
    starterCode: `function buildInterviewSession(config) {
  // Implementa el Patrón Builder aquí
  
}`,
    functionName: "buildInterviewSession",
    testCases: [
      {
        input: [{ role: "Backend Engineer", company: "Stripe", seniority: "Senior", voiceMode: false, questionsLimit: 8, skills: ["Go", "PostgreSQL"] }],
        expected: { role: "Backend Engineer", company: "Stripe", seniority: "Senior", voiceMode: false, questionsLimit: 8, skills: ["Go", "PostgreSQL"], readyForSimulation: true },
      },
      {
        input: [{ role: "Frontend Developer" }],
        expected: { role: "Frontend Developer", company: "Confidential Tech Corp", seniority: "Mid-Level", voiceMode: true, questionsLimit: 5, skills: ["Problem Solving", "System Design"], readyForSimulation: true },
      },
      {
        input: [{ role: "" }],
        expected: null,
      },
      {
        input: [{ role: "AI Engineer", questionsLimit: 20 }],
        expected: { role: "AI Engineer", company: "Confidential Tech Corp", seniority: "Mid-Level", voiceMode: true, questionsLimit: 10, skills: ["Problem Solving", "System Design"], readyForSimulation: true },
      },
    ],
    hints: [
      "El patrón Builder separa la construcción de un objeto complejo de su representación final.",
      "Valida primero la existencia del campo obligatorio 'role'.",
    ],
  },

  // ──────────────────────────────────────────
  // 14. Mediator Pattern: Orquestador de Eventos de Carrera
  // ──────────────────────────────────────────
  {
    id: "mediator-career-workflow",
    title: "Patrón Mediator: Desacoplamiento de Eventos entre Módulos",
    difficulty: "medium",
    category: ["Patrones de Diseño", "GoF Comportamental", "Event Bus"],
    patternObjective: "Mediator Pattern (GoF Comportamental)",
    timeLimit: 25,
    description: `Aplica el **Patrón Mediator** para centralizar la comunicación entre subsistemas independientes (Entrevistas, Postulaciones y Analítica).

Implementa la función \`dispatchMediatorEvent(eventName, payload)\`:
- Evento \`"INTERVIEW_EVALUATED"\`:
  - Recibe payload: \`{ interviewId, company, score, cefrLevel }\`.
  - Acción del mediador:
    - Evalúa alerta de puntos ciegos: \`blindspotAlert = score < 70 || ["A1", "A2", "B1"].includes(cefrLevel)\`.
    - Retorna: \`{ handled: true, event: "INTERVIEW_EVALUATED", interviewFinalized: true, notes: "Score: " + score + "/100, CEFR: " + cefrLevel, blindspotAlert }\`.
- Evento \`"APPLICATION_STATUS_CHANGED"\`:
  - Recibe payload: \`{ applicationId, newStatus }\`.
  - Retorna: \`{ handled: true, event: "APPLICATION_STATUS_CHANGED", applicationId, newStatus, autoSyncDashboard: true }\`.
- Cualquier otro evento:
  - Retorna: \`{ handled: false, error: "UNKNOWN_EVENT" }\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Mediator: Comunicación acoplada todos con todos (N*M dependencias)
function onInterviewDone(interview, jobsModule, analyticsModule) {
  jobsModule.updateApplication(interview.company);
  analyticsModule.trackMetric(interview.score);
}`,
    examples: [
      {
        input: 'eventName = "INTERVIEW_EVALUATED", payload = { interviewId: "int-1", company: "Amazon", score: 85, cefrLevel: "C1" }',
        output: '{ handled: true, event: "INTERVIEW_EVALUATED", interviewFinalized: true, notes: "Score: 85/100, CEFR: C1", blindspotAlert: false }',
        explanation: "El mediador coordina la finalización y la detección de puntos ciegos sin llamadas directas entre módulos.",
      },
    ],
    starterCode: `function dispatchMediatorEvent(eventName, payload) {
  // Implementa el Patrón Mediator aquí
  
}`,
    functionName: "dispatchMediatorEvent",
    testCases: [
      {
        input: ["INTERVIEW_EVALUATED", { interviewId: "int-101", company: "Amazon", score: 85, cefrLevel: "C1" }],
        expected: { handled: true, event: "INTERVIEW_EVALUATED", interviewFinalized: true, notes: "Score: 85/100, CEFR: C1", blindspotAlert: false },
      },
      {
        input: ["INTERVIEW_EVALUATED", { interviewId: "int-102", company: "Uber", score: 62, cefrLevel: "B1" }],
        expected: { handled: true, event: "INTERVIEW_EVALUATED", interviewFinalized: true, notes: "Score: 62/100, CEFR: B1", blindspotAlert: true },
      },
      {
        input: ["APPLICATION_STATUS_CHANGED", { applicationId: "app-5", newStatus: "offered" }],
        expected: { handled: true, event: "APPLICATION_STATUS_CHANGED", applicationId: "app-5", newStatus: "offered", autoSyncDashboard: true },
      },
      {
        input: ["INVALID_EVENT", {}],
        expected: { handled: false, error: "UNKNOWN_EVENT" },
      },
    ],
    hints: [
      "El patrón Mediator encapsula cómo interactúan un conjunto de objetos para promover el bajo acoplamiento.",
      "Usa una estructura de despacho basada en el nombre del evento.",
    ],
  },

  // ──────────────────────────────────────────
  // 15. Observer Pattern: Suscripción a Eventos de Empleo
  // ──────────────────────────────────────────
  {
    id: "observer-application-events",
    title: "Patrón Observer: Notificador Reactivo de Cambios de Postulación",
    difficulty: "medium",
    category: ["Patrones de Diseño", "GoF Comportamental", "Event-Driven"],
    patternObjective: "Observer Pattern (GoF Comportamental)",
    timeLimit: 20,
    description: `Aplica el **Patrón Observer** (Publicador/Suscriptor) para notificar a observadores registrados cuando ocurren cambios en las postulaciones de un candidato.

Implementa la función \`runObserverWorkflow(subscriptions, eventsToPublish)\`:
- \`subscriptions\`: arreglo de \`{ event: string, observerName: string }\` (ej: \`[{ event: "OFFER", observerName: "Email" }]\`).
- \`eventsToPublish\`: arreglo de \`{ event: string, payload: { company: string, role: string } }\`.
- Para cada evento publicado, cada observador suscrito a dicho evento genera un mensaje con el formato:
  \`"[\${observerName}] Evento \${event} recibido para \${role} en \${company}"\`
- Retorna el arreglo con todos los mensajes emitidos en orden cronológico. Si ningún observador estaba suscrito, retorna \`[]\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Observer: Notificaciones cableadas en el servicio
function updateJobStatus(app, newStatus) {
  sendEmailNotification(app);
  sendTelegramMessage(app);
  pushToAnalytics(app);
}`,
    examples: [
      {
        input: 'subscriptions = [{ event: "OFFER", observerName: "Slack" }], events = [{ event: "OFFER", payload: { company: "Google", role: "Dev" } }]',
        output: '["[Slack] Evento OFFER recibido para Dev en Google"]',
        explanation: "Slack estaba suscrito a OFFER y recibió la notificación con su payload.",
      },
    ],
    starterCode: `function runObserverWorkflow(subscriptions, eventsToPublish) {
  // Implementa el Patrón Observer aquí
  
}`,
    functionName: "runObserverWorkflow",
    testCases: [
      {
        input: [
          [
            { event: "OFFER_RECEIVED", observerName: "EmailNotifier" },
            { event: "OFFER_RECEIVED", observerName: "TelegramBot" },
          ],
          [
            { event: "OFFER_RECEIVED", payload: { company: "Google", role: "Software Engineer" } },
          ],
        ],
        expected: [
          "[EmailNotifier] Evento OFFER_RECEIVED recibido para Software Engineer en Google",
          "[TelegramBot] Evento OFFER_RECEIVED recibido para Software Engineer en Google",
        ],
      },
      {
        input: [
          [{ event: "REJECTED", observerName: "Analytics" }],
          [{ event: "ACCEPTED", payload: { company: "Vercel", role: "Frontend Lead" } }],
        ],
        expected: [],
      },
      {
        input: [
          [
            { event: "INTERVIEW_READY", observerName: "CalendarSync" },
            { event: "INTERVIEW_READY", observerName: "PushNotification" },
          ],
          [
            { event: "INTERVIEW_READY", payload: { company: "GitLab", role: "DevOps Engineer" } },
          ],
        ],
        expected: [
          "[CalendarSync] Evento INTERVIEW_READY recibido para DevOps Engineer en GitLab",
          "[PushNotification] Evento INTERVIEW_READY recibido para DevOps Engineer en GitLab",
        ],
      },
    ],
    hints: [
      "El patrón Observer define una dependencia uno-a-muchos entre objetos para que cuando uno cambie de estado, todos sus dependientes sean notificados.",
      "Mapea los suscriptores por el nombre del evento.",
    ],
  },

  // ──────────────────────────────────────────
  // 16. Decorator Pattern: Middleware de Peticiones
  // ──────────────────────────────────────────
  {
    id: "decorator-api-requests",
    title: "Patrón Decorator: Enriquecimiento Dinámico de Peticiones API",
    difficulty: "easy",
    category: ["Patrones de Diseño", "GoF Estructural", "Middleware"],
    patternObjective: "Decorator Pattern (GoF Estructural)",
    timeLimit: 15,
    description: `Aplica el **Patrón Decorator** para envolver y enriquecer dinámicamente peticiones HTTP con capas de funcionalidad sin alterar la petición base.

Implementa la función \`executeDecoratedRequest(baseRequest, decorators)\`:
- \`baseRequest\`: objeto con \`{ url: string, method: string, headers?: Record<string, string> }\`.
- \`decorators\`: arreglo con los decoradores a aplicar en orden:
  - \`"auth"\`: añade el header \`"Authorization": "Bearer devcareer_secure_token"\`.
  - \`"compression"\`: añade el header \`"Accept-Encoding": "gzip, br"\`.
  - \`"requestId"\`: añade el header \`"X-Correlation-ID": "corr-uuid-999"\`.
- La función debe retornar la petición con los headers resultantes combinados. Si un decorador no es reconocido, se ignora. Asegúrate de preservar los headers originales si existían.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Decorator: Modificación directa de argumentos y código disperso
function sendApi(req, withAuth, withGzip, withId) {
  if (withAuth) req.headers.Authorization = "Bearer token";
  if (withGzip) req.headers["Accept-Encoding"] = "gzip";
}`,
    examples: [
      {
        input: 'baseRequest = { url: "/jobs", method: "GET" }, decorators = ["auth"]',
        output: '{ url: "/jobs", method: "GET", headers: { "Authorization": "Bearer devcareer_secure_token" } }',
        explanation: "El decorador auth inyecta el token en las cabeceras.",
      },
    ],
    starterCode: `function executeDecoratedRequest(baseRequest, decorators) {
  // Implementa el Patrón Decorator aquí
  
}`,
    functionName: "executeDecoratedRequest",
    testCases: [
      {
        input: [
          { url: "/api/interview", method: "POST", headers: { "Content-Type": "application/json" } },
          ["auth", "compression"],
        ],
        expected: {
          url: "/api/interview",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer devcareer_secure_token",
            "Accept-Encoding": "gzip, br",
          },
        },
      },
      {
        input: [
          { url: "/api/profile", method: "GET" },
          ["requestId"],
        ],
        expected: {
          url: "/api/profile",
          method: "GET",
          headers: {
            "X-Correlation-ID": "corr-uuid-999",
          },
        },
      },
      {
        input: [
          { url: "/health", method: "GET" },
          [],
        ],
        expected: {
          url: "/health",
          method: "GET",
          headers: {},
        },
      },
    ],
    hints: [
      "El patrón Decorator adjunta responsabilidades adicionales a un objeto de forma dinámica.",
      "Itera sobre la lista de decoradores componiendo o mutando de forma segura los headers del objeto.",
    ],
  },

  // ──────────────────────────────────────────
  // 17. Abstract Factory: Familia de Infraestructura Cloud
  // ──────────────────────────────────────────
  {
    id: "abstract-factory-infra",
    title: "Patrón Abstract Factory: Familia de Infraestructura Cloud vs Local",
    difficulty: "medium",
    category: ["Patrones de Diseño", "GoF Creacional", "Cloud Architecture"],
    patternObjective: "Abstract Factory (GoF Creacional)",
    timeLimit: 20,
    description: `Aplica el **Patrón Abstract Factory** para crear familias completas de servicios de infraestructura relacionados sin especificar sus clases concretas.

Implementa la función \`createCloudInfrastructure(environment)\`:
- Para \`environment === "aws"\`:
  - \`database\`: \`{ service: "DynamoDB", table: "devcareer_data", encryption: "KMS" }\`
  - \`storage\`: \`{ service: "S3", bucket: "devcareer-cvs-bucket", region: "us-east-1" }\`
  - \`telemetry\`: \`{ service: "CloudWatch", metricNamespace: "DevCareer/Prod" }\`
- Para \`environment === "local"\`:
  - \`database\`: \`{ service: "SQLite/Memory", table: "devcareer_memory.db", encryption: "none" }\`
  - \`storage\`: \`{ service: "LocalStorageFS", bucket: "/tmp/devcareer_uploads", region: "localhost" }\`
  - \`telemetry\`: \`{ service: "ConsoleLogger", metricNamespace: "DevCareer/Dev" }\`
- Si el entorno no es soportado, retorna \`null\`.
- Retorna el objeto unificado \`{ environment, database, storage, telemetry }\`.`,
    legacySpaghettiCode: `// ❌ Código Legacy sin Abstract Factory: Instanciación cruzada e incoherente
function getStorageBad(env) {
  if (env === "aws") return new S3();
  return new LocalFS();
}`,
    examples: [
      {
        input: 'environment = "aws"',
        output: '{ environment: "aws", database: { service: "DynamoDB", ... }, storage: { ... }, telemetry: { ... } }',
        explanation: "La fábrica de AWS produce la familia coordinada de servicios compatibles.",
      },
    ],
    starterCode: `function createCloudInfrastructure(environment) {
  // Implementa el Patrón Abstract Factory aquí
  
}`,
    functionName: "createCloudInfrastructure",
    testCases: [
      {
        input: ["aws"],
        expected: {
          environment: "aws",
          database: { service: "DynamoDB", table: "devcareer_data", encryption: "KMS" },
          storage: { service: "S3", bucket: "devcareer-cvs-bucket", region: "us-east-1" },
          telemetry: { service: "CloudWatch", metricNamespace: "DevCareer/Prod" },
        },
      },
      {
        input: ["local"],
        expected: {
          environment: "local",
          database: { service: "SQLite/Memory", table: "devcareer_memory.db", encryption: "none" },
          storage: { service: "LocalStorageFS", bucket: "/tmp/devcareer_uploads", region: "localhost" },
          telemetry: { service: "ConsoleLogger", metricNamespace: "DevCareer/Dev" },
        },
      },
      {
        input: ["gcp"],
        expected: null,
      },
    ],
    hints: [
      "Abstract Factory proporciona una interfaz para crear familias de objetos relacionados o dependientes sin especificar sus clases concretas.",
      "Usa una fábrica concreta para 'aws' y otra para 'local'.",
    ],
  },

  // ──────────────────────────────────────────
  // 18. LRU Cache Simulator
  // ──────────────────────────────────────────
  {
    id: "lru-cache-simulator",
    title: "Caché LRU: Desalojo por Menor Uso Reciente",
    difficulty: "hard",
    category: ["Estructuras de Datos", "Algoritmos", "Hash Map", "Cache"],
    timeLimit: 30,
    description: `Diseña una estructura de datos que siga las restricciones de una caché **LRU (Least Recently Used)**.

Implementa la función \`simulateLruCache(capacity, operations)\`:
- \`capacity\`: número entero positivo indicando la capacidad máxima de la caché.
- \`operations\`: arreglo de comandos a ejecutar secuencialmente:
  - \`["put", key, value]\`: inserta o actualiza el valor de la clave. Si la cantidad de claves supera la capacidad, desaloja la clave menos recientemente usada.
  - \`["get", key]\`: retorna el valor de la clave si existe y la marca como recientemente usada; si no existe, retorna \`-1\`.
- La función debe retornar un arreglo con los resultados de todas las operaciones \`"get"\` en el orden en que ocurrieron.`,
    examples: [
      {
        input: 'capacity = 2, operations = [["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2]]',
        output: '[1, -1]',
        explanation: "put(1,1), put(2,2). get(1)->1. put(3,3) desaloja la clave 2 porque 1 fue usada recientemente. get(2)->-1.",
      },
    ],
    starterCode: `function simulateLruCache(capacity, operations) {
  // Escribe tu solución aquí
  
}`,
    functionName: "simulateLruCache",
    testCases: [
      {
        input: [
          2,
          [
            ["put", 1, 1],
            ["put", 2, 2],
            ["get", 1],
            ["put", 3, 3],
            ["get", 2],
            ["put", 4, 4],
            ["get", 1],
            ["get", 3],
            ["get", 4],
          ],
        ],
        expected: [1, -1, -1, 3, 4],
      },
      {
        input: [
          1,
          [
            ["put", "a", 100],
            ["get", "a"],
            ["put", "b", 200],
            ["get", "a"],
            ["get", "b"],
          ],
        ],
        expected: [100, -1, 200],
      },
    ],
    hints: [
      "En JavaScript, un objeto Map mantiene el orden de inserción de sus claves.",
      "Cuando se accede a un elemento con 'get' o se actualiza con 'put', puedes eliminarlo y volverlo a insertar al final para mantener el orden de recencia.",
      "Para desalojar el elemento más antiguo, toma la primera clave con map.keys().next().value.",
    ],
  },

  // ──────────────────────────────────────────
  // 19. Topological Build Order
  // ──────────────────────────────────────────
  {
    id: "topological-build-order",
    title: "Orden Topológico de Compilación de Módulos (Grafos)",
    difficulty: "medium",
    category: ["Grafos", "Algoritmos", "Topological Sort", "System Architecture"],
    timeLimit: 25,
    description: `Dado un arreglo de nombres de proyectos y un arreglo de pares de dependencias directas \`[target, dependency]\` (donde \`dependency\` debe compilarse **antes** que \`target\`), determina un orden seguro de compilación.

Implementa la función \`findBuildOrder(projects, dependencies)\`:
- Si se puede compilar todo sin conflictos, retorna el arreglo con los nombres en el orden de compilación adecuado.
- En caso de existir múltiples órdenes válidos con la misma prioridad, desempata en orden alfabético.
- Si existe una dependencia circular (ciclo) que haga imposible la compilación, retorna \`null\`.`,
    examples: [
      {
        input: 'projects = ["a", "b", "c"], dependencies = [["b", "a"], ["c", "b"]]',
        output: '["a", "b", "c"]',
        explanation: "b depende de a, c depende de b, por lo tanto el orden es a -> b -> c.",
      },
    ],
    starterCode: `function findBuildOrder(projects, dependencies) {
  // Escribe tu solución aquí
  
}`,
    functionName: "findBuildOrder",
    testCases: [
      {
        input: [
          ["a", "b", "c", "d"],
          [
            ["b", "a"],
            ["c", "b"],
            ["d", "c"],
          ],
        ],
        expected: ["a", "b", "c", "d"],
      },
      {
        input: [
          ["a", "b"],
          [
            ["a", "b"],
            ["b", "a"],
          ],
        ],
        expected: null,
      },
      {
        input: [
          ["core", "auth", "api", "web"],
          [
            ["auth", "core"],
            ["api", "core"],
            ["api", "auth"],
            ["web", "api"],
          ],
        ],
        expected: ["core", "auth", "api", "web"],
      },
    ],
    hints: [
      "Calcula el grado de entrada (in-degree) de cada nodo contando cuántas dependencias tiene pendientes.",
      "Usa el algoritmo de Kahn para procesar sucesivamente los nodos con grado 0.",
    ],
  },
];

export function getProblemById(id: string): Problem | undefined {
  const staticProblem = PROBLEMS.find((p) => p.id === id);
  if (staticProblem) return staticProblem;

  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("devcareer_custom_problems");
      if (stored) {
        const customProblems: Problem[] = JSON.parse(stored);
        const customFound = customProblems.find((p) => p.id === id);
        if (customFound) return customFound;
      }
    } catch (e) {
      console.error("Error reading custom problems from localStorage", e);
    }
  }

  return undefined;
}

export function getAllProblems(): Problem[] {
  let custom: Problem[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("devcareer_custom_problems");
      if (stored) {
        custom = JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading custom problems", e);
    }
  }
  return [...custom, ...PROBLEMS];
}

export {
  generateJobCustomChallenge,
  saveCustomProblem,
  getCustomProblems,
} from "./jobChallengeGenerator";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
  hard: "Difícil",
};

export const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  easy: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  hard: "text-red-400 bg-red-400/10 border-red-400/20",
};

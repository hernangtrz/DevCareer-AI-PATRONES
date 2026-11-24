// frontend/lib/jobChallengeGenerator.ts
// Generador dinámico de retos técnicos de código personalizados según la oferta laboral

import { Problem, Difficulty } from "./problems";

export interface GenerateJobChallengeInput {
  id?: string;
  title: string;
  company: string;
  requiredSkills?: string[];
  seniority?: string;
  description?: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Genera un reto de código interactivo a la medida de la vacante, empresa y tecnologías requeridas.
 */
export function generateJobCustomChallenge(job: GenerateJobChallengeInput): Problem {
  const company = job.company || "Tech Company";
  const title = job.title || "Software Engineer";
  const seniority = (job.seniority || "Mid-Level").toLowerCase();
  const skills = job.requiredSkills && job.requiredSkills.length > 0
    ? job.requiredSkills
    : ["JavaScript", "TypeScript", "Node.js"];

  const skillsText = skills.join(" ").toLowerCase();
  const titleText = title.toLowerCase();

  // Determinar dificultad según seniority
  let difficulty: Difficulty = "medium";
  let timeLimit = 25;
  if (seniority.includes("junior") || seniority.includes("trainee") || seniority.includes("entry")) {
    difficulty = "easy";
    timeLimit = 20;
  } else if (seniority.includes("senior") || seniority.includes("lead") || seniority.includes("principal") || seniority.includes("architect")) {
    difficulty = "hard";
    timeLimit = 35;
  }

  // Detección del perfil técnico
  const isFrontend =
    skillsText.includes("react") ||
    skillsText.includes("next") ||
    skillsText.includes("vue") ||
    skillsText.includes("angular") ||
    skillsText.includes("frontend") ||
    titleText.includes("frontend") ||
    titleText.includes("ui");

  const isDevOpsCloud =
    skillsText.includes("devops") ||
    skillsText.includes("cloud") ||
    skillsText.includes("aws") ||
    skillsText.includes("docker") ||
    skillsText.includes("kubernetes") ||
    skillsText.includes("ci/cd") ||
    skillsText.includes("pipeline") ||
    titleText.includes("devops") ||
    titleText.includes("cloud") ||
    titleText.includes("sre");

  const isDataAI =
    skillsText.includes("python") ||
    skillsText.includes("data") ||
    skillsText.includes("ai") ||
    skillsText.includes("ml") ||
    skillsText.includes("sql") ||
    skillsText.includes("analytics") ||
    titleText.includes("data") ||
    titleText.includes("ai") ||
    titleText.includes("machine learning");

  const challengeId = `job-${slugify(company)}-${slugify(title)}`;

  // ─────────────────────────────────────────────────────────────
  // 1. Perfil Frontend: Normalizador de Parámetros URL y Estado
  // ─────────────────────────────────────────────────────────────
  if (isFrontend) {
    return {
      id: challengeId,
      title: `${company}: Serializador Canónico de Filtros de Búsqueda UI`,
      difficulty,
      category: [...skills.slice(0, 3), "Frontend", "UI State", `${company} Technical Challenge`],
      timeLimit,
      patternObjective: "Builder & Strategy Pattern (Serialización Canónica)",
      description: `### Contexto de Negocio en **${company}**
Como **${title}**, el equipo de producto requiere un componente robusto para sincronizar los filtros interactivos del catálogo con los query parameters de la URL.

### Requerimiento Técnico
Implementa la función \`buildCanonicalQueryParams(filters)\` que reciba un objeto clave-valor con filtros y genere un query string canónico y limpio:

1. **Omisión de valores nulos o vacíos**: Claves con \`null\`, \`undefined\` o string vacío \`""\` deben ser descartadas.
2. **Normalización de arreglos**: Si un valor es un array de strings:
   - Ordena los elementos alfabéticamente.
   - Únelos mediante coma \`,\`.
   - Si el array está vacío, omite la clave.
3. **Conversión de tipos**: Valores booleanos y numéricos deben convertirse a su representación en string.
4. **Orden canónico**: Las claves resultantes deben estar ordenadas alfabéticamente.
5. **Formato**: Retorna el string sin el signo de interrogación inicial \`?\` (ej: \`"page=1&remote=true"\`). Si no hay parámetros válidos, retorna string vacío \`""\`.`,
      examples: [
        {
          input: 'filters = { role: "engineer", page: 1, remote: true, empty: "", tags: ["react", "typescript"], ghost: null }',
          output: '"page=1&remote=true&role=engineer&tags=react,typescript"',
          explanation: "Se omiten empty y ghost, se ordenan las claves alfabéticamente y los tags se unen ordenados.",
        },
        {
          input: 'filters = { company: "Google", tags: [] }',
          output: '"company=Google"',
          explanation: "El arreglo vacío se descarta.",
        },
      ],
      starterCode: `function buildCanonicalQueryParams(filters) {
  // Escribe tu solución aquí
  
}`,
      functionName: "buildCanonicalQueryParams",
      testCases: [
        {
          input: [{ role: "engineer", page: 1, remote: true, empty: "", tags: ["react", "typescript"], ghost: null }],
          expected: "page=1&remote=true&role=engineer&tags=react,typescript",
          label: "Filtros mixtos con tags y valores nulos",
        },
        {
          input: [{ company: company, tags: [] }],
          expected: `company=${company}`,
          label: "Filtrado con array vacío omitido",
        },
        {
          input: [{ active: false, count: 0, sort: "desc" }],
          expected: "active=false&count=0&sort=desc",
          label: "Valores falsy válidos (false y 0 deben conservarse)",
        },
        {
          input: [{ emptyStr: "", undef: undefined, nil: null }],
          expected: "",
          label: "Objeto sin campos válidos retorna string vacío",
        },
      ],
      hints: [
        "Usa Object.entries() para filtrar los pares [key, value] válidos.",
        "Asegúrate de no omitir valores booleanos (como false) ni números (como 0).",
        "Aplica .sort() a las claves antes de construir el query string final.",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Perfil DevOps / Cloud: Orquestador y Resolución Topológica
  // ─────────────────────────────────────────────────────────────
  if (isDevOpsCloud) {
    return {
      id: challengeId,
      title: `${company}: Validador de Dependencias y Orden de Ejecución CI/CD`,
      difficulty,
      category: [...skills.slice(0, 3), "DevOps", "CI/CD", `${company} Technical Challenge`],
      timeLimit,
      patternObjective: "Topological Sorting & Dependency Injection",
      description: `### Contexto de Negocio en **${company}**
Para la posición de **${title}**, el motor de integración y despliegue continuo (CI/CD) debe ejecutar las etapas de build, test y deploy respetando sus dependencias mutuas.

### Requerimiento Técnico
Implementa la función \`resolvePipelineExecutionOrder(steps)\`:
- Cada paso tiene la forma \`{ name: string, dependsOn: string[] }\`.
- Determina el orden seguro de ejecución asegurando que cada paso solo se ejecute cuando todas sus dependencias ya hayan finalizado.
- En caso de pasos independientes disponibles simultáneamente, prioriza orden alfabético por su \`name\`.
- Si se detecta un ciclo (dependencia circular) o una dependencia inexistente, retorna \`null\`.
- Retorna un arreglo de strings con los nombres en orden de ejecución.`,
      examples: [
        {
          input: 'steps = [{ name: "lint", dependsOn: [] }, { name: "test", dependsOn: ["lint"] }, { name: "build", dependsOn: ["lint"] }, { name: "deploy", dependsOn: ["build", "test"] }]',
          output: '["lint", "build", "test", "deploy"]',
          explanation: "lint se ejecuta primero; build y test dependen de lint (build va primero por orden alfabético); deploy al final.",
        },
      ],
      starterCode: `function resolvePipelineExecutionOrder(steps) {
  // Escribe tu solución aquí
  
}`,
      functionName: "resolvePipelineExecutionOrder",
      testCases: [
        {
          input: [
            [
              { name: "lint", dependsOn: [] },
              { name: "test", dependsOn: ["lint"] },
              { name: "build", dependsOn: ["lint"] },
              { name: "deploy", dependsOn: ["build", "test"] },
            ],
          ],
          expected: ["lint", "build", "test", "deploy"],
          label: "Pipeline estándar con dependencias múltiples",
        },
        {
          input: [
            [
              { name: "stepA", dependsOn: ["stepB"] },
              { name: "stepB", dependsOn: ["stepA"] },
            ],
          ],
          expected: null,
          label: "Detección de ciclo circular retorna null",
        },
        {
          input: [
            [
              { name: "package", dependsOn: ["compile"] },
            ],
          ],
          expected: null,
          label: "Dependencia inexistente retorna null",
        },
      ],
      hints: [
        "Calcula el grado de entrada (in-degree) de cada nodo en el grafo dirigido.",
        "Usa una cola o array con los nodos de grado 0 y ordénalos alfabéticamente.",
        "Si la cantidad de pasos resueltos no coincide con la cantidad total, existe un ciclo.",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Perfil Datos / IA: Agregador de Series Temporales en Buckets
  // ─────────────────────────────────────────────────────────────
  if (isDataAI) {
    return {
      id: challengeId,
      title: `${company}: Agregador de Telemetría y Métricas en Ventana Móvil`,
      difficulty,
      category: [...skills.slice(0, 3), "Data Engineering", "Algorithms", `${company} Technical Challenge`],
      timeLimit,
      patternObjective: "MapReduce / Window Aggregation Pattern",
      description: `### Contexto de Negocio en **${company}**
En tu rol como **${title}**, el pipeline de ingesta procesa millones de lecturas de telemetría de modelos y servicios en tiempo real.

### Requerimiento Técnico
Implementa la función \`aggregateMetricsBuckets(metrics, bucketSizeSeconds)\`:
- \`metrics\`: Arreglo de eventos \`{ timestamp: number, value: number }\`.
- \`bucketSizeSeconds\`: Tamaño del intervalo en segundos.
- Agrupa los puntos en ventanas donde \`bucketStart = Math.floor(timestamp / bucketSizeSeconds) * bucketSizeSeconds\`.
- Para cada bucket (ordenado de menor a mayor por \`bucketStart\`), calcula:
  \`{ bucketStart: number, count: number, min: number, max: number, avg: number }\`.
- Redondea \`avg\` a 2 decimales usando \`Number(avg.toFixed(2))\`.
- Retorna el arreglo de objetos resumidos. Si el arreglo de métricas está vacío, retorna \`[]\`.`,
      examples: [
        {
          input: 'metrics = [{ timestamp: 10, value: 100 }, { timestamp: 25, value: 200 }, { timestamp: 70, value: 50 }], bucketSizeSeconds = 60',
          output: '[{ bucketStart: 0, count: 2, min: 100, max: 200, avg: 150 }, { bucketStart: 60, count: 1, min: 50, max: 50, avg: 50 }]',
          explanation: "Los dos primeros caen en [0, 60), el tercero cae en [60, 120).",
        },
      ],
      starterCode: `function aggregateMetricsBuckets(metrics, bucketSizeSeconds) {
  // Escribe tu solución aquí
  
}`,
      functionName: "aggregateMetricsBuckets",
      testCases: [
        {
          input: [
            [
              { timestamp: 10, value: 100 },
              { timestamp: 25, value: 200 },
              { timestamp: 70, value: 50 },
            ],
            60,
          ],
          expected: [
            { bucketStart: 0, count: 2, min: 100, max: 200, avg: 150 },
            { bucketStart: 60, count: 1, min: 50, max: 50, avg: 50 },
          ],
          label: "Agrupación en dos intervalos de 60 segundos",
        },
        {
          input: [[], 60],
          expected: [],
          label: "Métricas vacías retorna arreglo vacío",
        },
        {
          input: [
            [
              { timestamp: 5, value: 10 },
              { timestamp: 15, value: 20 },
              { timestamp: 20, value: 15 },
            ],
            30,
          ],
          expected: [{ bucketStart: 0, count: 3, min: 10, max: 20, avg: 15 }],
          label: "Múltiples valores en un solo intervalo",
        },
      ],
      hints: [
        "Usa un Map con bucketStart como clave para acumular sumas, conteos, mínimos y máximos.",
        "Convierte los valores del Map en array y ordénalo por bucketStart.",
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Perfil Backend / Microservicios: Limitador de Tasa API (Rate Limiter)
  // ─────────────────────────────────────────────────────────────
  return {
    id: challengeId,
    title: `${company}: Control de Concurrencia y Rate Limiter API`,
    difficulty,
    category: [...skills.slice(0, 3), "Backend", "API Security", `${company} Technical Challenge`],
    timeLimit,
    patternObjective: "Sliding Window Counter & Token Bucket Pattern",
    description: `### Contexto de Negocio en **${company}**
Como **${title}**, una de tus responsabilidades críticas es proteger los endpoints de la API contra sobrecargas y abusos mediante un limitador de peticiones por usuario.

### Requerimiento Técnico
Implementa la función \`validateApiRateLimit(requests, maxAllowedPerWindow, windowSeconds)\`:
- \`requests\`: Arreglo de peticiones \`{ id: string, timestamp: number, userId: string }\` ordenadas cronológicamente por \`timestamp\`.
- \`maxAllowedPerWindow\`: Número máximo de peticiones permitidas por usuario dentro de una ventana de tiempo móvil.
- \`windowSeconds\`: Tamaño de la ventana en segundos.
- Para cada petición, se considera válida si en el intervalo cerrado \`[peticion.timestamp - windowSeconds, peticion.timestamp]\`, las peticiones **previamente aprobadas** del mismo usuario no superan el límite permitido \`< maxAllowedPerWindow\`.
- Retorna un arreglo con los \`id\` de todas las peticiones aprobadas en el orden en que fueron procesadas.`,
    examples: [
      {
        input: 'requests = [{ id: "r1", timestamp: 1, userId: "u1" }, { id: "r2", timestamp: 3, userId: "u1" }, { id: "r3", timestamp: 5, userId: "u1" }], max = 2, window = 10',
        output: '["r1", "r2"]',
        explanation: "La tercera petición excede el máximo de 2 peticiones en la ventana de 10 segundos.",
      },
      {
        input: 'requests = [{ id: "r1", timestamp: 1, userId: "u1" }, { id: "r2", timestamp: 2, userId: "u2" }, { id: "r3", timestamp: 15, userId: "u1" }], max = 1, window = 10',
        output: '["r1", "r2", "r3"]',
        explanation: "u1 y u2 son usuarios distintos; en t=15, la ventana [5, 15] para u1 solo tiene a r3.",
      },
    ],
    starterCode: `function validateApiRateLimit(requests, maxAllowedPerWindow, windowSeconds) {
  // Escribe tu solución aquí
  
}`,
    functionName: "validateApiRateLimit",
    testCases: [
      {
        input: [
          [
            { id: "req-1", timestamp: 1, userId: "user-A" },
            { id: "req-2", timestamp: 3, userId: "user-A" },
            { id: "req-3", timestamp: 5, userId: "user-A" },
          ],
          2,
          10,
        ],
        expected: ["req-1", "req-2"],
        label: "Usuario supera la cuota máxima en la misma ventana",
      },
      {
        input: [
          [
            { id: "req-1", timestamp: 1, userId: "user-A" },
            { id: "req-2", timestamp: 2, userId: "user-B" },
            { id: "req-3", timestamp: 3, userId: "user-A" },
            { id: "req-4", timestamp: 15, userId: "user-A" },
          ],
          2,
          10,
        ],
        expected: ["req-1", "req-2", "req-4"],
        label: "Ventana deslizante expira peticiones antiguas",
      },
      {
        input: [[], 3, 5],
        expected: [],
        label: "Sin peticiones retorna arreglo vacío",
      },
    ],
    hints: [
      "Mantén un registro (ej. Map) de los timestamps de las peticiones aprobadas por cada userId.",
      "Para cada petición, filtra los timestamps del usuario que caigan fuera de [req.timestamp - windowSeconds, req.timestamp].",
      "Si el tamaño de los timestamps aprobados dentro de la ventana es menor a maxAllowedPerWindow, aprueba la petición y guarda su timestamp.",
    ],
  };
}

/**
 * Guarda un reto personalizado en localStorage para que el editor Monaco y el banco de problemas lo reconozcan.
 */
export function saveCustomProblem(problem: Problem): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("devcareer_custom_problems");
    const existing: Problem[] = raw ? JSON.parse(raw) : [];
    const index = existing.findIndex((p) => p.id === problem.id);
    if (index >= 0) {
      existing[index] = problem;
    } else {
      existing.unshift(problem);
    }
    localStorage.setItem("devcareer_custom_problems", JSON.stringify(existing));
  } catch (e) {
    console.error("Error guardando reto personalizado en localStorage", e);
  }
}

/**
 * Obtiene todos los retos personalizados almacenados por el usuario.
 */
export function getCustomProblems(): Problem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("devcareer_custom_problems");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

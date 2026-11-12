const path = require("path");
const fs = require("fs");
const backendPath = path.join(__dirname, "../Backend");

// Cargar variables de entorno del Backend
const dotenv = require(path.join(backendPath, "node_modules/dotenv"));
dotenv.config({ path: path.join(backendPath, ".env") });

process.env.PORT = "3098";
process.env.NODE_ENV = "test";

function check(cond, msg) {
  if (!cond) throw new Error("FALLÓ: " + msg);
  console.log("   ✅ " + msg);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runIntegrationTest() {
  console.log("=========================================================================");
  console.log("PRUEBA DE INTEGRACIÓN E2E DE LA APP: PATRÓN MEDIATOR COMPLETO (GoF PE-09)");
  console.log("=========================================================================\n");

  // Respaldar job-applications.json para no ensuciar datos reales tras la prueba
  const dataFile = path.join(backendPath, "data/job-applications.json");
  const originalDataBackup = fs.existsSync(dataFile) ? fs.readFileSync(dataFile, "utf8") : null;

  // Configurar fábricas Mock (Patrones Abstract Factory & Factory Method) antes de cargar rutas
  const { AIProviderFactory } = require(path.join(backendPath, "dist/services/ai/ai-provider.factory"));
  const { RepositoryFactory, MockDataStoreFactory } = require(path.join(backendPath, "dist/repositories"));

  RepositoryFactory.setFactory(
    new MockDataStoreFactory(
      {},
      {},
      { "3aa77ca5-52cf-4204-8d4a-85c0456e716f": { id: "3aa77ca5-52cf-4204-8d4a-85c0456e716f", name: "Test User", email: "test@devcareer.ai" } }
    )
  );

  // Proveedor IA Mock contextual para probar /api/cv/analyze y /code/feedback sin consumir cuota real
  AIProviderFactory.setProvider({
    async generateJson(parts) {
      const promptText = parts.map((p) => p.text || "").join(" ");
      if (promptText.includes("ATS")) {
        return {
          score: 62,
          summary: "Compatibilidad media; faltan tecnologías de infraestructura en el CV.",
          breakdown: { keywords: 55, formatting: 80, grammar: 85, impact: 60 },
          matchedKeywords: ["TypeScript", "Node.js"],
          missingKeywords: ["Kubernetes", "Terraform", "Kafka"],
          suggestions: [
            {
              category: "keywords",
              title: "Agregar experiencia en Kubernetes y Terraform",
              description: "Incluye proyectos o certificaciones con contenedores e IaC.",
              severity: "high",
            },
          ],
        };
      }
      if (promptText.includes("Staff Software Engineer")) {
        return {
          score: 64,
          complexity: { time: "O(n^2)", space: "O(n)" },
          patternAnalysis: {
            isPatternApplied: false,
            patternName: "N/A",
            solidAdherence: "Viola Open/Closed Principle por condicionales acoplados.",
          },
          codeSmellsEliminated: [],
          strengths: ["Los casos de prueba básicos pasan"],
          improvements: ["Aplicar patrón Strategy para desacoplar variantes", "Optimizar complejidad a O(n)"],
          interviewerTip: "Extrae una interfaz común antes de agregar nuevas reglas.",
        };
      }
      return {};
    },
  });

  // Iniciar servidor Express compilado
  require(path.join(backendPath, "dist/index.js"));
  const { getDefaultCareerMediator } = require(path.join(backendPath, "dist/patterns/mediator"));
  const mediator = getDefaultCareerMediator();
  mediator.clearLogs();

  await sleep(800);
  const baseUrl = "http://127.0.0.1:3098";

  try {
    console.log("1. Verificando Health Check del Backend...");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthJson = await healthRes.json();
    check(healthRes.status === 200 && healthJson.status === "ok", "Backend en línea y respondiendo en puerto 3098");

    console.log("\n2. Probando flujo JOB_APPLIED vía POST /jobs/apply...");
    const applyRes = await fetch(`${baseUrl}/jobs/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job: {
          id: "job-netflix-e2e-01",
          title: "Senior Distributed Systems Engineer",
          company: "Netflix",
          platform: "Greenhouse",
          location: "Remote",
          salary: "$160k - $195k",
          requiredSkills: ["Go", "Kafka", "AWS"],
          matchScore: 94,
        },
        notes: "Postulación inicial E2E.",
      }),
    });
    const applyJson = await applyRes.json();
    check(applyRes.status === 201 && applyJson.success === true, "POST /jobs/apply respondió 201 Created");
    const createdAppId = applyJson.application.id;

    console.log("\n3. Probando flujo APPLICATION_STATUS_CHANGED ('interviewing') vía PATCH /jobs/applications/:id/status...");
    const statusRes = await fetch(`${baseUrl}/jobs/applications/${createdAppId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "interviewing" }),
    });
    const statusJson = await statusRes.json();
    check(statusRes.status === 200 && statusJson.success === true, "PATCH status respondió 200 OK");
    check(Boolean(statusJson.preparedInterviewId), `Simulacro creado automáticamente: ${statusJson.preparedInterviewId}`);
    check(
      statusJson.application.notes.includes(statusJson.preparedInterviewId),
      "Notas de postulación actualizadas con el ID del simulacro"
    );

    console.log("\n4. Probando flujo SKILL_GAP_DETECTED (CV ATS) vía POST /api/cv/analyze...");
    const cvRes = await fetch(`${baseUrl}/api/cv/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobDescription: "Senior Platform Engineer con Kubernetes, Terraform y Kafka.",
        cvText: "Desarrollador backend con 4 años de experiencia en TypeScript y Node.js construyendo APIs REST.",
        targetRole: "Senior Platform Engineer",
      }),
    });
    const cvJson = await cvRes.json();
    check(cvRes.status === 200 && cvJson.success === true, "POST /api/cv/analyze respondió 200 OK");
    check(
      Boolean(cvJson.refresherInterviewId),
      `El Mediador creó entrevista de refuerzo ATS automáticamente: ${cvJson.refresherInterviewId}`
    );

    console.log("\n5. Probando flujo SKILL_GAP_DETECTED (Reto de Código) vía POST /code/feedback...");
    const codeRes = await fetch(`${baseUrl}/code/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: "function pay(type) { if (type === 'card') return 1; return 2; }",
        problemTitle: "Refactorizar Pasarela de Pagos (Strategy)",
        problemDescription: "Aplica patrón Strategy respetando OCP.",
        passedCount: 3,
        totalCount: 3,
        isDesignPattern: true,
      }),
    });
    const codeJson = await codeRes.json();
    check(codeRes.status === 200 && codeJson.success === true, "POST /code/feedback respondió 200 OK");
    check(
      Boolean(codeJson.refresherInterviewId),
      `El Mediador creó entrevista de refuerzo SOLID automáticamente: ${codeJson.refresherInterviewId}`
    );

    console.log("\n6. Probando flujo INTERVIEW_EVALUATED (sincronización de entrevista + postulación + analítica)...");
    await mediator.feedbackColleague.notifyEvaluationCompleted({
      feedbackId: "fb_e2e_netflix_01",
      feedback: {
        id: "fb_e2e_netflix_01",
        interviewId: statusJson.preparedInterviewId,
        userId: "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
        totalScore: 72,
        categoryScores: [],
        strengths: ["Diseño sólido en Kafka"],
        areasForImprovement: ["Profundizar en consenso Raft"],
        finalAssessment: "Buen perfil Senior.",
        englishFeedback: {
          overallLevel: "B2",
          grammarScore: 82,
          vocabularyScore: 80,
          fluencyScore: 85,
          grammarErrors: [],
          vocabularySuggestions: [],
          overallComment: "Good communication.",
        },
        createdAt: new Date().toISOString(),
      },
      role: "Senior Distributed Systems Engineer",
      company: "Netflix",
    });

    const appsRes = await fetch(`${baseUrl}/jobs/applications`);
    const appsJson = await appsRes.json();
    const updatedApp = appsJson.applications.find((a) => a.id === createdAppId);
    check(
      updatedApp && updatedApp.notes.includes("72/100") && updatedApp.notes.includes("CEFR: B2"),
      "Postulación sincronizada con calificación (72/100) y nivel CEFR (B2)"
    );

    console.log("\n7. Verificando auditoría del Mediador y propagación a Analítica...");
    const logsRes = await fetch(`${baseUrl}/feedback/mediator/logs`);
    const logsJson = await logsRes.json();
    check(logsJson.logs.length === 5, `Se registraron las 5 transacciones en Mediator (${logsJson.logs.length} logs)`);
    check(logsJson.alerts.length >= 3, `Se generaron ${logsJson.alerts.length} alertas (Evaluación + CV ATS + Reto Código)`);

    const analyticsRes = await fetch(`${baseUrl}/feedback/user/analytics-summary`);
    const analyticsJson = await analyticsRes.json();
    check(
      analyticsRes.status === 200 &&
        analyticsJson.summary.blindspots.some((b) => b.category.includes("Brecha ATS") || b.category.includes("SOLID")),
      "GET /feedback/user/analytics-summary refleja en tiempo real las alertas generadas por el Mediador"
    );

    console.log("\n=========================================================================");
    console.log("🎉 ¡TODAS LAS PRUEBAS E2E DEL PATRÓN MEDIATOR PASARON AL 100%!");
    console.log("=========================================================================");
  } finally {
    if (originalDataBackup !== null) {
      fs.writeFileSync(dataFile, originalDataBackup, "utf8");
    }
  }

  process.exit(0);
}

runIntegrationTest().catch((err) => {
  console.error("\n❌ Error en prueba E2E:", err);
  process.exit(1);
});


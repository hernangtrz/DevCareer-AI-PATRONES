const assert = require("assert");

/**
 * ============================================================================
 * TEST AUTOMATIZADO: PATRÓN COMPORTAMENTAL VISITOR (GoF)
 * ============================================================================
 * Valida el Doble Despacho (Double Dispatch) y el comportamiento desacoplado
 * de los 3 visitantes sobre la estructura heterogénea del portafolio.
 */

// Usamos ts-node o require con compilación previa
async function runVisitorTests() {
  console.log("===============================================================");
  console.log("EJECUTANDO PRUEBAS DEL PATRÓN VISITOR (DevCareer AI)");
  console.log("===============================================================\n");

  let totalPassed = 0;

  // Importar clases desde TypeScript compilado
  const {
    CandidatePortfolio,
    InterviewSessionElement,
    CodeChallengeElement,
    JobApplicationElement,
    CvAtsAnalysisElement,
    SeniorityReadinessVisitor,
    BlindspotDetectionVisitor,
    ExecutivePortfolioVisitor,
  } = require("../Backend/dist/patterns/visitor");

  console.log("1. Probando instanciación de Elementos Heterogéneos y ObjectStructure...");
  const portfolio = new CandidatePortfolio("user-test-123");

  const interview1 = new InterviewSessionElement({
    id: "int-1",
    role: "Senior Backend Engineer",
    company: "GitLab",
    technicalScore: 88,
    communicationScore: 82,
    cefrLevel: "C1",
    techStack: ["Go", "PostgreSQL", "Docker", "Kubernetes"],
    finalized: true,
  });

  const interview2 = new InterviewSessionElement({
    id: "int-2",
    role: "Full Stack Developer",
    company: "Startup Co",
    technicalScore: 60, // Brecha técnica
    communicationScore: 55, // Brecha comunicación
    cefrLevel: "B1", // Brecha inglés
    techStack: ["Node.js", "Express"],
    finalized: true,
  });

  const code1 = new CodeChallengeElement({
    id: "code-1",
    challengeTitle: "LRU Cache Implementation",
    language: "TypeScript",
    difficulty: "Medium",
    testsPassed: 10,
    totalTests: 10,
    cyclomaticComplexity: 6,
    executionTimeMs: 25,
    cleanCodeScore: 92,
    passed: true,
  });

  const code2 = new CodeChallengeElement({
    id: "code-2",
    challengeTitle: "Graph Shortest Path Dijkstra",
    language: "Go",
    difficulty: "Hard",
    testsPassed: 7,
    totalTests: 10, // Falla 3 tests
    cyclomaticComplexity: 14, // Complejidad alta (> 10)
    executionTimeMs: 120,
    cleanCodeScore: 65,
    passed: false,
  });

  const app1 = new JobApplicationElement({
    id: "app-1",
    jobTitle: "Senior Go Engineer",
    company: "GitLab",
    status: "interviewing",
    matchScore: 95,
    seniority: "Senior",
    salaryUSD: "$12,500 USD",
    platform: "Greenhouse",
    techStack: ["Go", "Docker"],
  });

  const app2 = new JobApplicationElement({
    id: "app-2",
    jobTitle: "Lead Architect",
    company: "BigTech",
    status: "rejected",
    matchScore: 55, // Match score bajo (< 65)
    seniority: "Lead",
    platform: "Lever",
    notes: "", // Sin notas
  });

  const cv1 = new CvAtsAnalysisElement({
    id: "cv-1",
    targetRole: "Senior Backend Developer",
    atsScore: 85,
    matchedKeywords: ["Go", "Docker", "PostgreSQL", "TypeScript"],
    missingKeywords: ["GraphQL", "Kafka", "CI/CD"], // 3 keywords faltantes
    formattingIssues: ["Tabla detectada en header"],
    hasClearSenioritySummary: true,
  });

  portfolio.addElements([interview1, interview2, code1, code2, app1, app2, cv1]);

  assert.strictEqual(portfolio.size, 7, "El portafolio debe contener 7 elementos");
  console.log("   ✅ Éxito: 7 elementos heterogéneos agregados al portafolio.");
  totalPassed++;

  // -------------------------------------------------------------
  // Test 2: SeniorityReadinessVisitor
  // -------------------------------------------------------------
  console.log("\n2. Probando SeniorityReadinessVisitor (Auditoría de Nivel)...");
  const readinessVisitor = new SeniorityReadinessVisitor();
  portfolio.accept(readinessVisitor);
  const readinessReport = readinessVisitor.getReport();

  console.log("   Resultado Seniority:", readinessReport.recommendedLevel);
  console.log("   Puntaje Global de Preparación:", readinessReport.overallReadinessScore);
  console.log("   Categorías:", readinessReport.categoryScores);

  assert(readinessReport.overallReadinessScore > 0, "El score global debe ser mayor a 0");
  assert(readinessReport.analyzedElementsCount >= 7, "Debe analizar todos los elementos");
  assert(typeof readinessReport.verdict === "string", "Debe generar un veredicto");
  console.log("   ✅ Éxito: SeniorityReadinessVisitor evaluó los 4 tipos de elementos con doble despacho.");
  totalPassed++;

  // -------------------------------------------------------------
  // Test 3: BlindspotDetectionVisitor
  // -------------------------------------------------------------
  console.log("\n3. Probando BlindspotDetectionVisitor (Detección de Brechas Ocultas)...");
  const blindspotVisitor = new BlindspotDetectionVisitor();
  portfolio.accept(blindspotVisitor);
  const blindspotReport = blindspotVisitor.getReport();

  console.log("   Total Puntos Ciegos Detectados:", blindspotReport.totalBlindspots);
  console.log("   Brechas de Alta Severidad (HIGH):", blindspotReport.highSeverityCount);
  blindspotReport.blindspots.forEach((b) => {
    console.log(`   [${b.severity}] (${b.sourceType}) -> ${b.title}: ${b.issue}`);
  });

  assert(blindspotReport.totalBlindspots >= 5, "Debe detectar múltiples brechas sembradas");
  assert(blindspotReport.highSeverityCount >= 2, "Debe detectar al menos 2 brechas críticas (inglés y tests fallidos)");
  assert(blindspotReport.actionPlan.length > 0, "Debe proponer un plan de acción");
  console.log("   ✅ Éxito: BlindspotDetectionVisitor extrajo correctamente los puntos ciegos de cada elemento.");
  totalPassed++;

  // -------------------------------------------------------------
  // Test 4: ExecutivePortfolioVisitor
  // -------------------------------------------------------------
  console.log("\n4. Probando ExecutivePortfolioVisitor (Dossier Ejecutivo)...");
  const executiveVisitor = new ExecutivePortfolioVisitor();
  portfolio.accept(executiveVisitor);
  const executiveSummary = executiveVisitor.getSummary();

  console.log("   Resumen Ejecutivo:", executiveSummary.candidateSummary);
  console.log("   Entrevistas:", executiveSummary.totalInterviews);
  console.log("   Retos de Código:", executiveSummary.challengesCompleted);
  console.log("   Skills Validados:", executiveSummary.topMatchedSkills);

  assert.strictEqual(executiveSummary.totalInterviews, 2, "Debe registrar 2 entrevistas");
  assert.strictEqual(executiveSummary.challengesCompleted, 2, "Debe registrar 2 retos de código");
  assert.strictEqual(executiveSummary.readyForExport, true, "Debe estar listo para exportar");
  console.log("   ✅ Éxito: ExecutivePortfolioVisitor consolidó métricas ejecutivas para reclutadores.");
  totalPassed++;

  console.log("\n===============================================================");
  console.log(`TODAS LAS PRUEBAS DEL PATRÓN VISITOR PASARON (${totalPassed}/4)`);
  console.log("===============================================================\n");
}

runVisitorTests().catch((err) => {
  console.error("❌ Error en pruebas de Visitor:", err);
  process.exit(1);
});

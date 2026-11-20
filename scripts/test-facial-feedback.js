const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

process.env.SUPABASE_URL = process.env.SUPABASE_URL || "https://mock.supabase.co";
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "mock-service-key-for-tests";

const {
  HtmlRenderer,
  MarkdownRenderer,
  PlainTextRenderer,
  NonVerbalBehaviorReport,
} = require(path.join(backendPath, "dist/patterns/bridge"));

const {
  FacialBehaviorEvaluationService,
} = require(path.join(backendPath, "dist/services/ai"));

const {
  InterviewEvaluationFacade,
} = require(path.join(backendPath, "dist/patterns/facade"));

const {
  MockDataStoreFactory,
  RepositoryFactory,
} = require(path.join(backendPath, "dist/repositories"));

function check(cond, msg) {
  if (!cond) throw new Error("FALLÓ: " + msg);
  console.log("   ✅ " + msg);
}

async function runFacialTests() {
  console.log("================================================================================");
  console.log("PRUEBA COMPLETA: ANÁLISIS FACIAL Y FEEDBACK NO VERBAL (PATRONES GOF)");
  console.log("================================================================================\n");

  // 1. Telemetría de muestra simulada (Edge AI FACS + Cinemática 3D)
  const sampleTelemetry = {
    enabled: true,
    durationSeconds: 180,
    sampledFrames: 1260,
    validFaceFrames: 1220,
    facePresenceRatio: 0.97,
    calibrated: true,
    scores: {
      overallPresence: 88,
      eyeContact: 85,
      composure: 90,
      gestureBalance: 86,
      postureStability: 89,
      warmth: 82,
    },
    indicators: {
      avgTensionIndex: 0.12,
      gestureProfile: "natural",
      blinkRatePerMin: 18,
      headMovementVolatility: 2.8,
      speakingVsListening: {
        speakingTensionAvg: 0.14,
        listeningEyeContactAvg: 88,
      },
    },
    timeline: [
      { second: 15, tension: 15, eyeContact: 85, gestureIntensity: 30, warmth: 75, speaker: "agent" },
      { second: 30, tension: 20, eyeContact: 82, gestureIntensity: 45, warmth: 80, speaker: "user" },
      { second: 45, tension: 12, eyeContact: 88, gestureIntensity: 25, warmth: 78, speaker: "user" },
    ],
    peakEvents: [
      {
        timestampSec: 28,
        type: "high_tension",
        severity: "moderate",
        durationSec: 3.5,
        contextSnippet: "al explicar consistencia eventual en DynamoDB",
      },
    ],
  };

  // 2. Probar FacialBehaviorEvaluationService
  console.log("1. Probando FacialBehaviorEvaluationService (Servicio de Dominio)...");
  const evalService = new FacialBehaviorEvaluationService();
  const feedback = await evalService.evaluate({
    facialMetrics: sampleTelemetry,
    role: "Fullstack Architect",
    isEnglish: false,
  });

  check(typeof feedback.overallScore === "number", "overallScore es numérico (88/100)");
  check(typeof feedback.expressiveProfile === "string" && feedback.expressiveProfile.length > 0, "expressiveProfile definido");
  check(feedback.strengths.length > 0, "Lista de fortalezas no verbales identificadas");
  check(feedback.habitsToImprove.length > 0, "Hábitos a mejorar identificados");
  check(feedback.coachingTips.length > 0, "Consejos de coaching práctico generados");
  console.log("      Perfil obtenido:", feedback.expressiveProfile);
  console.log("      Score:", feedback.overallScore, "/ 100");

  // 3. Probar Patrón Bridge con NonVerbalBehaviorReport
  console.log("\n2. Probando Patrón Bridge con NonVerbalBehaviorReport (HTML, Markdown, PlainText)...");
  const renderers = [
    { name: "HTML", renderer: new HtmlRenderer(), ext: ".html", mime: "text/html" },
    { name: "Markdown", renderer: new MarkdownRenderer(), ext: ".md", mime: "text/markdown" },
    { name: "PlainText", renderer: new PlainTextRenderer(), ext: ".txt", mime: "text/plain" },
  ];

  for (const r of renderers) {
    const report = new NonVerbalBehaviorReport("int-abc-001", feedback, r.renderer);
    const { content, contentType, filename } = report.export();

    check(contentType.includes(r.mime), `Content-Type correcto para ${r.name}: ${contentType}`);
    check(filename.endsWith(r.ext), `Extensión de archivo correcta para ${r.name}: ${filename}`);
    check(content.includes("int-abc-001"), `${r.name} incluye ID de entrevista`);
    check(content.includes("Contacto Visual"), `${r.name} incluye métrica de Contacto Visual`);
  }

  // 4. Probar Fachada de Orquestación (InterviewEvaluationFacade) con MockDataStoreFactory
  console.log("\n3. Probando Orquestación en InterviewEvaluationFacade (Patrón Facade)...");
  const mockInterviews = {
    "int-001": {
      id: "int-001",
      userId: "user-123",
      role: "Backend Lead",
      company: "Tech Corp",
      questions: ["Explica ACID"],
      techstack: ["Node.js", "PostgreSQL"],
      type: "Technical",
      finalized: false,
    },
  };
  const mockFeedbacks = {};
  const mockFactory = new MockDataStoreFactory(mockInterviews, mockFeedbacks, {});
  RepositoryFactory.setFactory(mockFactory);

  const facade = new InterviewEvaluationFacade();
  const evaluationResult = await facade.processAndSaveEvaluation({
    interviewId: "int-001",
    userId: "user-123",
    transcript: [
      { role: "assistant", content: "¿Cómo aseguras consistencia de datos?" },
      { role: "user", content: "Utilizo transacciones distribuidas con patrón Saga." },
    ],
    language: "es",
    facialMetrics: sampleTelemetry,
  });

  check(evaluationResult.feedbackId.length > 0, "Feedback persistido con ID generado");
  check(evaluationResult.feedback.facialFeedback !== undefined, "facialFeedback incluido en la entidad Feedback");
  check(evaluationResult.feedback.facialFeedback.overallScore === 88, "Score no verbal persistido correctamente");

  // 5. Probar Resiliencia: Sesión sin cámara (Solo audio)
  console.log("\n4. Probando Resiliencia: Sesión solo audio (facialMetrics deshabilitado)...");
  const audioOnlyResult = await facade.processAndSaveEvaluation({
    interviewId: "int-001",
    userId: "user-123",
    transcript: [{ role: "user", content: "Respuesta solo voz." }],
    language: "es",
    facialMetrics: undefined,
  });
  check(audioOnlyResult.feedbackId.length > 0, "Evaluación solo audio procesada con éxito");
  check(audioOnlyResult.feedback.facialFeedback === undefined, "facialFeedback es undefined de forma segura en modo solo audio");

  console.log("\n================================================================================");
  console.log("🎉 TODOS LOS PATRONES GOF Y FLUJOS CONDUCTUALES FUNCIONAN PERFECTAMENTE");
  console.log("================================================================================");
}

runFacialTests().catch((err) => {
  console.error("❌ Fallo en las pruebas:", err);
  process.exit(1);
});

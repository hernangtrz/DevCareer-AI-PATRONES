const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

const {
  MarkdownRenderer,
  HtmlRenderer,
  PlainTextRenderer,
  InterviewFeedbackReport,
  EnglishProficiencyReport,
  resolveReportRenderer,
} = require(path.join(backendPath, "dist/patterns/bridge"));

const sampleFeedback = {
  id: "fb_001",
  interviewId: "int_123",
  userId: "user_abc",
  totalScore: 82,
  categoryScores: [
    { name: "Habilidades de Comunicación", score: 85, comment: "Respuestas claras." },
    { name: "Conocimiento Técnico", score: 80, comment: "Domina <React> & Node." },
  ],
  strengths: ["Comunicación clara", "Buen manejo de APIs REST"],
  areasForImprovement: ["Profundizar en testing"],
  finalAssessment: "Candidato sólido para nivel Mid.",
  createdAt: "2026-10-13T10:00:00.000Z",
  englishFeedback: {
    overallLevel: "B2",
    grammarScore: 78,
    vocabularyScore: 74,
    fluencyScore: 80,
    grammarErrors: ["I have worked there since 3 years"],
    vocabularySuggestions: ["Use 'leverage' instead of 'use a lot'"],
    overallComment: "Upper-intermediate level.",
  },
};

function check(cond, msg) {
  if (!cond) throw new Error("FALLÓ: " + msg);
  console.log("   ✅ " + msg);
}

function testBridge() {
  console.log("===================================================");
  console.log("PRUEBA DE PATRÓN ESTRUCTURAL: BRIDGE (GoF)");
  console.log("===================================================\n");

  const renderers = [new MarkdownRenderer(), new HtmlRenderer(), new PlainTextRenderer()];

  console.log("1. Combinando 2 reportes x 3 formatos (6 combinaciones con solo 5 clases concretas)...");
  for (const r of renderers) {
    const interview = new InterviewFeedbackReport(sampleFeedback, r).export();
    const english = new EnglishProficiencyReport("int_123", sampleFeedback.englishFeedback, r).export();
    check(interview.filename === `feedback-entrevista-int_123.${r.fileExtension}`, `Interview + ${r.format}: filename correcto`);
    check(english.filename === `english-cefr-int_123.${r.fileExtension}`, `English + ${r.format}: filename correcto`);
    check(interview.content.includes("82/100"), `Interview + ${r.format}: incluye puntaje global`);
    check(english.content.includes("B2"), `English + ${r.format}: incluye nivel CEFR`);
  }

  console.log("\n2. Verificando sintaxis propia de cada implementador...");
  const md = new InterviewFeedbackReport(sampleFeedback, new MarkdownRenderer()).render();
  const html = new InterviewFeedbackReport(sampleFeedback, new HtmlRenderer()).render();
  const txt = new InterviewFeedbackReport(sampleFeedback, new PlainTextRenderer()).render();
  check(md.startsWith("# "), "Markdown inicia con encabezado #");
  check(html.startsWith("<!DOCTYPE html>"), "HTML es un documento completo");
  check(html.includes("&lt;React&gt; &amp; Node"), "HTML escapa caracteres especiales");
  check(txt.includes("====="), "Texto plano subraya el título");

  console.log("\n3. Cambio de implementador en tiempo de ejecución (setRenderer)...");
  const report = new InterviewFeedbackReport(sampleFeedback, new MarkdownRenderer());
  const first = report.export().contentType;
  const second = report.setRenderer(new HtmlRenderer()).export().contentType;
  check(first.startsWith("text/markdown") && second.startsWith("text/html"), "El mismo reporte cambia de formato sin recrearse");

  console.log("\n4. Resolución de formatos desde el parámetro HTTP...");
  check(resolveReportRenderer("html") instanceof HtmlRenderer, "format=html -> HtmlRenderer");
  check(resolveReportRenderer(undefined) instanceof MarkdownRenderer, "sin format -> Markdown por defecto");
  check(resolveReportRenderer("pdf") === null, "format=pdf no soportado -> null");

  console.log("\n🎉 Todas las pruebas del patrón Bridge pasaron correctamente.");
}

try {
  testBridge();
} catch (err) {
  console.error("\n❌", err.message);
  process.exit(1);
}

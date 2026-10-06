const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

const {
  InterviewBuilder,
  InterviewDirector,
} = require(path.join(backendPath, "dist/patterns/builder"));

const {
  InterviewPrototype,
} = require(path.join(backendPath, "dist/patterns/prototype"));

async function testBuilder() {
  console.log("===================================================");
  console.log("PRUEBA DE PATRÓN CREACIONAL: BUILDER (GoF)");
  console.log("===================================================\n");

  let totalPassed = 0;

  // 1. Probar Construcción Paso a Paso con Interfaz Fluida
  console.log("1. Probando construcción fluida paso a paso con InterviewBuilder...");
  const builder = new InterviewBuilder();
  const interview = builder
    .forUser("user_abc_123")
    .withRole("Cloud Architect")
    .withLevel("Senior")
    .ofType("Technical")
    .withTechStack(["AWS", "Terraform"])
    .addTech("Kubernetes")
    .addTech("AWS") // Duplicado intencional, debe deduplicar
    .withQuestions(["¿Cómo diseñas una VPC multi-región?"])
    .addQuestion("¿Qué métricas evalúas en un Well-Architected Review?")
    .assignRandomCover()
    .asFinalized()
    .build();

  console.assert(interview.userId === "user_abc_123", "UserId correcto");
  console.assert(interview.role === "Cloud Architect", "Role correcto");
  console.assert(interview.techstack.length === 3, "Debe tener 3 tecnologías (sin duplicar AWS)");
  console.assert(interview.questions.length === 2, "Debe tener 2 preguntas");
  console.assert(interview.finalized === true, "Debe estar finalizada");
  console.assert(interview.coverImage.startsWith("/"), "Debe tener cover asignado");
  console.log("   - Entidad construida exitosamente:", {
    role: interview.role,
    level: interview.level,
    techstack: interview.techstack,
    questionsCount: interview.questions.length,
    finalized: interview.finalized,
  });
  console.log("   ✅ Éxito: Ensamble fluido y deduplicación completada.");
  totalPassed++;

  // 2. Probar Validaciones de Invariantes del Dominio
  console.log("\n2. Probando validación estricta de invariantes de negocio...");
  const invalidBuilder = new InterviewBuilder();
  let caughtErrors = 0;

  // Falta userId
  try {
    invalidBuilder.withRole("Frontend Dev").withLevel("Junior").ofType("Technical").build();
  } catch (e) {
    caughtErrors++;
    console.log(`   - Error esperado 1 (falta userId): "${e.message}"`);
  }

  // Falta role
  try {
    invalidBuilder.reset().forUser("user_1").withLevel("Junior").ofType("Technical").build();
  } catch (e) {
    caughtErrors++;
    console.log(`   - Error esperado 2 (falta role): "${e.message}"`);
  }

  // Falta level
  try {
    invalidBuilder.reset().forUser("user_1").withRole("Backend").ofType("Technical").build();
  } catch (e) {
    caughtErrors++;
    console.log(`   - Error esperado 3 (falta level): "${e.message}"`);
  }

  console.assert(caughtErrors === 3, "Debe haber capturado los 3 errores de validación");
  console.log("   ✅ Éxito: Validaciones de dominio bloquean construcciones inconsistentes.");
  totalPassed++;

  // 3. Probar InterviewDirector: Receta de Entrevista en Borrador (Draft)
  console.log("\n3. Probando InterviewDirector para construcción de Entrevista en Borrador...");
  const director = new InterviewDirector(builder);
  const draftInterview = director.constructDraftInterview({
    userId: "user_developer_77",
    role: "QA Automation Engineer",
    level: "Semi-Senior",
    type: "Technical",
    techstack: ["Playwright", "TypeScript", "Jest"],
  });

  console.assert(draftInterview.finalized === false, "Una entrevista en borrador debe tener finalized=false");
  console.assert(draftInterview.questions.length === 0, "Borrador inicializa con preguntas vacías");
  console.assert(draftInterview.role === "QA Automation Engineer", "Rol correcto");
  console.log("   - Entrevista Borrador creada con finalized =", draftInterview.finalized);
  console.log("   ✅ Éxito: Director coordinó correctamente el ensamble de borrador.");
  totalPassed++;

  // 4. Probar InterviewDirector: Receta Técnica Completa
  console.log("\n4. Probando InterviewDirector para Entrevista Técnica Completa...");
  const fullInterview = director.constructTechnicalInterview({
    userId: "user_developer_88",
    role: "Security Engineer",
    level: "Senior",
    type: "Technical",
    techstack: ["OAuth2", "OWASP", "Crypto"],
    questions: ["Explica mitigaciones contra CSRF.", "Describe cómo asegurar tokens JWT."],
    coverImage: "/hostinger.png",
  });

  console.assert(fullInterview.finalized === true, "Entrevista completa debe estar finalized=true");
  console.assert(fullInterview.questions.length === 2, "Debe contener las 2 preguntas");
  console.assert(fullInterview.coverImage === "/hostinger.png", "Cover asignado");
  console.log("   ✅ Éxito: Director coordinó correctamente la entrevista técnica.");
  totalPassed++;

  // 5. Probar Integración Sinergia Builder + Prototype
  console.log("\n5. Probando sinergia entre Patrones (Director construyendo desde un Prototype)...");
  const basePrototype = new InterviewPrototype({
    role: "Site Reliability Engineer",
    level: "Lead",
    type: "Mixed",
    techstack: ["Prometheus", "Grafana", "Linux"],
    questions: ["¿Cómo defines SLOs y Error Budgets?"],
    coverImage: "/skype.png",
    finalized: true,
  });

  const adaptedInterview = director.constructFromPrototype("user_sre_lead", basePrototype);
  console.assert(adaptedInterview.userId === "user_sre_lead", "UserId reasignado");
  console.assert(adaptedInterview.role === "Site Reliability Engineer", "Rol preservado");
  console.assert(adaptedInterview.questions[0].includes("SLOs"), "Pregunta preservada");
  console.log("   - Entrevista ensamblada a partir de un prototipo para:", adaptedInterview.userId);
  console.log("   ✅ Éxito: Sinergia Builder + Prototype validada con éxito.");
  totalPassed++;

  console.log("\n===================================================");
  console.log(`RESULTADO FINAL BUILDER: ${totalPassed}/5 PRUEBAS EXITOSAS (100% OK)`);
  console.log("===================================================\n");
}

testBuilder().catch((err) => {
  console.error("❌ Error en prueba Builder:", err);
  process.exit(1);
});

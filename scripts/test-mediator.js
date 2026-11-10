const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

const {
  CareerWorkflowMediator,
  JobApplicationColleague,
  InterviewSessionColleague,
  EvaluationFeedbackColleague,
  CandidateAnalyticsColleague,
} = require(path.join(backendPath, "dist/patterns/mediator"));

function check(cond, msg) {
  if (!cond) throw new Error("FALLÓ: " + msg);
  console.log("   ✅ " + msg);
}

// Repositorios Mock en memoria para validar la coordinación sin tocar base de datos externa
class InMemoryJobAppRepoMock {
  constructor() {
    this.items = new Map();
  }
  async create(app) {
    const id = "app_test_" + (this.items.size + 1);
    this.items.set(id, { id, ...app });
    return id;
  }
  async getByUserId(userId) {
    return Array.from(this.items.values()).filter((a) => a.userId === userId);
  }
  async getById(id) {
    return this.items.get(id) || null;
  }
  async updateStatus(id, status) {
    const item = this.items.get(id);
    if (item) item.status = status;
  }
  async updateNotes(id, notes) {
    const item = this.items.get(id);
    if (item) item.notes = notes;
  }
  async delete(id) {
    this.items.delete(id);
  }
}

class InMemoryInterviewRepoMock {
  constructor() {
    this.items = new Map();
  }
  async create(interview) {
    const id = "int_test_" + (this.items.size + 1);
    this.items.set(id, { id, ...interview });
    return id;
  }
  async getById(id) {
    return this.items.get(id) || null;
  }
  async getByUserId(userId) {
    return Array.from(this.items.values()).filter((i) => i.userId === userId);
  }
  async getLatest(_userId, limit = 10) {
    return Array.from(this.items.values()).slice(0, limit);
  }
  async update(interview) {
    this.items.set(interview.id, { ...interview });
  }
  async delete(id) {
    this.items.delete(id);
  }
}

async function testMediator() {
  console.log("===================================================");
  console.log("PRUEBA DE PATRÓN COMPORTAMENTAL: MEDIATOR (GoF)");
  console.log("===================================================\n");

  const mockAppRepo = new InMemoryJobAppRepoMock();
  const mockInterviewRepo = new InMemoryInterviewRepoMock();

  const jobColleague = new JobApplicationColleague(mockAppRepo);
  const interviewColleague = new InterviewSessionColleague(mockInterviewRepo);
  const feedbackColleague = new EvaluationFeedbackColleague();
  const analyticsColleague = new CandidateAnalyticsColleague();

  const mediator = new CareerWorkflowMediator(
    jobColleague,
    interviewColleague,
    feedbackColleague,
    analyticsColleague
  );

  const userId = "user_mediator_01";

  console.log("1. Flujo JOB_APPLIED: JobApplicationColleague -> Mediator -> CandidateAnalyticsColleague...");
  const appId = await mockAppRepo.create({
    userId,
    jobId: "job-stripe-01",
    jobTitle: "Senior Backend Engineer",
    company: "Stripe",
    platform: "Greenhouse",
    location: "Remote",
    salary: "$140k - $170k",
    appliedAt: new Date().toISOString(),
    status: "applied",
    notes: "Postulación inicial enviada.",
    techstack: ["TypeScript", "Go", "PostgreSQL"],
    matchScore: 92,
  });

  const createdApp = await mockAppRepo.getById(appId);
  await jobColleague.notifyJobApplied(createdApp);

  const milestonesAfterApply = analyticsColleague.getMilestonesForUser(userId);
  check(milestonesAfterApply.length === 1, "CandidateAnalyticsColleague registró el hito de postulación");
  check(
    milestonesAfterApply[0].summary.includes("Stripe"),
    "El hito de analítica incluye la empresa de la postulación"
  );

  console.log("\n2. Flujo APPLICATION_STATUS_CHANGED ('interviewing'): prepara entrevista y anota en postulación...");
  await jobColleague.changeStatusAndNotify(appId, userId, "interviewing");

  const preparedInterviewId = mediator.getLastPreparedInterviewId();
  check(Boolean(preparedInterviewId), `InterviewSessionColleague creó simulacro (${preparedInterviewId})`);

  const createdInterview = await mockInterviewRepo.getById(preparedInterviewId);
  check(
    createdInterview && createdInterview.role.includes("Stripe"),
    "El simulacro creado por InterviewSessionColleague está contextualizado para Stripe"
  );

  const updatedAppAfterStage = await mockAppRepo.getById(appId);
  check(
    updatedAppAfterStage.notes.includes(`[Simulacro IA Preparado: #${preparedInterviewId}]`),
    "JobApplicationColleague recibió en sus notas el vínculo al simulacro preparado"
  );

  console.log("\n3. Flujo INTERVIEW_EVALUATED: Feedback -> Finaliza Entrevista + Actualiza Postulación + Genera Alertas...");
  await feedbackColleague.notifyEvaluationCompleted({
    feedbackId: "fb_test_01",
    feedback: {
      id: "fb_test_01",
      interviewId: preparedInterviewId,
      userId,
      totalScore: 68,
      categoryScores: [],
      strengths: ["Buen dominio de TypeScript"],
      areasForImprovement: ["Profundizar en patrones de resiliencia e idempotencia en pagos"],
      finalAssessment: "Buen desempeño general con oportunidades en sistemas distribuidos.",
      englishFeedback: {
        overallLevel: "B1",
        grammarScore: 70,
        vocabularyScore: 72,
        fluencyScore: 68,
        grammarErrors: [],
        vocabularySuggestions: [],
        overallComment: "Intermediate level",
      },
      createdAt: new Date().toISOString(),
    },
  });

  const finalizedInterview = await mockInterviewRepo.getById(preparedInterviewId);
  check(finalizedInterview.finalized === true, "InterviewSessionColleague marcó la entrevista como finalizada");

  const syncedApp = await mockAppRepo.getById(appId);
  check(
    syncedApp.notes.includes("68/100") && syncedApp.notes.includes("CEFR: B1"),
    "JobApplicationColleague sincronizó el puntaje y nivel CEFR en las notas de la postulación"
  );

  const userAlerts = analyticsColleague.getAlertsForUser(userId);
  check(userAlerts.length >= 2, "CandidateAnalyticsColleague generó alertas de brecha técnica y CEFR B1");

  console.log("\n4. Flujo SKILL_GAP_DETECTED: Brecha en CV ATS dispara simulacro de refuerzo + alerta...");
  await feedbackColleague.notifySkillGapDetected({
    userId,
    source: "cv-ats",
    targetRole: "Cloud Architect",
    missingSkills: ["Kubernetes", "Terraform"],
    score: 58,
  });

  const refresherId = mediator.getLastPreparedInterviewId();
  const refresherInterview = await mockInterviewRepo.getById(refresherId);
  check(
    refresherInterview && refresherInterview.techstack.includes("Kubernetes"),
    "InterviewSessionColleague creó entrevista de refuerzo con las skills faltantes (Kubernetes, Terraform)"
  );

  const logs = mediator.getCoordinationLogs();
  check(logs.length === 4, `El Mediador registró las 4 transacciones coordinadas (${logs.length} logs)`);

  console.log("\n🎉 Todas las pruebas del patrón Mediator pasaron correctamente.");
}

testMediator().catch((err) => {
  console.error("\n❌", err.message);
  process.exit(1);
});


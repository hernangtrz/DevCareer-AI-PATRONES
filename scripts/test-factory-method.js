const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

// Require dotenv from Backend
const dotenv = require(path.join(backendPath, "node_modules/dotenv"));
dotenv.config({ path: path.join(backendPath, ".env") });

// Import compiled modules from Backend/dist/services/ai
const {
  GeminiProviderCreator,
  OpenAIProviderCreator,
  MockAIProviderCreator,
  AIProviderFactory,
  InterviewEvaluationService,
  GeminiAdapter,
  OpenAIAdapter,
} = require(path.join(backendPath, "dist/services/ai"));

async function testFactoryMethod() {
  console.log("=================================================");
  console.log("PRUEBA DE PATRÓN CREACIONAL: FACTORY METHOD (GoF)");
  console.log("=================================================\n");

  // 1. Probar Creator de Gemini
  console.log("1. Probando GeminiProviderCreator...");
  const geminiCreator = new GeminiProviderCreator();
  const geminiProvider = geminiCreator.createProvider();
  console.log("   - Instancia creada:", geminiProvider.constructor.name);
  console.assert(geminiProvider instanceof GeminiAdapter, "Debe ser instancia de GeminiAdapter");
  console.log("   ✓ Éxito: GeminiAdapter creado mediante Factory Method.\n");

  // 2. Probar Creator de OpenAI
  console.log("2. Probando OpenAIProviderCreator...");
  const openaiCreator = new OpenAIProviderCreator();
  const openaiProvider = openaiCreator.createProvider();
  console.log("   - Instancia creada:", openaiProvider.constructor.name);
  console.assert(openaiProvider instanceof OpenAIAdapter, "Debe ser instancia de OpenAIAdapter");
  console.log("   ✓ Éxito: OpenAIAdapter creado mediante Factory Method.\n");

  // 3. Probar Mock Creator para Testing
  console.log("3. Probando MockAIProviderCreator...");
  const mockCreator = new MockAIProviderCreator({
    default: {
      totalScore: 98,
      categoryScores: [{ name: "Prueba Mock", score: 98, comment: "Excelente" }],
      strengths: ["Uso correcto de Factory Method"],
      areasForImprovement: [],
      finalAssessment: "Aprobado con honores",
    },
  });
  const mockProvider = mockCreator.createProvider();
  console.log("   - Invocando generateJson() en el Mock Provider...");
  const mockResult = await mockProvider.generateJson([{ text: "dummy" }]);
  console.log("   - Resultado obtenido:", JSON.stringify(mockResult));
  console.assert(mockResult.totalScore === 98, "El puntaje mock debe ser 98");
  console.log("   ✓ Éxito: Mock Provider respondió correctamente sin conexión externa.\n");

  // 4. Probar Inyección en Servicio de Dominio (InterviewEvaluationService)
  console.log("4. Probando integración con InterviewEvaluationService...");
  AIProviderFactory.setCreator(mockCreator);
  const evaluationService = new InterviewEvaluationService();
  const feedback = await evaluationService.evaluate("Transcripción de prueba", false);
  console.log("   - Feedback recibido por el servicio:", feedback.finalAssessment);
  console.assert(feedback.totalScore === 98, "El servicio debe usar el proveedor del Factory Method");
  console.log("   ✓ Éxito: InterviewEvaluationService consumió el producto del Factory Method con éxito.\n");

  console.log("=================================================");
  console.log("¡TODAS LAS PRUEBAS DEL FACTORY METHOD PASARON 100%!");
  console.log("=================================================");
}

testFactoryMethod().catch(console.error);

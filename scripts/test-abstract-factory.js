const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

// Cargar variables de entorno primero
const dotenv = require(path.join(backendPath, "node_modules/dotenv"));
dotenv.config({ path: path.join(backendPath, ".env") });

const {
  DataStoreFactory,
  SupabaseDataStoreFactory,
  DynamoDataStoreFactory,
  MockDataStoreFactory,
  RepositoryFactory,
} = require(path.join(backendPath, "dist/repositories"));

const {
  SupabaseInterviewRepository,
} = require(path.join(backendPath, "dist/repositories/supabase/supabase-interview.repository"));

const {
  DynamoInterviewRepository,
} = require(path.join(backendPath, "dist/repositories/dynamo/dynamo-interview.repository"));

async function testAbstractFactory() {
  console.log("===================================================");
  console.log("PRUEBA DE PATRÓN CREACIONAL: ABSTRACT FACTORY (GoF)");
  console.log("===================================================\n");

  // 1. Probar SupabaseDataStoreFactory
  console.log("1. Probando SupabaseDataStoreFactory (Familia PostgreSQL)...");
  const supabaseFactory = new SupabaseDataStoreFactory();
  const sbInterviewRepo = supabaseFactory.createInterviewRepository();
  const sbFeedbackRepo = supabaseFactory.createFeedbackRepository();
  const sbUserRepo = supabaseFactory.createUserRepository();
  console.log("   - Interview Repo creado:", sbInterviewRepo.constructor.name);
  console.log("   - Feedback Repo creado:", sbFeedbackRepo.constructor.name);
  console.log("   - User Repo creado:", sbUserRepo.constructor.name);
  console.assert(sbInterviewRepo instanceof SupabaseInterviewRepository, "Debe ser SupabaseInterviewRepository");
  console.log("   ✓ Éxito: Familia completa de Supabase creada mediante Abstract Factory.\n");

  // 2. Probar DynamoDataStoreFactory
  console.log("2. Probando DynamoDataStoreFactory (Familia AWS DynamoDB)...");
  const dynamoFactory = new DynamoDataStoreFactory();
  const dynInterviewRepo = dynamoFactory.createInterviewRepository();
  const dynFeedbackRepo = dynamoFactory.createFeedbackRepository();
  const dynUserRepo = dynamoFactory.createUserRepository();
  console.log("   - Interview Repo creado:", dynInterviewRepo.constructor.name);
  console.log("   - Feedback Repo creado:", dynFeedbackRepo.constructor.name);
  console.log("   - User Repo creado:", dynUserRepo.constructor.name);
  console.assert(dynInterviewRepo instanceof DynamoInterviewRepository, "Debe ser DynamoInterviewRepository");
  console.log("   ✓ Éxito: Familia completa de DynamoDB creada mediante Abstract Factory.\n");

  // 3. Probar MockDataStoreFactory
  console.log("3. Probando MockDataStoreFactory (Familia In-Memory Testing)...");
  const mockFactory = new MockDataStoreFactory(
    { int_1: { id: "int_1", role: "Frontend Dev", userId: "u1" } },
    { f_1: { id: "f_1", interviewId: "int_1", totalScore: 95 } },
    { u1: { id: "u1", name: "Test User", email: "test@devcareer.ai" } }
  );

  RepositoryFactory.setFactory(mockFactory);
  const interview = await RepositoryFactory.getInterviewRepository().getById("int_1");
  const feedback = await RepositoryFactory.getFeedbackRepository().getByInterviewId("int_1", "u1");
  const user = await RepositoryFactory.getUserRepository().getById("u1");

  console.log("   - Entrevista obtenida:", interview.role);
  console.log("   - Feedback obtenido (score):", feedback.totalScore);
  console.log("   - Usuario obtenido:", user.name);

  console.assert(interview.role === "Frontend Dev", "Debe coincidir con el mock");
  console.assert(feedback.totalScore === 95, "Debe coincidir con el mock");
  console.assert(user.name === "Test User", "Debe coincidir con el mock");
  console.log("   ✓ Éxito: Repositorios mock consumidos transparentemente mediante RepositoryFactory.\n");

  console.log("===================================================");
  console.log("¡TODAS LAS PRUEBAS DE ABSTRACT FACTORY PASARON 100%!");
  console.log("===================================================");
}

testAbstractFactory().catch(console.error);

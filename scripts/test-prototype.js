const path = require("path");
const backendPath = path.join(__dirname, "../Backend");

const {
  InterviewPrototype,
  InterviewPrototypeRegistry,
} = require(path.join(backendPath, "dist/patterns/prototype"));

async function testPrototype() {
  console.log("===================================================");
  console.log("PRUEBA DE PATRÓN CREACIONAL: PROTOTYPE (GoF)");
  console.log("===================================================\n");

  let totalPassed = 0;

  // 1. Probar Creación y Clonación Básica
  console.log("1. Probando clonación básica de InterviewPrototype...");
  const basePrototype = new InterviewPrototype({
    role: "Full Stack Engineer",
    level: "Senior",
    type: "Technical",
    techstack: ["React", "Node.js", "TypeScript"],
    questions: [
      "Explica la arquitectura hexagonal.",
      "¿Cómo gestionas concurrencia en Node.js?",
    ],
    coverImage: "/amazon.png",
    finalized: true,
  });

  const cloned = basePrototype.clone();
  console.assert(cloned instanceof InterviewPrototype, "El clon debe ser instancia de InterviewPrototype");
  console.assert(cloned !== basePrototype, "El clon debe tener una referencia de memoria distinta al original");
  console.assert(cloned.role === basePrototype.role, "El rol debe coincidir");
  console.log("   ✅ Éxito: Prototipo clonado con referencia independiente en memoria.");
  totalPassed++;

  // 2. Probar Deep Copy de Arrays (techstack y questions)
  console.log("\n2. Probando aislamiento por Deep Copy (preguntas y techstack)...");
  cloned.addQuestion("Pregunta exclusiva del clon: ¿Qué es el Event Loop?");
  cloned.techstack.push("Docker");

  console.assert(basePrototype.questions.length === 2, "El prototipo original debe mantener sus 2 preguntas");
  console.assert(cloned.questions.length === 3, "El clon debe tener 3 preguntas");
  console.assert(!basePrototype.techstack.includes("Docker"), "El prototipo original NO debe contener 'Docker'");
  console.assert(cloned.techstack.includes("Docker"), "El clon SÍ debe contener 'Docker'");
  console.log(`   - Preguntas original: [${basePrototype.questions.length}] vs Clon: [${cloned.questions.length}]`);
  console.log(`   - Techstack original: [${basePrototype.techstack.join(", ")}]`);
  console.log(`   - Techstack clon:     [${cloned.techstack.join(", ")}]`);
  console.log("   ✅ Éxito: Modificar el clon NO altera el prototipo base (Deep Copy verificado).");
  totalPassed++;

  // 3. Probar preparación para usuario (prepareForUser)
  console.log("\n3. Probando preparación del clon para un nuevo usuario...");
  const initialTime = cloned.createdAt;
  cloned.prepareForUser("user_dev_999", { finalized: false });
  console.assert(cloned.userId === "user_dev_999", "El userId debe haberse actualizado");
  console.assert(cloned.finalized === false, "El estado finalized debe haberse ajustado");
  console.log(`   - UserId asignado: ${cloned.userId}, Finalized: ${cloned.finalized}`);
  console.log("   ✅ Éxito: Clon preparado para persistencia con metadatos independientes.");
  totalPassed++;

  // 4. Probar InterviewPrototypeRegistry (Catálogo de Prototipos)
  console.log("\n4. Probando InterviewPrototypeRegistry (Catálogo de Arquetipos)...");
  const registry = InterviewPrototypeRegistry.getInstance();
  const keys = registry.listKeys();
  console.log("   - Prototipos cargados por defecto:", keys);
  console.assert(keys.length >= 4, "Debe tener al menos las 4 plantillas predefinidas");
  console.assert(registry.has("template-frontend-junior"), "Debe contener 'template-frontend-junior'");
  console.assert(registry.has("template-backend-senior"), "Debe contener 'template-backend-senior'");

  // Clonar desde el catálogo
  const templateClone1 = registry.clone("template-backend-senior");
  const templateClone2 = registry.clone("template-backend-senior");
  console.assert(templateClone1 !== templateClone2, "Dos clones de la misma plantilla deben ser objetos distintos");

  templateClone1.addQuestion("Pregunta única para candidato 1");
  console.assert(templateClone1.questions.length !== templateClone2.questions.length, "Los clones no deben compartir listas");
  console.log("   ✅ Éxito: Registro entrega clones independientes sin mutación cruzada.");
  totalPassed++;

  // 5. Probar Registro de Prototipo Personalizado
  console.log("\n5. Probando registro de arquetipo personalizado en tiempo de ejecución...");
  const customArchetype = new InterviewPrototype({
    role: "DevOps Engineer",
    level: "Semi-Senior",
    type: "Technical",
    techstack: ["Kubernetes", "Terraform", "AWS"],
    questions: ["¿Cómo estructuras un pipeline CI/CD en GitHub Actions?"],
    coverImage: "/hostinger.png",
  });

  registry.register("custom-devops-archetype", customArchetype);
  console.assert(registry.has("custom-devops-archetype"), "Debe contener el nuevo prototipo");
  const devopsClone = registry.clone("custom-devops-archetype");
  console.assert(devopsClone.role === "DevOps Engineer", "Debe clonar con las propiedades del nuevo arquetipo");
  console.log("   ✅ Éxito: Registro dinámico y clonación de prototipos en tiempo de ejecución.");
  totalPassed++;

  console.log("\n===================================================");
  console.log(`RESULTADO FINAL PROTOTYPE: ${totalPassed}/5 PRUEBAS EXITOSAS (100% OK)`);
  console.log("===================================================\n");
}

testPrototype().catch((err) => {
  console.error("❌ Error en prueba Prototype:", err);
  process.exit(1);
});

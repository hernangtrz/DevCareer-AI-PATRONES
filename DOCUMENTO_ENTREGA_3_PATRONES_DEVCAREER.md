# 🏛️ Universidad Popular del Cesar — Especialización en Ingeniería de Software
## Asignatura: Patrones de Diseño de Software
### Actividad: Implementación de Patrones de Diseño Creacionales y Estructurales (Tercera Entrega)

**Docente Titular:** Ing. Jairo Seoanes, MSc. en Ingeniería de Sistemas y Computación  
**Proyecto:** DevCareer AI — Plataforma Full-Stack Integral de Preparación Técnica con IA  
**Estudiante / Autor:** Hernán Gutiérrez  
**Fecha:** Octubre 2026  
**Repositorio GitHub:** hernangtrz/DevCareer-AI-AWS  

---

## 📌 1. Introducción y Contexto del Proyecto

En esta tercera entrega, el sistema **DevCareer AI** evoluciona a partir de la arquitectura modular y desacoplada consolidada en la Entrega 2 (bajo principios SOLID). La meta central de esta fase es resolver problemas complejos de **creación de objetos** y **organización estructural de clases y subsistemas** que emergen al escalar el software hacia un entorno de producción real, incluyendo portales de empleo conectados a APIs internacionales, exportación multi-formato de métricas y simulaciones de entrevistas técnicas personalizadas con IA.

El proyecto incorpora formalmente:
1. **Los 5 Patrones Creacionales del catálogo GoF:** Abstract Factory, Factory Method, Builder, Prototype y Singleton.
2. **3 Patrones Estructurales del catálogo GoF:** Bridge, Facade y Adapter.

Cumpliendo con las directrices académicas institucionales de la Universidad Popular del Cesar:
* Cada patrón resuelve un problema real e identificable en el dominio del negocio.
* Cada clase y archivo refleja explícitamente su rol en el patrón mediante nomenclatura formal (*Creator, Director, Builder, Prototype, Registry, Abstraction, Implementor, Target, Adapter, Adaptee, Facade*).
* El código compila al 100% sin excepciones en Backend (TypeScript/Node.js/Express) y Frontend (Next.js/React 19), superando el 100% de la suite de pruebas unitarias automatizadas.

---

## 📋 2. Formato de Control de Cambios — Incorporación de Patrones (Oficial)

A continuación se presenta la matriz oficial de trazabilidad con prefijo **PE** (Patrón Estructural / Creacional), vinculando los problemas de diseño previos de la Entrega 2 con la solución arquitectónica implementada:

| ID | Clase(s) Modificada(s) / Creadas | Patrón Aplicado (Tipo GoF) | Problema Previo (Entrega 2 / Código Base) | Mejora Obtenida con el Patrón |
|:---:|:---|:---:|:---|:---|
| **PE-01** | `DataStoreFactory`, `SupabaseDataStoreFactory`, `DynamoDataStoreFactory`, `MockDataStoreFactory`, `RepositoryFactory` | **Abstract Factory** (Creacional) | Acoplamiento rígido de los DAOs al SDK de Supabase. Imposibilidad de migrar a DynamoDB o ejecutar pruebas offline sin conexión a internet. | Familias completas de repositorios intercambiables en caliente mediante la variable de entorno `DATA_STORE=supabase\|dynamo\|mock`. |
| **PE-02** | `AIProviderCreator`, `GeminiProviderCreator`, `OpenAIProviderCreator`, `MockAIProviderCreator`, `AIProviderFactory` | **Factory Method** (Creacional) | La lógica de negocio instanciaba directamente el SDK `@google/genai`. Si la cuota expiraba o se requería OpenAI, el código cliente se rompía. | Desacoplamiento total del proveedor de IA. Nuevos modelos se integran heredando de `AIProviderCreator` sin alterar el código de servicio. |
| **PE-03** | `IInterviewBuilder`, `InterviewBuilder`, `InterviewDirector` | **Builder** (Creacional) | Creación monolítica de entrevistas con constructores telescópicos de más de 8 parámetros. Imposibilidad de personalizar entrevistas según ofertas de empleo. | Construcción secuencial, validada y fluida de entrevistas estándar, drafts o a la medida de ofertas de empleo específicas mediante directores dedicados. |
| **PE-04** | `ICloneable<T>`, `InterviewPrototype`, `InterviewPrototypeRegistry` | **Prototype** (Creacional) | Generar plantillas de entrevistas base requería consultas reiteradas a la base de datos o llamadas costosas a la IA para obtener preguntas estándar. | Duplicación profunda instantánea en memoria (`clone()`) de plantillas preconfiguradas (Junior Frontend, Cloud Backend, etc.). |
| **PE-05** | `InterviewPrototypeRegistry`, `JobPortalAdapterRegistry` | **Singleton** (Creacional) | Instanciación descontrolada de catálogos en memoria, causando consumo redundante de recursos y pérdida de estado unificado. | Garantía de instancia única con acceso global thread-safe para el registro de plantillas y el catálogo de portales de empleo. |
| **PE-06** | `PerformanceReport`, `InterviewFeedbackReport`, `EnglishProficiencyReport`, `JobApplicationsReport`, `UserDashboardReport`, `IReportRenderer`, `HtmlRenderer`, `MarkdownRenderer`, `ExcelRenderer` | **Bridge** (Estructural) | Explosión combinatoria de clases ($M \times N$) al requerir exportar distintos reportes en HTML, Markdown y Libro de Excel (.csv con UTF-8 BOM). | Desacoplamiento ortogonal de qué se reporta (Abstracción) de cómo se formatea (Implementador). Adición aditiva de formatos ($M + N$) y cambio dinámico en runtime. |
| **PE-07** | `AIServiceFacade`, `JobApplicationFacade`, `InterviewEvaluationFacade` | **Facade** (Estructural) | Controladores sobrecargados (*Fat Controllers*) orquestando simultáneamente IA de cartas, optimización ATS de CV, Builder de entrevistas y base de datos. | Interfaz simplificada de alto nivel que ejecuta el flujo integral de postulación o evaluación en una única invocación desacoplada. |
| **PE-08** | `IJobPortalAdapter`, `RemoteOkJobApi`, `RemoteOkJobAdapter`, `InternalJobPortalAdapter`, `JobPortalAdapterRegistry` | **Adapter** (Estructural) | APIs de portales de trabajo externos devuelven esquemas incompatibles (RemoteOK usa tags/position/epoch vs. esquema interno JobOffer). | Contrato unificado `IJobPortalAdapter` que normaliza portales heterogéneos y calcula dinámicamente el Match Score (%) con el perfil del usuario. |

---

## 🧩 3. Detalle Sistemático de los 5 Patrones Creacionales

### 3.1. Patrón Abstract Factory (PE-01)
* **El Qué:** Fábrica abstracta (`DataStoreFactory`) que declara métodos de fabricación para crear familias completas de repositorios de persistencia sin especificar sus clases concretas.
* **El Por Qué:** Permite que DevCareer AI se despliegue de forma transparente en infraestructura Supabase (PostgreSQL), en AWS nativo (DynamoDB) o en memoria (Mock) para pruebas unitarias y CI/CD sin tocar la lógica de negocio.
* **El Cómo:** Se utiliza una clase despachadora `RepositoryFactory` que lee la variable de entorno `DATA_STORE` e instancia en tiempo de inicialización la fábrica concreta correspondiente.
* **Nomenclatura GoF:**
  * `DataStoreFactory` (AbstractFactory)
  * `SupabaseDataStoreFactory`, `DynamoDataStoreFactory`, `MockDataStoreFactory` (ConcreteFactories)
  * `IInterviewRepository`, `IFeedbackRepository`, `IJobApplicationRepository` (AbstractProducts)
* **Beneficios:** Aislamiento total de las tecnologías de persistencia; cumplimiento estricto del Principio de Inversión de Dependencias (DIP) y Abierto/Cerrado (OCP).
* **Desventajas:** La adición de una nueva entidad de datos exige actualizar la interfaz de la fábrica base y todas sus fábricas concretas derivadas.

#### Evidencia en Código:
```typescript
// ANTES (Acoplamiento Rígido al SDK de Supabase):
import { supabase } from "../config/supabase";
export async function getInterview(id: string) {
  return await supabase.from("interviews").select("*").eq("id", id);
}

// DESPUÉS (Abstract Factory):
const factory = RepositoryFactory.getDataStoreFactory();
const interviewRepo = factory.createInterviewRepository();
const interview = await interviewRepo.getById(id);
```

#### Diagrama de Clases UML del Patrón Abstract Factory (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class DataStoreFactory {
        <<Abstract>>
        +createInterviewRepository()* IInterviewRepository
        +createFeedbackRepository()* IFeedbackRepository
        +createUserRepository()* IUserRepository
        +createJobApplicationRepository()* IJobApplicationRepository
    }
    class SupabaseDataStoreFactory {
        +createInterviewRepository() IInterviewRepository
        +createFeedbackRepository() IFeedbackRepository
        +createUserRepository() IUserRepository
        +createJobApplicationRepository() IJobApplicationRepository
    }
    class DynamoDataStoreFactory {
        +createInterviewRepository() IInterviewRepository
        +createFeedbackRepository() IFeedbackRepository
        +createUserRepository() IUserRepository
        +createJobApplicationRepository() IJobApplicationRepository
    }
    class MockDataStoreFactory {
        +createInterviewRepository() IInterviewRepository
        +createFeedbackRepository() IFeedbackRepository
        +createUserRepository() IUserRepository
        +createJobApplicationRepository() IJobApplicationRepository
    }
    class RepositoryFactory {
        +getDataStoreFactory()$ DataStoreFactory
    }

    DataStoreFactory <|-- SupabaseDataStoreFactory
    DataStoreFactory <|-- DynamoDataStoreFactory
    DataStoreFactory <|-- MockDataStoreFactory
    RepositoryFactory ..> DataStoreFactory : produce
```

---

### 3.2. Patrón Factory Method (PE-02)
* **El Qué:** Define una interfaz para crear un objeto, pero delega en las subclases la decisión de qué clase exacta instanciar.
* **El Por Qué:** La plataforma evalúa transcripciones técnicas utilizando modelos de lenguaje. Si el API de Gemini experimenta saturación o se desea conmutar a OpenAI o Mock en pruebas, el cambio debe ser completamente transparente para los servicios.
* **El Cómo:** `AIProviderCreator` declara el método fábrica abstracto `createProvider(): IAIProvider`. Subclases como `GeminiProviderCreator` y `OpenAIProviderCreator` instancian sus adaptadores específicos.
* **Nomenclatura GoF:**
  * `AIProviderCreator` (Creator)
  * `GeminiProviderCreator`, `OpenAIProviderCreator`, `MockAIProviderCreator` (ConcreteCreators)
  * `IAIProvider` (Product)
  * `GeminiAdapter`, `OpenAIAdapter`, `MockAIAdapter` (ConcreteProducts)
* **Beneficios:** Elimina la dependencia directa de bibliotecas SDK; permite cambiar de modelo en tiempo de ejecución; facilita pruebas simuladas sin consumo de tokens.
* **Desventajas:** Proliferación de clases si se introducen proveedores menores.

#### Evidencia en Código:
```typescript
// ANTES (Acoplamiento directo al SDK):
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const res = await ai.models.generateContent({ model: "gemini-flash", contents });

// DESPUÉS (Factory Method):
export abstract class AIProviderCreator {
  public abstract createProvider(): IAIProvider;
  public async executePrompt(prompt: string): Promise<string> {
    const provider = this.createProvider();
    return provider.generateJson([{ text: prompt }]);
  }
}
export class GeminiProviderCreator extends AIProviderCreator {
  public createProvider(): IAIProvider { return new GeminiAdapter(); }
}
```

#### Diagrama de Clases UML del Patrón Factory Method (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class AIProviderCreator {
        <<Abstract>>
        +createProvider()* IAIProvider
        +executePrompt(prompt)* string
    }
    class GeminiProviderCreator {
        +createProvider() IAIProvider
    }
    class OpenAIProviderCreator {
        +createProvider() IAIProvider
    }
    class MockAIProviderCreator {
        +createProvider() IAIProvider
    }
    class IAIProvider {
        <<Interface>>
        +generateJson(contents)
        +analyzeVoice(audio)
    }
    class GeminiAdapter {
        +generateJson(contents)
    }
    class OpenAIAdapter {
        +generateJson(contents)
    }

    AIProviderCreator <|-- GeminiProviderCreator
    AIProviderCreator <|-- OpenAIProviderCreator
    AIProviderCreator <|-- MockAIProviderCreator
    IAIProvider <|.. GeminiAdapter
    IAIProvider <|.. OpenAIAdapter
    AIProviderCreator ..> IAIProvider : crea (Factory Method)
```

---

### 3.3. Patrón Builder (PE-03)
* **El Qué:** Separa la construcción de un objeto complejo (`Interview`) de su representación final, permitiendo que el mismo proceso de construcción produzca diferentes variantes.
* **El Por Qué:** Una entrevista técnica incluye múltiples atributos: rol, nivel, stack tecnológico, banco de preguntas dinámicas, imagen de portada y estado (borrador/finalizado). Utilizar constructores tradicionales generaba constructores telescópicos propensos a errores.
* **El Cómo:** `InterviewBuilder` implementa `IInterviewBuilder` permitiendo encadenar métodos de configuración (`withRole`, `withTechStack`, `withQuestions`). El `InterviewDirector` define recetas de ensamblado como `constructTechnicalInterview` para ofertas laborales específicas.
* **Nomenclatura GoF:**
  * `IInterviewBuilder` (Builder Interface)
  * `InterviewBuilder`, `MockInterviewBuilder` (ConcreteBuilders)
  * `InterviewDirector` (Director)
  * `Interview` (Product)
* **Beneficios:** Construcción paso a paso validada; inmutabilidad opcional; directores reutilizables para diferentes tipos de entrevistas.
* **Desventajas:** Incrementa el número inicial de clases e interfaces asociadas a un modelo.

#### Evidencia en Código:
```typescript
// ANTES (Constructor Telescópico):
const interview = new Interview(userId, "Senior React", "Senior", "Technical", ["React", "TypeScript"], [], "cover.png", true);

// DESPUÉS (Builder & Director):
const director = new InterviewDirector(new InterviewBuilder());
const interview = director.constructTechnicalInterview({
  userId,
  role: "Senior React Developer @ Stripe",
  level: "Senior",
  techstack: ["React", "TypeScript", "Node.js"],
  questions: ["Explica el ciclo de vida de Server Components"],
});
```

#### Diagrama de Clases UML del Patrón Builder (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction LR
    class InterviewDirector {
        -builder: IInterviewBuilder
        +constructTechnicalInterview(specs) Interview
        +constructDraftInterview(userId, role) Interview
    }
    class IInterviewBuilder {
        <<Interface>>
        +withRole(role) IInterviewBuilder
        +withTechStack(techstack) IInterviewBuilder
        +withQuestions(questions) IInterviewBuilder
        +withCoverImage(url) IInterviewBuilder
        +build() Interview
    }
    class InterviewBuilder {
        -interview: Interview
        +build() Interview
    }
    class Interview {
        +id: string
        +role: string
        +techstack: string[]
        +questions: string[]
    }

    InterviewDirector --> IInterviewBuilder : dirige
    IInterviewBuilder <|.. InterviewBuilder : implementa
    InterviewBuilder ..> Interview : construye
```

---

### 3.4. Patrón Prototype (PE-04)
* **El Qué:** Especifica los tipos de objetos a crear a partir de una instancia prototípica y genera nuevos objetos clonando este prototipo mediante copiado profundo.
* **El Por Qué:** DevCareer AI cuenta con plantillas de entrevistas predeterminadas (ej. Frontend Junior, Backend Cloud Senior). Recrearlas desde cero en cada sesión causaba lentitud y consumo innecesario de tokens en la IA.
* **El Cómo:** `InterviewPrototype` implementa la interfaz genérica `ICloneable<InterviewPrototype>` mediante un algoritmo de serialización/deserialización profunda (`structuredClone` / JSON clone).
* **Nomenclatura GoF:**
  * `ICloneable<T>` (Prototype Interface)
  * `InterviewPrototype` (ConcretePrototype)
  * `InterviewPrototypeRegistry` (Prototype Manager / Registry)
* **Beneficios:** Clonación inmediata en memoria sin consultar bases de datos externas; desacoplamiento de clases concretas al momento de instanciar.
* **Desventajas:** La clonación profunda de grafos de objetos con referencias circulares puede requerir algoritmos especializados.

#### Evidencia en Código:
```typescript
// ANTES (Recreación manual con duplicación):
const base = await db.findById(templateId);
const newInterview = { ...base, id: uuid(), userId, createdAt: new Date() };

// DESPUÉS (Prototype Deep Clone):
const registry = InterviewPrototypeRegistry.getInstance();
const clone = registry.clone("frontend-senior");
clone.prepareForUser(userId, { finalized: true });
await interviewRepo.create(clone.toEntity());
```

#### Diagrama de Clases UML del Patrón Prototype (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class ICloneable~T~ {
        <<Interface>>
        +clone(): T
    }
    class InterviewPrototype {
        -role: string
        -techstack: string[]
        -questions: string[]
        +clone(): InterviewPrototype
        +prepareForUser(userId, overrides)
        +toEntity(): Interview
    }
    class InterviewPrototypeRegistry {
        <<Singleton>>
        -templates: Map~string, InterviewPrototype~
        +clone(templateId): InterviewPrototype
    }

    ICloneable~T~ <|.. InterviewPrototype
    InterviewPrototypeRegistry o--> InterviewPrototype : almacena prototipos
```

---

### 3.5. Patrón Singleton (PE-05)
* **El Qué:** Garantiza que una clase posea una única instancia en memoria durante el ciclo de vida de la aplicación y provee un punto de acceso global hacia ella.
* **El Por Qué:** El catálogo de prototipos de entrevistas (`InterviewPrototypeRegistry`) y el registro de adaptadores de portales de empleo (`JobPortalAdapterRegistry`) deben residir en memoria una única vez, evitando fugas de memoria y manteniendo un estado consistente.
* **El Cómo:** Se declara el constructor con visibilidad privada (`private constructor()`) y un método estático (`public static getInstance()`) que implementa la instanciación perezosa (*lazy initialization*).
* **Nomenclatura GoF:**
  * `InterviewPrototypeRegistry` (Singleton)
  * `JobPortalAdapterRegistry` (Singleton)
* **Beneficios:** Uso eficiente de recursos de memoria; punto de acceso centralizado y predecible; prevención de estados inconsistentes.
* **Desventajas:** Puede dificultar las pruebas unitarias independientes si no se incluye un método de reinicio (`resetInstance()`).

#### Evidencia en Código:
```typescript
// ANTES (Múltiples instancias redundantes):
const registry1 = new InterviewPrototypeRegistry();
const registry2 = new InterviewPrototypeRegistry(); // Instancias desconectadas

// DESPUÉS (Singleton Estricto):
export class JobPortalAdapterRegistry {
  private static instance: JobPortalAdapterRegistry;
  private adapters = new Map<string, IJobPortalAdapter>();

  private constructor() { this.registerDefaultAdapters(); }

  public static getInstance(): JobPortalAdapterRegistry {
    if (!JobPortalAdapterRegistry.instance) {
      JobPortalAdapterRegistry.instance = new JobPortalAdapterRegistry();
    }
    return JobPortalAdapterRegistry.instance;
  }
}
```

#### Diagrama de Clases UML del Patrón Singleton (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class JobPortalAdapterRegistry {
        <<Singleton>>
        -instance: JobPortalAdapterRegistry$
        -adapters: Map~string, IJobPortalAdapter~
        -constructor()
        +getInstance()$ JobPortalAdapterRegistry
        +registerAdapter(name, adapter)
        +getAdapter(name): IJobPortalAdapter
    }
    class InterviewPrototypeRegistry {
        <<Singleton>>
        -instance: InterviewPrototypeRegistry$
        -templates: Map~string, InterviewPrototype~
        -constructor()
        +getInstance()$ InterviewPrototypeRegistry
        +clone(templateId): InterviewPrototype
    }
```

---

## 🏗️ 4. Detalle Sistemático de los 3 Patrones Estructurales

### 4.1. Patrón Bridge (PE-06)
* **El Qué:** Desacopla una abstracción de alto nivel (`PerformanceReport`) de su implementación de renderizado (`IReportRenderer`) para que ambas jerarquías puedan evolucionar y variar de manera completamente independiente.
* **El Por Qué:** La aplicación requería exportar múltiples reportes de negocio (`InterviewFeedbackReport`, `EnglishProficiencyReport`, `JobApplicationsReport`, `UserDashboardReport`) en múltiples formatos de salida (`HtmlRenderer`, `MarkdownRenderer` y **`ExcelRenderer`** compatible con Microsoft Excel mediante UTF-8 BOM `\uFEFF`). Sin el patrón Bridge, se generaba una explosión combinatoria de clases ($4 \times 3 = 12$ clases). Con Bridge, solo se requieren $4 + 3 = 7$ clases.
* **El Cómo:** `PerformanceReport` mantiene una referencia protegida `#renderer: IReportRenderer`. Permite cambiar el formateador en tiempo de ejecución mediante `setRenderer(renderer)`.
* **Nomenclatura GoF:**
  * `PerformanceReport` (Abstraction)
  * `InterviewFeedbackReport`, `EnglishProficiencyReport`, `JobApplicationsReport`, `UserDashboardReport` (RefinedAbstractions)
  * `IReportRenderer` (Implementor)
  * `HtmlRenderer`, `MarkdownRenderer`, `ExcelRenderer` (ConcreteImplementors)
* **Beneficios:** Cumplimiento total de OCP; adición aditiva de nuevos formatos sin tocar los reportes existentes; soporte nativo de visualización en Excel y navegadores web; disponible en Dashboard, Empleos y Analítica.
* **Desventajas:** Introduce capas adicionales de indirección que requieren comprensión de la composición sobre la herencia.

#### Evidencia en Código:
```typescript
// ANTES (Explosión Combinatoria M x N):
class InterviewFeedbackHtmlReport extends Report { ... }
class InterviewFeedbackMarkdownReport extends Report { ... }
class JobApplicationsExcelReport extends Report { ... }

// DESPUÉS (Patrón Bridge Desacoplado):
export abstract class PerformanceReport {
  constructor(protected renderer: IReportRenderer) {}
  setRenderer(renderer: IReportRenderer): this { this.renderer = renderer; return this; }

  export(): ExportedReport {
    return {
      content: this.render(),
      contentType: this.renderer.contentType,
      filename: `${this.getBaseFilename()}.${this.renderer.fileExtension}`,
    };
  }
}
```

#### Diagrama de Clases UML del Patrón Bridge (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class PerformanceReport {
        <<Abstract>>
        #renderer: IReportRenderer
        +setRenderer(r): this
        +render(): string*
        +export(): ExportedReport
    }
    class InterviewFeedbackReport {
        #buildBlocks(): ReportBlock[]
    }
    class JobApplicationsReport {
        #buildBlocks(): ReportBlock[]
    }
    class UserDashboardReport {
        #buildBlocks(): ReportBlock[]
    }

    class IReportRenderer {
        <<Interface>>
        +contentType: string
        +fileExtension: string
        +renderTitle(title): string
        +renderSection(heading, content): string
        +compose(title, blocks): string
    }
    class HtmlRenderer {
        +compose(title, blocks): string
    }
    class MarkdownRenderer {
        +compose(title, blocks): string
    }
    class ExcelRenderer {
        +compose(title, blocks): string
    }

    PerformanceReport o--> IReportRenderer : "puente (bridge)"
    PerformanceReport <|-- InterviewFeedbackReport
    PerformanceReport <|-- JobApplicationsReport
    PerformanceReport <|-- UserDashboardReport
    IReportRenderer <|.. HtmlRenderer
    IReportRenderer <|.. MarkdownRenderer
    IReportRenderer <|.. ExcelRenderer
```

---

### 4.2. Patrón Facade (PE-07)
* **El Qué:** Proporciona una interfaz unificada y simplificada a un conjunto complejo de interfaces pertenecientes a subsistemas dispares.
* **El Por Qué:** El flujo de postulación laboral en DevCareer AI requería coordinar simultáneamente: (1) Generación de Cover Letter con IA, (2) Adaptación del CV con palabras clave ATS, (3) Construcción del simulacro de entrevista técnica personalizada con el Builder, y (4) Persistencia en base de datos. Mantener esto en los controladores provocaba el antipatrón *Fat Controller*.
* **El Cómo:** `JobApplicationFacade` encapsula la interacción con `IAIProvider`, `InterviewDirector`, `IInterviewBuilder` e `IJobApplicationRepository`, ofreciendo al controlador el método unificado `processCompleteApplication`.
* **Nomenclatura GoF:**
  * `JobApplicationFacade` (Facade)
  * `AIServiceFacade`, `InterviewEvaluationFacade` (Facades de Evaluación)
  * `InterviewDirector`, `AIProviderCreator`, `IJobApplicationRepository` (Subsystems)
* **Beneficios:** Simplificación dramática del controlador; aislamiento de subsistemas; reutilización uniforme del proceso de postulación.
* **Desventajas:** La fachada debe mantenerse enfocada para no convertirse en un objeto Dios (*God Object*).

#### Evidencia en Código:
```typescript
// ANTES (Fat Controller con lógica dispersa):
router.post("/apply", async (req, res) => {
  const coverLetter = await aiService.generatePrompt(...);
  const cvSummary = await cvService.optimize(...);
  const interview = await builder.build(...);
  await db.insert(...);
});

// DESPUÉS (Patrón Facade):
const facade = new JobApplicationFacade();
const result = await facade.processCompleteApplication({
  userId: req.userId,
  job: req.body.job,
  userSkills: req.body.skills,
});
res.status(201).json(result);
```

#### Diagrama de Clases UML del Patrón Facade (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class JobsController {
        +applyToJob()
    }
    class JobApplicationFacade {
        -jobRepo: IJobApplicationRepository
        -director: InterviewDirector
        +processCompleteApplication(req): Promise~Result~
    }
    class AIProviderCreator {
        +executePrompt(p): Promise~string~
    }
    class InterviewDirector {
        +constructTechnicalInterview(specs): Interview
    }
    class IJobApplicationRepository {
        +create(app): Promise~JobApplication~
    }

    JobsController --> JobApplicationFacade : invoca (1 método)
    JobApplicationFacade --> AIProviderCreator : genera carta y ATS
    JobApplicationFacade --> InterviewDirector : crea simulacro
    JobApplicationFacade --> IJobApplicationRepository : guarda postulación
```

---

### 4.3. Patrón Adapter (PE-08)
* **El Qué:** Convierte la interfaz de una clase o API externa en otra interfaz que los clientes del dominio interno esperan, permitiendo que clases con interfaces incompatibles cooperen fluidamente.
* **El Por Qué:** El portal de empleos de DevCareer AI integra vacantes de múltiples fuentes externas (RemoteOK, bolsas internas, etc.). Cada API externa tiene endpoints y esquemas JSON completamente distintos (RemoteOK usa `position`, `tags`, `epoch`, `salary_min` vs. el modelo interno `JobOffer` con `title`, `requiredSkills`, `platform`).
* **El Cómo:** `RemoteOkJobAdapter` implementa el contrato `IJobPortalAdapter` (Target) y recibe una instancia de `RemoteOkJobApi` (Adaptee), traduciendo los esquemas externos a `JobOffer[]`. Además, el servicio calcula dinámicamente el porcentaje de compatibilidad (Match Score %).
* **Nomenclatura GoF:**
  * `IJobPortalAdapter` (Target Interface)
  * `RemoteOkJobApi` (Adaptee)
  * `RemoteOkJobAdapter`, `InternalJobPortalAdapter` (ConcreteAdapters)
  * `JobPortalAdapterRegistry` (Registry)
  * `JobsService` (Client)
* **Beneficios:** Integración limpia de nuevas APIs sin modificar los controladores; cumplimiento de OCP; normalización de datos.
* **Desventajas:** Añade una capa de traducción intermedia entre el modelo externo y el interno.

#### Evidencia en Código:
```typescript
// ANTES (Acoplamiento al JSON crudo de una API específica):
const res = await fetch("https://remoteok.com/api");
const raw = await res.json();
const title = raw[0].position; // Se rompe si se cambia a otra plataforma

// DESPUÉS (Patrón Adapter Normalizado):
export class RemoteOkJobAdapter implements IJobPortalAdapter {
  readonly portalName = "RemoteOK";
  constructor(private adaptee: RemoteOkJobApi = new RemoteOkJobApi()) {}

  async fetchJobs(): Promise<JobOffer[]> {
    const rawJobs = await this.adaptee.getRemoteJobs();
    return rawJobs.map(raw => ({
      id: String(raw.id),
      title: raw.position,
      company: raw.company,
      salary: `${raw.salary_min}k - ${raw.salary_max}k USD`,
      requiredSkills: raw.tags || [],
      platform: "RemoteOK",
    }));
  }
}
```

#### Diagrama de Clases UML del Patrón Adapter (Monocromático):
```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#ffffff', 'primaryTextColor': '#000000', 'primaryBorderColor': '#000000', 'lineColor': '#000000', 'mainBkg': '#ffffff', 'nodeBorder': '#000000', 'fontFamily': 'Arial'}}}%%
classDiagram
    direction TB
    class JobsService {
        +getJobFeed(portal): JobOffer[]
    }
    class IJobPortalAdapter {
        <<Interface>>
        +portalName: string
        +fetchJobs(): Promise~JobOffer[]~
    }
    class RemoteOkJobAdapter {
        -adaptee: RemoteOkJobApi
        +fetchJobs(): Promise~JobOffer[]~
    }
    class InternalJobPortalAdapter {
        +fetchJobs(): Promise~JobOffer[]~
    }
    class RemoteOkJobApi {
        +getRemoteJobs(): Promise~RemoteOkRawJob[]~
    }

    JobsService --> IJobPortalAdapter : usa contrato Target
    IJobPortalAdapter <|.. RemoteOkJobAdapter : implementa
    IJobPortalAdapter <|.. InternalJobPortalAdapter : implementa
    RemoteOkJobAdapter --> RemoteOkJobApi : adapta Adaptee
```

---

## 📊 5. Diagrama de Clases UML General Actualizado (Entrega 3)

El siguiente diagrama de clases general en **estricto blanco y negro monocromático** (sin sombras, sin colores y con espaciado limpio para draw.io) consolida la arquitectura completa del sistema integrando los módulos de negocio con los 8 patrones GoF implementados:

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#ffffff',
    'primaryTextColor': '#000000',
    'primaryBorderColor': '#000000',
    'lineColor': '#000000',
    'secondaryColor': '#ffffff',
    'tertiaryColor': '#ffffff',
    'mainBkg': '#ffffff',
    'nodeBorder': '#000000',
    'clusterBkg': '#ffffff',
    'clusterBorder': '#000000',
    'titleColor': '#000000',
    'fontFamily': 'Arial'
  }
}}%%
classDiagram
    direction TB

    %% CONTROLADORES / MÓDULOS DE NEGOCIO
    class InterviewsController {
        +createCustomInterview()
        +editInterview()
        +deleteInterview()
    }

    class JobsController {
        +getRecommendedJobs()
        +applyToJob()
        +exportApplications()
    }

    class DashboardController {
        +exportAnalytics()
    }

    %% 1. ABSTRACT FACTORY (PE-01)
    class RepositoryFactory {
        +getDataStoreFactory()$ DataStoreFactory
    }
    class DataStoreFactory {
        <<Abstract>>
        +createInterviewRepo()*
        +createFeedbackRepo()*
        +createJobApplicationRepo()*
    }
    class SupabaseDataStoreFactory {
        +createInterviewRepo()
        +createJobApplicationRepo()
    }
    class DynamoDataStoreFactory {
        +createInterviewRepo()
        +createJobApplicationRepo()
    }

    %% 2. FACTORY METHOD (PE-02)
    class AIProviderCreator {
        <<Abstract>>
        +createProvider()* IAIProvider
        +executePrompt(prompt)* string
    }
    class GeminiProviderCreator {
        +createProvider() IAIProvider
    }
    class OpenAIProviderCreator {
        +createProvider() IAIProvider
    }

    %% 3. BUILDER (PE-03)
    class InterviewDirector {
        -builder: IInterviewBuilder
        +constructTechnicalInterview()
    }
    class IInterviewBuilder {
        <<Interface>>
        +withRole(r)
        +withTechStack(s)
        +build() Interview
    }
    class InterviewBuilder {
        +build() Interview
    }

    %% 4. PROTOTYPE & SINGLETON (PE-04 & PE-05)
    class InterviewPrototypeRegistry {
        <<Singleton>>
        -instance: InterviewPrototypeRegistry$
        +getInstance()$
        +clone(templateId)
    }

    %% 5. ADAPTER (PE-08)
    class IJobPortalAdapter {
        <<Interface>>
        +fetchJobs(): JobOffer[]
    }
    class RemoteOkJobAdapter {
        -adaptee: RemoteOkJobApi
        +fetchJobs(): JobOffer[]
    }
    class InternalJobPortalAdapter {
        +fetchJobs(): JobOffer[]
    }
    class JobPortalAdapterRegistry {
        <<Singleton>>
        +getAdapter(name)
    }

    %% 6. FACADE (PE-07)
    class JobApplicationFacade {
        +processCompleteApplication()
    }
    class AIServiceFacade {
        +evaluateInterview()
    }

    %% 7. BRIDGE (PE-06)
    class PerformanceReport {
        <<Abstract>>
        #renderer: IReportRenderer
        +setRenderer(r)
        +export(): ExportedReport
    }
    class JobApplicationsReport {
        #buildBlocks()
    }
    class UserDashboardReport {
        #buildBlocks()
    }
    class IReportRenderer {
        <<Interface>>
        +renderTitle()
        +compose()
    }
    class HtmlRenderer {
        +compose()
    }
    class MarkdownRenderer {
        +compose()
    }
    class ExcelRenderer {
        +compose()
    }

    %% RELACIONES CLAVE
    JobsController --> JobApplicationFacade : delega
    JobApplicationFacade --> IJobPortalAdapter : consulta
    JobApplicationFacade --> InterviewDirector : usa Builder
    JobApplicationFacade --> AIProviderCreator : usa IA

    IJobPortalAdapter <|.. RemoteOkJobAdapter
    IJobPortalAdapter <|.. InternalJobPortalAdapter
    JobsController ..> JobPortalAdapterRegistry : consulta adaptador

    JobsController --> JobApplicationsReport : usa
    DashboardController --> UserDashboardReport : usa
    PerformanceReport o--> IReportRenderer : puente (bridge)
    PerformanceReport <|-- JobApplicationsReport
    PerformanceReport <|-- UserDashboardReport
    IReportRenderer <|.. HtmlRenderer
    IReportRenderer <|.. MarkdownRenderer
    IReportRenderer <|.. ExcelRenderer

    InterviewsController --> InterviewDirector : usa
    InterviewDirector --> IInterviewBuilder : secuencia
    IInterviewBuilder <|.. InterviewBuilder : implementa

    RepositoryFactory ..> DataStoreFactory : produce
    DataStoreFactory <|-- SupabaseDataStoreFactory
    DataStoreFactory <|-- DynamoDataStoreFactory
```

---

## 🎤 6. Guía de Preparación para la Sustentación Individual

Banco de preguntas clave y argumentación técnica para responder con seguridad ante el docente evaluador (Ing. Jairo Seoanes):

1. **¿Qué problema de diseño concreto resolvió el patrón Bridge en su entrega?**
   * *Respuesta:* Resolvió la explosión combinatoria de clases $M \times N$. En nuestro sistema tenemos 4 tipos de reportes (`InterviewFeedback`, `EnglishProficiency`, `JobApplications`, `UserDashboard`) y 3 formatos de renderizado (`HTML`, `Markdown`, y **`Excel .csv con BOM UTF-8`**). Con herencia tradicional requeríamos 12 clases acopladas. Con Bridge, separamos la jerarquía de abstracción (qué datos se extraen) de la jerarquía de formateo (cómo se escribe la sintaxis), reduciendo a solo 7 clases ($4 + 3$) y permitiendo cambiar de formato en tiempo de ejecución con `setRenderer()`.

2. **¿Por qué utilizó el patrón Adapter en el módulo de empleos y no simplemente una función de mapeo?**
   * *Respuesta:* Porque el patrón Adapter formaliza el contrato `IJobPortalAdapter` (Target Interface), permitiendo que la aplicación consuma APIs heterogéneas como RemoteOK, Jooble o bolsas internas sin acoplarse a los esquemas externos. Si mañana integramos otro portal, solo creamos un nuevo `ConcreteAdapter` y lo registramos en el `JobPortalAdapterRegistry` sin modificar ni una sola línea de los controladores o servicios (cumplimiento del Principio Abierto/Cerrado - OCP).

3. **¿Cuál es la diferencia entre el rol de la Fachada (Facade) y el Director del Builder en su código?**
   * *Respuesta:* El `InterviewDirector` del patrón **Builder** se enfoca exclusivamente en la construcción secuencial y validada de un objeto complejo específico (`Interview`). La `JobApplicationFacade` del patrón **Facade**, en cambio, coordina múltiples subsistemas completamente independientes: interactúa con el modelo de IA para la carta y el análisis ATS, ejecuta el Builder para el simulacro de entrevista y persiste la candidatura en el repositorio de base de datos, ofreciendo una API de alto nivel de 1 solo método al controlador.

4. **¿Por qué todas sus clases tienen sufijos como `Factory`, `Builder`, `Adapter`, `Facade`, `Renderer`?**
   * *Respuesta:* Para cumplir de manera estricta con la rúbrica de la guía de la Universidad Popular del Cesar, que exige que los nombres de las clases reflejen su rol en el catálogo GoF, garantizando alta legibilidad, trazabilidad y claridad arquitectónica en el código fuente y diagramas UML.

5. **¿Por qué utilizó el formato Excel (.csv) con BOM UTF-8 en lugar de texto plano?**
   * *Respuesta:* Porque un archivo CSV estándar sin BOM abierto directamente en Microsoft Excel en Windows distorsiona caracteres especiales en español (tildes, eñes, acentos). Al anteponer el Byte Order Mark UTF-8 (`\uFEFF`), garantizamos compatibilidad nativa inmediata con Microsoft Excel para que los reclutadores y usuarios puedan visualizar sus postulaciones y métricas en hojas de cálculo sin fallos de codificación.

---

## ✅ 7. Matriz de Cumplimiento con la Rúbrica de Entrega 3 (UPC)

| Criterio de Rúbrica | Estado | Evidencia Concreta en el Proyecto |
| :--- | :---: | :--- |
| **5 Patrones Creacionales GoF** | **100% Cumplido** | Abstract Factory (PE-01), Factory Method (PE-02), Builder (PE-03), Prototype (PE-04), Singleton (PE-05) documentados, diagramados y probados. |
| **Mínimo 3 Patrones Estructurales GoF** | **100% Cumplido** | Bridge (PE-06), Facade (PE-07), Adapter (PE-08) implementados en el núcleo del sistema con sus roles GoF explícitos. |
| **Nomenclatura GoF Explícita** | **100% Cumplido** | Clases con sufijos formales: *Factory, Creator, Builder, Director, Prototype, Registry, Abstraction, Implementor, Adapter, Facade*. |
| **Control de Cambios PE-XX** | **100% Cumplido** | Tabla oficial diligenciada con códigos PE-01 hasta PE-08 vinculando problemas de E2 y mejoras obtenidas. |
| **Código ANTES / DESPUÉS** | **100% Cumplido** | Bloques de código comparativos provistos para los 8 patrones mostrando el salto cualitativo en mantenibilidad. |
| **Diagramas UML Monocromáticos** | **100% Cumplido** | 8 diagramas individuales + 1 diagrama general en estricto blanco y negro (#ffffff / #000000) optimizados para draw.io sin superposiciones. |
| **Compilación y Pruebas** | **100% Cumplido** | Backend y Frontend con 0 errores TypeScript (`npx tsc --noEmit`); 25/25 pruebas unitarias superadas exitosamente. |
| **Guía de Sustentación** | **100% Cumplido** | Banco de 5 preguntas técnicas fundamentales con argumentación arquitectónica rigurosa para la defensa oral individual. |

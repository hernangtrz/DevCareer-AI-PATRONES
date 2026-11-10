# GUION MAESTRO DE EXPOSICIÓN: PATRONES DE DISEÑO GoF EN DEVCAREER AI

Este documento contiene el guion estructurado paso a paso para sustentar con éxito la incorporación de los **8 patrones de diseño GoF** (5 Creacionales y 3 Estructurales) aplicados en la arquitectura de **DevCareer AI**.

---

## 🧭 Estructura Recomendada para la Sustentación (10 a 15 Minutos)

1. **Introducción y Contexto (1 minuto):** Propósito del proyecto y necesidad de patrones frente al crecimiento del sistema.
2. **Patrones Creacionales (6 minutos):** 
   - PE-01: Abstract Factory
   - PE-02: Factory Method
   - PE-03: Builder
   - PE-04: Prototype
   - PE-05: Singleton
3. **Patrones Estructurales (5 minutos):**
   - PE-06: Bridge
   - PE-07: Facade
   - PE-08: Adapter
4. **Cierre e Impacto Arquitectónico (1 a 2 minutos):** Resumen de deuda técnica eliminada y cumplimiento de principios SOLID.

---

## 🎙️ APERTURA DE LA PRESENTACIÓN (Guion Introductorio)

> *"Buenos días profesor y compañeros. Hoy les presentamos la evolución arquitectónica de **DevCareer AI**, una plataforma integral diseñada para preparar a desarrolladores de software para procesos de selección técnica internacional mediante simulaciones de voz con IA, retos de código y agregación inteligente de vacantes remotas.*
>
> *A medida que nuestro sistema creció entre la Entrega 2 y la Entrega 3, nos enfrentamos a desafíos críticos: acoplamiento a librerías externas de base de datos e IA, controladores saturados de lógica y esquemas incompatibles de APIs externas.*
>
> *Para resolver estos problemas de raíz y robustecer nuestra arquitectura bajo principios SOLID, incorporamos formalmente **8 patrones de diseño del catálogo GoF**: 5 creacionales y 3 estructurales. A continuación, explicaremos el qué, el porqué, el cómo y el impacto de cada uno en nuestro código."*

---

# PARTE 1: PATRONES CREACIONALES

---

## 1. PE-01: Abstract Factory (Fábrica Abstracta)
* **Módulo:** Capa de Persistencia y Acceso a Datos (`Backend/src/repositories/factories/`).
* **Clases Clave:** `DataStoreFactory` (Abstracta), `SupabaseDataStoreFactory`, `DynamoDataStoreFactory`, `MockDataStoreFactory`, `RepositoryFactory`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Provee una interfaz abstracta para crear familias completas de repositorios compatibles (`IInterviewRepository`, `IFeedbackRepository`, `IUserRepository`) sin acoplarse al motor de persistencia subyacente.
* **El Porqué:** Anteriormente los servicios invocaban directamente el cliente de Supabase (`supabase.from('...')`) o usaban condicionales `if/else` repetitivos. Si la empresa migraba a AWS DynamoDB o requería correr pruebas unitarias offline en CI/CD, había que reescribir la lógica de negocio, violando el Principio Abierto/Cerrado (OCP) y el Principio de Inversión de Dependencias (DIP).
* **El Cómo:** Se definió la clase base abstracta `DataStoreFactory` con métodos fábrica para cada repositorio. Luego se crearon fábricas concretas para Supabase (PostgreSQL), DynamoDB (NoSQL AWS) y Mocks en memoria. La clase estática `RepositoryFactory` lee la variable de entorno `DATA_STORE` en el arranque e inyecta la familia correspondiente en tiempo de ejecución.

### 🗣️ Guion Oral Sugerido
> *"El primer patrón creacional es **Abstract Factory**, aplicado en nuestra capa de persistencia. DevCareer AI opera con una arquitectura de datos híbrida: en desarrollo usamos PostgreSQL con Supabase, en la nube nativa de AWS usamos DynamoDB, y para pipelines de CI/CD requerimos repositorios Mock en memoria para evitar costos y latencia de red.*
>
> *Antes teníamos un antipatrón con condicionales `if/else` dispersos en cada servicio, con el riesgo latente de mezclar accidentalmente tablas de Supabase con DynamoDB. Con Abstract Factory, definimos la clase abstracta `DataStoreFactory` y fábricas concretas para cada entorno. Ahora, cambiar de base de datos toma literalmente 1 segundo mediante una variable de entorno, garantizando 100% de consistencia de familia."*

### ⚠️ Pregunta Frecuente del Evaluador
* **Pregunta:** *"¿Cuál es la principal desventaja de Abstract Factory y cómo la gestionaron?"*
* **Respuesta:** *"Su desventaja clásica es la dificultad para incorporar nuevas entidades al dominio, porque agregar un nuevo repositorio obliga a modificar la fábrica abstracta y todas sus clases derivadas. En nuestro proyecto lo mitigamos diseñando repositorios con interfaces genéricas y dejando repositorios emergentes (como el de postulaciones) aislados mediante inyección directa."*

---

## 2. PE-02: Factory Method (Método de Fábrica)
* **Módulo:** Motor de Inferencia e Inteligencia Artificial (`Backend/src/services/ai/`).
* **Clases Clave:** `AIProviderCreator` (Creador Abstracto), `GeminiProviderCreator`, `OpenAIProviderCreator`, `IAIProvider` (Producto Abstracto).

### El Qué, El Porqué y El Cómo
* **El Qué:** Define una interfaz de creación de un único producto (`IAIProvider`), permitiendo que las subclases creadoras decidan qué clase concreta de motor de lenguaje instanciar y configurar con sus respectivas credenciales.
* **El Porqué:** Inicialmente, el servicio de evaluación importaba rígidamente `@google/genai`. Si la API de Google sufría cortes de servicio, agotamiento de cuota o se deseaba migrar a OpenAI GPT-4o, la lógica de negocio se rompía. Había un fuerte acoplamiento a un proveedor propietario.
* **El Cómo:** Se definió la interfaz de producto `IAIProvider` con métodos como `generateJson()` y `generateText()`. Se creó la clase abstracta `AIProviderCreator` con el método fábrica abstracto `createProvider()`. Cada subclase (`GeminiProviderCreator`, `OpenAIProviderCreator`) instancia su cliente SDK específico y maneja sus tokens sin que el servicio de entrevistas lo sepa.

### 🗣️ Guion Oral Sugerido
> *"El segundo patrón es **Factory Method**, aplicado en nuestro motor de Inteligencia Artificial. DevCareer AI genera preguntas técnicas y evalúa respuestas mediante modelos de lenguaje avanzados. Anteriormente, el código llamaba directamente a la librería de Google Gemini.*
>
> *Si Google cambiaba su SDK o si queríamos cambiar a OpenAI GPT-4o por costos o disponibilidad, teníamos que refactorizar la lógica central. Aplicamos Factory Method definiendo una interfaz unificada `IAIProvider` y subclases creadoras. Gracias a esto, el sistema cumple con el Principio Abierto/Cerrado: podemos agregar Anthropic Claude o modelos locales como Llama 3 creando un nuevo creador sin tocar una sola línea de los servicios de entrevista."*

### ⚠️ Pregunta Frecuente del Evaluador
* **Pregunta:** *"¿Por qué usaron Factory Method aquí y no Abstract Factory?"*
* **Respuesta:** *"Porque aquí no estamos construyendo una familia de múltiples productos heterogéneos interrelacionados, sino un único producto especializado: el proveedor de inferencia de IA (`IAIProvider`). Factory Method delega la instanciación de este producto puntual en subclases creadoras mediante herencia."*

---

## 3. PE-03: Builder (Constructor)
* **Módulo:** Ensamblado de Simulacros de Entrevistas (`Backend/src/patterns/builder/`).
* **Clases Clave:** `InterviewBuilder`, `InterviewDirector`, `InterviewSpecs`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Separa la construcción paso a paso de un objeto complejo (`Interview`) de su representación final, permitiendo que un mismo proceso de construcción produzca representaciones con diferentes configuraciones.
* **El Porqué:** Una simulación de entrevista técnica contiene múltiples parámetros: rol, seniority, stack tecnológico, lista de preguntas dinámicas, tiempo límite, lenguaje y tipo de evaluación. Antes se utilizaba un constructor 'telescópico' con más de 8 argumentos posicionales, propenso a errores de inversión de tipos y forzando a pasar arreglos vacíos `[]` o `null` para entrevistas rápidas o personalizadas.
* **El Cómo:** Se implementó `InterviewBuilder` con métodos encadenables (`withRole`, `withTechStack`, `withQuestions`, `asSystemDesign`, etc.) y validaciones internas antes del `.build()`. Adicionalmente, se incorporó un `InterviewDirector` que encapsula 'recetas' estándar (`constructTechnicalInterview`, `constructBehavioralInterview`), entregando objetos completos y consistentes.

### 🗣️ Guion Oral Sugerido
> *"El tercer patrón creacional es **Builder**, implementado en el ensamblado de simulacros de entrevista. Una sesión de entrevista técnica en DevCareer AI es un objeto complejo: requiere validar coherencia entre el nivel del desarrollador, el rol, el stack tecnológico requerido y las preguntas generadas.*
>
> *Antes de este patrón, la creación dependía de un constructor telescópico de más de 8 parámetros posicionales. Si alguien invertía el orden de dos parámetros tipo string, el error solo se detectaba en ejecución. Con el patrón Builder, la construcción se realiza de forma fluida, paso a paso, con validaciones estrictas y apoyada por el `InterviewDirector`, que estandariza plantillas para entrevistas técnicas, comportamentales o de arquitectura con un solo llamado."*

### ⚠️ Pregunta Frecuente del Evaluador
* **Pregunta:** *"¿Para qué sirve el Director si el Builder ya puede construir el objeto directamente?"*
* **Respuesta:** *"El Builder provee las piezas y los pasos de ensamblado, pero el Director actúa como el maestro de obras que encapsula recetas preconfiguradas del negocio. De esta forma, si el frontend solicita un simulacro técnico estándar, el cliente no necesita conocer qué pasos exactos encadenar; solo invoca al Director."*

---

## 4. PE-04: Prototype (Prototipo)
* **Módulo:** Clonación y Reintento de Simulacros (`Backend/src/patterns/prototype/`).
* **Clases Clave:** `InterviewPrototype`, `ICloneable`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Permite copiar o duplicar objetos existentes (`Interview`) sin que el código dependa de sus clases concretas, realizando una clonación profunda (*deep copy*) de sus estructuras de datos internas.
* **El Porqué:** Los candidatos suelen repetir un mismo simulacro técnico para mejorar su puntuación, o practicar a partir de plantillas oficiales de la comunidad. Si se hacía una copia superficial (`Object.assign` o spread operator `{ ...obj }`), los arreglos de preguntas y habilidades compartían la misma referencia en memoria; cuando el usuario agregaba una respuesta en su reintento, mutaba y corrompía la plantilla base original.
* **El Cómo:** Se definió la interfaz `ICloneable<T>` con el contrato `clone()`. La clase `InterviewPrototype` implementa la copia profunda de arreglos y diccionarios, regenerando nuevos identificadores únicos (`id`, `createdAt`) pero conservando intacto el banco de preguntas técnicas calibradas sin costo de re-inferencia en la IA.

### 🗣️ Guion Oral Sugerido
> *"El cuarto patrón es **Prototype**, ubicado en el subsistema de clonación y reintento de prácticas. En nuestra plataforma, miles de usuarios repiten una misma entrevista técnica para mejorar sus métricas de comunicación y código, o toman plantillas maestras prediseñadas.*
>
> *Inicialmente, realizar una nueva práctica implicaba volver a llamar a la API de IA para reconstruir las preguntas, lo que generaba latencia de hasta 4 segundos y costos innecesarios en tokens. Además, si se duplicaba el objeto en memoria con JavaScript estándar, los arreglos de preguntas quedaban enlazados por referencia, provocando mutaciones cruzadas. Con Prototype implementamos clonación profunda nativa: clonamos cualquier simulacro en microsegundos, con aislamiento total de memoria y cero llamadas externas."*

---

## 5. PE-05: Singleton (Instancia Única)
* **Módulo:** Registro Centralizado de Plantillas y Adaptadores (`Backend/src/patterns/prototype/` y `Backend/src/patterns/adapter/`).
* **Clases Clave:** `InterviewPrototypeRegistry`, `JobPortalAdapterRegistry`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Garantiza que una clase tenga únicamente una instancia en toda la aplicación y proporciona un punto de acceso global y seguro a la misma.
* **El Porqué:** Las plantillas base de entrevistas oficiales y las conexiones hacia los portales de trabajo internacionales deben inicializarse una sola vez en el ciclo de vida del servidor. Si cada petición HTTP creaba un nuevo registro, se desperdiciaba memoria RAM, se realizaban reconexiones innecesarias y se perdía la coherencia del catálogo compartido.
* **El Cómo:** Se definió un constructor privado (`private constructor()`), una variable estática privada para guardar la instancia única y un método estático público `getInstance()` que aplica inicialización perezosa (*lazy initialization*) con protección ante accesos concurrentes.

### 🗣️ Guion Oral Sugerido
> *"El último patrón creacional es **Singleton**, implementado en nuestro registro de plantillas de entrevista y en el catálogo de adaptadores de empleo. En una aplicación Node.js con múltiples conexiones concurrentes, registrar las plantillas maestras y configurar las fuentes de empleo en cada petición HTTP degradaba el rendimiento.*
>
> *Con Singleton, sellamos el constructor y creamos un punto de acceso único mediante `getInstance()`. Esto nos asegura que el catálogo de plantillas se precarga una única vez en memoria, optimizando la memoria del servidor y ofreciendo un acceso consistente para todos los usuarios."*

---

# PARTE 2: PATRONES ESTRUCTURALES

---

## 6. PE-06: Bridge (Puente)
* **Módulo:** Generación y Exportación Desacoplada de Reportes (`Backend/src/patterns/bridge/`).
* **Clases Clave:** `JobApplicationsReport` (Abstracción), `IReportRenderer` (Implementador), `HtmlReportRenderer`, `MarkdownReportRenderer`, `ExcelReportRenderer`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Desacopla una abstracción de su implementación, permitiendo que ambas jerarquías puedan variar de forma independiente sin generar una explosión combinatoria de clases.
* **El Porqué:** DevCareer AI necesita generar reportes de seguimiento de postulaciones, auditorías y analíticas del candidato en múltiples formatos: HTML interactivo, Markdown para desarrolladores y hojas de cálculo Excel/CSV. Si utilizábamos herencia tradicional, por cada tipo de reporte y por cada formato hubiéramos tenido que crear clases como `ApplicationHtmlReport`, `ApplicationExcelReport`, `AnalyticsHtmlReport`, multiplicando el mantenimiento.
* **El Cómo:** Se dividió el problema en dos dimensiones ortogonales:
  1. **Dimensión de Negocio (Abstracción):** `JobApplicationsReport` conoce qué datos agregar, calcular y resumir.
  2. **Dimensión de Formato (Implementador):** La interfaz `IReportRenderer` y sus clases concretas (`HtmlReportRenderer`, `MarkdownReportRenderer`, `ExcelReportRenderer`) saben únicamente cómo pintar tablas, estilos y cabeceras.
  La abstracción recibe al renderizador por inyección en su constructor (`bridge`).

### 🗣️ Guion Oral Sugerido
> *"Pasando a los patrones estructurales, presentamos el patrón **Bridge**. Nuestro módulo de empleo incluye la exportación del historial de postulaciones del desarrollador. El negocio requería que los datos se pudieran exportar tanto en tablas web HTML, como en Markdown para repositorios de GitHub, y en formato Excel (.csv) para seguimiento en hojas de cálculo.*
>
> *Si usábamos herencia clásica, caíamos en el problema de 'explosión combinatoria de clases'. Con el patrón Bridge desacoplamos qué información se procesa de cómo se dibuja en pantalla. La clase `JobApplicationsReport` contiene la lógica de negocio y se conecta mediante un puente a cualquier renderizador que implemente `IReportRenderer`. Si mañana el usuario nos pide exportar en PDF, solo creamos `PdfReportRenderer` sin tocar la lógica de datos."*

### ⚠️ Pregunta Frecuente del Evaluador
* **Pregunta:** *"¿En qué se diferencia Bridge de una simple estrategia (Strategy)?"*
* **Respuesta:** *"Aunque estructuralmente son similares porque usan composición, su propósito es distinto: Strategy intercambia un algoritmo intercambiable de comportamiento. Bridge desacopla dos jerarquías completas e independientes que evolucionan por separado: la jerarquía de conceptos de negocio (reportes) y la jerarquía de plataformas o formatos de presentación (renderers)."*

---

## 7. PE-07: Facade (Fachada)
* **Módulo:** Orquestación Integral de Postulaciones Laborales (`Backend/src/patterns/facade/job-application.facade.ts`).
* **Clases Clave:** `JobApplicationFacade`, `JobsRoutes`.

### El Qué, El Porqué y El Cómo
* **El Qué:** Proporciona una interfaz unificada y de alto nivel que oculta la complejidad y la interacción de un conjunto de subsistemas heterogéneos, haciendo que el subsistema sea mucho más fácil de usar y mantener.
* **El Porqué:** Cuando un candidato presiona 'Postularme a esta vacante', la aplicación debe realizar una secuencia compleja:
  1. Invocar al motor de IA para redactar una Carta de Presentación y un CV adaptado al cargo.
  2. Construir un simulacro técnico con el patrón Builder según los requisitos de la vacante.
  3. Registrar la entrevista técnica en el servicio de dominio.
  4. Persistir la postulación con sus materiales, notas y fecha en la base de datos.
  Antes, toda esta orquestación de más de 120 líneas vivía directamente dentro de la ruta HTTP de Express (`jobs.routes.ts`), creando un antipatrón *Fat Controller* altamente frágil: si fallaba la IA, la ruta colapsaba con un error 500 no controlado.
* **El Cómo:** Se creó la fachada `JobApplicationFacade` con el método de entrada `processCompleteApplication()`. La fachada coordina concurrentemente la llamada a `AIProviderFactory`, invoca a `InterviewDirector`, captura contingencias ofreciendo plantillas de respaldo seguras y persiste en `IJobApplicationRepository`. El controlador Express queda reducido a una única llamada limpia de 3 líneas.

### 🗣️ Guion Oral Sugerido
> *"El séptimo patrón es **Facade**, implementado en el flujo completo de postulación a vacantes técnicas. Para que un desarrollador se postule efectivamente, el sistema debe coordinar cuatro subsistemas a la vez: generar con IA una carta de motivación y un CV adaptado, ensamblar un simulacro técnico a la medida con el patrón Builder, registrar la sesión de voz y guardar la postulación en la base de datos.*
>
> *Teníamos un antipatrón de 'Fat Controller' en Express, donde la ruta HTTP conocía detalles de bajo nivel de 4 módulos distintos. Con `JobApplicationFacade`, encapsulamos toda esa complejidad tras un único método: `processCompleteApplication()`. El controlador ahora solo recibe la petición y delega en la fachada. Además, la fachada incorpora resiliencia: si la IA experimenta problemas de red, captura el error y entrega una plantilla estructurada de contingencia sin romper la experiencia del usuario."*

---

## 8. PE-08: Adapter (Adaptador)
* **Módulo:** Agregador Multiplataforma de Empleos (`Backend/src/patterns/adapter/`).
* **Clases Clave:** `IJobPortalAdapter` (Target), `GreenhouseJobAdapter`, `LeverJobAdapter`, `RemoteOkJobAdapter`, `JobOffer` (DTO de Dominio).

### El Qué, El Porqué y El Cómo
* **El Qué:** Convierte la interfaz o estructura de datos de una clase externa en otra interfaz que el cliente espera, permitiendo que clases con interfaces incompatibles trabajen juntas.
* **El Porqué:** DevCareer AI integra vacantes reales de múltiples fuentes internacionales: sistemas ATS corporativos como **Greenhouse** y **Lever**, y bolsas de trabajo remotas como **RemoteOK**. Cada API externa devuelve esquemas completamente dispares: en Greenhouse el cargo se llama `title`, en RemoteOK se llama `position`; los salarios vienen en números, rangos o strings; y las listas de tecnologías vienen como arrays, tags o texto sin procesar. Si el frontend consumía estos formatos directamente, se llenaba de condicionales frágiles.
* **El Cómo:** Se definió la interfaz estándar `IJobPortalAdapter` con el método `fetchJobs()`. Se construyó un adaptador para cada plataforma (`GreenhouseJobAdapter`, `LeverJobAdapter`, `RemoteOkJobAdapter`). Cada adaptador se encarga de consumir el API externa, normalizar los campos, calcular el *Match Score* del usuario y retornar objetos homogéneos de tipo `JobOffer`.

### 🗣️ Guion Oral Sugerido
> *"El último patrón estructural es **Adapter**, base de nuestro agregador de empleo tech. Para ofrecer vacantes en tiempo real, nos conectamos a portales globales como Greenhouse, Lever y RemoteOK. Cada una de estas plataformas devuelve un formato JSON totalmente diferente: RemoteOK utiliza campos como `position` y salarios mínimos en enteros, mientras que Lever y Greenhouse manejan estructuras anidadas de categorías y enlaces propios.*
>
> *En lugar de contaminar nuestra capa de negocio con validaciones y condicionales para cada portal, creamos una interfaz destino `IJobPortalAdapter` y un adaptador específico para cada proveedor. Cada adaptador traduce la respuesta propietaria al modelo canónico de nuestro dominio: `JobOffer`. De esta manera, si mañana conectamos LinkedIn Jobs o Indeed, solo implementamos su respectivo adaptador sin tocar el frontend ni la lógica de cálculo de afinidad del perfil."*

---

# PARTE 3: CIERRE DE LA SUSTENTACIÓN (Conclusión)

### 🗣️ Palabras de Cierre
> *"En conclusión, la incorporación de estos 8 patrones GoF no fue un ejercicio teórico, sino una respuesta directa a necesidades reales de escalabilidad en DevCareer AI:
>
> 1. Con los **Patrones Creacionales**, logramos una arquitectura independiente del motor de base de datos (con Abstract Factory), resiliente a cambios de proveedores de IA (con Factory Method), segura ante objetos complejos (con Builder), instantánea al clonar prácticas (con Prototype) y con estado global unificado (con Singleton).
> 2. Con los **Patrones Estructurales**, evitamos la proliferación de clases de reportes (con Bridge), convertimos rutas HTTP saturadas en controladores delgados y resilientes (con Facade), y homologamos fuentes de empleo internacionales incompatibles (con Adapter).
>
> Todo esto nos permitió alcanzar una arquitectura modular, desacoplada y alineada rigurosamente a los principios SOLID. Quedamos atentos a cualquier pregunta que deseen realizarnos. Muchas gracias."*

---

## 📌 Tabla Resumen para Memorizar Antes de Entrar

| Patrón | Tipo | Módulo DevCareer AI | Problema Previo que Soluciona |
| :--- | :---: | :--- | :--- |
| **Abstract Factory** | Creacional | Persistencia (`repositories/`) | Acoplamiento a Supabase; imposibilidad de usar DynamoDB o Mocks offline. |
| **Factory Method** | Creacional | Modelos de IA (`services/ai/`) | Dependencia directa del SDK `@google/genai`; rigidez para sumar OpenAI. |
| **Builder** | Creacional | Entrevistas (`patterns/builder/`) | Constructor telescópico de más de 8 parámetros propensos a error. |
| **Prototype** | Creacional | Prácticas (`patterns/prototype/`) | Corrupción por mutación en memoria de preguntas al reintentar simulacros. |
| **Singleton** | Creacional | Registros (`patterns/adapter/`) | Duplicación de catálogos y consumo excesivo de RAM en peticiones concurrentes. |
| **Bridge** | Estructural | Reportes (`patterns/bridge/`) | Explosión de clases al combinar tipos de reportes con formatos (HTML, MD, CSV). |
| **Facade** | Estructural | Postulación (`patterns/facade/`) | Fat Controller con más de 120 líneas coordinando IA, Builder y Repositorios. |
| **Adapter** | Estructural | Agregador de Empleos (`adapter/`) | Incompatibilidad de esquemas JSON entre Greenhouse, Lever y RemoteOK. |


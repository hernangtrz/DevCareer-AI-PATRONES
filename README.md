# DevCareer AI

> **Plataforma Integral de Simulación de Entrevistas de Voz en Tiempo Real, Búsqueda de Empleo Inteligente y Analítica de Empleabilidad con IA**  
> *Proyecto Integrador: Universidad Popular del Cesar (UPC)*  
> *Asignatura: Patrones de Diseño de Software - Taller N.º 3*  
> *Docente: Jairo Francisco Seoanes León*  
> *Equipo de Desarrollo: Jhon Mario García Barrios, Juan Sebastián Rondón, Hernan Andres Gutierrez Anillo*  
> *Repositorio Oficial: [https://github.com/hernangtrz/DevCareer-AI-PATRONES.git](https://github.com/hernangtrz/DevCareer-AI-PATRONES.git)*

---

## 📌 Descripción General

**DevCareer AI** es una plataforma tecnológica diseñada para cerrar la brecha competitiva de desarrolladores de software latinoamericanos frente al mercado laboral internacional. Centraliza el ciclo completo de preparación para procesos de selección técnicos en empresas globales mediante:

1. **Simulación de Entrevistas de Voz en Tiempo Real:** Conversaciones bidireccionales con entrevistadores de IA a través de WebRTC con latencia subsegundo, turnos acústicos gestionados por Silero VAD y evaluación lingüística en inglés técnico según el marco CEFR (A1 a C2).
2. **Portal de Empleo y Tracking de Postulaciones:** Feed agregador de ofertas de trabajo internacionales (RemoteOK, LinkedIn, Greenhouse ATS) con cálculo dinámico de afinidad (*Match Score*), registro de postulaciones en un clic, seguimiento por estados y gestión de notas personales persistentes.
3. **Analítica de Progreso y Métricas Reales:** Cálculo en vivo del Índice de Empleabilidad ponderado a partir de datos reales de base de datos, gráfico de Radar pentagonal dinámico en SVG, detección de puntos ciegos técnicos y exportación de reportes a Microsoft Excel (.csv con UTF-8 BOM), HTML y Markdown.
4. **Arena de Retos de Programación y Patrones GoF:** Editor de código interactivo en el navegador con ejecución de casos de prueba en tiempo real, detección de malos olores y verificación automática de principios SOLID y patrones de diseño.
5. **Centro de Optimización de CV y Filtros ATS:** Procesamiento y redacción estructurada de hojas de vida, con evaluación de coincidencia de palabras clave y métricas de impacto profesional.

La arquitectura de la aplicación está construida bajo los principios de **Clean Architecture**, **Principios SOLID** y la implementación formal de **8 Patrones de Diseño GoF** (5 Creacionales y 3 Estructurales), garantizando desacoplamiento de infraestructura multi-nube y alta testabilidad.

---

## 🧩 Catálogo de Patrones de Diseño GoF Implementados

El sistema implementa de manera estricta y desacoplada 8 patrones de diseño del catálogo Gang of Four (GoF):


### 1. Patrones Creacionales

| ID | Patrón | Rol en DevCareer AI | Problema Resuelto | Archivo Principal |
| :--- | :--- | :--- | :--- | :--- |
| **PE-01** | **Abstract Factory** | `DataStoreFactory` | Acoplamiento rígido a Supabase. Permite operar indistintamente sobre PostgreSQL, AWS DynamoDB o Mocks en memoria mediante `DATA_STORE`. | [Backend/src/patterns/abstract-factory/data-store.factory.ts](Backend/src/patterns/abstract-factory/data-store.factory.ts) |
| **PE-02** | **Factory Method** | `AIProviderCreator` | Dependencia dura del SDK de Gemini. Permite conmutación en caliente (*failover*) hacia OpenAI GPT-4o o Mock sin tocar servicios. | [Backend/src/patterns/factory-method/ai-provider.creator.ts](Backend/src/patterns/factory-method/ai-provider.creator.ts) |
| **PE-03** | **Builder** | `InterviewBuilder` e `InterviewDirector` | Constructor telescópico de más de 8 parámetros. Permite la construcción fluida, validada y estructurada de entrevistas personalizadas. | [Backend/src/patterns/builder/interview.builder.ts](Backend/src/patterns/builder/interview.builder.ts) |
| **PE-04** | **Prototype** | `InterviewPrototype` y `ICloneable` | Consultas pesadas y llamadas redundantes a IA para plantillas comunes. Duplicación profunda en memoria con `structuredClone` a 0 ms. | [Backend/src/patterns/prototype/interview.prototype.ts](Backend/src/patterns/prototype/interview.prototype.ts) |
| **PE-05** | **Singleton** | `JobPortalAdapterRegistry` y `PrototypeRegistry` | Múltiples instancias independientes dispersando estado en el heap. Punto de acceso global único y thread-safe con `getInstance()`. | [Backend/src/patterns/adapter/job-portal-adapter.registry.ts](Backend/src/patterns/adapter/job-portal-adapter.registry.ts) |

### 2. Patrones Estructurales

| ID | Patrón | Rol en DevCareer AI | Problema Resuelto | Archivo Principal |
| :--- | :--- | :--- | :--- | :--- |
| **PE-06** | **Bridge** | `PerformanceReport` o-- `IReportRenderer` | Explosión combinatoria de clases ($M \times N = 12$) al exportar múltiples reportes en múltiples formatos. Desacopla la abstracción del renderizador, soportando Excel con UTF-8 BOM (`\uFEFF`), HTML y Markdown ($M + N = 7$). | [Backend/src/patterns/bridge/performance-report.abstraction.ts](Backend/src/patterns/bridge/performance-report.abstraction.ts) |
| **PE-07** | **Facade** | `JobApplicationFacade`, `AIServiceFacade` | Antipatrón *Fat Controller* de más de 120 líneas coordinando IA, ATS, Builder y persistencia. Reduce el endpoint de postulación a 6 líneas limpias. | [Backend/src/patterns/facade/job-application.facade.ts](Backend/src/patterns/facade/job-application.facade.ts) |
| **PE-08** | **Adapter** | `IJobPortalAdapter` (RemoteOK, LinkedIn, Greenhouse) | Esquemas JSON externos heterogéneos e incompatibles. Normaliza cualquier portal hacia la entidad canónica del dominio `JobOffer`. | [Backend/src/patterns/adapter/job-portal-adapter.interface.ts](Backend/src/patterns/adapter/job-portal-adapter.interface.ts) |

---

## 🚀 Módulos Funcionales del Sistema

### 1. Portal de Empleos y Tracking de Postulaciones (`/jobs` y `/mis-postulaciones`)
- **Agregador Multicanal (Adapter):** Consulta y normalización de ofertas técnicas remotas en tiempo real procedentes de RemoteOK, LinkedIn y Greenhouse.
- **Cálculo de Match Score (%):** Comparación algorítmica entre las tecnologías del candidato y los requerimientos de la vacante antes de postularse.
- **Postulación Formal y Notas:** Botón de postulación que redirige al formulario de la empresa y registra la postulación en la base de datos del usuario.
- **Gestor de Postulaciones (`/mis-postulaciones`):** Vista de seguimiento que permite cambiar estados (*applied*, *interviewing*, *offer*, *rejected*), guardar notas personales de seguimiento persistentes en base de datos y lanzar simulaciones técnicas específicas para el puesto.

### 2. Entrevistas de Voz en Tiempo Real (`/interview/[id]`)
- **Saludo Contextual Personalizado:** Al iniciar la llamada, el agente de IA se presenta formalmente, da la bienvenida mencionando el nombre de la empresa, el rol al que se postula y el stack tecnológico a evaluar.
- **Optimizaciones Acústicas Silero VAD:** Parámetros afinados (`activationThreshold: 0.35`, `minSilenceDuration: 0.35s`, `aecWarmupDuration: 400ms`) y `preemptiveGeneration` para diálogo fluido sin silencios incómodos y corte inmediato ante interrupciones.
- **Interfaz Centrada y Profesional:** Sala de llamada con temporizador en vivo, chips de tecnologías evaluadas, estado de red WebRTC e indicador dinámico de voz.
- **Evaluación Lingüística CEFR:** Diagnóstico en paralelo de competencia en inglés (gramática, vocabulario técnico y nivel A1-C2).

### 3. Panel de Progreso y Analítica en Vivo (`/analytics`)
- **Conexión a Datos Reales:** Eliminación total de mocks en analítica. Cálculo en tiempo real desde la tabla `feedback` de Supabase o DynamoDB.
- **Índice de Empleabilidad:** Ponderación dinámica basada en el promedio de entrevistas finalizadas, puntajes por categoría y regularidad.
- **Radar de Competencias Pentagonal (SVG):** Visualización vectorial interactiva de los 5 ejes de evaluación (*Conocimiento Técnico*, *Comunicación*, *Resolución de Problemas*, *Ajuste Cultural* y *Claridad*).
- **Diagnóstico de Puntos Ciegos:** Identificación algorítmica de debilidades recurrentes analizando los campos `areas_for_improvement` del historial.
- **Exportación Multi-formato (Bridge):** Descarga instantánea de informes a Libro de Excel (.csv codificado con UTF-8 BOM `\uFEFF` para apertura sin fallos de caracteres en Windows), HTML o Markdown.

### 4. Retos de Código y Principios SOLID (`/challenges`)
- **Editor Monaco en el Navegador:** Entorno de programación con soporte para TypeScript y JavaScript.
- **Evaluación en Tiempo Real:** Ejecución de casos de prueba automatizados en sandbox aislado.
- **Auditoría Algorítmica con IA:** Diagnóstico de complejidad temporal y espacial (Big-O), detección de malos olores de código y verificación de principios SOLID.

### 5. Centro de CV y Filtros ATS (`/cv-creator` y `/cv-analyzer`)
- **Constructor de Currículum:** Redacción estructurada de logros laborales con verbos de acción fuertes y estándares internacionales.
- **Analizador ATS:** Evaluación porcentual de adecuación de la hoja de vida contra descripciones de vacantes y recomendaciones de palabras clave.

---

## 🏛️ Arquitectura del Sistema (Modelo C4)

### C4 Nivel 1: Contexto del Sistema
El usuario desarrollador interactúa con **DevCareer AI** a través de su navegador web para entrenar en entrevistas, postularse a empleos y medir su progreso. El sistema se integra con servicios de nube externos especializados:
- **LiveKit Cloud:** Streaming de audio bidireccional WebRTC de ultra baja latencia.
- **Deepgram Nova-2:** Transcripción de voz a texto (STT).
- **Groq (LPU):** Inferencia de modelos LLaMA 3.3 70B para diálogo de voz en milisegundos.
- **Cartesia Sonic-2:** Síntesis de voz hiperrealista (TTS).
- **Google Gemini 2.5 / OpenAI GPT-4o:** Análisis multimodal de CV, evaluación de código y feedback de entrevistas.
- **Portales de Empleo Externos:** APIs de RemoteOK, LinkedIn y Greenhouse.

### C4 Nivel 2: Contenedores
1. **Frontend Web (Next.js 16 / React 19):** Renderizado híbrido (SSR y Client Components), Tailwind CSS v4, gráficos SVG y cliente WebRTC LiveKit.
2. **Backend API (Node.js 20 / Express / TypeScript):** Orquestador de lógica de negocio, controladores HTTP delgados, fachadas y persistencia desacoplada.
3. **Agente de Voz en Tiempo Real (LiveKit Worker):** Proceso en segundo plano con Silero VAD y estrategias conversacionales por idioma.
4. **Persistencia Políglota:** Supabase (PostgreSQL) para desarrollo local y AWS DynamoDB para despliegue en producción.

---

## 🛠️ Tecnologías y Dependencias Principales

| Área | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16, React 19, TypeScript | Aplicación web reactiva con Server y Client Components |
| **Estilos** | Tailwind CSS v4, Radix UI, Framer Motion | Interfaz moderna, accesible y responsiva |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | IDE interactivo en el navegador para retos de código |
| **Backend** | Node.js 20, Express, TypeScript | API REST modular estructurada con patrones GoF |
| **Voz en Vivo** | LiveKit Cloud, Silero VAD | Señalización WebRTC y detección de actividad vocal |
| **STT / TTS** | Deepgram Nova-2, Cartesia Sonic-2 | Transcripción y síntesis de audio de ultra baja latencia |
| **Modelos de IA** | Groq LLaMA 3.3 70B, Google Gemini 2.5, GPT-4o | Conversación en tiempo real y evaluaciones técnicas |
| **Persistencia** | Supabase (PostgreSQL), AWS DynamoDB | Persistencia políglota intercambiable |
| **Autenticación** | Supabase Auth, AWS Cognito | Sesiones seguras y validación de tokens JWT |
| **Presentaciones** | PptxGenJS | Generación programática de presentaciones PowerPoint |

---

## 📁 Estructura del Repositorio

```
DevCareer-AI/
├── frontend/                     # Aplicación Web Next.js 16
│   ├── app/                      # Rutas de la aplicación (App Router)
│   │   ├── (auth)/               # Inicio de sesión y registro
│   │   ├── (root)/
│   │   │   ├── dashboard/        # Panel central del desarrollador
│   │   │   ├── interview/[id]/   # Sala de entrevista de voz en vivo
│   │   │   ├── jobs/             # Portal de empleo inteligente
│   │   │   ├── mis-postulaciones/# Tracking de postulaciones y notas
│   │   │   ├── analytics/        # Métricas reales y radar de competencias
│   │   │   ├── challenges/       # Arena de retos de código y SOLID
│   │   │   ├── cv-creator/       # Creador inteligente de currículums
│   │   │   └── cv-analyzer/      # Analizador de compatibilidad ATS
│   │   └── api/                  # Handlers de API Next.js
│   └── components/               # Componentes UI (Agent, Navbar, Radar SVG, etc.)
│
├── Backend/                      # Servidor API REST Express
│   └── src/
│       ├── config/               # Configuración de entornos y clientes de BD
│       ├── middleware/           # Middlewares (IAuthVerifier, CORS, Rate Limiting)
│       ├── patterns/             # Implementación formal de los 8 Patrones GoF
│       │   ├── abstract-factory/ # PE-01: DataStoreFactory (Supabase, Dynamo, Mock)
│       │   ├── factory-method/   # PE-02: AIProviderCreator (Gemini, OpenAI, Mock)
│       │   ├── builder/          # PE-03: InterviewBuilder y InterviewDirector
│       │   ├── prototype/        # PE-04: InterviewPrototype y Registry (Deep Clone)
│       │   ├── bridge/           # PE-06: PerformanceReport y Renderers (Excel BOM, HTML)
│       │   ├── facade/           # PE-07: JobApplicationFacade y AIServiceFacade
│       │   └── adapter/          # PE-08: IJobPortalAdapter (RemoteOK, LinkedIn, Greenhouse)
│       ├── routes/               # Controladores HTTP delgados
│       │   ├── jobs.routes.ts    # Endpoints de vacantes y postulaciones
│       │   ├── feedback.routes.ts# Endpoints de analítica y exportación Bridge
│       │   ├── livekit.routes.ts # Generación de tokens WebRTC
│       │   └── auth.routes.ts    # Rutas de autenticación
│       ├── services/             # Lógica de dominio y analytics
│       │   └── analytics.service.ts # Cálculo de índice de empleabilidad y radar
│       └── types/                # Entidades canónicas tipadas en TypeScript
│
├── livekit-agent/                # Worker del Agente de Voz en Tiempo Real
│   ├── agent.ts                  # Flujo de audio WebRTC y turnos de conversación
│   └── strategies/               # Estrategias de voz y prompts según idioma
│
├── scripts/                      # Generadores y suites de pruebas
│   ├── generate_taller3_presentation.js   # Generador de presentación oficial Taller 3
│   ├── generate_patterns_presentation.js  # Generador de presentación de Patrones GoF
│   ├── test-abstract-factory.js           # Pruebas de persistencia políglota
│   ├── test-factory-method.js             # Pruebas de proveedores de IA
│   ├── test-builder.js                    # Pruebas de ensamble de entrevistas
│   └── test-prototype.js                  # Pruebas de clonación en memoria
│
├── DevCareer_AI_Presentacion_Taller3.pptx # Presentación oficial para defensa (13 slides)
└── DevCareer_AI_Patrones_Diseno_GoF.pptx  # Presentación técnica de los 8 patrones (19 slides)
```

---

## 🧪 Pruebas Automatizadas

El proyecto incluye scripts independientes para verificar el comportamiento de los patrones sin requerir levantar la interfaz gráfica:

```bash
# 1. Probar Abstract Factory (Supabase, DynamoDB y Mock en memoria)
node scripts/test-abstract-factory.js

# 2. Probar Factory Method y Adapter (Gemini, OpenAI y Mock)
node scripts/test-factory-method.js

# 3. Probar Builder e invariantes de negocio
node scripts/test-builder.js

# 4. Probar Prototype y clonación profunda con structuredClone
node scripts/test-prototype.js
```

---

## 💻 Guía de Despliegue y Ejecución Local

### Prerrequisitos
- **Node.js:** Versión 20.x o superior.
- **npm:** Versión 10.x o superior.
- Cuentas activas en [LiveKit Cloud](https://cloud.livekit.io/), [Deepgram](https://deepgram.com/), [Groq](https://groq.com/), [Cartesia](https://cartesia.ai/) y [Google AI Studio](https://aistudio.google.com/).

### Pasos de Instalación

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/hernangtrz/DevCareer-AI-PATRONES.git
   cd DevCareer-AI-PATRONES
   ```

2. **Configurar variables de entorno:**
   - En `Backend/.env`:
     ```env
     PORT=3001
     FRONTEND_URL=http://localhost:3000
     DATA_STORE=supabase # Opciones: supabase | dynamo | mock
     AI_PROVIDER=gemini  # Opciones: gemini | openai | mock
     SUPABASE_URL=https://tu-proyecto.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
     LIVEKIT_API_KEY=tu-livekit-key
     LIVEKIT_API_SECRET=tu-livekit-secret
     LIVEKIT_URL=https://tu-proyecto.livekit.cloud
     GOOGLE_GENERATIVE_AI_API_KEY=tu-gemini-key
     ```
   - En `frontend/.env`:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
     NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
     NEXT_PUBLIC_LIVEKIT_URL=https://tu-proyecto.livekit.cloud
     ```
   - En `livekit-agent/.env`:
     ```env
     LIVEKIT_URL=https://tu-proyecto.livekit.cloud
     LIVEKIT_API_KEY=tu-livekit-key
     LIVEKIT_API_SECRET=tu-livekit-secret
     DEEPGRAM_API_KEY=tu-deepgram-key
     GROQ_API_KEY=tu-groq-key
     CARTESIA_API_KEY=tu-cartesia-key
     BACKEND_URL=http://localhost:3001
     ```

3. **Ejecutar los tres servicios en paralelo:**
   ```bash
   # Terminal 1: Backend Express
   cd Backend && npm install && npm run dev

   # Terminal 2: Frontend Next.js
   cd frontend && npm install && npm run dev

   # Terminal 3: Agente LiveKit
   cd livekit-agent && npm install && npm run dev
   ```

4. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---


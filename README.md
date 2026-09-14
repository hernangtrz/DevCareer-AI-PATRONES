# DevCareer AI

> **Plataforma de Entrenamiento y Preparación Técnica para Desarrolladores de Software**  
> *Proyecto Integrador: Universidad Popular del Cesar*  

---

## 📌 Descripción General

**DevCareer AI** es una plataforma integral orientada a la preparación técnica de profesionales en tecnología para procesos de selección y entrevistas laborales. Integra simulaciones de entrevistas de voz en tiempo real con Inteligencia Artificial, análisis y optimización de currículums bajo estándares ATS (*Applicant Tracking Systems*), y entornos interactivos para la resolución y evaluación de retos de código algorítmico y código limpio.

La plataforma está diseñada con una arquitectura desacoplada de microservicios y clientes web que se comunican mediante WebRTC y APIs REST tipadas.

---

## 🚀 Funcionalidades Principales

### 1. Entrevistas de Voz en Tiempo Real con IA
* **Simulación Conversacional:** Conversación bidireccional por voz con agentes de IA a través de WebRTC de ultra baja latencia.
* **Modalidades de Creación:**
  * *Basada en Formulario:* Selección de rol objetivo, nivel de experiencia (*Junior, Mid, Senior, Lead*), stack tecnológico, enfoque de la entrevista (*Técnica, Conductual o Mixta*) y cantidad de preguntas.
  * *Basada en Voz:* Agente conversacional que recopila los parámetros del usuario interactivamente y configura la entrevista.
* **Retroalimentación Multidimensional:** Al finalizar la llamada, Google Gemini procesa la transcripción completa generando un informe de desempeño con puntuación global (0-100), evaluación por 5 categorías (*Comunicación, Conocimiento Técnico, Resolución de Problemas, Ajuste Cultural y Claridad*), fortalezas, áreas de mejora y dictamen final.
* **Evaluación de Nivel de Inglés (CEFR):** En entrevistas en inglés, genera en paralelo un reporte de competencia lingüística según el Marco Común Europeo (A1 a C2), con detección de errores gramaticales textuales y sugerencias de vocabulario técnico.
* **Personalidades e Idiomas:** Soporte en Español e Inglés con voces masculinas y femeninas (Alejandro, Catalina, Katie, Daniel).

### 2. Creador y Optimizador de CV (CV Creator)
* Asistente inteligente para la redacción de currículums estructurados bajo estándares internacionales de la industria tecnológica.
* Optimización de titulares profesionales (*headlines*), viñetas de logros laborales mediante verbos de acción fuertes y traducción integral del perfil.

### 3. Analizador de Hojas de Vida ATS (CV Analyzer)
* Procesamiento multimodal de archivos PDF o texto plano contrastados contra descripciones de ofertas de empleo reales.
* Cálculo de índice de compatibilidad ATS (0-100%), desglose de palabras clave coincidentes y faltantes, y sugerencias accionables de formato, impacto y gramática.

### 4. Evaluador de Retos de Programación (Code Challenge)
* Entorno de desarrollo integrado en el navegador basado en **Monaco Editor**.
* Ejecución de pruebas unitarias en tiempo real y evaluación técnica con IA sobre corrección algorítmica, complejidad temporal y espacial Big-O, y adherencia a principios de diseño limpio.

### 5. Portal de Empleos y Postulación Inteligente (En Construcción)
* **Exploración de Vacantes:** Directorio de ofertas de trabajo en tecnología con filtros por rol, nivel de experiencia, stack tecnológico, ubicación y modalidad remota.
* **Postulación Inteligente (1-Click Application):** Autocompletado asistido de formularios de postulación a partir de la información estructurada del perfil y el CV del candidato.
* **Cartas de Presentación con IA:** Generación automatizada de cartas de presentación (*Cover Letters*) personalizadas y alineadas a los requisitos de cada oferta.
* **Simulación de Entrevista por Vacante:** Capacidad de generar y lanzar instantáneamente una entrevista de voz simulada con IA enfocada en los requerimientos específicos de la oferta laboral seleccionada.
* **Índice de Compatibilidad:** Cálculo porcentual de ajuste entre el perfil del desarrollador y la vacante (*Puntaje de Compatibilidad*), identificando fortalezas y brechas técnicas antes de postularse.

### 6. Autenticación y Seguridad Híbrida
* Soporte nativo para inicio de sesión, registro y rutas protegidas.
* Compatible con **AWS Cognito** (User Pools + JWT) en producción y **Supabase Auth** (PostgreSQL) en desarrollo local.

---

## 🛠️ Tecnologías Utilizadas

| Capa / Componente | Tecnología | Propósito |
|---|---|---|
| **Frontend Framework** | Next.js 16 (App Router), React 19, TypeScript | Interfaz de usuario reactiva, Server Components y renderizado híbrido |
| **Estilos y Componentes** | Tailwind CSS v4, Framer Motion, Radix UI, shadcn/ui | Sistema de diseño moderno, animaciones y componentes accesibles |
| **Editor de Código** | Monaco Editor (`@monaco-editor/react`) | IDE interactivo para retos de programación en el navegador |
| **Backend API** | Express.js, TypeScript, Node.js 20+ | API REST central, servicios de dominio y control de autenticación |
| **Reconocimiento de Voz (STT)** | Deepgram Nova-2 | Transcripción de voz a texto en tiempo real |
| **Modelo Conversacional (LLM)** | Groq (LLaMA 3.3 70B Versatile) | Razonamiento y diálogo del entrevistador de voz |
| **Síntesis de Audio (TTS)** | Cartesia Sonic-2 | Generación de voz natural de ultra baja latencia |
| **Detección de Actividad Vocal** | Silero VAD | Manejo de turnos de conversación e interrupciones del usuario |
| **Transporte WebRTC** | LiveKit Cloud / LiveKit Agents SDK | Infraestructura de audio en tiempo real y señalización |
| **Inteligencia Artificial de Análisis** | Google Gemini Flash (`gemini-3.1-flash-lite`) | Generación de preguntas, reportes de feedback, análisis ATS y retos de código |
| **Bases de Datos** | AWS DynamoDB (Producción) / Supabase PostgreSQL (Desarrollo) | Persistencia políglota de usuarios, entrevistas y feedback |
| **Gestión de Identidad** | AWS Cognito User Pools / Supabase Auth | Autenticación y validación de tokens JWT |
| **Infraestructura como Código** | Terraform | Aprovisionamiento automatizado de infraestructura AWS |
| **Despliegue** | AWS ECS Fargate, ALB, Vercel | Orquestación de contenedores y despliegue en la nube |

---

## 🏗️ Novedades de la Segunda Entrega: Refactorización SOLID y Antipatrones

En esta segunda entrega se llevó a cabo una auditoría sistemática del código fuente de la Entrega 1, identificando y resolviendo **8 fallos de diseño** mediante la aplicación estricta de los **cinco principios SOLID** y la erradicación de antipatrones:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA REFACTORIZADA (ENTREGA 2)                        │
├────────────────────────┬────────────────────────┬────────────────────────────────┤
│ Capa de Controladores  │ Capa de Servicios      │ Capa de Abstracción / Infra    │
├────────────────────────┼────────────────────────┼────────────────────────────────┤
│ livekit.routes.ts      │ QuestionGeneratorSvc   │ IInterviewRepository (DIP/OCP) │
│ cv.routes.ts           │ CvOptimizationService  │ IFeedbackRepository  (DIP/LSP) │
│ auth.routes.ts         │ Domain Services        │ IUserRepository      (DIP/OCP) │
│ feedback.routes.ts     │ InterviewEvaluationSvc │ IAuthVerifier        (OCP/ISP) │
│ code.routes.ts         │ CodeChallengeService   │ IAIProvider          (DIP/OCP) │
│ LiveKit Voice Agent    │ VoiceAgentConfig       │ Spanish / English Strategy     │
└────────────────────────┴────────────────────────┴────────────────────────────────┘
```

### Resumen de los 8 Cambios Implementados (Control de Cambios):

* **CC-01 (DIP / OCP):** Se creó la interfaz `IInterviewRepository` y las implementaciones independientes `SupabaseInterviewRepository` y `DynamoInterviewRepository`, eliminando los condicionales `if-else` repetidos (*Shotgun Surgery*) en `interviews.service.ts`.
* **CC-02 (DIP / LSP):** Se abstrajo la persistencia de retroalimentación mediante `IFeedbackRepository`, desacoplando `feedback.service.ts` de librerías concretas (*Tight Coupling*).
* **CC-03 (DIP / OCP):** Se diseñó `IUserRepository` para encapsular el acceso a datos de usuarios, independizando los controladores de autenticación del motor de base de datos (*Hardcoded Data Access*).
* **CC-04 (SRP / DIP):** Se descompuso la clase dios `gemini.service.ts` (352 líneas) en 4 servicios especializados (`InterviewEvaluationService`, `EnglishProficiencyService`, `CvAnalysisService` y `CodeChallengeService`) comunicados a través del contrato `IAIProvider` (*God Class*).
* **CC-05 (SRP):** Se extrajo la lógica de creación y orquestación asíncrona de preguntas de `livekit.routes.ts` a `QuestionGeneratorService`, convirtiendo el endpoint en un controlador ligero (*Spaghetti Code / Smart Controller*).
* **CC-06 (SRP):** Se modularizó la optimización y traducción de currículums de `cv.routes.ts` hacia `CvOptimizationService` (*Fat Controller*).
* **CC-07 (OCP / ISP):** Se refactorizó la validación de tokens en `auth.middleware.ts` creando la interfaz `IAuthVerifier` con implementaciones polimórficas (`SupabaseAuthVerifier` y `CognitoAuthVerifier`), permitiendo agregar nuevos proveedores de autenticación sin modificar el código existente (*Hardcoded Fallback*).
* **CC-08 (SRP / OCP):** Se aisló la configuración de idiomas, prompts y voces del agente en tiempo real mediante `VoiceAgentConfigStrategy` (`SpanishVoiceStrategy` y `EnglishVoiceStrategy`), manteniendo `agent.ts` centrado únicamente en el flujo de audio WebRTC (*Feature Envy*).

---

## 📁 Estructura del Proyecto

```
DevCareer-AI/
├── frontend/                     # Aplicación Web Next.js 16
│   ├── app/                      # Rutas de la aplicación (App Router)
│   │   ├── (auth)/               # Pantallas de inicio de sesión y registro
│   │   ├── (root)/
│   │   │   ├── dashboard/        # Panel principal del usuario
│   │   │   ├── interview/        # Sala de entrevista de voz en vivo
│   │   │   ├── cv-analyzer/      # Analizador ATS de hojas de vida
│   │   │   ├── cv-creator/       # Creador de hojas de vida con IA
│   │   │   └── code-challenge/   # Retos de código interactivos
│   │   ├── api/                  # Endpoints de servidor Next.js
│   │   └── page.tsx              # Landing page
│   ├── components/               # Componentes UI reutilizables (Agent, Navbar, etc.)
│   ├── contexts/                 # Contextos de estado global (Auth, Interview)
│   └── lib/                      # Clientes de API REST y configuración
│
├── Backend/                      # Servidor API REST Express
│   └── src/
│       ├── config/               # Inicialización de clientes (Supabase, DynamoDB, Cognito)
│       ├── middleware/           # Middlewares de seguridad (IAuthVerifier, Rate Limiting)
│       ├── repositories/         # Capa de persistencia desacoplada (DIP / OCP)
│       │   ├── interview.repository.ts
│       │   ├── feedback.repository.ts
│       │   ├── user.repository.ts
│       │   ├── supabase/         # Implementaciones concretas para Supabase
│       │   ├── dynamo/           # Implementaciones concretas para DynamoDB
│       │   └── repository.factory.ts
│       ├── routes/               # Controladores HTTP delgados (Auth, LiveKit, CV, Code)
│       ├── services/             # Servicios de dominio
│       │   ├── ai/               # Módulo de IA desacoplado (SRP / DIP)
│       │   │   ├── ai-provider.interface.ts
│       │   │   ├── gemini.adapter.ts
│       │   │   ├── ai-provider.factory.ts
│       │   │   ├── interview-evaluation.service.ts
│       │   │   ├── english-proficiency.service.ts
│       │   │   ├── cv-analysis.service.ts
│       │   │   └── code-challenge.service.ts
│       │   ├── question-generator.service.ts
│       │   └── cv-optimization.service.ts
│       └── types/                # Entidades y tipos de TypeScript
│
├── livekit-agent/                # Agente de Voz en Tiempo Real (Worker)
│   ├── agent.ts                  # Orquestación de WebRTC y flujo de audio
│   └── strategies/               # Estrategias de voz y prompts (SRP / OCP)
│       └── voice-agent.strategy.ts
│
├── terraform-aws/                # Infraestructura como Código (AWS ECS, ALB, DynamoDB)
└── scripts/                      # Scripts de compilación, generación de PDFs y utilidades
```

---

## 💻 Guía de Ejecución en Entorno Local

### Prerrequisitos
* **Node.js:** Versión 20.x o superior.
* **npm:** Versión 10.x o superior.
* Cuentas y API Keys activas en los siguientes servicios externos:
  * [LiveKit Cloud](https://cloud.livekit.io/) (Señalización WebRTC).
  * [Deepgram](https://deepgram.com/) (Transcripción de voz Nova-2).
  * [Groq](https://groq.com/) (Inferencia ultrarrápida de LLaMA 3.3 70B).
  * [Cartesia](https://cartesia.ai/) (Síntesis de voz Sonic-2).
  * [Google AI Studio](https://aistudio.google.com/) (API Key de Gemini Flash).
  * [Supabase](https://supabase.com/) (Base de datos PostgreSQL y autenticación local).

---

### Paso a Paso de Instalación

#### 1. Clonar el repositorio
```bash
git clone https://github.com/hernangtrz/DevCareer-AI-AWS.git
cd DevCareer-AI-AWS
```

#### 2. Configurar la Base de Datos en Supabase
En el editor SQL de tu proyecto de Supabase, ejecuta el siguiente script para crear el esquema de tablas:

```sql
create table users (
  id text primary key,
  email text unique not null,
  name text,
  created_at timestamptz default now()
);

create table interviews (
  id text primary key,
  user_id text references users(id),
  role text,
  level text,
  techstack jsonb,
  type text,
  questions jsonb,
  finalized boolean default false,
  cover_image text,
  created_at timestamptz default now()
);

create table feedback (
  id text primary key,
  interview_id text references interviews(id),
  user_id text references users(id),
  total_score numeric,
  category_scores jsonb,
  strengths jsonb,
  areas_for_improvement jsonb,
  final_assessment text,
  english_feedback jsonb,
  created_at timestamptz default now()
);
```

#### 3. Configurar Variables de Entorno

Crear el archivo `Backend/.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-supabase-service-role-key
LIVEKIT_API_KEY=tu-livekit-api-key
LIVEKIT_API_SECRET=tu-livekit-api-secret
LIVEKIT_URL=https://tu-proyecto.livekit.cloud
GOOGLE_GENERATIVE_AI_API_KEY=tu-gemini-api-key
```

Crear el archivo `frontend/.env`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-supabase-anon-key
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_LIVEKIT_URL=https://tu-proyecto.livekit.cloud
GOOGLE_GENERATIVE_AI_API_KEY=tu-gemini-api-key
```

Crear el archivo `livekit-agent/.env`:
```env
LIVEKIT_URL=https://tu-proyecto.livekit.cloud
LIVEKIT_API_KEY=tu-livekit-api-key
LIVEKIT_API_SECRET=tu-livekit-api-secret
DEEPGRAM_API_KEY=tu-deepgram-api-key
GROQ_API_KEY=tu-groq-api-key
CARTESIA_API_KEY=tu-cartesia-api-key
BACKEND_URL=http://localhost:3001
```

#### 4. Iniciar los Servicios en Paralelo

Abre tres terminales independientes y ejecuta:

```bash
# Terminal 1: Servidor Backend (Express API)
cd Backend
npm install
npm run dev

# Terminal 2: Aplicación Frontend (Next.js)
cd frontend
npm install
npm run dev

# Terminal 3: Agente de Voz en Tiempo Real (LiveKit Worker)
cd livekit-agent
npm install
npm run dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) para acceder a la aplicación.

---

## 🌐 Proceso de Despliegue en Producción

La infraestructura de producción en Amazon Web Services (AWS) está completamente automatizada mediante **Terraform**:

```
AWS Cloud
├── VPC (Public & Private Subnets en 2 AZs)
├── Application Load Balancer (ALB) con HTTPS
├── ECS Fargate Cluster (Contenedores Backend y LiveKit Agent)
├── Amazon DynamoDB (Tablas de Usuarios, Entrevistas y Feedback)
└── Amazon Cognito (User Pool con autenticación JWT administrada)
```

### Pasos para Despliegue con Terraform:

```bash
cd terraform-aws
terraform init
terraform plan
terraform apply
```


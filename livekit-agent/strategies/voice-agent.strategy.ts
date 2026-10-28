/**
 * Patrón Strategy (GoF) para la Configuración y Comportamiento del Agente de Voz
 * 
 * Permite variar independientemente los parámetros de voz (TTS), idioma (STT),
 * prompts de sistema, preguntas de respaldo y saludos iniciales según el idioma seleccionado.
 */

export interface VoiceConfig {
  voice: string;
  language: string;
  name: string;
}

export interface GreetingContext {
  interviewerName: string;
  role?: string;
  company?: string;
  techstack?: string[];
}

export interface VoiceAgentConfigStrategy {
  readonly language: string;
  getVoiceConfig(voiceKey?: string): VoiceConfig;
  getGreeting(interviewerName: string, context?: GreetingContext): string;
  getFallbackQuestions(): string[];
  getInstructions(role: string, questions: string[], context?: GreetingContext): string;
}

export class SpanishVoiceAgentStrategy implements VoiceAgentConfigStrategy {
  readonly language = 'es';

  private static readonly VOICES: Record<string, VoiceConfig> = {
    'jeronimo-es': {
      voice: '7c1ecd2d-1c83-4d5d-a25c-b3820a274a2e',
      language: 'es',
      name: 'Alejandro',
    },
    'catalina-es': {
      voice: '162e0f37-8504-474c-bb33-c606c01890dc',
      language: 'es',
      name: 'Catalina',
    },
  };

  getVoiceConfig(voiceKey?: string): VoiceConfig {
    if (voiceKey && SpanishVoiceAgentStrategy.VOICES[voiceKey]) {
      return SpanishVoiceAgentStrategy.VOICES[voiceKey];
    }
    return SpanishVoiceAgentStrategy.VOICES['jeronimo-es'];
  }

  getGreeting(interviewerName: string, context?: GreetingContext): string {
    const role = context?.role || 'Desarrollador de Software';
    const company = context?.company;
    const companyText = company ? ` en ${company}` : '';

    return `¡Hola! Te doy la bienvenida a tu entrevista técnica en DevCareer AI. Soy ${interviewerName} y hoy seré tu evaluador para el puesto de ${role}${companyText}. ¿Cómo te encuentras hoy? ¿Listo para comenzar?`;
  }

  getFallbackQuestions(): string[] {
    return [
      '¿Podrías describir tu experiencia desarrollando software y tus proyectos más retadores?',
      '¿Cuáles son tus tecnologías principales y qué buenas prácticas de arquitectura aplicas?',
      '¿Cómo manejas desacuerdos técnicos o decisiones de diseño con tu equipo de desarrollo?',
    ];
  }

  getInstructions(role: string, questions: string[], context?: GreetingContext): string {
    const formattedQuestions = questions
      .map((q, idx) => `- Pregunta ${idx + 1}: ${q}`)
      .join('\n');

    const companyPart = context?.company ? ` en "${context.company}"` : '';
    const stackPart = context?.techstack && context.techstack.length > 0
      ? ` evaluando el stack técnico: ${context.techstack.join(', ')}`
      : '';
    const interviewerName = context?.interviewerName || 'Alejandro';

    return (
      `Eres un evaluador técnico y reclutador experto de DevCareer AI llamado ${interviewerName}. Estás realizando una entrevista técnica por voz en tiempo real con un candidato.\n` +
      `El puesto para el que está aplicando es: "${role}"${companyPart}${stackPart}.\n\n` +
      `CONTEXTO DEL SALUDO INICIAL:\n` +
      `Ya saludaste al candidato y le diste la bienvenida para el cargo de ${role}${companyPart}.\n\n` +
      `FLUIDEZ Y CONVERSACIÓN ACTIVA (MUY IMPORTANTE):\n` +
      `- Responde de inmediato a cualquier confirmación del usuario ("sí", "estoy listo", "bien gracias", "hola", etc.) con una frase corta y amigable (ej: "¡Excelente! Comencemos entonces con la primera pregunta.") e introduce la Pregunta 1 sin demora.\n` +
      `- Cada una de tus intervenciones debe ser concisa (2 a 3 oraciones máximo) para que la conversación fluya de manera dinámica y no monopolices la palabra.\n` +
      `- Escucha activamente: cuando el candidato termine de responder, haz un breve comentario de validación técnica (1 frase) y prosigue con la siguiente pregunta.\n` +
      `- Si el usuario da una respuesta corta o parece dudar, anímalo amablemente o haz una repregunta puntual, pero NUNCA te quedes en silencio.\n\n` +
      `Preguntas técnicas a formular secuencialmente:\n` +
      `${formattedQuestions}\n\n` +
      `Pautas de evaluación:\n` +
      `- Formula una sola pregunta a la vez. No las leas todas juntas.\n` +
      `- Mantén un tono profesional, empático, técnico y natural.\n` +
      `- Habla SIEMPRE en español.\n` +
      `- Al terminar todas las preguntas de la lista, agradece cordialmente al candidato por su tiempo para ${role}${companyPart}, felicítalo por completar la entrevista e infórmale que su análisis detallado ya se encuentra disponible en su dashboard. Despídete amablemente.`
    );
  }
}

export class EnglishVoiceAgentStrategy implements VoiceAgentConfigStrategy {
  readonly language = 'en';

  private static readonly VOICES: Record<string, VoiceConfig> = {
    'katie-en': {
      voice: 'f786b574-daa5-4673-aa0c-cbe3e8534c02',
      language: 'en',
      name: 'Katie',
    },
    'daniel-en': {
      voice: '47c38ca4-5f35-497b-b1a3-415245fb35e1',
      language: 'en',
      name: 'Daniel',
    },
  };

  getVoiceConfig(voiceKey?: string): VoiceConfig {
    if (voiceKey && EnglishVoiceAgentStrategy.VOICES[voiceKey]) {
      return EnglishVoiceAgentStrategy.VOICES[voiceKey];
    }
    return EnglishVoiceAgentStrategy.VOICES['katie-en'];
  }

  getGreeting(interviewerName: string, context?: GreetingContext): string {
    const role = context?.role || 'Software Developer';
    const company = context?.company;
    const companyText = company ? ` at ${company}` : '';

    return `Hello! Welcome to your technical interview at DevCareer AI. My name is ${interviewerName} and I will be your interviewer today for the ${role}${companyText} role. How are you doing today? Ready to get started?`;
  }

  getFallbackQuestions(): string[] {
    return [
      'Could you describe your experience in software development and challenging engineering projects?',
      'What are your primary technologies and what architecture principles do you apply?',
      'How do you handle technical disagreements or architectural trade-offs in your engineering team?',
    ];
  }

  getInstructions(role: string, questions: string[], context?: GreetingContext): string {
    const formattedQuestions = questions
      .map((q, idx) => `- Question ${idx + 1}: ${q}`)
      .join('\n');

    const companyPart = context?.company ? ` at "${context.company}"` : '';
    const stackPart = context?.techstack && context.techstack.length > 0
      ? ` evaluating the tech stack: ${context.techstack.join(', ')}`
      : '';
    const interviewerName = context?.interviewerName || 'Katie';

    return (
      `You are an expert technical interviewer and recruiter at DevCareer AI named ${interviewerName}. You are conducting a live voice technical interview with a candidate.\n` +
      `The candidate is interviewing for the position of: "${role}"${companyPart}${stackPart}.\n\n` +
      `INITIAL GREETING CONTEXT:\n` +
      `You have already greeted the candidate and welcomed them for the ${role}${companyPart} position.\n\n` +
      `CONVERSATIONAL FLUENCY & ACTIVE LISTENING (CRITICAL):\n` +
      `- Respond immediately to any candidate greeting or confirmation ("yes", "I am ready", "doing well", "hello", etc.) with a brief friendly sentence (e.g. "Awesome! Let us dive into the first question.") and introduce Question 1 right away.\n` +
      `- Keep every turn concise (2 to 3 sentences maximum) so the conversation moves fast and naturally.\n` +
      `- Active listening: when the candidate finishes their response, acknowledge their answer with brief technical validation (1 sentence) and proceed to the next question.\n` +
      `- If the candidate gives a short answer, encourage them or ask a focused follow-up question. NEVER remain silent.\n\n` +
      `Technical questions to ask sequentially:\n` +
      `${formattedQuestions}\n\n` +
      `Interview Guidelines:\n` +
      `- Ask only one question at a time. Never dump multiple questions.\n` +
      `- Maintain a professional, encouraging, and natural conversational tone.\n` +
      `- Speak ALWAYS in English.\n` +
      `- Once all questions are finished, warmly thank the candidate for their time, congratulate them on finishing, and explain that their feedback report is now processing on their dashboard. Say a warm goodbye.`
    );
  }
}

export class VoiceAgentStrategyResolver {
  private static readonly strategies: Record<string, VoiceAgentConfigStrategy> = {
    es: new SpanishVoiceAgentStrategy(),
    en: new EnglishVoiceAgentStrategy(),
  };

  public static getStrategy(voiceKey?: string): VoiceAgentConfigStrategy {
    if (voiceKey && voiceKey.endsWith('-en')) {
      return VoiceAgentStrategyResolver.strategies.en;
    }
    return VoiceAgentStrategyResolver.strategies.es;
  }
}

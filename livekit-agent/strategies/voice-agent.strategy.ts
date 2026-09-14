/**
 * voice-agent.strategy.ts
 * Refactorización CC-08 (Principios SOLID: SRP y OCP).
 * Desacopla la configuración de voces, idiomas y guiones del ciclo de transporte WebRTC del agente.
 */

export interface VoiceConfig {
  voice: string;
  language: string;
  name: string;
}

export interface VoiceAgentConfigStrategy {
  readonly language: string;
  getVoiceConfig(voiceKey?: string): VoiceConfig;
  getGreeting(interviewerName: string): string;
  getFallbackQuestions(): string[];
  getInstructions(role: string, questions: string[]): string;
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

  getGreeting(interviewerName: string): string {
    return `Hola, bienvenido a tu entrevista de simulación en DevCareer AI. Soy ${interviewerName} y hoy seré tu entrevistador. ¿Estás listo para comenzar con la primera pregunta?`;
  }

  getFallbackQuestions(): string[] {
    return [
      '¿Podrías describirme tu experiencia en el desarrollo de software?',
      '¿Cuáles son tus tecnologías favoritas y por qué?',
      '¿Cómo manejas situaciones de desacuerdo con tu equipo técnico?',
    ];
  }

  getInstructions(role: string, questions: string[]): string {
    const formattedQuestions = questions
      .map((q, idx) => `- Pregunta ${idx + 1}: ${q}`)
      .join('\n');

    return (
      `Eres un entrevistador profesional y reclutador técnico experto de DevCareer AI. Estás conduciendo una entrevista en tiempo real con un candidato.\n` +
      `El puesto para el que está aplicando es: "${role}".\n\n` +
      `Debes realizar las siguientes preguntas secuencialmente en el orden establecido, esperando a que el usuario responda a cada una antes de pasar a la siguiente:\n` +
      `${formattedQuestions}\n\n` +
      `Pautas importantes:\n` +
      `- Saluda al usuario cordialmente y pregúntale si está listo.\n` +
      `- Formula una pregunta a la vez. No las leas todas juntas.\n` +
      `- Escucha la respuesta del usuario de forma activa. Reconócela o haz un comentario muy breve antes de pasar a la siguiente pregunta.\n` +
      `- Si su respuesta es demasiado corta o vaga, puedes hacer una pregunta de seguimiento muy breve sobre el tema.\n` +
      `- Mantén las respuestas de tu parte muy cortas (máximo 2 frases) para que sea un diálogo ágil.\n` +
      `- Sé profesional pero amable y motivador.\n` +
      `- Habla SIEMPRE en español. No uses inglés.\n` +
      `- Al finalizar todas las preguntas, agradece formalmente al usuario por su tiempo, dile que su entrevista ha concluido y que el sistema generará su reporte en el dashboard de inmediato. Despídete amablemente.`
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

  getGreeting(interviewerName: string): string {
    return `Hello, welcome to your simulation interview at DevCareer AI. I am ${interviewerName} and I will be your interviewer today. Are you ready to begin with the first question?`;
  }

  getFallbackQuestions(): string[] {
    return [
      'Could you describe your experience in software development?',
      'What are your favorite technologies and why?',
      'How do you handle disagreements with your technical team?',
    ];
  }

  getInstructions(role: string, questions: string[]): string {
    const formattedQuestions = questions
      .map((q, idx) => `- Question ${idx + 1}: ${q}`)
      .join('\n');

    return (
      `You are a professional interviewer and expert technical recruiter from DevCareer AI. You are conducting a real-time voice interview with a candidate.\n` +
      `The position they are applying for is: "${role}".\n\n` +
      `You must ask the following questions sequentially in the order established, waiting for the user to respond to each before moving to the next:\n` +
      `${formattedQuestions}\n\n` +
      `Important guidelines:\n` +
      `- Greet the user cordially and ask if they are ready.\n` +
      `- Ask one question at a time. Do not read them all together.\n` +
      `- Listen to the user's response actively. Acknowledge it or make a very brief comment before asking the next question.\n` +
      `- If their answer is too short or vague, you can ask a very brief follow-up question on the topic.\n` +
      `- Keep your responses very short (maximum 2 sentences) to make it an active dialogue.\n` +
      `- Be professional but polite and encouraging.\n` +
      `- Speak ALWAYS in English. Do not use Spanish.\n` +
      `- Upon completing all questions, formally thank the user for their time, tell them that the interview has concluded and the system will generate their report in the dashboard immediately. Say goodbye politely.`
    );
  }
}

export class VoiceAgentStrategyResolver {
  private static readonly strategies: Record<string, VoiceAgentConfigStrategy> = {
    'es': new SpanishVoiceAgentStrategy(),
    'en': new EnglishVoiceAgentStrategy(),
  };

  static getStrategy(voiceKey: string): VoiceAgentConfigStrategy {
    const isEnglish = voiceKey.endsWith('-en');
    return isEnglish ? this.strategies['en'] : this.strategies['es'];
  }
}


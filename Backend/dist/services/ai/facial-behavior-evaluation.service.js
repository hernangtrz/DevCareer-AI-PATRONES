"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FacialBehaviorEvaluationService = void 0;
const ai_provider_factory_1 = require("./ai-provider.factory");
/**
 * ============================================================================
 * SERVICIO ESPECIALIZADO: FacialBehaviorEvaluationService (SRP)
 * ============================================================================
 * Interpreta la telemetría facial y cinemática (FACS, 52 blendshapes, orientación 3D)
 * para transformarla en retroalimentación empática, accionable y profesional.
 */
class FacialBehaviorEvaluationService {
    constructor(aiProvider = ai_provider_factory_1.AIProviderFactory.getProvider()) {
        this.aiProvider = aiProvider;
    }
    async evaluate(params) {
        const { facialMetrics, role = "Desarrollador de Software", isEnglish = false } = params;
        // Validación de suficiencia de telemetría (mínimo ~30 frames con rostro y 25% de presencia)
        if (!facialMetrics ||
            !facialMetrics.enabled ||
            facialMetrics.validFaceFrames < 25 ||
            facialMetrics.facePresenceRatio < 0.2) {
            return this.buildInsufficientDataFeedback(facialMetrics, isEnglish);
        }
        try {
            const prompt = this.buildPrompt(facialMetrics, role, isEnglish);
            const aiResponse = await this.aiProvider.generateJson([{ text: prompt }], { temperature: 0.3 });
            return {
                overallScore: aiResponse.overallScore ?? facialMetrics.scores.overallPresence ?? 80,
                expressiveProfile: aiResponse.expressiveProfile || (isEnglish ? "Calm & Natural" : "Sereno y Natural"),
                summaryComment: aiResponse.summaryComment || (isEnglish ? "Solid non-verbal presence throughout the interview." : "Buena presencia y lenguaje no verbal durante la entrevista."),
                metrics: {
                    eyeContact: facialMetrics.scores.eyeContact,
                    composure: facialMetrics.scores.composure,
                    gestureBalance: facialMetrics.scores.gestureBalance,
                    postureStability: facialMetrics.scores.postureStability,
                    warmth: facialMetrics.scores.warmth,
                    blinkRatePerMin: facialMetrics.indicators.blinkRatePerMin,
                    facePresencePercent: Math.round(facialMetrics.facePresenceRatio * 100),
                },
                strengths: aiResponse.strengths || [isEnglish ? "Consistent eye contact with the camera" : "Contacto visual sostenido con la cámara"],
                habitsToImprove: aiResponse.habitsToImprove || [isEnglish ? "Relax facial tension when tackling challenging questions" : "Relajar la tensión facial al abordar preguntas complejas"],
                coachingTips: aiResponse.coachingTips || [isEnglish ? "Take a 1-second pause before answering to reset posture" : "Toma 1 segundo de pausa antes de responder para relajar hombros"],
                keyMoments: aiResponse.keyMoments || [],
                timeline: facialMetrics.timeline || [],
            };
        }
        catch (err) {
            console.warn("[FacialBehaviorEvaluationService] Error en inferencia LLM, usando fallback determinístico:", err?.message);
            return this.buildDeterministicFallback(facialMetrics, isEnglish);
        }
    }
    buildPrompt(metrics, role, isEnglish) {
        const s = metrics.scores;
        const ind = metrics.indicators;
        const peakEventsFormatted = (metrics.peakEvents || [])
            .map((p) => `- Segundo ${p.timestampSec}s: Tipo [${p.type}], Severidad [${p.severity}], Duración [${p.durationSec}s]${p.contextSnippet ? ` (Contexto: "${p.contextSnippet}")` : ""}`)
            .join("\n");
        if (isEnglish) {
            return `You are an expert executive communication coach analyzing non-verbal behavior and facial telemetry from a simulated interview for a ${role} position.
The candidate was evaluated using Edge AI (MediaPipe Face Landmarker FACS blendshapes + 3D kinematics).

Telemetry Data:
- Overall Non-Verbal Presence: ${s.overallPresence}/100
- Eye Contact Score: ${s.eyeContact}/100
- Composure & Tension Control: ${s.composure}/100 (Average Tension Index: ${ind.avgTensionIndex})
- Gesture Balance: ${s.gestureBalance}/100 (Profile: ${ind.gestureProfile}, Head Volatility: ${ind.headMovementVolatility} deg/s)
- Posture Stability: ${s.postureStability}/100
- Expressive Warmth: ${s.warmth}/100
- Blink Rate: ${ind.blinkRatePerMin} blinks/min (normal range: 14-22)
- Speaking vs Listening Tension: Speaking Tension ${ind.speakingVsListening.speakingTensionAvg} vs Listening Eye Contact ${ind.speakingVsListening.listeningEyeContactAvg}/100
- Notable Tension/Gaze Peaks:
${peakEventsFormatted || "None detected (stable demeanor)"}

Provide empathetic, constructive, professional executive coaching. Do not use clinical or pseudoscientific terms (avoid "lying", "anxiety disorder"). Focus on actionable workplace communication.
Respond ONLY with a valid JSON matching this schema:
{
  "overallScore": number,
  "expressiveProfile": string,
  "summaryComment": string,
  "strengths": [string],
  "habitsToImprove": [string],
  "coachingTips": [string],
  "keyMoments": [
    { "timestampSec": number, "label": string, "observation": string }
  ]
}`;
        }
        return `Eres un coach experto en comunicación ejecutiva y lenguaje no verbal para entrevistas de tecnología analizando a un candidato para el puesto de ${role}.
El candidato fue evaluado mediante visión por computadora en el navegador (MediaPipe Face Landmarker, FACS y cinemática 3D).

Datos de Telemetría:
- Presencia No Verbal Global: ${s.overallPresence}/100
- Puntuación de Contacto Visual: ${s.eyeContact}/100
- Control de Tensión y Serenidad: ${s.composure}/100 (Índice promedio de tensión: ${ind.avgTensionIndex})
- Equilibrio Gestual: ${s.gestureBalance}/100 (Perfil: ${ind.gestureProfile}, Volatilidad de cabeza: ${ind.headMovementVolatility} °/seg)
- Estabilidad Postural: ${s.postureStability}/100
- Calidez Expresiva: ${s.warmth}/100
- Tasa de Parpadeo: ${ind.blinkRatePerMin} parpadeos/min (rango normal: 14-22)
- Tensión Hablando vs Escuchando: Tensión al hablar ${ind.speakingVsListening.speakingTensionAvg} vs Contacto visual al escuchar ${ind.speakingVsListening.listeningEyeContactAvg}/100
- Eventos Pico de Tensión/Desvío de Mirada:
${peakEventsFormatted || "Ninguno relevante (conducta estable)"}

Genera un diagnóstico constructivo, empático y accionable. No uses diagnósticos clínicos ni afirmaciones pseudocientíficas (evita "ansiedad clínica", "estaba mintiendo"). Céntrate en proyección profesional y serenidad.
Responde ÚNICAMENTE con un JSON válido con este formato exacto:
{
  "overallScore": number,
  "expressiveProfile": string,
  "summaryComment": string,
  "strengths": [string],
  "habitsToImprove": [string],
  "coachingTips": [string],
  "keyMoments": [
    { "timestampSec": number, "label": string, "observation": string }
  ]
}`;
    }
    buildInsufficientDataFeedback(metrics, isEnglish) {
        return {
            overallScore: 70,
            expressiveProfile: isEnglish ? "Audio Only / Limited Camera" : "Solo Audio / Muestra Limitada",
            summaryComment: isEnglish
                ? "Video feed had limited face presence. To receive in-depth non-verbal coaching, ensure good front lighting and center your camera."
                : "La cámara estuvo apagada o el rostro no estuvo visible el tiempo suficiente. Para un análisis completo, mantén buena iluminación frontal y encuadre centrado.",
            metrics: {
                eyeContact: metrics?.scores?.eyeContact || 70,
                composure: metrics?.scores?.composure || 70,
                gestureBalance: metrics?.scores?.gestureBalance || 70,
                postureStability: metrics?.scores?.postureStability || 70,
                warmth: metrics?.scores?.warmth || 70,
                blinkRatePerMin: metrics?.indicators?.blinkRatePerMin || 16,
                facePresencePercent: Math.round((metrics?.facePresenceRatio || 0) * 100),
            },
            strengths: [
                isEnglish
                    ? "Good vocal engagement maintained during the session"
                    : "Excelente interacción y tono de voz durante la sesión",
            ],
            habitsToImprove: [
                isEnglish
                    ? "Keep your camera centered and at eye level in future sessions"
                    : "Mantener la cámara encendida a la altura de los ojos en próximas sesiones",
            ],
            coachingTips: [
                isEnglish
                    ? "Position your camera at eye level with front-facing light for full non-verbal feedback"
                    : "Ubica la webcam al nivel de tus ojos y con luz frontal para recibir retroalimentación visual completa",
            ],
            keyMoments: [],
            timeline: metrics?.timeline || [],
        };
    }
    buildDeterministicFallback(metrics, isEnglish) {
        const s = metrics.scores;
        const isTense = s.composure < 70;
        const isLowContact = s.eyeContact < 65;
        const isOverExpressive = metrics.indicators.gestureProfile === "over_expressive";
        const strengths = [];
        const habits = [];
        const tips = [];
        if (!isTense) {
            strengths.push(isEnglish
                ? "Good facial composure maintained under technical questioning"
                : "Excelente serenidad y control facial al responder preguntas técnicas");
        }
        else {
            habits.push(isEnglish
                ? "Noticeable brow and jaw tension when processing difficult questions"
                : "Tensión en el ceño y mandíbula al pensar respuestas complejas");
            tips.push(isEnglish
                ? "Inhale deeply and consciously drop your shoulders before each technical answer"
                : "Inhala profundamente y relaja hombros y mandíbula antes de cada explicación");
        }
        if (!isLowContact) {
            strengths.push(isEnglish
                ? "Solid and professional eye connection with the interviewer"
                : "Contacto visual sólido y profesional con la cámara");
        }
        else {
            habits.push(isEnglish
                ? "Frequent downward or lateral gaze deviations when formulating answers"
                : "Desvíos de mirada hacia abajo o los lados al formular ideas");
            tips.push(isEnglish
                ? "Place the browser window close to your physical webcam to naturally anchor your gaze"
                : "Ubica la ventana del navegador cerca del lente físico de la cámara para anclar tu mirada");
        }
        if (isOverExpressive) {
            habits.push(isEnglish
                ? "Rapid head gestures that may project restlessness"
                : "Movimientos bruscos o frecuentes de cabeza que pueden transmitir inquietud");
            tips.push(isEnglish
                ? "Ground your hands on the desk to provide natural physical stability"
                : "Apoya suavemente las manos en el escritorio para lograr mayor estabilidad postural");
        }
        else {
            strengths.push(isEnglish
                ? "Balanced and natural gestures that support your technical credibility"
                : "Gesticulación equilibrada y natural que refuerza tu credibilidad técnica");
        }
        if (habits.length === 0) {
            habits.push(isEnglish
                ? "Occasional gaze reset when transitioning between complex architectural topics"
                : "Micro-pausas de contacto visual al estructurar explicaciones arquitectónicas complejas");
        }
        if (tips.length === 0) {
            tips.push(isEnglish
                ? "Maintain this executive presence and complement it with structured STAR summaries"
                : "Conserva esta sólida presencia ejecutiva y compleméntala con cierres técnicos estructurados");
        }
        return {
            overallScore: s.overallPresence,
            expressiveProfile: isTense
                ? isEnglish
                    ? "Mild Tension Under Pressure"
                    : "Tensión Moderada Bajo Presión"
                : isEnglish
                    ? "Serene & Executive Presence"
                    : "Presencia Ejecutiva y Serena",
            summaryComment: isEnglish
                ? `Overall presence scored at ${s.overallPresence}/100. Eye contact was ${s.eyeContact}/100 with a composure rating of ${s.composure}/100.`
                : `Tu presencia global obtuvo un puntaje de ${s.overallPresence}/100. Mantuviste un contacto visual de ${s.eyeContact}/100 y un índice de serenidad de ${s.composure}/100.`,
            metrics: {
                eyeContact: s.eyeContact,
                composure: s.composure,
                gestureBalance: s.gestureBalance,
                postureStability: s.postureStability,
                warmth: s.warmth,
                blinkRatePerMin: metrics.indicators.blinkRatePerMin,
                facePresencePercent: Math.round(metrics.facePresenceRatio * 100),
            },
            strengths,
            habitsToImprove: habits,
            coachingTips: tips,
            keyMoments: (metrics.peakEvents || []).map((e) => ({
                timestampSec: e.timestampSec,
                label: e.type === "high_tension" ? "Pico de Tensión Facial" : "Desvío de Mirada",
                observation: e.contextSnippet ? `Durante: "${e.contextSnippet}"` : "Momento de alta concentración",
            })),
            timeline: metrics.timeline || [],
        };
    }
}
exports.FacialBehaviorEvaluationService = FacialBehaviorEvaluationService;
//# sourceMappingURL=facial-behavior-evaluation.service.js.map
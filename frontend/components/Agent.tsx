"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { createFeedback } from "@/lib/api";
import { getFreshAuthToken } from "@/lib/cognito";
import {
  MOTION_SPRING,
  MOTION_TRANSITION,
  resolveMotionTransition,
} from "@/lib/motion-tokens";
import {
  Phone,
  PhoneOff,
  Sparkles,
  Loader2,
  Globe,
  Headphones,
  Mic,
  MicOff,
  Clock,
  ShieldCheck,
  Briefcase,
  Code2,
  Camera,
  CameraOff,
  Volume2,
  RotateCcw,
} from "lucide-react";
import { FacialMonitorPanel } from "./FacialMonitorPanel";
import VoiceAudioWave from "./VoiceAudioWave";
import AiLoader from "./AiLoader";
import { useFacialBehaviorAnalyzer } from "@/lib/facial/useFacialBehaviorAnalyzer";
import {
  Room,
  RoomEvent,
  Participant,
  RemoteParticipant,
  LocalParticipant,
  Track,
  ConnectionState,
  TranscriptionSegment,
} from "livekit-client";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
  GENERATING_FEEDBACK = "GENERATING_FEEDBACK",
}

interface SavedMessage {
  id?: string;
  role: "user" | "system" | "assistant";
  content: string;
}

const VOICE_OPTIONS = [
  { key: "jeronimo-es", label: "Alejandro — Español LatAm (Hombre)", lang: "es", name: "Alejandro" },
  { key: "catalina-es", label: "Catalina — Español LatAm (Mujer)", lang: "es", name: "Catalina" },
  { key: "katie-en", label: "Katie — English US (Female)", lang: "en", name: "Katie" },
  { key: "daniel-en", label: "Daniel — English US (Male)", lang: "en", name: "Daniel" },
];

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
  role = "Backend Developer",
  company = "",
  level = "Mid-Senior",
  interviewType = "Técnica",
  techstack = [],
}: AgentProps) => {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [agentLiveState, setAgentLiveState] = useState<
    "initializing" | "listening" | "thinking" | "speaking"
  >("initializing");
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [latestSpeaker, setLatestSpeaker] = useState<"agent" | "user">("agent");
  const messagesRef = useRef<SavedMessage[]>([]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const [selectedVoice, setSelectedVoice] = useState("catalina-es");
  const [lkRoom, setLkRoom] = useState<Room | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [candidateAudioTrack, setCandidateAudioTrack] = useState<MediaStreamTrack | null>(null);
  const [agentAudioTrack, setAgentAudioTrack] = useState<MediaStreamTrack | null>(null);

  // Aislamiento de voz inteligente (BVC - Krisp AI server-side)
  const [isVoiceIsolationEnabled, setIsVoiceIsolationEnabled] = useState(true);

  // Monitor de salud del agente de voz
  const [agentHealth, setAgentHealth] = useState<{
    status: "ok" | "recovering" | "error";
    message?: string;
  }>({ status: "ok" });

  // Mapa de segmentos de transcripción deduplicados por segmentId (evita colisiones y pérdida de frases)
  const usingTextStreamRef = useRef<boolean>(false);
  const hasAgentStateAttrRef = useRef<boolean>(false);
  const autoEndingRef = useRef<boolean>(false);
  const lkRoomRef = useRef<Room | null>(null);
  const audioElementsRef = useRef<Set<HTMLMediaElement>>(new Set());
  const healthResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanupAudioElements = useCallback(() => {
    setCandidateAudioTrack(null);
    setAgentAudioTrack(null);
    audioElementsRef.current.forEach((el) => {
      try {
        el.pause();
        el.remove();
      } catch {
        // ignore cleanup errors
      }
    });
    audioElementsRef.current.clear();
  }, []);

  const disconnectRoomSafely = useCallback((roomToClose?: Room | null) => {
    const targetRoom = roomToClose ?? lkRoomRef.current;
    if (lkRoomRef.current === targetRoom) {
      lkRoomRef.current = null;
    }
    setLkRoom((prev) => (prev === targetRoom ? null : prev));
    if (targetRoom && targetRoom.state !== ConnectionState.Disconnected) {
      targetRoom.disconnect(true).catch(() => {});
    }
  }, []);

  // Limpieza segura de WebRTC y elementos <audio> al desmontar
  useEffect(() => {
    return () => {
      if (healthResetTimerRef.current) clearTimeout(healthResetTimerRef.current);
      cleanupAudioElements();
      disconnectRoomSafely();
    };
  }, [cleanupAudioElements, disconnectRoomSafely]);

  // Estado de análisis facial (Edge AI)
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showMeshOverlay, setShowMeshOverlay] = useState(false);

  const facial = useFacialBehaviorAnalyzer({
    isEnabled: isCameraActive,
    isCallActive: callStatus === CallStatus.ACTIVE,
    isSpeaking: isCandidateSpeaking || latestSpeaker === "user",
    elapsedSeconds,
    currentTranscriptSnippet: messages[messages.length - 1]?.content || "",
    showMeshOverlay,
  });

  const finalizeSummaryRef = useRef(facial.finalizeSummary);
  useEffect(() => {
    finalizeSummaryRef.current = facial.finalizeSummary;
  }, [facial.finalizeSummary]);

  // Active call duration timer
  useEffect(() => {
    if (callStatus !== CallStatus.ACTIVE) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [callStatus]);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleMic = async () => {
    if (!lkRoom || callStatus !== CallStatus.ACTIVE) return;
    try {
      const nextMuted = !isMicMuted;
      await lkRoom.localParticipant.setMicrophoneEnabled(!nextMuted);
      setIsMicMuted(nextMuted);
      if (nextMuted) {
        setCandidateAudioTrack(null);
      } else {
        const micPub = lkRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
        setCandidateAudioTrack(micPub?.track?.mediaStreamTrack ?? null);
      }
    } catch (e) {
      console.warn("Could not toggle mic:", e);
    }
  };

  // Enviar comandos al watchdog del agente por DataChannel
  const sendInterviewControl = useCallback(
    async (command: "repeat_last" | "resume_turn") => {
      if (!lkRoom || callStatus !== CallStatus.ACTIVE) return;
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ action: command, type: command, timestamp: Date.now() })
        );
        await lkRoom.localParticipant.publishData(payload, {
          reliable: true,
          topic: "interview-control",
        });
      } catch (e) {
        console.warn("[Agent] Failed to send interview-control command:", e);
      }
    },
    [lkRoom, callStatus]
  );

  const handleGenerateFeedback = useCallback(
    async (msgs: SavedMessage[]) => {
      console.log("[Agent] Generando reporte y feedback de entrevista...");
      setCallStatus(CallStatus.GENERATING_FEEDBACK);

      try {
        const idToken = await getFreshAuthToken();
        const cleanMsgs = msgs.map(({ role, content }) => ({ role, content }));
        const voiceOpt = VOICE_OPTIONS.find((opt) => opt.key === selectedVoice);
        const language = voiceOpt ? voiceOpt.lang : "es";

        const facialSummary = finalizeSummaryRef.current();
        const res = await createFeedback(
          {
            interviewId: interviewId!,
            transcript: cleanMsgs,
            language,
            facialMetrics:
              facialSummary.enabled && facialSummary.validFaceFrames > 0
                ? facialSummary
                : undefined,
          },
          idToken || undefined
        );

        if (res && res.success) {
          router.push(`/interview/${interviewId}/feedback`);
        } else if (res?.unauthorized) {
          toast.error("Tu sesión expiró", {
            description:
              "Vuelve a iniciar sesión para guardar tu evaluación de entrevista.",
          });
          router.push("/sign-in");
        } else {
          toast.error("No se pudo generar el feedback", {
            description:
              "Ocurrió un error al procesar la evaluación. Inténtalo nuevamente.",
          });
          router.push("/dashboard");
        }
      } catch (e) {
        console.error(e);
        toast.error("Error al generar el feedback");
        router.push("/dashboard");
      }
    },
    [interviewId, router, selectedVoice]
  );

  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push("/dashboard");
      } else {
        handleGenerateFeedback(messagesRef.current);
      }
    }
  }, [callStatus, handleGenerateFeedback, router, type]);

  const upsertTranscriptSegment = useCallback(
    (segmentId: string, sender: "user" | "assistant", text: string) => {
      const cleaned = text.trim();
      if (!cleaned) return;
      setLatestSpeaker(sender === "user" ? "user" : "agent");

      setMessages((prev) => {
        const existingIdx = prev.findIndex((m) => m.id === segmentId);
        if (existingIdx !== -1) {
          if (prev[existingIdx].content === cleaned) return prev;
          const next = [...prev];
          next[existingIdx] = { ...next[existingIdx], content: cleaned };
          return next;
        }
        return [...prev, { id: segmentId, role: sender, content: cleaned }];
      });
    },
    []
  );

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    setElapsedSeconds(0);
    setIsMicMuted(false);
    setAgentLiveState("initializing");
    hasAgentStateAttrRef.current = false;
    autoEndingRef.current = false;
    setIsSpeaking(false);
    setMessages([]);
    usingTextStreamRef.current = false;
    cleanupAudioElements();
    setAgentHealth({ status: "ok" });

    try {
      const roomName =
        type === "generate"
          ? `generate_${userId || "unknown"}_${selectedVoice}_${Date.now()}`
          : `interview_${interviewId || "unknown"}_${selectedVoice}_${Date.now()}`;
      const identity = `developer_${userId || Math.floor(Math.random() * 1000)}`;

      const apiUrl =
        typeof window !== "undefined"
          ? "/api/proxy"
          : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const tokenResponse = await fetch(
        `${apiUrl}/api/livekit/token?room=${roomName}&identity=${identity}&voiceIsolation=${isVoiceIsolationEnabled}`
      );

      if (!tokenResponse.ok) {
        throw new Error("No se pudo obtener el token de LiveKit.");
      }

      const { token, url } = await tokenResponse.json();

      const currentRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      currentRoom.on(RoomEvent.ConnectionStateChanged, (state) => {
        console.log("[LiveKit] ConnectionState:", state);
        if (state === ConnectionState.Connected) {
          setCallStatus(CallStatus.ACTIVE);
          setAgentHealth({ status: "ok" });
        } else if (state === ConnectionState.Reconnecting) {
          setAgentHealth({
            status: "recovering",
            message: "Reconectando enlace de audio...",
          });
        } else if (state === ConnectionState.Disconnected) {
          cleanupAudioElements();
          lkRoomRef.current = null;
          setCallStatus((prev) => {
            if (prev === CallStatus.ACTIVE) {
              return CallStatus.FINISHED;
            }
            return prev;
          });
          setLkRoom(null);
          setIsSpeaking(false);
          setAgentLiveState("initializing");
          setIsCandidateSpeaking(false);
        }
      });

      // Reanudación automática de audio tras reconexión temporal de WebRTC
      currentRoom.on(RoomEvent.Reconnected, () => {
        setAgentHealth({ status: "ok" });
        currentRoom.startAudio().catch(() => {});
      });

      // Desbloqueo proactivo de audio en navegadores estrictos
      currentRoom.on(RoomEvent.AudioPlaybackStatusChanged, (canPlayAudio) => {
        if (!canPlayAudio) {
          currentRoom.startAudio().catch((err) => {
            console.warn("[LiveKit] Audio autoplay unlock failed:", err);
          });
        }
      });

      currentRoom.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const element = track.attach();
          element.autoplay = true;
          document.body.appendChild(element);
          audioElementsRef.current.add(element);
          element.play().catch((err) => {
            console.warn("[LiveKit] Audio element play failed, unlocking via room:", err);
            currentRoom.startAudio().catch(() => {});
          });
          setAgentAudioTrack(track.mediaStreamTrack ?? null);
          console.log(`[Audio Subscribed] Reproduciendo audio de: ${participant.identity}`);
        }
      });

      currentRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        if (track.kind === Track.Kind.Audio) {
          setAgentAudioTrack(null);
        }
        track.detach().forEach((element) => {
          audioElementsRef.current.delete(element);
          element.remove();
        });
      });

      currentRoom.on(RoomEvent.LocalTrackPublished, (publication) => {
        if (publication.source === Track.Source.Microphone || publication.kind === Track.Kind.Audio) {
          setCandidateAudioTrack(publication.track?.mediaStreamTrack ?? null);
        }
      });

      currentRoom.on(RoomEvent.LocalTrackUnpublished, (publication) => {
        if (publication.source === Track.Source.Microphone || publication.kind === Track.Kind.Audio) {
          setCandidateAudioTrack(null);
        }
      });

      // Estado real del agente publicado por LiveKit RoomIO ('initializing' | 'listening' | 'thinking' | 'speaking')
      const syncAgentStateAttr = (participant: Participant) => {
        if (participant instanceof LocalParticipant || participant.identity.startsWith("developer_")) {
          return;
        }
        const rawState = participant.attributes?.["lk.agent.state"];
        if (
          rawState === "initializing" ||
          rawState === "listening" ||
          rawState === "thinking" ||
          rawState === "speaking"
        ) {
          hasAgentStateAttrRef.current = true;
          setAgentLiveState(rawState);
          setIsSpeaking(rawState === "speaking");
        }
      };

      currentRoom.on(RoomEvent.ParticipantConnected, (participant) => {
        syncAgentStateAttr(participant);
      });

      currentRoom.on(RoomEvent.ParticipantAttributesChanged, (_changed, participant) => {
        syncAgentStateAttr(participant);
      });

      // Detección de oradores para animación y supresión de falsos positivos gestuales
      currentRoom.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        const isAgentSpeaking = speakers.some(
          (s) => !s.identity.startsWith("developer_") && s instanceof RemoteParticipant
        );
        const candidateActive = speakers.some(
          (s) => s instanceof LocalParticipant || s.identity.startsWith("developer_")
        );
        setIsCandidateSpeaking(candidateActive);
        if (!hasAgentStateAttrRef.current) {
          setIsSpeaking(isAgentSpeaking);
        }
      });

      // Monitor de salud, recuperación y cierre automático del agente por DataChannel
      currentRoom.on(
        RoomEvent.DataReceived,
        (payload: Uint8Array, _participant?: Participant, _kind?: unknown, topic?: string) => {
          if (topic === "agent-health") {
            try {
              const str = new TextDecoder().decode(payload);
              const data = JSON.parse(str);
              if (data.status) {
                if (healthResetTimerRef.current) clearTimeout(healthResetTimerRef.current);
                setAgentHealth({ status: data.status, message: data.message });
                if (data.status === "ok") {
                  healthResetTimerRef.current = setTimeout(
                    () => setAgentHealth({ status: "ok" }),
                    3500
                  );
                }
              }
            } catch (err) {
              console.warn("[LiveKit] Error parsing agent health message:", err);
            }
          } else if (topic === "interview-control") {
            try {
              const str = new TextDecoder().decode(payload);
              const data = JSON.parse(str);
              const action = data.action || data.type;
              if (action === "interview_completed" && !autoEndingRef.current) {
                autoEndingRef.current = true;
                if (typeof data.finalMessage === "string" && data.finalMessage.trim()) {
                  const trimmed = data.finalMessage.trim();
                  const alreadySaved = messagesRef.current.some(
                    (m) => m.role === "assistant" && m.content.trim() === trimmed
                  );
                  if (!alreadySaved) {
                    const updated: SavedMessage[] = [
                      ...messagesRef.current,
                      { id: `farewell-${Date.now()}`, role: "assistant", content: trimmed },
                    ];
                    messagesRef.current = updated;
                    setMessages(updated);
                  }
                }
                setCallStatus(CallStatus.FINISHED);
                disconnectRoomSafely(currentRoom);
              }
            } catch (err) {
              console.warn("[LiveKit] Error parsing interview control message:", err);
            }
          }
        }
      );

      // Transcripción incremental en vivo (LiveKit 1.x TextStream primario, Legacy Event solo respaldo)
      currentRoom.on(
        RoomEvent.TranscriptionReceived,
        (segments: TranscriptionSegment[], participant?: Participant) => {
          if (!participant || usingTextStreamRef.current) return;
          const isSelf = participant instanceof LocalParticipant;
          const sender = isSelf ? "user" : "assistant";

          for (const seg of segments) {
            if (seg.text?.trim()) {
              upsertTranscriptSegment(seg.id || `legacy-${sender}`, sender, seg.text);
            }
          }
        }
      );

      try {
        currentRoom.registerTextStreamHandler(
          "lk.transcription",
          async (reader, participantInfo) => {
            usingTextStreamRef.current = true;
            const isSelf =
              participantInfo.identity === currentRoom.localParticipant.identity ||
              participantInfo.identity.startsWith("developer_");
            const sender = isSelf ? "user" : "assistant";
            const segmentId =
              reader.info?.attributes?.["lk.segment_id"] ||
              reader.info?.id ||
              `stream-${sender}-${Date.now()}`;

            let accumulated = "";
            try {
              for await (const chunk of reader) {
                accumulated += chunk;
                if (accumulated.trim()) {
                  upsertTranscriptSegment(segmentId, sender, accumulated);
                }
              }
            } catch {
              // Ignorar cierre/abort esperado del TextStream al finalizar la sala
            }
          }
        );
      } catch (streamErr) {
        console.warn("[LiveKit] TextStream handler already registered:", streamErr);
      }

      await currentRoom.connect(url, token);
      currentRoom.remoteParticipants.forEach((participant) => {
        syncAgentStateAttr(participant);
      });
      // Desbloquear salida de audio dentro del gesto de clic del botón "Iniciar Entrevista"
      currentRoom.startAudio().catch(() => {});
      lkRoomRef.current = currentRoom;
      setLkRoom(currentRoom);

      try {
        // Evitar doble supresión destructiva: cuando Krisp BVC corre en servidor,
        // desactivamos noiseSuppression del navegador y mantenemos AEC + AGC.
        const audioConstraints = {
          echoCancellation: true,
          noiseSuppression: !isVoiceIsolationEnabled,
          autoGainControl: true,
        };

        await currentRoom.localParticipant.setMicrophoneEnabled(true, audioConstraints);
        const micPub = currentRoom.localParticipant.getTrackPublication(Track.Source.Microphone);
        if (micPub?.track?.mediaStreamTrack) {
          setCandidateAudioTrack(micPub.track.mediaStreamTrack);
        }
      } catch (micErr) {
        console.warn("[LiveKit] No se pudo habilitar el micrófono:", micErr);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err ?? "");
      if (msg.includes("Abort handler called") || msg.toLowerCase().includes("cancelled")) {
        return;
      }
      console.error("Error al iniciar llamada con LiveKit:", err);
      cleanupAudioElements();
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    disconnectRoomSafely(lkRoom);
  };

  const latestMessage = messages[messages.length - 1]?.content;
  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED;

  const currentVoiceObj = VOICE_OPTIONS.find((opt) => opt.key === selectedVoice) || VOICE_OPTIONS[0];
  const isEs = currentVoiceObj.lang === "es";

  // Effective company and role
  let displayRole = role;
  let displayCompany = company;
  if (!displayCompany && role.includes(" @ ")) {
    const parts = role.split(" @ ");
    displayRole = parts[0].trim();
    displayCompany = parts[1].trim();
  } else if (!displayCompany && role.includes(" en ")) {
    const parts = role.split(" en ");
    displayRole = parts[0].trim();
    displayCompany = parts[1].trim();
  }

  // Fallback techstack if empty
  const displayTechs =
    techstack && techstack.length > 0
      ? techstack
      : ["Java", "Go", "Docker", "Microservicios", "SOLID"];

  const smoothTransition = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_TRANSITION.smooth
  );
  const orbSpring = resolveMotionTransition(
    prefersReducedMotion,
    MOTION_SPRING.gentle
  );

  const aiStageHeading =
    callStatus === CallStatus.ACTIVE
      ? isSpeaking
        ? `${currentVoiceObj.name} hablando`
        : agentLiveState === "thinking"
        ? isEs
          ? `${currentVoiceObj.name} analizando tu respuesta`
          : `${currentVoiceObj.name} analyzing your answer`
        : isEs
        ? "Tu turno · Escuchando"
        : "Your turn · Listening"
      : callStatus === CallStatus.CONNECTING
      ? isEs
        ? "Estableciendo enlace de audio…"
        : "Establishing secure audio link…"
      : isEs
      ? "Listo para comenzar"
      : "Ready to begin";

  const aiStageHint =
    callStatus === CallStatus.ACTIVE
      ? isSpeaking
        ? isEs
          ? "Puedes hablar en cualquier momento para intervenir"
          : "You can speak at any moment to interrupt"
        : agentLiveState === "thinking"
        ? isEs
          ? "Preparando la siguiente intervención…"
          : "Preparing next prompt…"
        : isEs
        ? "Habla con claridad, tu micrófono está activo"
        : "Speak clearly, your microphone is active"
      : isEs
      ? "Pulsa «Iniciar entrevista» para conectar la sala"
      : "Click «Start interview» below to connect";

  const aiPresenceBadge =
    callStatus === CallStatus.ACTIVE
      ? isSpeaking
        ? isEs
          ? "Hablando"
          : "Speaking"
        : agentLiveState === "thinking"
        ? isEs
          ? "Analizando"
          : "Thinking"
        : isEs
        ? "Escuchando"
        : "Listening"
      : callStatus === CallStatus.CONNECTING
      ? isEs
        ? "Conectando"
        : "Connecting"
      : isEs
      ? "En espera"
      : "Standby";

  if (callStatus === CallStatus.GENERATING_FEEDBACK) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smoothTransition}
        className="relative flex flex-col items-center justify-center gap-6 p-10 rounded-[28px] bg-[#0c0f19]/90 border border-white/[0.08] backdrop-blur-2xl max-w-lg mx-auto text-center shadow-[0_30px_90px_-30px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.20] to-transparent"
        />
        <AiLoader
          size={1}
          label="Generando evaluación técnica"
          sublabel={
            isEs
              ? "Procesando transcripción y calculando radar de competencias de arquitectura y comunicación…"
              : "Analyzing technical answers and compiling detailed assessment report…"
          }
        />
        <div className="w-full max-w-xs h-1 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-400 to-cyan-400 rounded-full animate-pulse w-3/4" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={smoothTransition}
      className="w-full max-w-5xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* ── 1. Unified Apple Minimal Studio Context Header ── */}
      <header className="relative w-full rounded-[24px] bg-[#0c0f19]/80 border border-white/[0.08] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.85)] backdrop-blur-2xl overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.08] ring-1 ring-inset ring-white/[0.04] flex items-center justify-center text-indigo-300 shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-[17px] font-semibold tracking-[-0.02em] text-white capitalize truncate">
                  Entrevista de {displayRole}
                </h2>
                {displayCompany && (
                  <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-200 border border-white/[0.09]">
                    {displayCompany}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
                <span className="text-indigo-300 font-medium">{level}</span>
                <span className="text-white/20">·</span>
                <span className="text-zinc-300">{interviewType}</span>
                <span className="text-white/20">·</span>
                <span className="tabular-nums">
                  {questions?.length || 5} preguntas
                </span>
              </div>
            </div>
          </div>

          {/* Live Session Beacon & Tabular Stopwatch */}
          <div className="flex items-center self-start sm:self-auto shrink-0">
            {callStatus === CallStatus.ACTIVE ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/[0.10] border border-emerald-400/25 text-emerald-300 text-xs font-medium backdrop-blur-xl">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] animate-pulse" />
                <span className="tracking-[0.04em] text-[11px] font-semibold">
                  EN VIVO
                </span>
                <span className="h-3 w-px bg-emerald-400/25" />
                <span className="inline-flex items-center gap-1.5 text-white font-mono tabular-nums text-xs">
                  <Clock className="w-3.5 h-3.5 text-emerald-300" />
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>
            ) : callStatus === CallStatus.CONNECTING ? (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/[0.10] border border-amber-400/25 text-amber-200 text-xs font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>Conectando…</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                <span>Sala preparada</span>
              </div>
            )}
          </div>
        </div>

        {/* Integrated Evaluated Tech Stack Strip */}
        <div className="flex items-center gap-2 flex-wrap px-5 py-2.5 border-t border-white/[0.06] bg-white/[0.015]">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 mr-1">
            <Code2 className="w-3.5 h-3.5 text-indigo-300" />
            <span>Stack evaluado</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {displayTechs.map((tech, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.04] text-zinc-200 border border-white/[0.08] tracking-[-0.01em]"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── 2. Main Apple Minimal Virtual Conference Studio ── */}
      <section className="relative w-full rounded-[30px] bg-gradient-to-b from-[#0e111d]/92 via-[#090b14]/96 to-[#05070d]/98 border border-white/[0.08] shadow-[0_32px_90px_-32px_rgba(0,0,0,0.92)] p-5 sm:p-6 md:p-7 flex flex-col gap-5 overflow-hidden backdrop-blur-2xl">
        {/* Top 1px specular glass sheen */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.20] to-transparent"
        />

        {/* Adaptive serene radial ambient glow */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[280px] rounded-full blur-[120px] transition-colors duration-700",
            callStatus === CallStatus.ACTIVE && isSpeaking
              ? "bg-indigo-500/20"
              : callStatus === CallStatus.ACTIVE && isCandidateSpeaking
              ? "bg-emerald-500/15"
              : callStatus === CallStatus.CONNECTING
              ? "bg-amber-500/15"
              : "bg-indigo-500/[0.08]"
          )}
        />

        {/* ── Studio Toolbar: Evaluator Identity & Audio Settings ── */}
        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-500 to-indigo-400 ring-1 ring-inset ring-white/25 flex items-center justify-center text-white text-xs font-semibold shadow-[0_8px_20px_-6px_rgba(99,102,241,0.7)] shrink-0">
              AI
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-[-0.015em] text-white">
                  {currentVoiceObj.name}
                </span>
                <span className="text-xs text-zinc-400 truncate">
                  · Evaluador técnico
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              </div>
              <p className="text-[11px] text-zinc-400">
                {callStatus === CallStatus.ACTIVE
                  ? "Enlace de audio WebRTC activo · 48 kHz"
                  : "Listo para iniciar sesión de voz"}
              </p>
            </div>
          </div>

          {/* Right Audio Settings: Health Banner, Voice Isolation, Voice Select */}
          <div className="flex items-center gap-2 flex-wrap">
            {(agentHealth.status === "recovering" ||
              agentHealth.status === "error") && (
              <div
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border backdrop-blur-xl",
                  agentHealth.status === "recovering"
                    ? "bg-amber-500/15 border-amber-400/30 text-amber-200 animate-pulse"
                    : "bg-rose-500/15 border-rose-400/30 text-rose-200"
                )}
              >
                <RotateCcw
                  className={cn(
                    "w-3 h-3",
                    agentHealth.status === "recovering"
                      ? "animate-spin text-amber-300"
                      : "text-rose-300"
                  )}
                />
                <span>
                  {agentHealth.message ||
                    (agentHealth.status === "recovering"
                      ? "Reanudando agente…"
                      : "Pulsa «Reanudar IA» para continuar")}
                </span>
              </div>
            )}

            {/* Krisp BVC Voice Isolation Toggle */}
            <button
              type="button"
              onClick={() => setIsVoiceIsolationEnabled((prev) => !prev)}
              disabled={
                callStatus === CallStatus.CONNECTING ||
                callStatus === CallStatus.ACTIVE
              }
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 transition border cursor-pointer whitespace-nowrap",
                isVoiceIsolationEnabled
                  ? "bg-emerald-500/[0.10] border-emerald-400/25 text-emerald-200"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.07]",
                (callStatus === CallStatus.CONNECTING ||
                  callStatus === CallStatus.ACTIVE) &&
                  "opacity-75 cursor-default"
              )}
              title={
                isVoiceIsolationEnabled
                  ? "Aislamiento de voz activo (Krisp AI): bloquea voces de fondo y ruido de ambiente"
                  : "Aislamiento de voz desactivado: usa supresión de ruido estándar"
              }
            >
              <Volume2
                className={cn(
                  "w-3.5 h-3.5",
                  isVoiceIsolationEnabled ? "text-emerald-400" : "text-zinc-500"
                )}
              />
              <span>
                Aislamiento {isVoiceIsolationEnabled ? "ON" : "OFF"}
              </span>
            </button>

            {/* Voice Profile Selector */}
            <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1.5 hover:border-white/[0.14] transition">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={
                  callStatus === CallStatus.CONNECTING ||
                  callStatus === CallStatus.ACTIVE
                }
                aria-label="Seleccionar voz del evaluador"
                className="bg-transparent text-zinc-200 text-[11px] outline-none disabled:opacity-55 transition cursor-pointer font-medium"
              >
                {VOICE_OPTIONS.map((opt) => (
                  <option
                    key={opt.key}
                    value={opt.key}
                    className="bg-[#0e111d] text-zinc-100"
                  >
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Balanced Two-Card Studio Stage / Centered Audio Stage ── */}
        <div className="relative z-10 w-full">
          <div
            className={cn(
              "grid gap-4 items-stretch",
              isCameraActive ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"
            )}
          >
            {/* AI Evaluator Presence Card */}
            <div
              className={cn(
                "relative rounded-[24px] bg-white/[0.02] border border-white/[0.07] ring-1 ring-inset ring-white/[0.03] p-6 flex flex-col justify-between overflow-hidden",
                isCameraActive
                  ? "min-h-[300px] md:min-h-[340px]"
                  : "min-h-[320px] py-8"
              )}
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.14] to-transparent"
              />

              {/* Subtle Top Presence Pill */}
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-medium text-zinc-300">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)] animate-pulse"
                        : callStatus === CallStatus.ACTIVE
                        ? "bg-emerald-400 animate-pulse"
                        : callStatus === CallStatus.CONNECTING
                        ? "bg-amber-400 animate-pulse"
                        : "bg-zinc-500"
                    )}
                  />
                  <span>{aiPresenceBadge}</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-medium">
                  {currentVoiceObj.lang === "es" ? "ES · LatAm" : "EN · US"}
                </span>
              </div>

              {/* Acoustic Presence Orb */}
              <div className="flex flex-col items-center justify-center my-auto py-4">
                <div className="relative flex items-center justify-center">
                  {/* Outer breathing halo */}
                  <motion.div
                    aria-hidden="true"
                    animate={{
                      scale:
                        callStatus === CallStatus.ACTIVE && isSpeaking
                          ? 1.18
                          : callStatus === CallStatus.ACTIVE
                          ? 1.04
                          : 0.96,
                      opacity:
                        callStatus === CallStatus.ACTIVE && isSpeaking
                          ? 0.9
                          : callStatus === CallStatus.ACTIVE
                          ? 0.45
                          : 0.2,
                    }}
                    transition={orbSpring}
                    className={cn(
                      "absolute rounded-full border pointer-events-none",
                      isCameraActive ? "w-40 h-40" : "w-44 h-44",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "border-indigo-400/25 bg-indigo-500/[0.06]"
                        : callStatus === CallStatus.ACTIVE
                        ? "border-emerald-400/20 bg-emerald-500/[0.03]"
                        : "border-white/[0.06]"
                    )}
                  />
                  <motion.div
                    aria-hidden="true"
                    animate={{
                      scale:
                        callStatus === CallStatus.ACTIVE && isSpeaking
                          ? 1.36
                          : 1,
                      opacity:
                        callStatus === CallStatus.ACTIVE && isSpeaking
                          ? 0.45
                          : 0,
                    }}
                    transition={orbSpring}
                    className={cn(
                      "absolute rounded-full border border-violet-400/20 pointer-events-none",
                      isCameraActive ? "w-44 h-44" : "w-48 h-48"
                    )}
                  />

                  {/* Precision Core Orb */}
                  <motion.div
                    animate={{
                      scale:
                        callStatus === CallStatus.ACTIVE && isSpeaking
                          ? 1.05
                          : 1,
                    }}
                    transition={orbSpring}
                    className={cn(
                      "relative z-10 flex items-center justify-center rounded-full shadow-2xl overflow-hidden transition-colors duration-500",
                      isCameraActive ? "w-24 h-24" : "w-28 h-28",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-400 shadow-[0_18px_45px_-10px_rgba(99,102,241,0.65)] ring-1 ring-inset ring-white/30"
                        : callStatus === CallStatus.ACTIVE
                        ? "bg-gradient-to-b from-[#161b2e] to-[#0d111d] border border-indigo-400/30 shadow-[0_14px_34px_-12px_rgba(99,102,241,0.3)]"
                        : callStatus === CallStatus.CONNECTING
                        ? "bg-[#121521] border border-amber-400/40 shadow-[0_12px_30px_-12px_rgba(245,158,11,0.3)]"
                        : "bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.10] shadow-[0_18px_36px_-18px_rgba(0,0,0,0.9)]"
                    )}
                  >
                    {/* Subtle specular glass reflection */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-3 top-1 h-6 rounded-full bg-gradient-to-b from-white/20 to-transparent"
                    />

                    {callStatus === CallStatus.CONNECTING && (
                      <Loader2 className="w-7 h-7 text-amber-300 animate-spin" />
                    )}

                    {callStatus === CallStatus.ACTIVE && (
                      <div className="flex items-center gap-1.5">
                        {isSpeaking ? (
                          <>
                            <div className="w-1 bg-white/95 rounded-full animate-vocalBar1 h-7" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar2 h-10" />
                            <div className="w-1 bg-white/90 rounded-full animate-vocalBar3 h-5" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar2 h-9" />
                            <div className="w-1 bg-white/95 rounded-full animate-vocalBar1 h-7" />
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:200ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:400ms]" />
                          </div>
                        )}
                      </div>
                    )}

                    {isCallInactiveOrFinished && (
                      <Headphones className="w-7 h-7 text-zinc-400" />
                    )}
                  </motion.div>
                </div>

                {/* Calm Typographic Hierarchy */}
                <div className="mt-5 flex flex-col items-center gap-1 text-center max-w-xs">
                  <h4 className="text-white font-semibold text-sm sm:text-[15px] tracking-[-0.015em]">
                    {aiStageHeading}
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {aiStageHint}
                  </p>
                </div>
              </div>

              {/* Integrated Agent Waveform */}
              {callStatus === CallStatus.ACTIVE ? (
                <VoiceAudioWave
                  audioTrack={agentAudioTrack}
                  isActive={callStatus === CallStatus.ACTIVE}
                  variant="agent"
                  label={
                    isSpeaking
                      ? currentVoiceObj.name
                      : agentLiveState === "thinking"
                      ? isEs
                        ? "Analizando…"
                        : "Thinking…"
                      : isEs
                      ? "Escuchando"
                      : "Listening"
                  }
                  width={isCameraActive ? 190 : 260}
                  height={26}
                  className={cn(
                    "w-full mx-auto",
                    isCameraActive ? "max-w-[300px]" : "max-w-[380px]"
                  )}
                />
              ) : (
                <div className="h-2" />
              )}
            </div>

            {/* Candidate Facial Monitor Card (Camera Active) */}
            {isCameraActive && (
              <div className="w-full">
                <FacialMonitorPanel
                  videoRef={facial.videoRef}
                  canvasRef={facial.canvasRef}
                  isEnabled={isCameraActive}
                  onToggleEnabled={() => setIsCameraActive((prev) => !prev)}
                  hasPermission={facial.hasPermission}
                  isCalibrated={facial.isCalibrated}
                  faceDetected={facial.faceDetected}
                  cameraError={facial.cameraError}
                  liveCue={facial.liveCue}
                  liveScores={facial.liveScores}
                  showMeshOverlay={showMeshOverlay}
                  onToggleMeshOverlay={() =>
                    setShowMeshOverlay((prev) => !prev)
                  }
                  onRecalibrate={facial.triggerRecalibration}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Live Candidate Mic Strip & Closed Captions ── */}
        <div className="relative z-10 flex flex-col gap-3">
          {callStatus === CallStatus.ACTIVE && (
            <VoiceAudioWave
              audioTrack={candidateAudioTrack}
              isActive={callStatus === CallStatus.ACTIVE}
              isMuted={isMicMuted}
              variant="candidate"
              label={
                isMicMuted
                  ? isEs
                    ? "Micrófono silenciado"
                    : "Microphone muted"
                  : isCandidateSpeaking
                  ? isEs
                    ? "Tu voz · Hablando"
                    : "Your voice · Speaking"
                  : isEs
                  ? "Tu micrófono en vivo"
                  : "Your live microphone"
              }
              width={460}
              height={28}
              className="w-full"
            />
          )}

          {/* Frosted Live Subtitle Bar */}
          <div className="w-full min-h-[68px] max-h-24 overflow-y-auto no-scrollbar rounded-2xl bg-white/[0.025] border border-white/[0.07] px-4 sm:px-5 py-3.5 flex items-center justify-center text-center backdrop-blur-xl">
            <AnimatePresence mode="wait">
              {latestMessage ? (
                <motion.div
                  key={`${latestSpeaker}-${latestMessage.slice(0, 32)}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={smoothTransition}
                  className="flex items-baseline gap-2.5 max-w-3xl text-left"
                >
                  <span
                    className={cn(
                      "text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full border shrink-0",
                      latestSpeaker === "user"
                        ? "bg-emerald-500/15 border-emerald-400/25 text-emerald-200"
                        : "bg-indigo-500/15 border-indigo-400/25 text-indigo-200"
                    )}
                  >
                    {latestSpeaker === "user" ? "Tú" : currentVoiceObj.name}
                  </span>
                  <p className="text-[13px] sm:text-sm text-zinc-100/95 leading-relaxed">
                    {latestMessage}
                  </p>
                </motion.div>
              ) : (
                <motion.p
                  key="caption-idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={smoothTransition}
                  className="text-xs text-zinc-500"
                >
                  {callStatus === CallStatus.ACTIVE
                    ? isEs
                      ? "La transcripción en vivo aparecerá aquí en tiempo real…"
                      : "Live speech transcript will appear here in real time…"
                    : isEs
                    ? "Esperando inicio de la sesión…"
                    : "Waiting for interview to begin…"}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── 4. FaceTime-Style Single-Line Floating Control Dock ── */}
        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.06]">
          {/* Subtle Left Spacer on Large Screens to Balance Dock Centering */}
          <div className="hidden lg:flex items-center w-[150px]" aria-hidden="true" />

          {/* Centered Frosted Pill Control Dock */}
          <div className="inline-flex flex-wrap sm:flex-nowrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-white/[0.035] border border-white/[0.09] backdrop-blur-2xl shadow-[0_14px_40px_-18px_rgba(0,0,0,0.9)] max-w-full">
            {/* Candidate Mic Toggle */}
            <button
              type="button"
              onClick={toggleMic}
              disabled={callStatus !== CallStatus.ACTIVE}
              className={cn(
                "h-10 px-3.5 sm:px-4 rounded-full text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer border whitespace-nowrap shrink-0",
                isMicMuted
                  ? "bg-rose-500/20 text-rose-200 border-rose-400/35"
                  : isCandidateSpeaking && callStatus === CallStatus.ACTIVE
                  ? "bg-emerald-500/20 text-emerald-100 border-emerald-400/35 shadow-[0_0_20px_-6px_rgba(16,185,129,0.6)]"
                  : "bg-white/[0.04] text-zinc-200 border-white/[0.07] hover:bg-white/[0.09] disabled:opacity-40 disabled:cursor-not-allowed"
              )}
              title={
                isMicMuted
                  ? "Activar micrófono"
                  : isCandidateSpeaking && callStatus === CallStatus.ACTIVE
                  ? "Voz detectada — clic para silenciar"
                  : "Silenciar micrófono"
              }
              aria-label={isMicMuted ? "Activar micrófono" : "Silenciar micrófono"}
            >
              {isMicMuted ? (
                <MicOff className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="hidden sm:inline">
                {isMicMuted
                  ? "Silenciado"
                  : isCandidateSpeaking && callStatus === CallStatus.ACTIVE
                  ? "Hablando"
                  : "Micrófono"}
              </span>
            </button>

            {/* Candidate Camera Toggle */}
            <button
              type="button"
              onClick={() => setIsCameraActive((prev) => !prev)}
              className={cn(
                "h-10 px-3.5 sm:px-4 rounded-full text-xs font-medium inline-flex items-center gap-2 transition cursor-pointer border whitespace-nowrap shrink-0",
                isCameraActive
                  ? "bg-indigo-500/20 text-indigo-100 border-indigo-400/35"
                  : "bg-white/[0.04] text-zinc-400 border-white/[0.07] hover:bg-white/[0.09] hover:text-zinc-200"
              )}
              title={isCameraActive ? "Desactivar cámara" : "Activar cámara"}
              aria-label={isCameraActive ? "Desactivar cámara" : "Activar cámara"}
            >
              {isCameraActive ? (
                <Camera className="w-4 h-4 text-indigo-300 shrink-0" />
              ) : (
                <CameraOff className="w-4 h-4 text-zinc-500 shrink-0" />
              )}
              <span className="hidden sm:inline">Cámara</span>
            </button>

            {/* Active Session Resilience Controls */}
            {callStatus === CallStatus.ACTIVE && (
              <>
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-block h-5 w-px bg-white/[0.10] mx-0.5 shrink-0"
                />
                <button
                  type="button"
                  onClick={() => sendInterviewControl("repeat_last")}
                  className="h-10 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 bg-white/[0.04] text-zinc-200 border border-white/[0.07] hover:bg-white/[0.09] hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Pedir a la IA que repita la última intervención"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                  <span className="hidden md:inline">Repetir</span>
                </button>
                <button
                  type="button"
                  onClick={() => sendInterviewControl("resume_turn")}
                  className="h-10 px-3.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 bg-white/[0.04] text-zinc-200 border border-white/[0.07] hover:bg-white/[0.09] hover:text-white transition cursor-pointer whitespace-nowrap shrink-0"
                  title="Reactivar a la IA si se quedó en silencio esperando"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="hidden md:inline">Reanudar IA</span>
                </button>
              </>
            )}

            <span
              aria-hidden="true"
              className="hidden sm:inline-block h-5 w-px bg-white/[0.10] mx-0.5 shrink-0"
            />

            {/* Main Action CTA: Start or End Interview */}
            {callStatus !== CallStatus.ACTIVE ? (
              <button
                type="button"
                onClick={handleCall}
                disabled={callStatus === CallStatus.CONNECTING}
                className={cn(
                  "h-10 px-5 sm:px-6 rounded-full inline-flex items-center justify-center gap-2 font-semibold text-xs sm:text-[13px] text-white transition-all cursor-pointer whitespace-nowrap shrink-0",
                  callStatus === CallStatus.CONNECTING
                    ? "bg-amber-500/80 cursor-not-allowed opacity-85"
                    : "bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500 hover:brightness-110 shadow-[0_10px_28px_-8px_rgba(99,102,241,0.65)] ring-1 ring-inset ring-white/20"
                )}
              >
                {callStatus === CallStatus.CONNECTING ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>{isEs ? "Conectando…" : "Connecting…"}</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-3.5 h-3.5 fill-white shrink-0" />
                    <span>
                      {isEs ? "Iniciar entrevista" : "Start interview"}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDisconnect}
                title={isEs ? "Finalizar entrevista" : "End interview"}
                aria-label={isEs ? "Finalizar entrevista" : "End interview"}
                className="h-10 px-5 rounded-full inline-flex items-center justify-center gap-2 font-semibold text-xs sm:text-[13px] bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer shadow-[0_10px_28px_-8px_rgba(225,29,72,0.65)] ring-1 ring-inset ring-white/20 whitespace-nowrap shrink-0"
              >
                <PhoneOff className="w-3.5 h-3.5 fill-white shrink-0" />
                <span>{isEs ? "Finalizar" : "End call"}</span>
              </button>
            )}
          </div>

          {/* Candidate Identity Pill */}
          <div className="flex items-center justify-end lg:w-[150px]">
            <div className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.07]">
              <div className="w-6 h-6 rounded-full bg-white/[0.08] border border-white/[0.12] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
                {userName ? userName.slice(0, 1).toUpperCase() : "U"}
              </div>
              <span className="text-xs font-medium text-zinc-300 truncate max-w-[96px]">
                {userName || "Candidato"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Local keyframes style block */}
      <style>{`
        @keyframes vocalBarAnim1 {
          0%, 100% { height: 14px; }
          50% { height: 30px; }
        }
        @keyframes vocalBarAnim2 {
          0%, 100% { height: 22px; }
          50% { height: 40px; }
        }
        @keyframes vocalBarAnim3 {
          0%, 100% { height: 10px; }
          50% { height: 26px; }
        }
        .animate-vocalBar1 { animation: vocalBarAnim1 1s ease-in-out infinite; }
        .animate-vocalBar2 { animation: vocalBarAnim2 0.8s ease-in-out infinite; }
        .animate-vocalBar3 { animation: vocalBarAnim3 1.2s ease-in-out infinite; }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </motion.div>
  );
};

export default Agent;

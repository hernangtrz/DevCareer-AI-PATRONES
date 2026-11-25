"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createFeedback } from "@/lib/api";
import { getCognitoIdToken } from "@/lib/cognito";
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

  const [selectedVoice, setSelectedVoice] = useState("jeronimo-es");
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

  // Limpieza segura de WebRTC y elementos <audio> al desmontar
  useEffect(() => {
    return () => {
      if (healthResetTimerRef.current) clearTimeout(healthResetTimerRef.current);
      cleanupAudioElements();
      if (lkRoomRef.current) {
        lkRoomRef.current.disconnect().catch(() => {});
        lkRoomRef.current = null;
      }
    };
  }, [cleanupAudioElements]);

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
        const idToken = getCognitoIdToken();
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
          idToken
        );

        if (res && res.success) {
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          router.push("/dashboard");
        }
      } catch (e) {
        console.error(e);
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
                currentRoom.disconnect().catch(() => {});
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
            for await (const chunk of reader) {
              accumulated += chunk;
              if (accumulated.trim()) {
                upsertTranscriptSegment(segmentId, sender, accumulated);
              }
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
      console.error("Error al iniciar llamada con LiveKit:", err);
      cleanupAudioElements();
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    if (lkRoom) {
      lkRoom.disconnect();
    }
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

  if (callStatus === CallStatus.GENERATING_FEEDBACK) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-10 rounded-3xl bg-[#0c0d14]/90 border border-white/[0.08] max-w-lg mx-auto text-center shadow-2xl">
        <AiLoader
          size={1}
          label="Generando Evaluación Técnica"
          sublabel={
            isEs
              ? "Procesando transcripción y calculando radar de competencias de arquitectura y comunicación..."
              : "Analyzing technical answers and compiling detailed assessment report..."
          }
        />
        <div className="w-full max-w-xs h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none">
      {/* ── 1. Top Context Bar: Role, Company & Live Badges ── */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:px-5 rounded-2xl bg-[#0f111a]/90 border border-white/[0.08] shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-white capitalize">
                Entrevista de {displayRole}
              </h2>
              {displayCompany && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {displayCompany}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400 font-medium">
              <span className="text-indigo-400">{level}</span>
              <span>•</span>
              <span className="text-zinc-300">{interviewType}</span>
              <span>•</span>
              <span className="text-zinc-400">{questions?.length || 5} preguntas</span>
            </div>
          </div>
        </div>

        {/* Live Status Beacon & Stopwatch */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {callStatus === CallStatus.ACTIVE ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>EN VIVO</span>
              <span className="text-zinc-500 font-normal">|</span>
              <div className="flex items-center gap-1 text-white">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatTimer(elapsedSeconds)}</span>
              </div>
            </div>
          ) : callStatus === CallStatus.CONNECTING ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Conectando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-zinc-500" />
              <span>Sala Preparada</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. Evaluated Tech Stack Chips Banner ── */}
      <div className="flex items-center gap-2 px-1 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
          Stack Evaluado:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {displayTechs.map((tech, idx) => (
            <span
              key={idx}
              className="text-xs font-mono font-medium px-2.5 py-1 rounded-lg bg-zinc-900/90 text-zinc-200 border border-zinc-800/80 hover:border-indigo-500/40 transition shadow-sm"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* ── 3. Main Realistic Virtual Conference Room ── */}
      <div className="relative w-full min-h-[460px] md:min-h-[500px] rounded-3xl bg-gradient-to-b from-[#0e101a] via-[#090a10] to-[#05060a] border border-white/[0.08] shadow-2xl p-6 md:p-8 flex flex-col justify-between overflow-hidden relative">
        {/* Subtle Room Grid & Ambient Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#312e8108_1px,transparent_1px),linear-gradient(to_bottom,#312e8108_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Room Header: Interviewer Identity & Audio Settings */}
        <div className="relative w-full flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-zinc-800/70 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
              AI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">
                  {currentVoiceObj.name}
                </span>
                <span className="text-[10px] text-zinc-400">• Evaluador Técnico DevCareer</span>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-400">
                {callStatus === CallStatus.ACTIVE ? "Enlace de audio WebRTC activo (48kHz)" : "Listo para sesión de voz"}
              </p>
            </div>
          </div>

          {/* Voice Selector as Audio Output Setting & Voice Isolation (BVC) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Indicador de recuperación o alerta de salud del agente */}
            {(agentHealth.status === "recovering" || agentHealth.status === "error") && (
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs border",
                  agentHealth.status === "recovering"
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-200 animate-pulse"
                    : "bg-rose-500/20 border-rose-500/40 text-rose-200"
                )}
              >
                <RotateCcw
                  className={cn(
                    "w-3 h-3",
                    agentHealth.status === "recovering"
                      ? "animate-spin text-amber-400"
                      : "text-rose-400"
                  )}
                />
                <span>
                  {agentHealth.message ||
                    (agentHealth.status === "recovering"
                      ? "Reanudando agente..."
                      : "Pulsa 'Reanudar IA' para continuar")}
                </span>
              </div>
            )}

            {/* Toggle de Aislamiento de Voz Inteligente (Krisp BVC) */}
            <button
              type="button"
              onClick={() => setIsVoiceIsolationEnabled((prev) => !prev)}
              disabled={callStatus === CallStatus.CONNECTING || callStatus === CallStatus.ACTIVE}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border cursor-pointer",
                isVoiceIsolationEnabled
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200",
                (callStatus === CallStatus.CONNECTING || callStatus === CallStatus.ACTIVE) &&
                  "opacity-80 cursor-default"
              )}
              title={
                isVoiceIsolationEnabled
                  ? "Aislamiento de voz activo (Krisp AI): bloquea voces de fondo y ruido de ambiente"
                  : "Aislamiento de voz desactivado: usa supresión de ruido estándar"
              }
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Aislamiento Voz {isVoiceIsolationEnabled ? "ON" : "OFF"}</span>
            </button>

            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 rounded-xl px-2.5 py-1">
              <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={callStatus === CallStatus.CONNECTING || callStatus === CallStatus.ACTIVE}
                className="bg-transparent text-zinc-200 text-xs outline-none disabled:opacity-50 transition cursor-pointer font-medium"
              >
                {VOICE_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key} className="bg-zinc-950 text-zinc-200">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center Visualizer: Dynamic Audio Orb & Facial Monitor Panel */}
        <div className="relative w-full my-auto py-4 z-10 select-none">
          {isCameraActive ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Columna Izquierda: Orbe del Evaluador IA */}
              <div className="flex flex-col items-center justify-center p-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={cn(
                      "absolute rounded-full border border-indigo-500/20 pointer-events-none transition-all duration-700",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "w-44 h-44 opacity-100 animate-pulse"
                        : "w-32 h-32 opacity-20"
                    )}
                  />
                  <div
                    className={cn(
                      "absolute rounded-full border border-indigo-500/10 pointer-events-none transition-all duration-700",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "w-52 h-52 opacity-100 animate-ping [animation-duration:2.5s]"
                        : "w-36 h-36 opacity-0"
                    )}
                  />

                  <div
                    className={cn(
                      "z-10 flex items-center justify-center rounded-full transition-all duration-500 shadow-2xl relative overflow-hidden",
                      callStatus === CallStatus.ACTIVE && isSpeaking
                        ? "w-28 h-28 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 scale-105 shadow-indigo-500/30 ring-4 ring-indigo-500/20"
                        : "",
                      callStatus === CallStatus.ACTIVE && !isSpeaking
                        ? "w-24 h-24 bg-gradient-to-tr from-zinc-900 to-indigo-950/80 scale-100 shadow-indigo-500/10 border border-indigo-500/30"
                        : "",
                      callStatus === CallStatus.CONNECTING
                        ? "w-24 h-24 bg-zinc-900 border border-amber-500/50 scale-100 shadow-amber-500/10 animate-pulse"
                        : "",
                      isCallInactiveOrFinished
                        ? "w-24 h-24 bg-zinc-900/90 border border-zinc-800 scale-100 shadow-black/60"
                        : ""
                    )}
                  >
                    {callStatus === CallStatus.CONNECTING && (
                      <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
                    )}

                    {callStatus === CallStatus.ACTIVE && (
                      <div className="flex items-center gap-1.5">
                        {isSpeaking ? (
                          <>
                            <div className="w-1 bg-white rounded-full animate-vocalBar1 h-7" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar2 h-10" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar3 h-5" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar2 h-9" />
                            <div className="w-1 bg-white rounded-full animate-vocalBar1 h-7" />
                          </>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:200ms]" />
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:400ms]" />
                          </div>
                        )}
                      </div>
                    )}

                    {isCallInactiveOrFinished && (
                      <Headphones className="w-7 h-7 text-zinc-500" />
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-col items-center gap-1 text-center">
                  <h4 className="text-white font-bold text-sm tracking-wide">
                    {callStatus === CallStatus.ACTIVE
                      ? isSpeaking
                        ? `${currentVoiceObj.name} hablando...`
                        : agentLiveState === "thinking"
                        ? isEs
                          ? `${currentVoiceObj.name} analizando tu respuesta...`
                          : `${currentVoiceObj.name} analyzing your answer...`
                        : isEs
                        ? "Tu turno — escuchándote activamente..."
                        : "Your turn — listening to your response..."
                      : callStatus === CallStatus.CONNECTING
                      ? isEs
                        ? "Estableciendo enlace de audio..."
                        : "Establishing secure audio link..."
                      : isEs
                      ? "Listo para comenzar la entrevista"
                      : "Ready to begin technical interview"}
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {callStatus === CallStatus.ACTIVE
                      ? isSpeaking
                        ? "Puedes hablar en cualquier momento para intervenir"
                        : agentLiveState === "thinking"
                        ? isEs
                          ? "Preparando la siguiente intervención..."
                          : "Preparing next prompt..."
                        : "Habla con claridad, tu micrófono está activo"
                      : isEs
                      ? "Haz clic en 'Iniciar Entrevista' para conectar"
                      : "Click 'Start Interview' below to connect"}
                  </p>
                  {callStatus === CallStatus.ACTIVE && (
                    <VoiceAudioWave
                      audioTrack={agentAudioTrack}
                      isActive={callStatus === CallStatus.ACTIVE}
                      variant="agent"
                      label={
                        isSpeaking
                          ? `${currentVoiceObj.name}`
                          : agentLiveState === "thinking"
                          ? isEs
                            ? "Analizando..."
                            : "Thinking..."
                          : isEs
                          ? "Escuchando"
                          : "Listening"
                      }
                      width={190}
                      height={28}
                      className="mt-2.5 w-full max-w-[300px]"
                    />
                  )}
                </div>
              </div>

              {/* Columna Derecha: Tarjeta de Cámara del Candidato con Edge AI */}
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
                  onToggleMeshOverlay={() => setShowMeshOverlay((prev) => !prev)}
                  onRecalibrate={facial.triggerRecalibration}
                />
              </div>
            </div>
          ) : (
            /* Modo Solo Audio Centrado */
            <div className="relative flex flex-col items-center justify-center my-auto py-8">
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "absolute rounded-full border border-indigo-500/20 pointer-events-none transition-all duration-700",
                    callStatus === CallStatus.ACTIVE && isSpeaking
                      ? "w-52 h-52 opacity-100 animate-pulse"
                      : "w-36 h-36 opacity-20"
                  )}
                />
                <div
                  className={cn(
                    "absolute rounded-full border border-indigo-500/10 pointer-events-none transition-all duration-700",
                    callStatus === CallStatus.ACTIVE && isSpeaking
                      ? "w-64 h-64 opacity-100 animate-ping [animation-duration:2.5s]"
                      : "w-44 h-44 opacity-0"
                  )}
                />

                <div
                  className={cn(
                    "z-10 flex items-center justify-center rounded-full transition-all duration-500 shadow-2xl relative overflow-hidden",
                    callStatus === CallStatus.ACTIVE && isSpeaking
                      ? "w-32 h-32 bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 scale-105 shadow-indigo-500/30 ring-4 ring-indigo-500/20"
                      : "",
                    callStatus === CallStatus.ACTIVE && !isSpeaking
                      ? "w-28 h-28 bg-gradient-to-tr from-zinc-900 to-indigo-950/80 scale-100 shadow-indigo-500/10 border border-indigo-500/30"
                      : "",
                    callStatus === CallStatus.CONNECTING
                      ? "w-28 h-28 bg-zinc-900 border border-amber-500/50 scale-100 shadow-amber-500/10 animate-pulse"
                      : "",
                    isCallInactiveOrFinished
                      ? "w-28 h-28 bg-zinc-900/90 border border-zinc-800 scale-100 shadow-black/60"
                      : ""
                  )}
                >
                  {callStatus === CallStatus.CONNECTING && (
                    <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  )}

                  {callStatus === CallStatus.ACTIVE && (
                    <div className="flex items-center gap-1.5">
                      {isSpeaking ? (
                        <>
                          <div className="w-1 bg-white rounded-full animate-vocalBar1 h-8" />
                          <div className="w-1 bg-white rounded-full animate-vocalBar2 h-12" />
                          <div className="w-1 bg-white rounded-full animate-vocalBar3 h-6" />
                          <div className="w-1 bg-white rounded-full animate-vocalBar2 h-10" />
                          <div className="w-1 bg-white rounded-full animate-vocalBar1 h-8" />
                        </>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:200ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:400ms]" />
                        </div>
                      )}
                    </div>
                  )}

                  {isCallInactiveOrFinished && (
                    <Headphones className="w-8 h-8 text-zinc-500" />
                  )}
                </div>
              </div>

              <div className="mt-5 flex flex-col items-center gap-1 text-center">
                <h4 className="text-white font-bold text-sm tracking-wide">
                  {callStatus === CallStatus.ACTIVE
                    ? isSpeaking
                      ? `${currentVoiceObj.name} hablando...`
                      : agentLiveState === "thinking"
                      ? isEs
                        ? `${currentVoiceObj.name} analizando tu respuesta...`
                        : `${currentVoiceObj.name} analyzing your answer...`
                      : isEs
                      ? "Tu turno — escuchándote activamente..."
                      : "Your turn — listening to your response..."
                    : callStatus === CallStatus.CONNECTING
                    ? isEs
                      ? "Estableciendo enlace de audio..."
                      : "Establishing secure audio link..."
                    : isEs
                    ? "Listo para comenzar la entrevista"
                    : "Ready to begin technical interview"}
                </h4>
                <p className="text-[11px] text-zinc-400 font-mono">
                  {callStatus === CallStatus.ACTIVE
                    ? isSpeaking
                      ? "Puedes hablar en cualquier momento para intervenir"
                      : agentLiveState === "thinking"
                      ? isEs
                        ? "Preparando la siguiente intervención..."
                        : "Preparing next prompt..."
                      : "Habla con claridad, tu micrófono está activo"
                    : isEs
                    ? "Haz clic en 'Iniciar Entrevista' para conectar"
                    : "Click 'Start Interview' below to connect"}
                </p>
                {callStatus === CallStatus.ACTIVE && (
                  <VoiceAudioWave
                    audioTrack={agentAudioTrack}
                    isActive={callStatus === CallStatus.ACTIVE}
                    variant="agent"
                    label={
                      isSpeaking
                        ? `${currentVoiceObj.name}`
                        : agentLiveState === "thinking"
                        ? isEs
                          ? "Analizando..."
                          : "Thinking..."
                        : isEs
                        ? "Escuchando"
                        : "Listening"
                    }
                    width={240}
                    height={30}
                    className="mt-3 w-full max-w-[360px]"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Candidate Voice Waveform (react-audio-visualize) */}
        {callStatus === CallStatus.ACTIVE && (
          <div className="relative z-10 w-full mb-3">
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
                    ? "Tu voz — hablando..."
                    : "Your voice — speaking..."
                  : isEs
                  ? "Tu micrófono en vivo"
                  : "Your live microphone"
              }
              width={460}
              height={32}
              className="w-full"
            />
          </div>
        )}

        {/* Closed Captions HUD / Live Subtitle Box */}
        <div className="relative w-full min-h-[76px] bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3.5 flex items-center justify-center text-center z-10 max-h-24 overflow-y-auto no-scrollbar mb-5 backdrop-blur-md">
          {latestMessage ? (
            <div className="flex items-center gap-2 max-w-2xl text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 shrink-0">
                {latestSpeaker === "user" ? "Tú" : currentVoiceObj.name}
              </span>
              <p className="text-xs md:text-sm text-zinc-200 leading-relaxed font-light">
                {latestMessage}
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">
              {callStatus === CallStatus.ACTIVE
                ? isEs
                  ? "La transcripción en vivo aparecerá aquí en tiempo real..."
                  : "Live speech transcript will appear here in real time..."
                : isEs
                ? "Esperando inicio de la sesión..."
                : "Waiting for interview to begin..."}
            </p>
          )}
        </div>

        {/* Meeting Controls Bar / Floating Dock */}
        <div className="relative w-full flex items-center justify-between gap-3 pt-3 border-t border-zinc-800/70 z-10">
          <div className="flex items-center gap-2">
            {/* Candidate Mic Toggle Button */}
            <button
              onClick={toggleMic}
              disabled={callStatus !== CallStatus.ACTIVE}
              className={cn(
                "px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border",
                isMicMuted
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                  : isCandidateSpeaking && callStatus === CallStatus.ACTIVE
                  ? "bg-emerald-500/15 text-emerald-200 border-emerald-500/40 shadow-sm shadow-emerald-500/20"
                  : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 disabled:opacity-40"
              )}
              title={isMicMuted ? "Activar micrófono" : "Silenciar micrófono"}
            >
              {isMicMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
              <span className="hidden sm:inline">
                {isMicMuted
                  ? "Micrófono Silenciado"
                  : isCandidateSpeaking && callStatus === CallStatus.ACTIVE
                  ? "Voz Detectada"
                  : "Micrófono Activo"}
              </span>
            </button>

            {/* Candidate Camera Toggle Button */}
            <button
              onClick={() => setIsCameraActive((prev) => !prev)}
              className={cn(
                "px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border",
                isCameraActive
                  ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/40"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
              )}
              title={isCameraActive ? "Desactivar cámara" : "Activar cámara"}
            >
              {isCameraActive ? <Camera className="w-4 h-4 text-indigo-400" /> : <CameraOff className="w-4 h-4 text-zinc-500" />}
              <span className="hidden sm:inline">
                {isCameraActive ? "Cámara Activa" : "Cámara Desactivada"}
              </span>
            </button>

            {/* Controles de resiliencia durante la llamada activa */}
            {callStatus === CallStatus.ACTIVE && (
              <div className="flex items-center gap-1.5 ml-1 border-l border-zinc-800/80 pl-2">
                <button
                  type="button"
                  onClick={() => sendInterviewControl("repeat_last")}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                  title="Pedir a la IA que repita la última intervención"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden md:inline">Repetir</span>
                </button>
                <button
                  type="button"
                  onClick={() => sendInterviewControl("resume_turn")}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                  title="Reactivar a la IA si se quedó en silencio esperando"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden md:inline">Reanudar IA</span>
                </button>
              </div>
            )}
          </div>

          {/* Main Action Button: Start or End Meeting */}
          {callStatus !== CallStatus.ACTIVE ? (
            <button
              onClick={handleCall}
              disabled={callStatus === CallStatus.CONNECTING}
              className={cn(
                "flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition-all duration-300 cursor-pointer shadow-lg",
                callStatus === CallStatus.CONNECTING
                  ? "bg-amber-600 cursor-not-allowed opacity-80"
                  : "bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 hover:shadow-indigo-500/25 hover:scale-[1.02]"
              )}
            >
              {callStatus === CallStatus.CONNECTING ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isEs ? "Conectando Sala..." : "Connecting..."}</span>
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 fill-white" />
                  <span>{isEs ? "Iniciar Entrevista" : "Start Interview"}</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center gap-2 px-7 py-3 rounded-2xl font-bold text-xs sm:text-sm bg-rose-600 hover:bg-rose-500 text-white transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <PhoneOff className="w-4 h-4 fill-white" />
              <span>{isEs ? "Finalizar Entrevista" : "End Interview"}</span>
            </button>
          )}

          {/* Candidate Profile Avatar */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-[11px] font-bold">
              {userName ? userName.slice(0, 1).toUpperCase() : "U"}
            </div>
            <span className="hidden md:inline font-medium text-zinc-300 truncate max-w-[100px]">
              {userName || "Candidato"}
            </span>
          </div>
        </div>
      </div>

      {/* Local keyframes style block */}
      <style>{`
        @keyframes vocalBarAnim1 {
          0%, 100% { height: 16px; }
          50% { height: 32px; }
        }
        @keyframes vocalBarAnim2 {
          0%, 100% { height: 24px; }
          50% { height: 44px; }
        }
        @keyframes vocalBarAnim3 {
          0%, 100% { height: 12px; }
          50% { height: 28px; }
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
    </div>
  );
};

export default Agent;

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getJobs,
  applyToJob,
  getUserJobApplications,
  updateJobApplicationStatus,
  updateJobApplicationNotes,
  deleteJobApplication,
  createJobInterview,
  JobOfferDto,
  JobApplicationDto,
} from "@/lib/api";
import {
  Briefcase,
  Search,
  Sparkles,
  Zap,
  Mic,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Send,
  ArrowRight,
  TrendingUp,
  Table,
  Bookmark,
  RefreshCw,
  Globe,
  Code2,
  Building2,
  Trash2,
  Save,
  Check,
  Calendar,
  MessageSquare,
  X,
  ChevronRight,
  Copy,
  Bell,
  BellRing,
  CheckCheck,
  Inbox,
  Eye,
} from "lucide-react";
import { generateJobCustomChallenge, saveCustomProblem } from "@/lib/problems";

export interface JobNotification {
  id: string;
  type: "application" | "job_alert" | "interview" | "status_change" | "system";
  title: string;
  message: string;
  company?: string;
  jobId?: string;
  timestamp: string;
  timeAgo: string;
  read: boolean;
  priority: "high" | "normal" | "low";
  actionLabel?: string;
  actionTab?: "feed" | "saved" | "applications" | "notifications";
}

const DEFAULT_JOB_NOTIFICATIONS: JobNotification[] = [
  {
    id: "notif-1",
    type: "status_change",
    title: "¡Avance a Entrevista Técnica!",
    message: "Tu postulación en GitLab para Senior Backend Engineer (Go & Ruby) avanzó a la fase de entrevista técnica con el equipo de ingeniería.",
    company: "GitLab",
    jobId: "gh-8843512002",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    timeAgo: "Hace 25 min",
    read: false,
    priority: "high",
    actionLabel: "Ver en Seguimiento",
    actionTab: "applications",
  },
  {
    id: "notif-2",
    type: "job_alert",
    title: "Nueva vacante con 98% de Match",
    message: "Detectamos una nueva vacante remota en Greenhouse: Senior Backend Engineer en GitLab con afinidad sobresaliente para tu perfil.",
    company: "GitLab",
    jobId: "gh-8843512002",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timeAgo: "Hace 2 horas",
    read: false,
    priority: "normal",
    actionLabel: "Ver Vacante",
    actionTab: "feed",
  },
  {
    id: "notif-3",
    type: "interview",
    title: "Reto Técnico Personalizado Disponible",
    message: "Se generó una simulación 360° (Voz + Código) adaptada a los requisitos técnicos de Palantir Technologies.",
    company: "Palantir Technologies",
    jobId: "lev-10dfc8bc",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    timeAgo: "Hace 5 horas",
    read: false,
    priority: "high",
    actionLabel: "Iniciar Simulación",
    actionTab: "feed",
  },
  {
    id: "notif-4",
    type: "application",
    title: "Materiales de Postulación Listos",
    message: "Tu Cover Letter y CV adaptado para Klardaten fueron preparados con éxito mediante el Patrón Facade.",
    company: "Klardaten",
    jobId: "rok-1137571",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    timeAgo: "Ayer",
    read: true,
    priority: "normal",
    actionLabel: "Revisar Materiales",
    actionTab: "applications",
  },
];

interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyInitials: string;
  logoGradient: string;
  platform: "Greenhouse" | "Lever" | "RemoteOK";
  platformBg: string;
  location: string;
  remote: boolean;
  seniority: "Junior" | "Mid-Level" | "Senior" | "Staff";
  salaryMonthlyUSD: string;
  postedAgo: string;
  matchScore: number;
  matchLevel: "Excelente" | "Alto" | "Bueno";
  matchedSkills: string[];
  missingSkills: string[];
  externalUrl: string;
  requiredFields: string[];
}

function dedupeSkills(skills?: string[]): string[] {
  if (!skills || skills.length === 0) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of skills) {
    const clean = (raw || "").trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(clean);
  }
  return result;
}

function makeClientAppId(): string {
  return `app-${Date.now()}`;
}

function makeNotificationId(): string {
  return `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function pickRandomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

const CONNECTED_PLATFORMS = [
  { id: "greenhouse", name: "Greenhouse ATS", type: "Postulación Directa", icon: "greenhouse", count: 15, active: true },
  { id: "lever", name: "Lever ATS", type: "Formulario Oficial", icon: "lever", count: 15, active: true },
  { id: "remoteok", name: "RemoteOK", type: "Remoto Tech", icon: "remoteok", count: 20, active: true },
];

const MOCK_JOBS: JobOffer[] = [
  {
    id: "gh-8843512002",
    title: "Senior Backend Engineer (Go & Ruby)",
    company: "GitLab",
    companyInitials: "GL",
    logoGradient: "from-emerald-700 to-teal-900",
    platform: "Greenhouse",
    platformBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    location: "Remoto (Global)",
    remote: true,
    seniority: "Senior",
    salaryMonthlyUSD: "$11,250 - $15,400 USD",
    postedAgo: "Hace 10 minutos",
    matchScore: 98,
    matchLevel: "Excelente",
    matchedSkills: ["Go", "Ruby", "PostgreSQL", "Docker", "Kubernetes", "Git"],
    missingSkills: ["CI/CD"],
    externalUrl: "https://job-boards.greenhouse.io/gitlab/jobs/8843512002#app",
    requiredFields: ["Nombre Completo", "Email", "CV en PDF", "LinkedIn"],
  },
  {
    id: "lever-10dfc8bc-99ad-4ca2-ab76-853cb90a92c2",
    title: "Backend Software Engineer - Application Development",
    company: "Palantir Technologies",
    companyInitials: "PL",
    logoGradient: "from-amber-600 to-orange-800",
    platform: "Lever",
    platformBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    location: "Remoto (Americas)",
    remote: true,
    seniority: "Mid-Level",
    salaryMonthlyUSD: "$10,800 - $14,500 USD",
    postedAgo: "Hace 25 minutos",
    matchScore: 95,
    matchLevel: "Excelente",
    matchedSkills: ["Java", "Python", "Go", "TypeScript", "React", "Docker"],
    missingSkills: ["AWS"],
    externalUrl: "https://jobs.lever.co/palantir/10dfc8bc-99ad-4ca2-ab76-853cb90a92c2/apply",
    requiredFields: ["Nombre Completo", "Email", "CV en PDF", "GitHub"],
  },
  {
    id: "rok-1137571",
    title: "Senior Software Engineer (TypeScript & React)",
    company: "Klardaten",
    companyInitials: "KD",
    logoGradient: "from-blue-600 to-indigo-800",
    platform: "RemoteOK",
    platformBg: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    location: "Remoto (LatAm / Global)",
    remote: true,
    seniority: "Senior",
    salaryMonthlyUSD: "$9,100 - $12,900 USD",
    postedAgo: "Hace 40 minutos",
    matchScore: 92,
    matchLevel: "Excelente",
    matchedSkills: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"],
    missingSkills: ["Docker"],
    externalUrl: "https://remoteOK.com/remote-jobs/remote-senior-software-engineer-klardaten-1137571",
    requiredFields: ["Nombre Completo", "Email", "CV en PDF", "Portafolio"],
  },
];

export default function JobsPage() {
  const router = useRouter();

  // Navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<"feed" | "saved" | "applications" | "notifications">("feed");
  const [liveApplications, setLiveApplications] = useState<JobApplicationDto[]>([]);
  const [liveJobs, setLiveJobs] = useState<JobOffer[]>([]);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [simulatingJobId, setSimulatingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notificaciones & Alertas del Portal de Empleo
  const [notifications, setNotifications] = useState<JobNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread" | "application" | "job_alert" | "interview">("all");

  // Search & Filter in Feed
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [selectedSeniority, setSelectedSeniority] = useState<string>("all");
  const [savedJobs, setSavedJobs] = useState<string[]>(["job-1"]);
  const [appliedJobIds, setAppliedJobIds] = useState<string[]>([]);

  // Applications Tracker Filters & Notes
  const [appFilterStatus, setAppFilterStatus] = useState<string>("all");
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<{ [appId: string]: string }>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState<{ [appId: string]: boolean }>({});
  const [preparedByApp, setPreparedByApp] = useState<{ [appId: string]: string }>({});

  // Custom offer modal
  const [showCustomOfferModal, setShowCustomOfferModal] = useState(false);
  const [customOfferText, setCustomOfferText] = useState("");

  // Modal de Selección de Modalidad de Preparación (Voz, Reto de Código o Ambos)
  const [practiceModalJob, setPracticeModalJob] = useState<{
    title: string;
    company: string;
    description?: string;
    matchedSkills?: string[];
    seniority?: string;
    id?: string;
  } | null>(null);

  // Modal de Materiales de Postulación (Patrón Facade)
  const [applicationModal, setApplicationModal] = useState<{
    isOpen: boolean;
    jobTitle: string;
    company: string;
    externalUrl?: string;
    coverLetter: string;
    adaptedResumeSummary: string;
    interviewId?: string;
  }>({
    isOpen: false,
    jobTitle: "",
    company: "",
    externalUrl: "",
    coverLetter: "",
    adaptedResumeSummary: "",
  });
  const [modalActiveTab, setModalActiveTab] = useState<"coverLetter" | "resume">("coverLetter");
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [copiedResume, setCopiedResume] = useState(false);
  const [expandedAppMaterials, setExpandedAppMaterials] = useState<{
    [appId: string]: "coverLetter" | "resume" | null;
  }>({});

  // Profile data
  const profileData = {
    fullName: "Hernán Gutiérrez",
    email: "hernan@devcareer.ai",
    phone: "+57 (300) 123-4567",
    location: "Barranquilla, Colombia (Remoto)",
    headline: "Senior Full Stack Engineer · AI Developer · 3+ Años de Experiencia",
    linkedinUrl: "https://linkedin.com/in/hernangtrz",
    githubUrl: "https://github.com/hernangtrz",
    portfolioUrl: "https://hernangtrz.dev",
  };

  const showToast = (msg: string, durationMs = 4500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  };

  // Carga inicial de datos
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // Restaurar postulaciones, guardados y notificaciones de localStorage si existen
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "applications") {
          setActiveMainTab("applications");
        } else if (params.get("tab") === "notifications") {
          setActiveMainTab("notifications");
        }
        try {
          const savedApplied = localStorage.getItem("devcareer_applied_jobs");
          if (savedApplied) setAppliedJobIds(JSON.parse(savedApplied));

          const savedBookmarks = localStorage.getItem("devcareer_saved_jobs");
          if (savedBookmarks) setSavedJobs(JSON.parse(savedBookmarks));

          const savedApps = localStorage.getItem("devcareer_applications");
          if (savedApps) {
            const parsed: unknown = JSON.parse(savedApps);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const typedApps = parsed as JobApplicationDto[];
              setLiveApplications(typedApps);
              const notesMap: { [id: string]: string } = {};
              typedApps.forEach((a) => {
                if (a.notes) notesMap[a.id] = a.notes;
              });
              setEditingNotes((prev) => ({ ...notesMap, ...prev }));
            }
          }

          const savedNotifs = localStorage.getItem("devcareer_job_notifications");
          if (savedNotifs) {
            const parsedNotifs: unknown = JSON.parse(savedNotifs);
            if (Array.isArray(parsedNotifs) && parsedNotifs.length > 0) {
              setNotifications(parsedNotifs as JobNotification[]);
            } else {
              setNotifications(DEFAULT_JOB_NOTIFICATIONS);
            }
          } else {
            setNotifications(DEFAULT_JOB_NOTIFICATIONS);
            localStorage.setItem(
              "devcareer_job_notifications",
              JSON.stringify(DEFAULT_JOB_NOTIFICATIONS)
            );
          }
        } catch (e) {
          console.error("Error leyendo de localStorage:", e);
        }
      }

      // 1. Cargar postulaciones del usuario desde Backend
      try {
        const apps = await getUserJobApplications();
        if (isMounted && apps && apps.length > 0) {
          setLiveApplications(apps);
          const jobIds = apps.map((a) => a.jobId).filter(Boolean);
          setAppliedJobIds((prev) => Array.from(new Set([...prev, ...jobIds])));

          // Inicializar notas en estado local
          const notesMap: { [id: string]: string } = {};
          apps.forEach((a) => {
            if (a.notes) notesMap[a.id] = a.notes;
          });
          setEditingNotes(notesMap);
        }
      } catch (e) {
        console.error("Error cargando postulaciones:", e);
      }

      // 2. Cargar ofertas en vivo
      try {
        const backendJobs = await getJobs();
        if (isMounted && backendJobs && backendJobs.length > 0) {
          const mapped: JobOffer[] = backendJobs.map((j) => {
            const initials = (j.company || "TC").slice(0, 2).toUpperCase();
            let gradient = "from-blue-600 to-indigo-700";
            let platformBg = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";

            const platLower = (j.platform || "").toLowerCase();
            let platformName: JobOffer["platform"] = "RemoteOK";
            if (platLower.includes("greenhouse")) {
              platformName = "Greenhouse";
              gradient = "from-emerald-700 to-teal-900";
              platformBg = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
            } else if (platLower.includes("lever")) {
              platformName = "Lever";
              gradient = "from-amber-600 to-orange-800";
              platformBg = "bg-amber-500/10 text-amber-300 border-amber-500/20";
            } else {
              platformName = "RemoteOK";
              gradient = "from-sky-600 to-indigo-800";
              platformBg = "bg-sky-500/10 text-sky-300 border-sky-500/20";
            }

            const score = j.matchScore || 88;
            const matchLevel: "Excelente" | "Alto" | "Bueno" =
              score >= 90 ? "Excelente" : score >= 75 ? "Alto" : "Bueno";

            const matchedSkills = dedupeSkills(
              j.matchedSkills && j.matchedSkills.length > 0
                ? j.matchedSkills
                : (j.requiredSkills || []).slice(0, 3)
            );
            const matchedSet = new Set(matchedSkills.map((s) => s.toLowerCase()));
            const missingSkills = dedupeSkills(j.missingSkills).filter(
              (s) => !matchedSet.has(s.toLowerCase())
            );

            const validSeniorities: JobOffer["seniority"][] = ["Junior", "Mid-Level", "Senior", "Staff"];
            const resolvedSeniority: JobOffer["seniority"] = validSeniorities.includes(
              j.seniority as JobOffer["seniority"]
            )
              ? (j.seniority as JobOffer["seniority"])
              : "Mid-Level";

            return {
              id: j.id,
              title: j.title,
              company: j.company,
              companyInitials: initials,
              logoGradient: gradient,
              platform: platformName,
              platformBg,
              location: j.location || "Remoto (LatAm / Global)",
              remote: true,
              seniority: resolvedSeniority,
              salaryMonthlyUSD: j.salary || "$5,000 - $7,500 USD",
              postedAgo: "En vivo",
              matchScore: score,
              matchLevel,
              matchedSkills,
              missingSkills,
              externalUrl:
                j.url ||
                `https://www.google.com/search?q=${encodeURIComponent(j.title + " " + j.company + " jobs")}`,
              requiredFields: ["Nombre Completo", "Email", "CV en PDF", "LinkedIn"],
            };
          });

          setLiveJobs(mapped);
        }
      } catch (e) {
        console.error("Error cargando empleos en vivo:", e);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ── MÉTODOS DEL SISTEMA DE NOTIFICACIONES ──
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const addNotification = (
    notif: Omit<JobNotification, "id" | "timestamp" | "timeAgo" | "read">
  ) => {
    const newNotif: JobNotification = {
      ...notif,
      id: makeNotificationId(),
      timestamp: new Date().toISOString(),
      timeAgo: "Ahora mismo",
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev];
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_job_notifications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_job_notifications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const toggleNotificationUnread = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n));
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_job_notifications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_job_notifications", JSON.stringify(updated));
      }
      return updated;
    });
    showToast("Todas las alertas fueron marcadas como leídas");
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_job_notifications", JSON.stringify(updated));
      }
      return updated;
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("devcareer_job_notifications");
    }
    showToast("Historial de alertas eliminado");
  };

  const handleNotificationAction = (notif: JobNotification) => {
    markNotificationAsRead(notif.id);
    setShowNotifDropdown(false);
    if (notif.actionTab) {
      setActiveMainTab(notif.actionTab);
    }
  };

  const handleSimulateNewNotification = () => {
    const samples = [
      {
        company: "Stripe",
        role: "Staff Infrastructure Engineer",
        type: "job_alert" as const,
        title: "Nueva vacante con 96% de Match en Stripe",
        message: "Detectamos una nueva vacante remota: Staff Infrastructure Engineer con alta afinidad técnica para tu perfil.",
        actionLabel: "Ver Oferta",
        actionTab: "feed" as const,
      },
      {
        company: "Vercel",
        role: "Senior Full Stack Systems",
        type: "interview" as const,
        title: "Reto Técnico generado para Vercel",
        message: "Tu simulación de voz y reto de programación adaptado a Next.js y Edge Runtime están listos para practicar.",
        actionLabel: "Iniciar Reto",
        actionTab: "feed" as const,
      },
      {
        company: "GitLab",
        role: "Senior Backend Engineer",
        type: "status_change" as const,
        title: "¡Avance de fase en GitLab!",
        message: "El equipo de reclutamiento ha revisado tu CV adaptado y programó una entrevista técnica.",
        actionLabel: "Ver Seguimiento",
        actionTab: "applications" as const,
      },
    ];
    const pick = pickRandomItem(samples);
    addNotification({
      type: pick.type,
      title: pick.title,
      message: pick.message,
      company: pick.company,
      priority: "high",
      actionLabel: pick.actionLabel,
      actionTab: pick.actionTab,
    });
    showToast(`¡Alerta recibida: ${pick.title}!`);
  };

  const toggleSaveJob = (id: string) => {
    const isAlreadySaved = savedJobs.includes(id);
    const targetJob = (liveJobs.length > 0 ? liveJobs : MOCK_JOBS).find((j) => j.id === id);

    setSavedJobs((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_saved_jobs", JSON.stringify(next));
      }
      return next;
    });

    if (!isAlreadySaved && targetJob) {
      addNotification({
        type: "job_alert",
        title: `Oferta guardada: ${targetJob.company}`,
        message: `Guardaste "${targetJob.title}" en tus ofertas favoritas para revisarla o practicar más tarde.`,
        company: targetJob.company,
        jobId: id,
        priority: "normal",
        actionLabel: "Ver Guardadas",
        actionTab: "saved",
      });
    }
  };

    // POSTULACIÓN DIRECTA (1-CLIC) A TRAVÉS DEL PATRÓN FACADE
  const handleDirectApply = async (job: JobOffer) => {
    setApplyingJobId(job.id);
    try {
      // 1. Registrar y procesar mediante JobApplicationFacade
      const jobDto: JobOfferDto = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.remote ? "Remote" : "Full-time",
        salary: job.salaryMonthlyUSD,
        description: `Vacante para ${job.title} en ${job.company}`,
        requiredSkills: job.matchedSkills || [],
        seniority: job.seniority,
        platform: job.platform,
        matchScore: job.matchScore,
        matchedSkills: job.matchedSkills,
        url: job.externalUrl,
        createdAt: new Date().toISOString(),
      };

      const res = await applyToJob({
        job: jobDto,
        userSkills: job.matchedSkills || ["TypeScript", "React", "Node.js"],
        userExperienceSummary: profileData.headline,
      });

      const coverLetter = res.coverLetter || res.application?.coverLetter || "";
      const adaptedResumeSummary = res.adaptedResumeSummary || res.application?.adaptedResumeSummary || "";

      const newApp: JobApplicationDto = {
        id: res.application?.id || makeClientAppId(),
        userId: res.application?.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        platform: job.platform,
        location: job.location,
        salary: job.salaryMonthlyUSD,
        appliedAt: new Date().toISOString(),
        status: "applied",
        notes: "",
        url: job.externalUrl,
        techstack: job.matchedSkills,
        matchScore: job.matchScore,
        interviewId: res.interviewId,
        coverLetter,
        adaptedResumeSummary,
      };

      const updatedApps = [newApp, ...liveApplications.filter((a) => a.jobId !== job.id)];
      setLiveApplications(updatedApps);

      const updatedJobIds = Array.from(new Set([...appliedJobIds, job.id]));
      setAppliedJobIds(updatedJobIds);

      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_applications", JSON.stringify(updatedApps));
        localStorage.setItem("devcareer_applied_jobs", JSON.stringify(updatedJobIds));
      }

      // Abrir modal con la carta y el CV adaptado generados por la Fachada
      setApplicationModal({
        isOpen: true,
        jobTitle: job.title,
        company: job.company,
        externalUrl: job.externalUrl,
        coverLetter,
        adaptedResumeSummary,
        interviewId: res.interviewId,
      });

      showToast(`¡Materiales preparados para ${job.company}! Carta de presentación y CV adaptado listos.`);

      // Disparar Notificación en el Centro de Empleo
      addNotification({
        type: "application",
        title: `¡Postulación enviada a ${job.company}!`,
        message: `Has aplicado exitosamente a la vacante de ${job.title}. Se generó tu Cover Letter y adaptación de perfil con el Patrón Facade.`,
        company: job.company,
        jobId: job.id,
        priority: "high",
        actionLabel: "Ver en Seguimiento",
        actionTab: "applications",
      });
    } catch (e: unknown) {
      console.error("Error al registrar postulación:", e);
      showToast("Error registrando postulación: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setApplyingJobId(null);
    }
  };


  // ABRIR O GENERAR MATERIALES DE POSTULACIÓN (FACADE)
  const handleOpenMaterials = async (job: JobOffer) => {
    const existing = liveApplications.find((a) => a.jobId === job.id);

    // Si ya tiene carta y CV adaptado generados, abrir directamente
    if (existing && existing.coverLetter && existing.adaptedResumeSummary) {
      setApplicationModal({
        isOpen: true,
        jobTitle: job.title,
        company: job.company,
        externalUrl: job.externalUrl,
        coverLetter: existing.coverLetter,
        adaptedResumeSummary: existing.adaptedResumeSummary,
        interviewId: existing.interviewId,
      });
      return;
    }

    // Si se había postulado antes sin generar materiales, generarlos ahora con la Fachada
    setApplyingJobId(job.id);
    try {
      const jobDto: JobOfferDto = {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        type: job.remote ? "Remote" : "Full-time",
        salary: job.salaryMonthlyUSD,
        description: `Vacante para ${job.title} en ${job.company}`,
        requiredSkills: job.matchedSkills || [],
        seniority: job.seniority,
        platform: job.platform,
        matchScore: job.matchScore,
        matchedSkills: job.matchedSkills,
        url: job.externalUrl,
        createdAt: new Date().toISOString(),
      };

      const res = await applyToJob({
        job: jobDto,
        userSkills: job.matchedSkills || ["TypeScript", "React", "Node.js"],
        userExperienceSummary: profileData.headline,
      });

      const coverLetter = res.coverLetter || res.application?.coverLetter || "";
      const adaptedResumeSummary = res.adaptedResumeSummary || res.application?.adaptedResumeSummary || "";

      const updatedApps = liveApplications.map((a) =>
        a.jobId === job.id
          ? { ...a, coverLetter, adaptedResumeSummary, interviewId: res.interviewId || a.interviewId }
          : a
      );

      // Si no estaba en liveApplications, agregarlo
      if (!existing) {
        const newApp: JobApplicationDto = {
          id: res.application?.id || makeClientAppId(),
          userId: res.application?.userId || "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          platform: job.platform,
          location: job.location,
          salary: job.salaryMonthlyUSD,
          appliedAt: new Date().toISOString(),
          status: "applied",
          notes: "",
          url: job.externalUrl,
          techstack: job.matchedSkills,
          matchScore: job.matchScore,
          interviewId: res.interviewId,
          coverLetter,
          adaptedResumeSummary,
        };
        updatedApps.unshift(newApp);
      }

      setLiveApplications(updatedApps);
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_applications", JSON.stringify(updatedApps));
      }

      setApplicationModal({
        isOpen: true,
        jobTitle: job.title,
        company: job.company,
        externalUrl: job.externalUrl,
        coverLetter,
        adaptedResumeSummary,
        interviewId: res.interviewId || existing?.interviewId,
      });
    } catch (err: unknown) {
      console.error("Error al obtener materiales:", err);
      showToast("Error al obtener materiales de la vacante");
    } finally {
      setApplyingJobId(null);
    }
  };

  // CAMBIO INTERACTIVO DE ESTADO
  const handleStatusChange = async (
    appId: string,
    newStatus: "applied" | "interviewing" | "offered" | "rejected"
  ) => {
    const targetApp = liveApplications.find((a) => a.id === appId);
    const statusLabels: Record<string, string> = {
      applied: "En Espera / Enviada",
      interviewing: "En Entrevista Técnica",
      offered: "Oferta Recibida",
      rejected: "Descartada",
    };

    setLiveApplications((prev) => {
      const updated = prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a));
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_applications", JSON.stringify(updated));
      }
      return updated;
    });

    // Disparar Notificación de cambio de estado
    addNotification({
      type: "status_change",
      title: `Estado actualizado: ${targetApp?.company || "Vacante"}`,
      message: `Tu postulación para ${targetApp?.jobTitle || "el puesto"} ha cambiado a: "${statusLabels[newStatus] || newStatus}".`,
      company: targetApp?.company,
      jobId: targetApp?.jobId,
      priority: newStatus === "interviewing" || newStatus === "offered" ? "high" : "normal",
      actionLabel: "Ver en Seguimiento",
      actionTab: "applications",
    });

    try {
      const res = await updateJobApplicationStatus(appId, newStatus);
      if (!res.success) {
        showToast(res.message || "Error actualizando estado en el servidor");
        return;
      }

      if (res.application) {
        const serverApp = res.application;
        setLiveApplications((prev) => {
          const updated = prev.map((a) =>
            a.id === appId
              ? { ...a, ...serverApp, status: serverApp.status || newStatus }
              : a
          );
          if (typeof window !== "undefined") {
            localStorage.setItem("devcareer_applications", JSON.stringify(updated));
          }
          return updated;
        });

        if (typeof serverApp.notes === "string") {
          setEditingNotes((prev) => ({
            ...prev,
            [appId]: serverApp.notes!,
          }));
        }
      }

      if (newStatus === "interviewing" && res.preparedInterviewId) {
        setPreparedByApp((prev) => ({
          ...prev,
          [appId]: res.preparedInterviewId!,
        }));
        showToast(
          `Estado actualizado a "En entrevista". El Mediador preparó el simulacro #${res.preparedInterviewId.slice(0, 8)} y actualizó tus notas.`,
          6500
        );
      } else {
        showToast("Estado actualizado con éxito");
      }
    } catch (e: unknown) {
      console.error("Error actualizando estado:", e);
      showToast("Error actualizando estado en el servidor");
    }
  };

  // GUARDAR NOTAS DE LA POSTULACIÓN
  const handleSaveNotes = async (appId: string) => {
    const notes = editingNotes[appId] ?? "";
    setSavingNotesId(appId);
    try {
      await updateJobApplicationNotes(appId, notes);
      setLiveApplications((prev) => {
        const updated = prev.map((a) => (a.id === appId ? { ...a, notes } : a));
        if (typeof window !== "undefined") {
          localStorage.setItem("devcareer_applications", JSON.stringify(updated));
        }
        return updated;
      });
      setSavedNotesSuccess((prev) => ({ ...prev, [appId]: true }));
      setTimeout(() => {
        setSavedNotesSuccess((prev) => ({ ...prev, [appId]: false }));
      }, 2000);
      showToast("Notas de la postulación guardadas");
    } catch (e: unknown) {
      console.error("Error guardando notas:", e);
      showToast("Error guardando notas: " + (e instanceof Error ? e.message : "Error desconocido"));
    } finally {
      setSavingNotesId(null);
    }
  };

  // ELIMINAR POSTULACIÓN DEL SEGUIMIENTO
  const handleDeleteApplication = async (appId: string, jobId?: string) => {
    if (!confirm("¿Seguro que deseas eliminar esta postulación de tu seguimiento?")) return;
    try {
      await deleteJobApplication(appId);
      setLiveApplications((prev) => {
        const updated = prev.filter((a) => a.id !== appId);
        if (typeof window !== "undefined") {
          localStorage.setItem("devcareer_applications", JSON.stringify(updated));
        }
        return updated;
      });
      if (jobId) {
        setAppliedJobIds((prev) => {
          const updated = prev.filter((id) => id !== jobId);
          if (typeof window !== "undefined") {
            localStorage.setItem("devcareer_applied_jobs", JSON.stringify(updated));
          }
          return updated;
        });
      }
      showToast("Postulación eliminada del seguimiento");
    } catch (e: unknown) {
      console.error("Error eliminando postulación:", e);
      showToast("Error eliminando postulación");
    }
  };

  // SIMULACIÓN DE ENTREVISTA A MEDIDA (PATRÓN BUILDER)
  const handleSimulateInterviewForJob = async (job: {
    title: string;
    company: string;
    description?: string;
    matchedSkills?: string[];
    seniority?: string;
    id?: string;
  }) => {
    const targetId = job.id || job.title;
    setSimulatingJobId(targetId);
    try {
      const res = await createJobInterview({
        jobTitle: job.title,
        company: job.company,
        description: job.description || `Vacante para ${job.title} en ${job.company}`,
        requiredSkills: job.matchedSkills || ["TypeScript", "React", "Node.js"],
        seniority: job.seniority || "Mid-Level",
      });

      if (res.success && res.interviewId) {
        router.push(`/interview/${res.interviewId}`);
      } else {
        alert(res.message || "No se pudo iniciar el simulacro de entrevista");
      }
    } catch (e: unknown) {
      alert(
        "Error iniciando entrevista personalizada: " +
          (e instanceof Error ? e.message : "Error desconocido")
      );
    } finally {
      setSimulatingJobId(null);
    }
  };

  // RETO TÉCNICO DE CÓDIGO PERSONALIZADO PARA LA OFERTA
  const handleStartCodeChallenge = (job: {
    title: string;
    company: string;
    description?: string;
    matchedSkills?: string[];
    seniority?: string;
    id?: string;
  }) => {
    const problem = generateJobCustomChallenge({
      id: job.id,
      title: job.title,
      company: job.company,
      description: job.description,
      requiredSkills: job.matchedSkills,
      seniority: job.seniority,
    });
    saveCustomProblem(problem);
    setPracticeModalJob(null);
    showToast(`Reto de código para ${job.company} generado con éxito`);
    router.push(`/code-challenge/${problem.id}`);
  };

  // PREPARACIÓN COMPLETA (VOZ + CÓDIGO) 360°
  const handleStartDualPreparation = async (job: {
    title: string;
    company: string;
    description?: string;
    matchedSkills?: string[];
    seniority?: string;
    id?: string;
  }) => {
    const targetId = job.id || job.title;
    setSimulatingJobId(targetId);
    try {
      // 1. Generar reto técnico interactivo a medida
      const problem = generateJobCustomChallenge({
        id: job.id,
        title: job.title,
        company: job.company,
        description: job.description,
        requiredSkills: job.matchedSkills,
        seniority: job.seniority,
      });
      saveCustomProblem(problem);

      // 2. Generar sesión de entrevista por voz
      const res = await createJobInterview({
        jobTitle: job.title,
        company: job.company,
        description: job.description || `Vacante para ${job.title} en ${job.company}`,
        requiredSkills: job.matchedSkills || ["TypeScript", "React", "Node.js"],
        seniority: job.seniority || "Mid-Level",
      });

      if (res.success && res.interviewId) {
        // 3. Vincular con notas de postulación si existe
        const matchingApp = liveApplications.find(
          (a) => a.company.toLowerCase() === job.company.toLowerCase() || (job.id && a.jobId === job.id)
        );
        if (matchingApp) {
          const prepNote = `🎯 Preparación 360° generada:\n- Reto Técnico: ${problem.title} (/code-challenge/${problem.id})\n- Entrevista por Voz: Simulación generada (/interview/${res.interviewId})`;
          const newNotes = matchingApp.notes ? `${matchingApp.notes}\n\n${prepNote}` : prepNote;
          setEditingNotes((prev) => ({ ...prev, [matchingApp.id]: newNotes }));
          updateJobApplicationNotes(matchingApp.id, newNotes).catch(console.error);
        }

        setPracticeModalJob(null);
        showToast("¡Preparación completa configurada! Iniciando reto de código...");
        router.push(`/code-challenge/${problem.id}?nextInterview=${res.interviewId}`);
      } else {
        setPracticeModalJob(null);
        router.push(`/code-challenge/${problem.id}`);
      }
    } catch (e: unknown) {
      alert(
        "Error preparando sesión combinada: " +
          (e instanceof Error ? e.message : "Error desconocido")
      );
    } finally {
      setSimulatingJobId(null);
    }
  };

  // Filtros de ofertas
  const allCurrentJobs = liveJobs.length > 0 ? liveJobs : MOCK_JOBS;
  const filteredJobs = allCurrentJobs.filter((job) => {
    if (activeMainTab === "saved" && !savedJobs.includes(job.id)) return false;

    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.matchedSkills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedPlatform !== "all" && job.platform.toLowerCase() !== selectedPlatform.toLowerCase()) return false;
    if (selectedSeniority !== "all" && job.seniority !== selectedSeniority) return false;

    return true;
  });

  // Filtros de Mis Postulaciones
  const filteredApplications = liveApplications.filter((app) => {
    if (appFilterStatus !== "all" && app.status !== appFilterStatus) return false;
    if (appSearchQuery.trim()) {
      const q = appSearchQuery.toLowerCase();
      const matchTitle = app.jobTitle?.toLowerCase().includes(q);
      const matchCompany = app.company?.toLowerCase().includes(q);
      const matchTech = (app.techstack || []).some((t) => t.toLowerCase().includes(q));
      const matchNotes = app.notes?.toLowerCase().includes(q);
      if (!matchTitle && !matchCompany && !matchTech && !matchNotes) return false;
    }
    return true;
  });

  // Filtros de Notificaciones & Alertas
  const filteredNotifications = notifications.filter((n) => {
    if (notifFilter === "unread") return !n.read;
    if (notifFilter === "application") return n.type === "application" || n.type === "status_change";
    if (notifFilter === "job_alert") return n.type === "job_alert";
    if (notifFilter === "interview") return n.type === "interview";
    return true;
  });

  // Métricas para KPI Cards
  const totalAppsCount = liveApplications.length;
  const interviewingCount = liveApplications.filter((a) => a.status === "interviewing").length;
  const offeredCount = liveApplications.filter((a) => a.status === "offered").length;
  const appliedCount = liveApplications.filter((a) => a.status === "applied").length;
  const rejectedCount = liveApplications.filter((a) => a.status === "rejected").length;

  return (
    <div className="flex flex-col gap-8 min-h-screen pb-16">
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl bg-zinc-900 border border-emerald-500/40 text-white text-xs font-semibold shadow-2xl shadow-emerald-500/20 flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Top Header Banner with Nav Tabs ── */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-zinc-900 via-zinc-900 to-indigo-950/40 border border-zinc-800 flex flex-col gap-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>PORTAL DE EMPLEO & SEGUIMIENTO</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>¡Bienvenido de vuelta, {profileData.fullName.split(" ")[0]}!</span>
              <Sparkles className="w-6 h-6 text-indigo-400 shrink-0" aria-hidden="true" />
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl">
              Explora vacantes verificadas en tiempo real de Greenhouse, Lever y RemoteOK, postúlate directamente y gestiona cada proceso de selección en tu espacio de seguimiento.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Botón de Campana con Dropdown Flotante */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border border-zinc-700/60"
                title="Notificaciones y Alertas de Empleo"
              >
                {unreadNotificationsCount > 0 ? (
                  <BellRing className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : (
                  <Bell className="w-4 h-4 text-zinc-400" />
                )}
                <span className="hidden sm:inline">Alertas</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold shadow-lg shadow-rose-500/50">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Popover Flotante de Notificaciones */}
              {showNotifDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifDropdown(false)}
                  />

                  <div className="absolute right-0 top-12 z-50 w-80 sm:w-96 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl p-4 flex flex-col gap-3 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-white">Notificaciones</h4>
                        {unreadNotificationsCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-[10px] text-white font-mono font-bold">
                            {unreadNotificationsCount}
                          </span>
                        )}
                      </div>

                      {unreadNotificationsCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-[11px] text-zinc-400 hover:text-emerald-400 font-medium transition cursor-pointer flex items-center gap-1"
                        >
                          <CheckCheck className="w-3 h-3" />
                          <span>Marcar leídas</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {notifications.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotificationAction(n)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                            !n.read
                              ? "bg-purple-950/20 border-purple-500/40 hover:bg-purple-950/30"
                              : "bg-zinc-900/50 border-zinc-800/80 hover:bg-zinc-900"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-snug">
                            {n.message}
                          </p>
                          <span className="text-[9px] text-zinc-500">
                            {n.timeAgo} {n.company ? `· ${n.company}` : ""}
                          </span>
                        </div>
                      ))}

                      {notifications.length === 0 && (
                        <p className="text-xs text-zinc-500 text-center py-4">
                          No tienes notificaciones por el momento
                        </p>
                      )}
                    </div>

                    <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                      <button
                        onClick={handleSimulateNewNotification}
                        className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        <span>Simular alerta</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowNotifDropdown(false);
                          setActiveMainTab("notifications");
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Ver todas ({notifications.length})</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowCustomOfferModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Practicar con mi propia Oferta</span>
            </button>
            <Link
              href="/analytics"
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Ver Métricas</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs (Feed / Saved / Mis Postulaciones / Notificaciones) */}
        <div className="flex items-center gap-2 border-t border-zinc-800/80 pt-4 flex-wrap">
          <button
            onClick={() => setActiveMainTab("feed")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "feed"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Explorar Ofertas ({allCurrentJobs.length})</span>
          </button>

          <button
            onClick={() => setActiveMainTab("saved")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "saved"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25"
                : "bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Ofertas Guardadas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-300 font-mono">
              {savedJobs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab("applications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === "applications"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 ring-2 ring-emerald-400/50"
                : "bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <Send className="w-4 h-4 text-emerald-300" />
            <span>Mis Postulaciones & Seguimiento</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-mono font-bold">
              {liveApplications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveMainTab("notifications")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer relative ${
              activeMainTab === "notifications"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/25 ring-2 ring-purple-400/50"
                : "bg-zinc-950/60 text-zinc-400 hover:text-white border border-zinc-800"
            }`}
          >
            <Bell className="w-4 h-4 text-purple-300" />
            <span>Notificaciones & Alertas</span>
            {unreadNotificationsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] text-white font-mono font-bold animate-pulse">
                {unreadNotificationsCount}
              </span>
            ) : (
              <span className="px-1.5 py-0.2 rounded-full bg-zinc-800 text-[10px] text-zinc-400 font-mono">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* VISTA 1 & 2: FEED DE OFERTAS & OFERTAS GUARDADAS            */}
      {/* ────────────────────────────────────────────────────────── */}
      {(activeMainTab === "feed" || activeMainTab === "saved") && (
        <>
          {/* Portales de Empleo Conectados */}
          {activeMainTab === "feed" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">
                  Portales de Empleo Conectados
                </h2>
                <span className="text-[11px] text-zinc-500">Actualización en tiempo real</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CONNECTED_PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatform === platform.id;
                  const count =
                    allCurrentJobs.filter((j) => j.platform.toLowerCase().includes(platform.id)).length ||
                    platform.count;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(isSelected ? "all" : platform.id)}
                      className={`relative p-4 rounded-2xl border transition-all text-left cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                          : "bg-zinc-900/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-lg shadow-inner">
                          {platform.id === "greenhouse" ? (
                            <Building2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                          ) : platform.id === "lever" ? (
                            <Zap className="w-4 h-4 text-amber-400" aria-hidden="true" />
                          ) : (
                            <Globe className="w-4 h-4 text-sky-400" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {platform.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium font-mono tabular-nums">
                            {count} ofertas activas
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        <Check className="w-3 h-3" aria-hidden="true" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2 Columnas (Feed Izquierda + Perfil Derecha) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Feed de Vacantes */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Barra de Búsqueda y Filtros */}
              <search className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Buscar vacante por rol, tecnología o empresa"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="Buscar vacante por rol, tecnología o empresa (ej. React, Python, GitLab)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-950 border border-zinc-800 rounded-xl p-1 shrink-0">
                    {["all", "Junior", "Mid-Level", "Senior"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setSelectedSeniority(lvl)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          selectedSeniority === lvl ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {lvl === "all" ? "Todos" : lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </search>

              {/* Feed Header */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>{activeMainTab === "saved" ? "Ofertas Guardadas" : "Vacantes Disponibles"}</span>
                  <span className="text-xs font-normal text-zinc-500">({filteredJobs.length} resultados)</span>
                </h2>
                {activeMainTab === "saved" && (
                  <span className="text-xs text-indigo-400 font-semibold">
                    Vacantes marcadas para postularte después
                  </span>
                )}
              </div>

              {/* Tarjetas de Vacantes */}
              {filteredJobs.length === 0 ? (
                <div className="p-12 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center flex flex-col items-center gap-3">
                  <Bookmark className="w-8 h-8 text-zinc-600" />
                  <p className="text-zinc-400 text-sm">No tienes ofertas en esta categoría actualmente.</p>
                  <button
                    onClick={() => {
                      setActiveMainTab("feed");
                      setSelectedPlatform("all");
                      setSelectedSeniority("all");
                      setSearchQuery("");
                    }}
                    className="text-xs text-indigo-400 hover:underline cursor-pointer"
                  >
                    Ver todas las vacantes
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredJobs.map((job) => {
                    const isSaved = savedJobs.includes(job.id);
                    const isApplied = appliedJobIds.includes(job.id);
                    const isApplying = applyingJobId === job.id;
                    const isSimulating = simulatingJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className={`p-5 md:p-6 rounded-3xl bg-gradient-to-b from-[#181a20] to-[#0c0d10] border transition-all shadow-xl flex flex-col gap-4 group ${
                          isApplied ? "border-emerald-500/40 bg-emerald-950/10" : "border-zinc-800/90 hover:border-indigo-500/40"
                        }`}
                      >
                        {/* Fila Superior */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${job.logoGradient} flex items-center justify-center text-white font-black text-sm shadow-md shrink-0`}
                            >
                              {job.companyInitials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-zinc-200">{job.company}</span>
                                <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold border ${job.platformBg}`}>
                                  {job.platform}
                                </span>
                                <span className="text-zinc-600 text-xs">•</span>
                                <span className="text-zinc-500 text-[11px] flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {job.postedAgo}
                                </span>
                                {isApplied && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Ya te has postulado
                                  </span>
                                )}
                              </div>
                              <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors truncate mt-0.5">
                                {job.title}
                              </h3>
                            </div>
                          </div>

                          {/* Match Score */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-base font-extrabold font-mono text-emerald-400">
                              {job.matchScore}% Match
                            </span>
                            <span className="text-[10px] text-emerald-300/70 font-semibold">
                              {job.matchLevel} afinidad
                            </span>
                          </div>
                        </div>

                        {/* Detalles */}
                        <div className="flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
                          <span className="flex items-center gap-1.5 text-zinc-200 font-semibold">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                            {job.salaryMonthlyUSD}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            {job.location}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-bold border border-indigo-500/20">
                            {job.seniority}
                          </span>
                        </div>

                        {/* Tecnologías / Stack Requerido */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-zinc-500 uppercase font-bold mr-1">Tecnologías:</span>
                          {job.matchedSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-[11px] font-medium border border-emerald-500/20"
                            >
                              ✓ {sk}
                            </span>
                          ))}
                          {job.missingSkills.map((sk) => (
                            <span
                              key={sk}
                              className="px-2 py-0.5 rounded-md bg-zinc-800/60 text-zinc-400 text-[11px] font-medium border border-zinc-700"
                            >
                              + {sk}
                            </span>
                          ))}
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-800/80">
                          {/* Grupo de Práctica: Modal + Accesos Directos */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => setPracticeModalJob(job)}
                              disabled={isSimulating}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-cyan-500/15 hover:from-pink-500/25 hover:via-purple-500/25 hover:to-cyan-500/25 border border-pink-500/30 text-xs font-semibold text-pink-300 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                              title="Elegir entre entrevista de voz, reto de código o ambos"
                            >
                              <Zap className="w-3.5 h-3.5 text-yellow-400" />
                              <span>{isSimulating ? "Preparando..." : "Preparar prueba para esta oferta"}</span>
                            </button>

                            <button
                              onClick={() => handleSimulateInterviewForJob(job)}
                              disabled={isSimulating}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 text-[11px] font-medium transition cursor-pointer"
                              title="Iniciar directamente entrevista simulada por voz"
                            >
                              <Mic className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin text-pink-400" : ""}`} />
                              <span>Voz</span>
                            </button>

                            <button
                              onClick={() => handleStartCodeChallenge(job)}
                              disabled={isSimulating}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-cyan-400 hover:border-cyan-500/30 text-[11px] font-medium transition cursor-pointer"
                              title="Iniciar directamente reto técnico de código en vivo"
                            >
                              <Code2 className="w-3.5 h-3.5" />
                              <span>Código</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Guardar en Favoritos */}
                            <button
                              onClick={() => toggleSaveJob(job.id)}
                              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                                isSaved
                                  ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-300"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                              }`}
                              title={isSaved ? "Guardada en favoritos" : "Guardar oferta"}
                            >
                              <Bookmark className="w-4 h-4" />
                            </button>

                            {/* Botón de Postulación Normal */}
                            {isApplied ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleOpenMaterials(job)}
                                  disabled={isApplying}
                                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="Ver carta de motivación y CV adaptado generados"
                                >
                                  {isApplying ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                      <span>Cargando...</span>
                                    </>
                                  ) : (
                                    <>
                                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                      <span>Ver Carta & CV</span>
                                    </>
                                  )}
                                </button>
                                <a
                                  href={job.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                                  title="Abrir el formulario oficial nuevamente"
                                >
                                  <span>Formulario</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => setActiveMainTab("applications")}
                                  className="px-3.5 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Seguimiento</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDirectApply(job)}
                                disabled={isApplying}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                title="Generar carta de motivación, CV adaptado y registrar postulación"
                              >
                                {isApplying ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Preparando postulación...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Postularme a esta vacante</span>
                                    <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna Derecha: Widget de Perfil */}
            <div className="lg:col-span-4 flex flex-col gap-5">
              <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-2xl flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Estado de tu Perfil
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Listo para aplicar
                  </span>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/60 border border-zinc-850">
                  <div className="relative flex items-center justify-center w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        className="text-zinc-800"
                        strokeWidth="7"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="36"
                        cy="36"
                        r="30"
                        fill="transparent"
                        stroke="#10b981"
                        strokeWidth="7"
                        strokeDasharray="188"
                        strokeDashoffset="10"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute text-white font-extrabold text-sm">98%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">Perfil Optimizado 🎉</span>
                    <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">
                      Tus datos y tecnologías están listos para postularte sin fricción.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Información de Contacto Verificada</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Stack Tecnológico Validado</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Postulación Directa con 1 Clic</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Seguimiento de Entrevistas Activo</span>
                  </div>
                </div>

                <Link
                  href="/profile"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ver / Editar Mi Perfil</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Tips de Postulaciones */}
              <div className="p-5 rounded-3xl bg-gradient-to-b from-indigo-950/30 to-zinc-900 border border-indigo-500/20 shadow-xl flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <Zap className="w-4 h-4 text-indigo-400" />
                    <span>Seguimiento Activo</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400">
                    {liveApplications.length} registradas
                  </span>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Al hacer clic en &ldquo;Postularme&rdquo;, la vacante se guarda automáticamente en tu tablero de seguimiento para que actualices sus estados y practiques entrevistas simuladas.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* VISTA 3: MIS POSTULACIONES & SEGUIMIENTO (TRACKER CRM)     */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeMainTab === "applications" && (
        <div className="flex flex-col gap-6">
          {/* Header con Exportador Bridge */}
          <div className="p-6 bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-indigo-500/30 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Patrón Bridge Aplicado
                </span>
                <span className="text-xs text-zinc-400">• Exportación Desacoplada</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Mis Postulaciones & Seguimiento de Procesos
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-xl">
                Trackea el estado de cada postulación, anota contactos y preguntas de entrevistas, y practica pruebas técnicas simuladas con IA ajustadas al puesto.
              </p>
            </div>

            {/* Exportaciones Bridge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400 mr-1 font-semibold">Exportar Reporte:</span>
              <a
                href="/api/proxy/jobs/applications/export?format=excel"
                target="_blank"
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/10"
                title="Descargar en formato Excel compatible (.csv)"
              >
                <Table className="w-4 h-4 text-emerald-400" />
                <span>Excel (.csv)</span>
              </a>
              <a
                href="/api/proxy/jobs/applications/export?format=html"
                target="_blank"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 flex items-center gap-1.5 transition"
              >
                <FileText className="w-4 h-4 text-zinc-300" />
                <span>HTML</span>
              </a>
              <a
                href="/api/proxy/jobs/applications/export?format=md"
                target="_blank"
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/30 flex items-center gap-1.5 transition"
              >
                <Code2 className="w-4 h-4 text-blue-400" />
                <span>Markdown</span>
              </a>
            </div>
          </div>

          {/* Tarjetas KPI de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1 shadow-lg">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                Total Postuladas
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-white font-mono">{totalAppsCount}</span>
                <Send className="w-4 h-4 text-indigo-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-amber-500/30 flex flex-col gap-1 shadow-lg bg-amber-500/5">
              <span className="text-[11px] text-amber-300 font-bold uppercase tracking-wider">
                En Entrevista Activa
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-amber-300 font-mono">{interviewingCount}</span>
                <Mic className="w-4 h-4 text-amber-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-emerald-500/30 flex flex-col gap-1 shadow-lg bg-emerald-500/5">
              <span className="text-[11px] text-emerald-300 font-bold uppercase tracking-wider">
                Ofertas Recibidas
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-emerald-300 font-mono">{offeredCount}</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-1 shadow-lg">
              <span className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                En Espera / Enviadas
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black text-zinc-300 font-mono">{appliedCount}</span>
                <Clock className="w-4 h-4 text-zinc-500" />
              </div>
            </div>
          </div>

          {/* Filtros del Seguimiento */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Filtrar por empresa, cargo, tecnología o notas..."
                value={appSearchQuery}
                onChange={(e) => setAppSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Píldoras de Filtro por Estado */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "Todas", count: totalAppsCount },
                { id: "interviewing", label: "En Entrevista", count: interviewingCount },
                { id: "offered", label: "Ofertas", count: offeredCount },
                { id: "applied", label: "En Espera", count: appliedCount },
                { id: "rejected", label: "Descartadas", count: rejectedCount },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setAppFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                    appFilterStatus === tab.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                      : "bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-mono">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Postulaciones */}
          {filteredApplications.length === 0 ? (
            <div className="p-12 text-center border border-zinc-800/80 rounded-3xl bg-zinc-950/40 flex flex-col items-center gap-3">
              <Send className="w-12 h-12 text-zinc-600" />
              <h3 className="text-base font-bold text-white">No hay postulaciones en este filtro</h3>
              <p className="text-xs text-zinc-400 max-w-md">
                Explora las vacantes disponibles y presiona &ldquo;Postularme a esta vacante&rdquo; para abrir el formulario y registrar tu postulación automáticamente.
              </p>
              <button
                onClick={() => {
                  setActiveMainTab("feed");
                  setAppFilterStatus("all");
                  setAppSearchQuery("");
                }}
                className="mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
              >
                Explorar Ofertas
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {filteredApplications.map((app) => {
                const isSimulating = simulatingJobId === (app.jobId || app.id);
                const currentNotes = editingNotes[app.id] ?? app.notes ?? "";
                const isSavingNotes = savingNotesId === app.id;
                const isNotesSaved = savedNotesSuccess[app.id];
                const noteMatches = Array.from(
                  currentNotes.matchAll(/\[Simulacro IA Preparado:\s*#([a-zA-Z0-9-]+)\]/g)
                );
                const preparedInterviewId =
                  preparedByApp[app.id] ||
                  (noteMatches.length > 0 ? noteMatches[noteMatches.length - 1][1] : null);

                // Formato de fecha limpio
                const dateObj = app.appliedAt ? new Date(app.appliedAt) : new Date();
                const formattedDate = dateObj.toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={app.id}
                    className="p-6 rounded-3xl bg-gradient-to-b from-[#181a20] to-[#0d0f13] border border-zinc-800/90 hover:border-zinc-700/80 transition-all shadow-xl flex flex-col gap-5"
                  >
                    {/* Header de la Tarjeta */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-lg font-bold text-white tracking-tight">
                            {app.jobTitle}
                          </h3>
                          <span className="text-xs px-2.5 py-0.5 rounded-lg bg-zinc-800 text-zinc-200 font-bold border border-zinc-700">
                            {app.company}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                            {app.platform || "Greenhouse"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap mt-0.5">
                          {currentNotes.trim() && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                              <FileText className="w-3 h-3" aria-hidden="true" /> Notas activas
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-zinc-300">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            {app.location || "Remoto"}
                          </span>
                          {app.salary && (
                            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                              <DollarSign className="w-3.5 h-3.5" />
                              {app.salary}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            Postulado el {formattedDate}
                          </span>
                        </div>
                      </div>

                      {/* Selector Interactivo de Estado */}
                      <div className="flex items-center gap-3 shrink-0 flex-wrap">
                        <div className="flex flex-col items-start md:items-end gap-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                            Estado del Proceso:
                          </span>
                          <select
                            value={app.status || "applied"}
                            onChange={(e) =>
                              handleStatusChange(
                                app.id,
                                e.target.value as "applied" | "interviewing" | "offered" | "rejected"
                              )
                            }
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border cursor-pointer outline-none transition-all ${
                              app.status === "offered"
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
                                : app.status === "interviewing"
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                                : app.status === "rejected"
                                ? "bg-rose-500/20 text-rose-300 border-rose-500/50"
                                : "bg-blue-500/20 text-blue-300 border-blue-500/50"
                            }`}
                          >
                            <option value="applied" className="bg-zinc-900 text-blue-300">
                              Postulado / En Espera
                            </option>
                            <option value="interviewing" className="bg-zinc-900 text-amber-300">
                              En Proceso de Entrevista
                            </option>
                            <option value="offered" className="bg-zinc-900 text-emerald-300">
                              ¡Oferta Recibida!
                            </option>
                            <option value="rejected" className="bg-zinc-900 text-rose-300">
                              No Seleccionado
                            </option>
                          </select>
                        </div>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => handleDeleteApplication(app.id, app.jobId)}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-950/30 text-zinc-500 hover:text-rose-400 border border-zinc-800 hover:border-rose-500/30 transition cursor-pointer"
                          title="Eliminar del seguimiento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Tecnologías de la Vacante */}
                    {app.techstack && app.techstack.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-zinc-400 mr-1 flex items-center gap-1">
                          <Code2 className="w-3.5 h-3.5 text-indigo-400" /> Stack Requerido:
                        </span>
                        {app.techstack.map((tech, idx) => (
                          <span
                            key={`tech-${tech}-${idx}`}
                            className="px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Confirmación Mediator al avanzar a En entrevista */}
                    {app.status === "interviewing" && preparedInterviewId && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-emerald-300">
                              Simulacro IA Preparado Automáticamente (Patrón Mediator)
                            </span>
                            <span className="text-[11px] text-emerald-100/80">
                              El Mediador interceptó el cambio a &quot;En entrevista&quot;, creó la sesión #{preparedInterviewId.slice(0, 8)} y actualizó tus notas.
                            </span>
                          </div>
                        </div>
                        <Link
                          href={`/interview/${preparedInterviewId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shrink-0 w-fit"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Practicar simulacro</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    )}

                    {/* Bitácora / Notas Personales del Candidato */}
                    <div className={`p-4 rounded-2xl transition-all flex flex-col gap-2.5 ${
                      currentNotes.trim()
                        ? "bg-amber-950/10 border border-amber-500/30 shadow-lg shadow-amber-950/10"
                        : "bg-zinc-950/70 border border-zinc-800/80"
                    }`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className={`w-4 h-4 ${currentNotes.trim() ? "text-amber-400" : "text-indigo-400"}`} />
                          <span className="text-xs font-bold text-zinc-200">
                            Notas & Bitácora de la Entrevista
                          </span>
                          <span className="text-[10px] text-zinc-500 hidden sm:inline">
                            (Reclutador, fechas, links de reunión, preguntas técnicas)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {currentNotes.trim() && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentNotes);
                                showToast("Notas copiadas al portapapeles");
                              }}
                              className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold transition cursor-pointer"
                              title="Copiar estas notas"
                            >
                              Copiar
                            </button>
                          )}
                          <button
                            onClick={() => handleSaveNotes(app.id)}
                            disabled={isSavingNotes}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
                              currentNotes.trim()
                                ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
                                : "bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300"
                            }`}
                          >
                            {isNotesSaved ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">¡Guardado en el servidor!</span>
                              </>
                            ) : isSavingNotes ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                <span>Guardando...</span>
                              </>
                            ) : (
                              <>
                                <Save className="w-3 h-3" />
                                <span>Guardar Notas</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={currentNotes}
                        onChange={(e) =>
                          setEditingNotes((prev) => ({ ...prev, [app.id]: e.target.value }))
                        }
                        placeholder="Escribe aquí notas privadas sobre esta postulación: nombre del reclutador, link de la reunión, salario conversado, preguntas técnicas repasadas..."
                        rows={3}
                        className={`w-full rounded-xl p-3 text-xs leading-relaxed resize-y transition-colors ${
                          currentNotes.trim()
                            ? "bg-zinc-950/90 border border-amber-500/20 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                            : "bg-zinc-900/60 border border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                        }`}
                      />
                    </div>

                    {/* Materiales Generados (Carta de Motivación & CV Adaptado) */}
                    {(app.coverLetter || app.adaptedResumeSummary) && (
                      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col gap-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-zinc-200">
                              Materiales Preparados para esta Vacante
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              (Generados al postularte)
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {app.coverLetter && (
                              <button
                                onClick={() =>
                                  setExpandedAppMaterials((prev) => ({
                                    ...prev,
                                    [app.id]: prev[app.id] === "coverLetter" ? null : "coverLetter",
                                  }))
                                }
                                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                  expandedAppMaterials[app.id] === "coverLetter"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Carta de Motivación</span>
                              </button>
                            )}

                            {app.adaptedResumeSummary && (
                              <button
                                onClick={() =>
                                  setExpandedAppMaterials((prev) => ({
                                    ...prev,
                                    [app.id]: prev[app.id] === "resume" ? null : "resume",
                                  }))
                                }
                                className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                                  expandedAppMaterials[app.id] === "resume"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                                }`}
                              >
                                <Bookmark className="w-3.5 h-3.5" />
                                <span>CV Adaptado</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setApplicationModal({
                                  isOpen: true,
                                  jobTitle: app.jobTitle,
                                  company: app.company,
                                  externalUrl: app.url,
                                  coverLetter: app.coverLetter || "",
                                  adaptedResumeSummary: app.adaptedResumeSummary || "",
                                  interviewId: app.interviewId,
                                });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Ver en ventana emergente completa"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Abrir Modal</span>
                            </button>
                          </div>
                        </div>

                        {/* Visor desplegable inline */}
                        {expandedAppMaterials[app.id] === "coverLetter" && app.coverLetter && (
                          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-indigo-500/30 text-xs text-zinc-200 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-indigo-300 font-bold border-b border-zinc-800 pb-2">
                              <span>Carta de Presentación / Motivación:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(app.coverLetter || "");
                                  showToast("Carta copiada al portapapeles");
                                }}
                                className="px-2 py-0.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copiar Carta</span>
                              </button>
                            </div>
                            <div className="whitespace-pre-line text-zinc-300 text-xs leading-relaxed font-sans max-h-60 overflow-y-auto pr-1">
                              {app.coverLetter}
                            </div>
                          </div>
                        )}

                        {expandedAppMaterials[app.id] === "resume" && app.adaptedResumeSummary && (
                          <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-teal-500/30 text-xs text-zinc-200 flex flex-col gap-2">
                            <div className="flex items-center justify-between text-teal-300 font-bold border-b border-zinc-800 pb-2">
                              <span>Resumen y Hoja de Vida Adaptada al Cargo:</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(app.adaptedResumeSummary || "");
                                  showToast("CV adaptado copiado al portapapeles");
                                }}
                                className="px-2 py-0.5 rounded-lg bg-teal-600/30 hover:bg-teal-600/50 text-teal-200 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copiar CV</span>
                              </button>
                            </div>
                            <div className="whitespace-pre-line text-zinc-300 text-xs leading-relaxed font-mono max-h-60 overflow-y-auto pr-1">
                              {app.adaptedResumeSummary}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Acciones de la Postulación */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 flex-wrap">
                      {/* Grupo de Botones de Preparación */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() =>
                            setPracticeModalJob({
                              title: app.jobTitle,
                              company: app.company,
                              description: `Vacante para ${app.jobTitle} en ${app.company}`,
                              matchedSkills: app.techstack || ["TypeScript", "React", "Node.js"],
                              id: app.jobId || app.id,
                            })
                          }
                          disabled={isSimulating}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
                          title="Elegir modalidad de preparación: entrevista de voz, reto de código o ambos"
                        >
                          <Zap className="w-4 h-4 text-yellow-300" />
                          <span>
                            {isSimulating ? "Preparando..." : "Preparar Prueba (Voz / Código)"}
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            handleStartCodeChallenge({
                              title: app.jobTitle,
                              company: app.company,
                              description: `Vacante para ${app.jobTitle} en ${app.company}`,
                              matchedSkills: app.techstack || ["TypeScript", "React", "Node.js"],
                              id: app.jobId || app.id,
                            })
                          }
                          className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-cyan-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                          title="Iniciar directamente reto de código personalizado"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          <span>Reto Código</span>
                        </button>

                        <button
                          onClick={() =>
                            handleSimulateInterviewForJob({
                              title: app.jobTitle,
                              company: app.company,
                              description: `Vacante para ${app.jobTitle} en ${app.company}`,
                              matchedSkills: app.techstack || ["TypeScript", "React", "Node.js"],
                              id: app.jobId || app.id,
                            })
                          }
                          disabled={isSimulating}
                          className="px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-pink-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                          title="Iniciar directamente simulación de entrevista por voz"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Voz</span>
                        </button>
                      </div>

                      {/* Abrir Formulario Oficial */}
                      {app.url && (
                        <a
                          href={app.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer w-fit"
                        >
                          <span>Abrir Formulario Oficial de la Vacante</span>
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* VISTA 4: CENTRO DE NOTIFICACIONES & ALERTAS DE EMPLEO      */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeMainTab === "notifications" && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Banner de Cabecera del Centro de Notificaciones */}
          <div className="p-6 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">
                    Centro de Notificaciones & Alertas
                  </h2>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold font-mono">
                      {unreadNotificationsCount} sin leer
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Alertas en tiempo real sobre postulaciones, cambios de fase, retos disponibles y nuevas vacantes IA.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleSimulateNewNotification}
                className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                title="Simular recepción de una nueva alerta para probar el sistema"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Simular Alerta</span>
              </button>

              {unreadNotificationsCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Marcar todas como leídas</span>
                </button>
              )}

              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Limpiar todo el historial"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Métricas de Notificaciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[#11131c] border border-zinc-800 flex flex-col justify-between">
              <span className="text-xs text-zinc-400 font-medium flex items-center justify-between">
                Total Alertas
                <Inbox className="w-4 h-4 text-zinc-500" />
              </span>
              <span className="text-2xl font-black text-white font-mono mt-2">
                {notifications.length}
              </span>
              <span className="text-[10px] text-zinc-500 mt-0.5">Historial acumulado</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11131c] border border-rose-500/20 flex flex-col justify-between">
              <span className="text-xs text-rose-300 font-medium flex items-center justify-between">
                Sin Leer
                <Bell className="w-4 h-4 text-rose-400" />
              </span>
              <span className="text-2xl font-black text-rose-400 font-mono mt-2">
                {unreadNotificationsCount}
              </span>
              <span className="text-[10px] text-rose-300/80 mt-0.5">Requieren tu atención</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11131c] border border-emerald-500/20 flex flex-col justify-between">
              <span className="text-xs text-emerald-300 font-medium flex items-center justify-between">
                Postulaciones
                <Send className="w-4 h-4 text-emerald-400" />
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-2">
                {notifications.filter((n) => n.type === "application" || n.type === "status_change").length}
              </span>
              <span className="text-[10px] text-emerald-300/80 mt-0.5">Avances de procesos</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#11131c] border border-cyan-500/20 flex flex-col justify-between">
              <span className="text-xs text-cyan-300 font-medium flex items-center justify-between">
                Vacantes & Retos
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </span>
              <span className="text-2xl font-black text-cyan-400 font-mono mt-2">
                {notifications.filter((n) => n.type === "job_alert" || n.type === "interview").length}
              </span>
              <span className="text-[10px] text-cyan-300/80 mt-0.5">Oportunidades de práctica</span>
            </div>
          </div>

          {/* Filtros de Notificaciones */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todas", count: notifications.length },
              { id: "unread", label: "Sin leer", count: unreadNotificationsCount },
              {
                id: "application",
                label: "Postulaciones",
                count: notifications.filter((n) => n.type === "application" || n.type === "status_change").length,
              },
              {
                id: "job_alert",
                label: "Vacantes IA",
                count: notifications.filter((n) => n.type === "job_alert").length,
              },
              {
                id: "interview",
                label: "Retos & Entrevistas",
                count: notifications.filter((n) => n.type === "interview").length,
              },
            ].map((f) => {
              const active = notifFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() =>
                    setNotifFilter(
                      f.id as "all" | "unread" | "application" | "job_alert" | "interview"
                    )
                  }
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    active
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                      active ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {f.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Lista de Notificaciones */}
          {filteredNotifications.length === 0 ? (
            <div className="p-12 rounded-3xl bg-[#11131c] border border-zinc-800 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No tienes notificaciones en este filtro</h3>
              <p className="text-xs text-zinc-400 max-w-sm">
                Cuando te postules a una vacante, guardes una oferta o cambie el estado de un proceso, recibirás alertas aquí.
              </p>
              <button
                onClick={handleSimulateNewNotification}
                className="mt-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Simular una alerta de prueba</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notif) => {
                const isUnread = !notif.read;
                const borderHighlight = isUnread ? "border-purple-500/40 bg-purple-950/10" : "border-zinc-800/80 bg-zinc-900/60";
                let iconEl = <Bell className="w-4 h-4 text-zinc-400" />;
                let tagLabel = "Aviso";
                let tagColor = "bg-zinc-800 text-zinc-400 border-zinc-700/60";

                if (notif.type === "application") {
                  iconEl = <Send className="w-4 h-4 text-emerald-400" />;
                  tagLabel = "Postulación";
                  tagColor = "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
                } else if (notif.type === "status_change") {
                  iconEl = <TrendingUp className="w-4 h-4 text-indigo-400" />;
                  tagLabel = "Cambio de Estado";
                  tagColor = "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
                } else if (notif.type === "job_alert") {
                  iconEl = <Sparkles className="w-4 h-4 text-cyan-400" />;
                  tagLabel = "Vacante Recomendada";
                  tagColor = "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
                } else if (notif.type === "interview") {
                  iconEl = <Code2 className="w-4 h-4 text-pink-400" />;
                  tagLabel = "Reto & Entrevista";
                  tagColor = "bg-pink-500/10 text-pink-300 border-pink-500/20";
                }

                return (
                  <div
                    key={notif.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all shadow-lg flex flex-col md:flex-row md:items-start justify-between gap-4 group ${borderHighlight}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                        {iconEl}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white tracking-wide">
                            {notif.title}
                          </h4>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tagColor}`}>
                            {tagLabel}
                          </span>

                          {notif.company && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300">
                              {notif.company}
                            </span>
                          )}

                          {isUnread && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              NUEVA
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                          {notif.message}
                        </p>

                        <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{notif.timeAgo || new Date(notif.timestamp).toLocaleDateString("es-ES")}</span>
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                      {notif.actionLabel && (
                        <button
                          onClick={() => handleNotificationAction(notif)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() =>
                          isUnread ? markNotificationAsRead(notif.id) : toggleNotificationUnread(notif.id)
                        }
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                        title={isUnread ? "Marcar como leída" : "Marcar como no leída"}
                      >
                        {isUnread ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="p-1.5 rounded-xl bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/30 text-zinc-400 hover:text-red-400 transition cursor-pointer"
                        title="Eliminar notificación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Practicar con Oferta Propia */}
      {showCustomOfferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Practicar con tu propia Oferta</h3>
                  <p className="text-xs text-zinc-400">Pega la descripción de cualquier oferta externa</p>
                </div>
              </div>
              <button
                onClick={() => setShowCustomOfferModal(false)}
                className="p-1.5 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-300">Pega la descripción de la vacante:</label>
              <textarea
                value={customOfferText}
                onChange={(e) => setCustomOfferText(e.target.value)}
                placeholder="Pega aquí el texto completo del puesto (requerimientos, tecnologías, responsabilidades)..."
                rows={6}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Nuestra IA extraerá automáticamente el stack y configurará tu entrevista de voz.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomOfferModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setShowCustomOfferModal(false);
                  router.push("/interview");
                }}
                disabled={!customOfferText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-40 flex items-center gap-2"
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Generar Entrevista a Medida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Materiales de Postulación Generados (Carta de Motivación & CV Adaptado) */}
      {applicationModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col gap-5 max-h-[90vh] overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-start justify-between gap-4 border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <span>Materiales de Postulación</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Listo para Enviar
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {applicationModal.jobTitle} · <span className="text-zinc-200 font-semibold">{applicationModal.company}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setApplicationModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pestañas: Carta vs CV Adaptado */}
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
              <button
                onClick={() => setModalActiveTab("coverLetter")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  modalActiveTab === "coverLetter"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Carta de Presentación / Motivación</span>
              </button>
              <button
                onClick={() => setModalActiveTab("resume")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  modalActiveTab === "resume"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>Hoja de Vida Adaptada</span>
              </button>
            </div>

            {/* Área de Visualización y Copia */}
            <div className="flex-1 overflow-y-auto bg-zinc-900/60 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
              {modalActiveTab === "coverLetter" ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-indigo-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Carta adaptada al rol de {applicationModal.jobTitle}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(applicationModal.coverLetter);
                        setCopiedCoverLetter(true);
                        setTimeout(() => setCopiedCoverLetter(false), 2000);
                        showToast("Carta de presentación copiada al portapapeles");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      {copiedCoverLetter ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>¡Copiada!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Carta</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-sans select-all">
                    {applicationModal.coverLetter || "Generando carta de presentación..."}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-teal-300 font-semibold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Resumen curricular y fortalezas destacadas para {applicationModal.company}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(applicationModal.adaptedResumeSummary);
                        setCopiedResume(true);
                        setTimeout(() => setCopiedResume(false), 2000);
                        showToast("Resumen de CV adaptado copiado al portapapeles");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-teal-600/20"
                    >
                      {copiedResume ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar CV</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-xs text-zinc-200 leading-relaxed whitespace-pre-line font-mono select-all">
                    {applicationModal.adaptedResumeSummary || "Generando resumen adaptado..."}
                  </div>
                </div>
              )}
            </div>

            {/* Footer de Acciones Directas */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                {applicationModal.externalUrl && (
                  <a
                    href={applicationModal.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-emerald-600/20"
                  >
                    <span>Ir al Formulario Oficial</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {applicationModal.interviewId && (
                  <button
                    onClick={() => {
                      setApplicationModal((prev) => ({ ...prev, isOpen: false }));
                      router.push(`/interview/${applicationModal.interviewId}`);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-pink-600/20 cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Practicar Entrevista</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => setApplicationModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Selección de Modalidad de Preparación Técnica (Voz, Código o Ambos) */}
      {practiceModalJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#101216] border border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 flex flex-col gap-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      Preparación Técnica Personalizada
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {practiceModalJob.seniority || "Mid-Level"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    {practiceModalJob.title}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {practiceModalJob.company} · Selecciona la modalidad con la que deseas practicar
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPracticeModalJob(null)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid de Modalidades */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Opción 1: Entrevista por Voz */}
              <div className="group flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-pink-500/40 hover:bg-zinc-900/90 transition-all flex-1">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                      Entrevista por Voz
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Simulación hablada interactiva con IA (LiveKit + Gemini) centrada en arquitectura, experiencia previa y soft skills.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                      Audio en vivo
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                      Patrón Builder
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const job = practiceModalJob;
                    setPracticeModalJob(null);
                    handleSimulateInterviewForJob(job);
                  }}
                  disabled={Boolean(simulatingJobId)}
                  className="mt-5 w-full py-2.5 px-3 rounded-xl bg-pink-600/20 hover:bg-pink-600 border border-pink-500/30 hover:border-pink-500 text-pink-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>Iniciar Voz</span>
                </button>
              </div>

              {/* Opción 2: Reto Técnico de Código */}
              <div className="group flex flex-col justify-between p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-cyan-500/40 hover:bg-zinc-900/90 transition-all flex-1">
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                      Reto Técnico de Código
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                      Desafío de programación en vivo con editor Monaco y pruebas unitarias basadas en el stack de la oferta ({practiceModalJob.matchedSkills?.slice(0, 3).join(", ") || "TypeScript/Node"}).
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                      Editor Monaco
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400 font-medium">
                      Feedback IA & Big-O
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartCodeChallenge(practiceModalJob)}
                  className="mt-5 w-full py-2.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 border border-cyan-500/30 hover:border-cyan-500 text-cyan-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Iniciar Reto Código</span>
                </button>
              </div>

              {/* Opción 3: Ambos (Preparación Completa 360°) */}
              <div className="relative group flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-purple-950/30 via-zinc-900/80 to-zinc-900/90 border border-purple-500/40 hover:border-purple-400 transition-all flex-1 shadow-lg shadow-purple-950/20">
                <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-md">
                  Recomendado
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-purple-200 transition-colors">
                      Preparación Completa
                    </h4>
                    <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                      Entrenamiento integral 360°: resuelve primero el reto técnico de código y luego valida tus conceptos en la entrevista técnica por voz.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                      Voz + Código
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 font-medium">
                      Seguimiento Dual
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStartDualPreparation(practiceModalJob)}
                  disabled={Boolean(simulatingJobId)}
                  className="mt-5 w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:via-purple-500 hover:to-cyan-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{simulatingJobId ? "Generando..." : "Realizar Ambos (360°)"}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs text-zinc-500">
              <span>Las sesiones quedan registradas en tu historial de preparación.</span>
              <button
                onClick={() => setPracticeModalJob(null)}
                className="text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
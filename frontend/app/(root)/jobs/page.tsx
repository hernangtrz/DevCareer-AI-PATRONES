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
  Target,
  Zap,
  Mic,
  MapPin,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Filter,
  Layers,
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
  Plus,
  Trash2,
  Save,
  Check,
  Calendar,
  MessageSquare,
  HelpCircle,
  X,
  ChevronRight,
} from "lucide-react";

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

const CONNECTED_PLATFORMS = [
  { id: "greenhouse", name: "Greenhouse ATS", type: "Postulación Directa", icon: "🟢", count: 15, active: true },
  { id: "lever", name: "Lever ATS", type: "Formulario Oficial", icon: "⚡", count: 15, active: true },
  { id: "remoteok", name: "RemoteOK", type: "Remoto Tech", icon: "🌍", count: 20, active: true },
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
  const [activeMainTab, setActiveMainTab] = useState<"feed" | "saved" | "applications">("feed");
  const [liveApplications, setLiveApplications] = useState<JobApplicationDto[]>([]);
  const [liveJobs, setLiveJobs] = useState<JobOffer[]>([]);
  const [isLoadingLiveJobs, setIsLoadingLiveJobs] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [simulatingJobId, setSimulatingJobId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Custom offer modal
  const [showCustomOfferModal, setShowCustomOfferModal] = useState(false);
  const [customOfferText, setCustomOfferText] = useState("");

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Carga inicial de datos
  useEffect(() => {
    let isMounted = true;

    // Restaurar postulaciones y guardados de localStorage si existen
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "applications") {
        setActiveMainTab("applications");
      }
      try {
        const savedApplied = localStorage.getItem("devcareer_applied_jobs");
        if (savedApplied) setAppliedJobIds(JSON.parse(savedApplied));

        const savedBookmarks = localStorage.getItem("devcareer_saved_jobs");
        if (savedBookmarks) setSavedJobs(JSON.parse(savedBookmarks));

        const savedApps = localStorage.getItem("devcareer_applications");
        if (savedApps) {
          const parsed = JSON.parse(savedApps);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLiveApplications(parsed);
            const notesMap: { [id: string]: string } = {};
            parsed.forEach((a: any) => {
              if (a.notes) notesMap[a.id] = a.notes;
            });
            setEditingNotes((prev) => ({ ...notesMap, ...prev }));
          }
        }
      } catch (e) {
        console.error("Error leyendo de localStorage:", e);
      }
    }

    async function loadData() {
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
        setIsLoadingLiveJobs(true);
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
              seniority: (j.seniority as any) || "Mid-Level",
              salaryMonthlyUSD: j.salary || "$5,000 - $7,500 USD",
              postedAgo: "En vivo",
              matchScore: score,
              matchLevel,
              matchedSkills:
                j.matchedSkills && j.matchedSkills.length > 0
                  ? j.matchedSkills
                  : (j.requiredSkills || []).slice(0, 3),
              missingSkills: j.missingSkills || [],
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
      } finally {
        if (isMounted) setIsLoadingLiveJobs(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleSaveJob = (id: string) => {
    setSavedJobs((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_saved_jobs", JSON.stringify(next));
      }
      return next;
    });
  };

  // POSTULACIÓN DIRECTA (1-CLIC)
  const handleDirectApply = async (job: JobOffer) => {
    setApplyingJobId(job.id);
    try {
      // 1. Abrir de inmediato el formulario oficial de la empresa en nueva pestaña
      window.open(job.externalUrl, "_blank", "noopener,noreferrer");

      // 2. Registrar la postulación en Backend
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

      const newApp: JobApplicationDto = {
        id: res.application?.id || `app-${Date.now()}`,
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
      };

      const updatedApps = [newApp, ...liveApplications.filter((a) => a.jobId !== job.id)];
      setLiveApplications(updatedApps);

      const updatedJobIds = Array.from(new Set([...appliedJobIds, job.id]));
      setAppliedJobIds(updatedJobIds);

      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_applications", JSON.stringify(updatedApps));
        localStorage.setItem("devcareer_applied_jobs", JSON.stringify(updatedJobIds));
      }

      showToast(`¡Postulación registrada! Te abrimos el formulario oficial de ${job.company} en una nueva pestaña.`);
    } catch (e: any) {
      console.error("Error al registrar postulación:", e);
      showToast("Error registrando postulación: " + e.message);
    } finally {
      setApplyingJobId(null);
    }
  };

  // CAMBIO INTERACTIVO DE ESTADO
  const handleStatusChange = async (
    appId: string,
    newStatus: "applied" | "interviewing" | "offered" | "rejected"
  ) => {
    setLiveApplications((prev) => {
      const updated = prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a));
      if (typeof window !== "undefined") {
        localStorage.setItem("devcareer_applications", JSON.stringify(updated));
      }
      return updated;
    });

    try {
      await updateJobApplicationStatus(appId, newStatus);
      showToast("Estado actualizado con éxito");
    } catch (e: any) {
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
    } catch (e: any) {
      console.error("Error guardando notas:", e);
      showToast("Error guardando notas: " + e.message);
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
    } catch (e: any) {
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
    } catch (e: any) {
      alert("Error iniciando entrevista personalizada: " + e.message);
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
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              ¡Bienvenido de vuelta, {profileData.fullName.split(" ")[0]}! 👋
            </h1>
            <p className="text-zinc-400 text-xs md:text-sm max-w-xl">
              Explora vacantes verificadas en tiempo real de Greenhouse, Lever y RemoteOK, postúlate directamente y gestiona cada proceso de selección en tu espacio de seguimiento.
            </p>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Navigation Tabs (Feed / Saved / Mis Postulaciones) */}
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
                          {platform.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                            {platform.name}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {count} ofertas activas
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isSelected ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        ✓
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
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
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
              </div>

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
                          {/* Botón Simular Entrevista */}
                          <button
                            onClick={() => handleSimulateInterviewForJob(job)}
                            disabled={isSimulating}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-400 hover:text-pink-300 transition-colors cursor-pointer disabled:opacity-50"
                            title="Crear simulación técnica con el patrón Builder"
                          >
                            <Mic className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
                            <span>{isSimulating ? "Creando entrevista a la medida..." : "Simular entrevista para esta oferta"}</span>
                          </button>

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
                                <a
                                  href={job.externalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                                  title="Abrir el formulario oficial nuevamente"
                                >
                                  <span>Formulario Oficial</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => setActiveMainTab("applications")}
                                  className="px-4 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Ver en Seguimiento</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDirectApply(job)}
                                disabled={isApplying}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                                title="Abrir formulario oficial de la empresa y registrar en Mis Postulaciones"
                              >
                                {isApplying ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>Abriendo vacante...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    <span>Postularme a esta vacante</span>
                                    <ExternalLink className="w-3 h-3 text-emerald-200" />
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
                  Al hacer clic en "Postularme", la vacante se guarda automáticamente en tu tablero de seguimiento para que actualices sus estados y practiques entrevistas simuladas.
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
                Explora las vacantes disponibles y presiona "Postularme a esta vacante" para abrir el formulario y registrar tu postulación automáticamente.
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
                              📝 Notas activas
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
                              🔵 Postulado / En Espera
                            </option>
                            <option value="interviewing" className="bg-zinc-900 text-amber-300">
                              🟡 En Proceso de Entrevista
                            </option>
                            <option value="offered" className="bg-zinc-900 text-emerald-300">
                              🟢 ¡Oferta Recibida!
                            </option>
                            <option value="rejected" className="bg-zinc-900 text-rose-300">
                              🔴 No Seleccionado
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
                        {app.techstack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-0.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono font-medium"
                          >
                            {tech}
                          </span>
                        ))}
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

                    {/* Acciones de la Postulación */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      {/* Botón Practicar Entrevista Técnica Simulada */}
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
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 flex items-center gap-2 transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50 w-fit"
                        title="Crear una sesión de entrevista simulada por voz para este puesto específico con IA"
                      >
                        <Mic className={`w-4 h-4 ${isSimulating ? "animate-spin" : ""}`} />
                        <span>
                          {isSimulating
                            ? "Preparando entrevista..."
                            : "Practicar Entrevista Técnica Simulada"}
                        </span>
                      </button>

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
    </div>
  );
}

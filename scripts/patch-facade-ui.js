const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../frontend/app/(root)/jobs/page.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Ensure Copy is in lucide-react imports
if (!content.includes("Copy,")) {
  content = content.replace("ChevronRight,", "ChevronRight,\n  Copy,");
}

// 2. Add applicationModal state
const stateMarker = 'const [customOfferText, setCustomOfferText] = useState("");';
const modalState = `const [customOfferText, setCustomOfferText] = useState("");

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
  }>({});`;

if (!content.includes("applicationModal, setApplicationModal")) {
  content = content.replace(stateMarker, modalState);
}

// 3. Update handleDirectApply
const directApplyStart = "  // POSTULACIÓN DIRECTA (1-CLIC)\n  const handleDirectApply = async (job: JobOffer) => {";
const directApplyEnd = "  // CAMBIO INTERACTIVO DE ESTADO";

const newDirectApply = `  // POSTULACIÓN DIRECTA (1-CLIC) A TRAVÉS DEL PATRÓN FACADE
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
        description: \`Vacante para \${job.title} en \${job.company}\`,
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
        id: res.application?.id || \`app-\${Date.now()}\`,
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

      showToast(\`¡Materiales preparados para \${job.company}! Carta de presentación y CV adaptado listos.\`);
    } catch (e: any) {
      console.error("Error al registrar postulación:", e);
      showToast("Error registrando postulación: " + e.message);
    } finally {
      setApplyingJobId(null);
    }
  };

`;

const directApplyRegex = /\/\/ POSTULACI[ÓO]N DIRECTA \(1-CLIC\)[\s\S]*?\/\/ CAMBIO INTERACTIVO DE ESTADO/;
content = content.replace(directApplyRegex, newDirectApply + "  // CAMBIO INTERACTIVO DE ESTADO");

// 4. Update Job Card buttons area
const jobCardButtonsRegex = /\{\/\* Botón de Postulación Normal \*\/\}[\s\S]*?\{\/\* Columna Derecha: Widget de Perfil \*\/\}/;
const newJobCardButtons = `{/* Botón de Postulación Normal */}
                            {isApplied ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const existing = liveApplications.find((a) => a.jobId === job.id);
                                    setApplicationModal({
                                      isOpen: true,
                                      jobTitle: job.title,
                                      company: job.company,
                                      externalUrl: job.externalUrl,
                                      coverLetter: existing?.coverLetter || "",
                                      adaptedResumeSummary: existing?.adaptedResumeSummary || "",
                                      interviewId: existing?.interviewId,
                                    });
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                  title="Ver carta de motivación y CV adaptado generados"
                                >
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Ver Carta & CV</span>
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

            {/* Columna Derecha: Widget de Perfil */}`;

content = content.replace(jobCardButtonsRegex, newJobCardButtons);

// 5. In "Mis Postulaciones" tab: add Cover Letter & Adapted Resume viewer
const trackerNotesEnd = `                      />
                    </div>

                    {/* Acciones de la Postulación */}`;

const trackerWithMaterials = `                      />
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
                                className={\`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 \${
                                  expandedAppMaterials[app.id] === "coverLetter"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                                }\`}
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
                                className={\`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 \${
                                  expandedAppMaterials[app.id] === "resume"
                                    ? "bg-indigo-600 text-white"
                                    : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800"
                                }\`}
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

                    {/* Acciones de la Postulación */}`;

if (!content.includes("Materiales Preparados para esta Vacante")) {
  content = content.replace(trackerNotesEnd, trackerWithMaterials);
}

// 6. Append applicationModal before final closing tag
const applicationModalJsx = `      {/* Modal: Materiales de Postulación Generados (Carta de Motivación & CV Adaptado) */}
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
                className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer \${
                  modalActiveTab === "coverLetter"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }\`}
              >
                <FileText className="w-4 h-4" />
                <span>Carta de Presentación / Motivación</span>
              </button>
              <button
                onClick={() => setModalActiveTab("resume")}
                className={\`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer \${
                  modalActiveTab === "resume"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                }\`}
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
                      router.push(\`/interview/\${applicationModal.interviewId}\`);
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
`;

if (!content.includes("Modal: Materiales de Postulación Generados")) {
  const lastDivIndex = content.lastIndexOf("</div>\n  );\n}");
  if (lastDivIndex !== -1) {
    content = content.slice(0, lastDivIndex) + applicationModalJsx + "\n    </div>\n  );\n}";
  }
}

fs.writeFileSync(filePath, content, "utf-8");
console.log("Successfully patched frontend/app/(root)/jobs/page.tsx with Facade materials and modal!");


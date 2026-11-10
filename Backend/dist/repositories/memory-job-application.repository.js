"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryJobApplicationRepository = void 0;
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, "../../data");
const DATA_FILE = path_1.default.join(DATA_DIR, "job-applications.json");
const SEED_APPLICATIONS = [
    {
        id: "app-palantir-backend",
        userId: "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
        jobId: "lever-10dfc8bc-99ad-4ca2-ab76-853cb90a92c2",
        jobTitle: "Backend Software Engineer - Application Development",
        company: "Palantir Technologies",
        platform: "Lever",
        location: "Remoto (Americas)",
        salary: "$10,800 - $14,500 USD",
        appliedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        status: "interviewing",
        notes: "Contacto: Carlos Mendoza (Lead Tech Recruiter). Entrevista técnica de arquitectura programada para el jueves 10:00 AM. Repasar diseño de microservicios, Java, Python y Go.",
        url: "https://jobs.lever.co/palantir/10dfc8bc-99ad-4ca2-ab76-853cb90a92c2/apply",
        techstack: ["Java", "Python", "Go", "TypeScript", "React", "Docker"],
        matchScore: 95,
    },
    {
        id: "app-gitlab-senior",
        userId: "3aa77ca5-52cf-4204-8d4a-85c0456e716f",
        jobId: "gh-8843512002",
        jobTitle: "Senior Backend Engineer (Go & Ruby)",
        company: "GitLab",
        platform: "Greenhouse",
        location: "Remoto (Global)",
        salary: "$11,250 - $15,400 USD",
        appliedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        status: "applied",
        notes: "Postulado a través del formulario oficial de Greenhouse. En espera de respuesta del equipo de selección. Expectativa salarial enviada: $13,500 USD.",
        url: "https://job-boards.greenhouse.io/gitlab/jobs/8843512002#app",
        techstack: ["Go", "Ruby", "PostgreSQL", "Docker", "Kubernetes", "Git"],
        matchScore: 98,
    },
];
class MemoryJobApplicationRepository {
    constructor() {
        this.ensureInitialized();
    }
    ensureInitialized() {
        if (MemoryJobApplicationRepository.initialized)
            return;
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs_1.default.existsSync(DATA_FILE)) {
                const raw = fs_1.default.readFileSync(DATA_FILE, "utf8");
                const list = JSON.parse(raw);
                if (Array.isArray(list) && list.length > 0) {
                    list.forEach((app) => MemoryJobApplicationRepository.store.set(app.id, app));
                    MemoryJobApplicationRepository.initialized = true;
                    return;
                }
            }
            // Inicializar con semillas iniciales si el archivo está vacío
            SEED_APPLICATIONS.forEach((app) => MemoryJobApplicationRepository.store.set(app.id, app));
            this.saveToFile();
            MemoryJobApplicationRepository.initialized = true;
        }
        catch (e) {
            console.error("Error inicializando almacenamiento persistente de postulaciones:", e);
            SEED_APPLICATIONS.forEach((app) => MemoryJobApplicationRepository.store.set(app.id, app));
            MemoryJobApplicationRepository.initialized = true;
        }
    }
    saveToFile() {
        try {
            if (!fs_1.default.existsSync(DATA_DIR)) {
                fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
            }
            const list = Array.from(MemoryJobApplicationRepository.store.values());
            fs_1.default.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
        }
        catch (e) {
            console.error("Error guardando postulaciones en archivo:", e);
        }
    }
    async create(app) {
        this.ensureInitialized();
        const id = "app-" + (0, uuid_1.v4)().slice(0, 8);
        const item = { id, ...app };
        MemoryJobApplicationRepository.store.set(id, item);
        this.saveToFile();
        return id;
    }
    async getByUserId(userId) {
        this.ensureInitialized();
        const all = Array.from(MemoryJobApplicationRepository.store.values());
        const userApps = all.filter((a) => a.userId === userId);
        return userApps.length > 0 ? userApps : all;
    }
    async getById(id) {
        this.ensureInitialized();
        return MemoryJobApplicationRepository.store.get(id) || null;
    }
    async updateStatus(id, status) {
        this.ensureInitialized();
        const item = MemoryJobApplicationRepository.store.get(id);
        if (item) {
            item.status = status;
            this.saveToFile();
        }
    }
    async updateNotes(id, notes) {
        this.ensureInitialized();
        const item = MemoryJobApplicationRepository.store.get(id);
        if (item) {
            item.notes = notes;
            this.saveToFile();
        }
    }
    async delete(id) {
        this.ensureInitialized();
        MemoryJobApplicationRepository.store.delete(id);
        this.saveToFile();
    }
}
exports.MemoryJobApplicationRepository = MemoryJobApplicationRepository;
MemoryJobApplicationRepository.store = new Map();
MemoryJobApplicationRepository.initialized = false;
//# sourceMappingURL=memory-job-application.repository.js.map
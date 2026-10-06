"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewPrototypeRegistry = void 0;
const interview_prototype_1 = require("./interview.prototype");
const constants_1 = require("../../config/constants");
/**
 * Catálogo / Registro de Prototipos de Entrevistas
 *
 * Centraliza los arquetipos de entrevistas predefinidas del sistema y
 * permite a los clientes solicitar copias independientes a través de `clone()`.
 * Previene la instanciación acoplada y manual campo por campo.
 */
class InterviewPrototypeRegistry {
    constructor() {
        this.prototypes = new Map();
        this.loadDefaultTemplates();
    }
    /**
     * Obtiene la instancia única (Singleton) del registro de prototipos.
     */
    static getInstance() {
        if (!InterviewPrototypeRegistry.instance) {
            InterviewPrototypeRegistry.instance = new InterviewPrototypeRegistry();
        }
        return InterviewPrototypeRegistry.instance;
    }
    /**
     * Carga inicial de arquetipos estándar basados en las constantes del sistema.
     */
    loadDefaultTemplates() {
        for (const template of constants_1.interviewTemplates) {
            const prototype = new interview_prototype_1.InterviewPrototype({
                role: template.role,
                level: template.level,
                type: template.type,
                techstack: template.techstack,
                questions: template.questions,
                coverImage: (0, constants_1.getRandomInterviewCover)(),
                finalized: true,
            });
            this.register(template.id, prototype);
        }
    }
    /**
     * Registra un nuevo prototipo en el catálogo.
     */
    register(key, prototype) {
        if (!key || !prototype) {
            throw new Error("Clave y prototipo son requeridos para el registro.");
        }
        this.prototypes.set(key, prototype);
    }
    /**
     * Obtiene la referencia directa del prototipo (solo lectura/consulta).
     */
    get(key) {
        return this.prototypes.get(key) || null;
    }
    /**
     * Retorna una COPIA INDEPENDIENTE (clon) del prototipo solicitado.
     * Modificaciones al objeto devuelto no afectarán al prototipo registrado.
     */
    clone(key) {
        const prototype = this.prototypes.get(key);
        if (!prototype) {
            return null;
        }
        return prototype.clone();
    }
    /**
     * Comprueba si existe un prototipo bajo la clave especificada.
     */
    has(key) {
        return this.prototypes.has(key);
    }
    /**
     * Lista todas las claves de prototipos registradas.
     */
    listKeys() {
        return Array.from(this.prototypes.keys());
    }
    /**
     * Permite reiniciar el catálogo a su estado base (útil para pruebas unitarias).
     */
    resetToDefaults() {
        this.prototypes.clear();
        this.loadDefaultTemplates();
    }
}
exports.InterviewPrototypeRegistry = InterviewPrototypeRegistry;
//# sourceMappingURL=interview-prototype.registry.js.map
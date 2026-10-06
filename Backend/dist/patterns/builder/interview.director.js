"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterviewDirector = void 0;
/**
 * Director del Patrón Builder: InterviewDirector
 *
 * Coordina y secuencia los pasos de construcción para producir familias
 * o configuraciones específicas de entrevistas, aislando al cliente del detalle fino
 * del algoritmo de ensamblado.
 */
class InterviewDirector {
    constructor(builder) {
        this.builder = builder;
    }
    /**
     * Cambia el builder asignado al director.
     */
    setBuilder(builder) {
        this.builder = builder;
    }
    /**
     * Construye una entrevista en estado BORRADOR (sin preguntas aún, lista para IA en segundo plano).
     */
    constructDraftInterview(params) {
        return this.builder
            .reset()
            .forUser(params.userId)
            .withRole(params.role)
            .withLevel(params.level)
            .ofType(params.type)
            .withTechStack(params.techstack)
            .withQuestions([])
            .assignRandomCover()
            .asDraft()
            .build();
    }
    /**
     * Construye una entrevista técnica completa ya finalizada con su banco de preguntas.
     */
    constructTechnicalInterview(params) {
        const b = this.builder
            .reset()
            .forUser(params.userId)
            .withRole(params.role)
            .withLevel(params.level)
            .ofType("Technical")
            .withTechStack(params.techstack)
            .withQuestions(params.questions)
            .asFinalized();
        if (params.coverImage) {
            b.withCoverImage(params.coverImage);
        }
        else {
            b.assignRandomCover();
        }
        return b.build();
    }
    /**
     * Construye una entrevista basada en un Prototipo existente adaptándolo al usuario.
     */
    constructFromPrototype(userId, prototype) {
        const clone = prototype.clone();
        clone.prepareForUser(userId, { finalized: true });
        return this.builder
            .reset()
            .forUser(userId)
            .withRole(clone.role)
            .withLevel(clone.level)
            .ofType(clone.type)
            .withTechStack(clone.techstack)
            .withQuestions(clone.questions)
            .withCoverImage(clone.coverImage)
            .asFinalized()
            .build();
    }
}
exports.InterviewDirector = InterviewDirector;
//# sourceMappingURL=interview.director.js.map
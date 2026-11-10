"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseColleague = void 0;
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): BaseColleague (Componente / Colega Base)
 * ============================================================================
 * Clase base abstracta para los componentes que participan en la coordinación
 * mediada. Cada colega conoce únicamente la interfaz `ICareerMediator` y nunca
 * importa ni invoca directamente a otros colegas concretos.
 */
class BaseColleague {
    constructor(mediator) {
        this.mediator = mediator;
    }
    /**
     * Vincula o actualiza el mediador responsable de coordinar a este colega.
     */
    setMediator(mediator) {
        this.mediator = mediator;
    }
    /**
     * Emite un evento de dominio hacia el mediador para que coordine las
     * reacciones correspondientes en los demás colegas del ecosistema.
     */
    async emit(event, payload) {
        if (!this.mediator) {
            return;
        }
        await this.mediator.notify(this, event, payload);
    }
}
exports.BaseColleague = BaseColleague;
//# sourceMappingURL=base.colleague.js.map
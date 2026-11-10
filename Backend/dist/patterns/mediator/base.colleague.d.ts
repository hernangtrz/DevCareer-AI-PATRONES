import { ICareerMediator, CareerDomainEvent, CareerEventPayloadMap } from "./career-mediator.interface";
/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): BaseColleague (Componente / Colega Base)
 * ============================================================================
 * Clase base abstracta para los componentes que participan en la coordinación
 * mediada. Cada colega conoce únicamente la interfaz `ICareerMediator` y nunca
 * importa ni invoca directamente a otros colegas concretos.
 */
export declare abstract class BaseColleague {
    protected mediator?: ICareerMediator;
    abstract readonly colleagueName: string;
    constructor(mediator?: ICareerMediator);
    /**
     * Vincula o actualiza el mediador responsable de coordinar a este colega.
     */
    setMediator(mediator: ICareerMediator): void;
    /**
     * Emite un evento de dominio hacia el mediador para que coordine las
     * reacciones correspondientes en los demás colegas del ecosistema.
     */
    protected emit<E extends CareerDomainEvent>(event: E, payload: CareerEventPayloadMap[E]): Promise<void>;
}

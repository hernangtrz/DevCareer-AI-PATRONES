import {
  ICareerMediator,
  CareerDomainEvent,
  CareerEventPayloadMap,
} from "./career-mediator.interface";

/**
 * ============================================================================
 * PATRÓN COMPORTAMENTAL MEDIATOR (GoF): BaseColleague (Componente / Colega Base)
 * ============================================================================
 * Clase base abstracta para los componentes que participan en la coordinación
 * mediada. Cada colega conoce únicamente la interfaz `ICareerMediator` y nunca
 * importa ni invoca directamente a otros colegas concretos.
 */
export abstract class BaseColleague {
  protected mediator?: ICareerMediator;

  public abstract readonly colleagueName: string;

  constructor(mediator?: ICareerMediator) {
    this.mediator = mediator;
  }

  /**
   * Vincula o actualiza el mediador responsable de coordinar a este colega.
   */
  public setMediator(mediator: ICareerMediator): void {
    this.mediator = mediator;
  }

  /**
   * Emite un evento de dominio hacia el mediador para que coordine las
   * reacciones correspondientes en los demás colegas del ecosistema.
   */
  protected async emit<E extends CareerDomainEvent>(
    event: E,
    payload: CareerEventPayloadMap[E]
  ): Promise<void> {
    if (!this.mediator) {
      return;
    }
    await this.mediator.notify(this, event, payload);
  }
}


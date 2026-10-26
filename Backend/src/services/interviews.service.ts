import { RepositoryFactory } from "../repositories/repository.factory";
import { IInterviewRepository } from "../repositories/interview.repository";
import { Interview } from "../types";
import { InterviewPrototype, InterviewPrototypeRegistry } from "../patterns/prototype";

/**
 * Servicio de Dominio para Entrevistas (DIP / OCP).
 * Delega la persistencia al contrato IInterviewRepository obtenido mediante la factoría
 * e integra los patrones Prototype y Builder para la creación desacoplada.
 */
let currentRepo: IInterviewRepository = RepositoryFactory.getInterviewRepository();

export function setInterviewRepository(repo: IInterviewRepository): void {
  currentRepo = repo;
}

export async function getInterviewsByUserId(userId: string): Promise<Interview[]> {
  return currentRepo.getByUserId(userId);
}

export async function getLatestInterviews(
  userId: string,
  limit: number = 20
): Promise<Interview[]> {
  return currentRepo.getLatest(userId, limit);
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  return currentRepo.getById(id);
}

export async function createInterview(
  interview: Omit<Interview, "id">
): Promise<string> {
  return currentRepo.create(interview);
}

export async function updateInterview(
  interview: Interview
): Promise<void> {
  return currentRepo.update(interview);
}

/**
 * Patrón Prototype: Crea una nueva entrevista a partir de una plantilla registrada
 * utilizando clonación profunda (Deep Clone).
 */
export async function createInterviewFromTemplate(
  templateId: string,
  userId: string
): Promise<string | null> {
  const registry = InterviewPrototypeRegistry.getInstance();
  const prototypeClone = registry.clone(templateId);

  if (!prototypeClone) {
    return null;
  }

  // Prepara el clon para el usuario específico (nuevo timestamp, usuario asignado)
  prototypeClone.prepareForUser(userId, { finalized: true });
  return currentRepo.create(prototypeClone.toEntity());
}

/**
 * Patrón Prototype: Clona una entrevista histórica existente para permitir reintentarla
 * o duplicarla sin afectar la entrevista original.
 */
export async function cloneInterview(
  interviewId: string,
  userId: string
): Promise<string | null> {
  const existingInterview = await currentRepo.getById(interviewId);
  if (!existingInterview) {
    return null;
  }

  const prototype = InterviewPrototype.fromEntity(existingInterview);
  const cloned = prototype.clone();
  cloned.prepareForUser(userId, { finalized: true });

  return currentRepo.create(cloned.toEntity());
}


export async function deleteInterview(
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await currentRepo.getById(id);
  if (!existing) return false;
  if (existing.userId !== userId) {
    throw new Error("No autorizado para eliminar esta entrevista");
  }
  await currentRepo.delete(id);
  return true;
}

export async function editInterview(
  id: string,
  userId: string,
  updates: Partial<Pick<Interview, "role" | "level" | "techstack" | "questions" | "finalized" | "type">>
): Promise<Interview | null> {
  const existing = await currentRepo.getById(id);
  if (!existing) return null;
  if (existing.userId !== userId) {
    throw new Error("No autorizado para editar esta entrevista");
  }
  const updated: Interview = {
    ...existing,
    ...updates,
    id: existing.id,
    userId: existing.userId,
  };
  await currentRepo.update(updated);
  return updated;
}

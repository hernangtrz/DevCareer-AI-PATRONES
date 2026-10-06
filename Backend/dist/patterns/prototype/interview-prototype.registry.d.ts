import { InterviewPrototype } from "./interview.prototype";
/**
 * Catálogo / Registro de Prototipos de Entrevistas
 *
 * Centraliza los arquetipos de entrevistas predefinidas del sistema y
 * permite a los clientes solicitar copias independientes a través de `clone()`.
 * Previene la instanciación acoplada y manual campo por campo.
 */
export declare class InterviewPrototypeRegistry {
    private static instance;
    private prototypes;
    private constructor();
    /**
     * Obtiene la instancia única (Singleton) del registro de prototipos.
     */
    static getInstance(): InterviewPrototypeRegistry;
    /**
     * Carga inicial de arquetipos estándar basados en las constantes del sistema.
     */
    private loadDefaultTemplates;
    /**
     * Registra un nuevo prototipo en el catálogo.
     */
    register(key: string, prototype: InterviewPrototype): void;
    /**
     * Obtiene la referencia directa del prototipo (solo lectura/consulta).
     */
    get(key: string): InterviewPrototype | null;
    /**
     * Retorna una COPIA INDEPENDIENTE (clon) del prototipo solicitado.
     * Modificaciones al objeto devuelto no afectarán al prototipo registrado.
     */
    clone(key: string): InterviewPrototype | null;
    /**
     * Comprueba si existe un prototipo bajo la clave especificada.
     */
    has(key: string): boolean;
    /**
     * Lista todas las claves de prototipos registradas.
     */
    listKeys(): string[];
    /**
     * Permite reiniciar el catálogo a su estado base (útil para pruebas unitarias).
     */
    resetToDefaults(): void;
}

/**
 * PATRÓN CREACIONAL ABSTRACT FACTORY (GoF)
 * Familias de repositorios intercambiables (Supabase, DynamoDB, Mock).
 */
export * from "../../repositories/factories/datastore.factory";
export * from "../../repositories/factories/supabase-datastore.factory";
export * from "../../repositories/factories/dynamo-datastore.factory";
export * from "../../repositories/factories/mock-datastore.factory";
export * from "../../repositories/repository.factory";

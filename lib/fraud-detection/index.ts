/**
 * Fraud Detection Module
 * 
 * Ce module contient tous les outils de détection de fraude :
 * - Card Testing Detection : Détection des attaques de test de cartes
 * - Rules Engine : Moteur de règles personnalisables
 * - Rule Templates : Templates de règles prédéfinies
 */

// Card Testing Detection
export { detectCardTesting } from "./card-testing";
export type { CardTestingResult } from "./card-testing";

// Rules Engine
export {
  applyRules,
  buildRuleContext,
} from "./rules-engine";
export type {
  RuleEvaluationContext,
  RuleEvaluationResult,
} from "./rules-engine";


import { db } from "@/lib/db";
import { rules, Rule } from "@/lib/schemas/rules";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";

export type RuleEvaluationContext = {
  amount: number;
  currency: string;
  country?: string;
  ipAddress?: string;
  cardBrand?: string;
  cardLast4?: string;
  email?: string;
  metadata?: Record<string, any>;
  paymentIntent: Stripe.PaymentIntent;
  charge?: Stripe.Charge;
};

export type RuleEvaluationResult = {
  action: "allow" | "block" | "review" | "require_3ds" | "alert_only";
  triggeredRule?: {
    id: string;
    name: string;
    priority: number;
  };
  allMatches: Array<{
    id: string;
    name: string;
    action: string;
    priority: number;
  }>;
};

/**
 * Évalue une condition de règle
 */
function evaluateCondition(
  context: RuleEvaluationContext,
  condition: any
): boolean {
  if (!condition || typeof condition !== "object") {
    return false;
  }

  const { field, operator, value } = condition;

  if (!field || !operator) {
    return false;
  }

  // Récupérer la valeur du contexte
  let contextValue: any;

  // Support pour les champs imbriqués (ex: "metadata.ip_address")
  if (field.includes(".")) {
    const parts = field.split(".");
    contextValue = parts.reduce((obj: any, key: string) => obj?.[key], context as any);
  } else {
    contextValue = (context as any)[field];
  }

  // Évaluation selon l'opérateur
  switch (operator) {
    case "eq": // égal
      return contextValue === value;

    case "ne": // différent
      return contextValue !== value;

    case "gt": // supérieur
      return Number(contextValue) > Number(value);

    case "gte": // supérieur ou égal
      return Number(contextValue) >= Number(value);

    case "lt": // inférieur
      return Number(contextValue) < Number(value);

    case "lte": // inférieur ou égal
      return Number(contextValue) <= Number(value);

    case "in": // dans la liste
      return Array.isArray(value) && value.includes(contextValue);

    case "not_in": // pas dans la liste
      return Array.isArray(value) && !value.includes(contextValue);

    case "contains": // contient (pour strings)
      return String(contextValue).toLowerCase().includes(String(value).toLowerCase());

    case "starts_with": // commence par
      return String(contextValue).toLowerCase().startsWith(String(value).toLowerCase());

    case "ends_with": // termine par
      return String(contextValue).toLowerCase().endsWith(String(value).toLowerCase());

    case "regex": // expression régulière
      try {
        return new RegExp(value).test(String(contextValue));
      } catch {
        return false;
      }

    default:
      console.warn(`Opérateur inconnu: ${operator}`);
      return false;
  }
}

/**
 * Évalue une règle complète (peut avoir plusieurs conditions)
 */
function evaluateRule(context: RuleEvaluationContext, rule: any): boolean {
  const conditions = rule.conditions;

  if (!conditions || typeof conditions !== "object") {
    return false;
  }

  // Support pour une seule condition (objet simple)
  if ("field" in conditions) {
    return evaluateCondition(context, conditions);
  }

  // Support pour plusieurs conditions avec logique AND/OR
  if ("and" in conditions && Array.isArray(conditions.and)) {
    return conditions.and.every((cond: any) => evaluateCondition(context, cond));
  }

  if ("or" in conditions && Array.isArray(conditions.or)) {
    return conditions.or.some((cond: any) => evaluateCondition(context, cond));
  }

  // Par défaut, essayer d'évaluer comme une condition simple
  return evaluateCondition(context, conditions);
}

/**
 * Applique toutes les règles de l'organisation et retourne l'action à prendre
 */
export async function applyRules(
  organizationId: string,
  context: RuleEvaluationContext
): Promise<RuleEvaluationResult> {
  try {
    // Récupérer toutes les règles actives de l'organisation (triées par priorité)
    const organizationRules = await db.query.rules.findMany({
      where: eq(rules.organizationId, organizationId),
      orderBy: (rules, { desc }) => [desc(rules.priority), desc(rules.createdAt)],
    });

    // Filtrer uniquement les règles actives
    const activeRules = organizationRules.filter((rule) => rule.enabled);

    if (activeRules.length === 0) {
      return {
        action: "allow",
        allMatches: [],
      };
    }

    console.log(`📋 Évaluation de ${activeRules.length} règles actives`);

    // Évaluer chaque règle et collecter les matches
    const matches: Array<{
      id: string;
      name: string;
      action: string;
      priority: number;
    }> = [];

    for (const rule of activeRules) {
      const matched = evaluateRule(context, rule);

      if (matched) {
        console.log(`✅ Règle déclenchée: ${rule.name} (action: ${rule.action})`);
        matches.push({
          id: rule.id,
          name: rule.name,
          action: rule.action,
          priority: rule.priority,
        });
      }
    }

    // Si aucune règle ne matche, autoriser
    if (matches.length === 0) {
      console.log("✅ Aucune règle déclenchée, transaction autorisée");
      return {
        action: "allow",
        allMatches: [],
      };
    }

    // Prendre la règle avec la plus haute priorité
    const highestPriorityMatch = matches[0]; // Déjà trié par priorité

    console.log(
      `🎯 Action finale: ${highestPriorityMatch.action} (règle: ${highestPriorityMatch.name})`
    );

    return {
      action: highestPriorityMatch.action as any,
      triggeredRule: highestPriorityMatch,
      allMatches: matches,
    };
  } catch (error) {
    console.error("❌ Erreur lors de l'évaluation des règles:", error);
    // En cas d'erreur, autoriser par défaut (fail-open)
    return {
      action: "allow",
      allMatches: [],
    };
  }
}

/**
 * Construit le contexte d'évaluation à partir d'un PaymentIntent Stripe
 */
export function buildRuleContext(
  paymentIntent: Stripe.PaymentIntent,
  charge?: Stripe.Charge
): RuleEvaluationContext {
  const cardDetails = charge?.payment_method_details?.card;

  return {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    country:
      paymentIntent.metadata?.country ||
      charge?.billing_details?.address?.country ||
      cardDetails?.country ||
      undefined,
    ipAddress:
      paymentIntent.metadata?.ip_address || charge?.metadata?.ip_address || undefined,
    cardBrand: cardDetails?.brand || undefined,
    cardLast4: cardDetails?.last4 || undefined,
    email:
      paymentIntent.receipt_email ||
      charge?.billing_details?.email ||
      undefined,
    metadata: paymentIntent.metadata,
    paymentIntent,
    charge,
  };
}


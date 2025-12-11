"use server";

import { db } from "@/lib/db";
import { rules, rulesInsertSchema } from "@/lib/schemas/rules";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export type CreateRuleInput = {
  organizationId: string;
  name: string;
  description?: string;
  enabled?: boolean;
  priority?: number;
  conditions: Record<string, any>;
  action: "block" | "review" | "require_3ds" | "alert_only";
  threshold?: number;
};

export async function createRule(input: CreateRuleInput) {
  try {
    // Validation des données
    const validatedData = rulesInsertSchema.parse({
      ...input,
      updatedAt: new Date(),
    });

    // Création de la règle
    const [newRule] = await db
      .insert(rules)
      .values(validatedData)
      .returning();

    // Revalider la page des règles
    revalidatePath("/dashboard/rules");

    return {
      success: true,
      data: newRule,
    };
  } catch (error) {
    console.error("Error creating rule:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la création de la règle",
    };
  }
}

export async function updateRule(
  id: string,
  input: Partial<CreateRuleInput>
) {
  try {
    const [updatedRule] = await db
      .update(rules)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(eq(rules.id, id))
      .returning();

    revalidatePath("/dashboard/rules");

    return {
      success: true,
      data: updatedRule,
    };
  } catch (error) {
    console.error("Error updating rule:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la mise à jour de la règle",
    };
  }
}

export async function deleteRule(id: string) {
  try {
    await db.delete(rules).where(eq(rules.id, id));

    revalidatePath("/dashboard/rules");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting rule:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la suppression de la règle",
    };
  }
}

export async function toggleRuleEnabled(id: string, enabled: boolean) {
  try {
    const [updatedRule] = await db
      .update(rules)
      .set({
        enabled,
        updatedAt: new Date(),
      })
      .where(eq(rules.id, id))
      .returning();

    revalidatePath("/dashboard/rules");

    return {
      success: true,
      data: updatedRule,
    };
  } catch (error) {
    console.error("Error toggling rule:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Une erreur est survenue lors de la modification de la règle",
    };
  }
}

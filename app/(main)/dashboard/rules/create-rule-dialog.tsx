"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus,
  Loader2,
  ChevronRight,
  Info,
  Zap,
  Filter,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { createRule, type CreateRuleInput } from "@/lib/actions/rules";
import { cn } from "@/lib/utils";

// Schema de validation pour le formulaire
const createRuleFormSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  enabled: z.boolean().default(true),
  priority: z.coerce
    .number()
    .int()
    .min(0, "La priorité doit être supérieure ou égale à 0")
    .default(0),
  action: z.enum(["block", "review", "require_3ds", "alert_only"]),
  conditionField: z.string().min(1, "Le champ est requis"),
  conditionOperator: z.enum(["gt", "lt", "eq", "in", "contains"]),
  conditionValue: z.string().min(1, "La valeur est requise"),
  threshold: z.coerce.number().int().optional(),
});

type CreateRuleFormValues = z.infer<typeof createRuleFormSchema>;

interface CreateRuleDialogProps {
  organizationId: string;
}

const steps = [
  {
    id: 1,
    title: "Informations",
    icon: Info,
  },
  {
    id: 2,
    title: "Action",
    icon: Zap,
  },
  {
    id: 3,
    title: "Conditions",
    icon: Filter,
  },
];

export function CreateRuleDialog({ organizationId }: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(createRuleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      enabled: true,
      priority: 0,
      conditionField: "",
      conditionOperator: "gt",
      conditionValue: "",
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (values: CreateRuleFormValues) => {
      // Construction de l'objet conditions à partir des champs du formulaire
      const conditions = {
        field: values.conditionField,
        operator: values.conditionOperator,
        value:
          values.conditionOperator === "in"
            ? values.conditionValue.split(",").map((v) => v.trim())
            : isNaN(Number(values.conditionValue))
              ? values.conditionValue
              : Number(values.conditionValue),
      };

      const input: CreateRuleInput = {
        organizationId,
        name: values.name,
        description: values.description,
        enabled: values.enabled,
        priority: values.priority,
        action: values.action,
        conditions,
        threshold: values.threshold,
      };

      return createRule(input);
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Règle créée avec succès !");
        form.reset();
        setOpen(false);
        // Invalider les queries pour rafraîchir la liste
        queryClient.invalidateQueries({ queryKey: ["rules"] });
      } else {
        toast.error(result.error || "Erreur lors de la création de la règle");
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast.error("Une erreur est survenue lors de la création de la règle");
    },
  });

  const onSubmit = (values: CreateRuleFormValues) => {
    createRuleMutation.mutate(values);
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof CreateRuleFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ["name", "description", "priority", "enabled"];
    } else if (currentStep === 2) {
      fieldsToValidate = ["action", "threshold"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid && currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setCurrentStep(1);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-white text-black hover:bg-zinc-200 border border-transparent shadow-none transition-all">
          <Plus className="mr-2 h-4 w-4" />
          Créer une règle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/5 text-white sm:max-w-[600px] overflow-hidden p-0 gap-0 shadow-2xl shadow-black/50">
        <DialogHeader className="px-6 py-6 border-b border-white/5 bg-zinc-900/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-medium tracking-tight text-white">
              Nouvelle règle
            </DialogTitle>
            <div className="flex items-center gap-1.5 bg-zinc-900/50 rounded-full px-3 py-1 border border-white/5">
              <span className="text-xs font-medium text-zinc-400">
                Étape {currentStep}
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-xs font-medium text-zinc-600">
                {steps.length}
              </span>
            </div>
          </div>

          {/* Minimalist Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            {steps.map((step) => {
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="flex-1 flex flex-col gap-2 group">
                  <div
                    className={cn(
                      "h-1 w-full rounded-full transition-all duration-300",
                      isActive
                        ? "bg-indigo-500"
                        : isCompleted
                          ? "bg-indigo-500/50"
                          : "bg-zinc-800",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] uppercase tracking-wider font-medium transition-colors duration-300",
                      isActive
                        ? "text-indigo-400"
                        : isCompleted
                          ? "text-zinc-400"
                          : "text-zinc-600",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col"
          >
            <div className="p-6 min-h-[400px]">
              <AnimatePresence mode="wait" initial={false}>
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-normal">
                              Nom de la règle
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: Transactions suspectes"
                                className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-normal">
                              Description
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Objectif de cette règle..."
                                className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 min-h-[100px] resize-none transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-400 font-normal">
                                Priorité
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value as number}
                                  type="number"
                                  min="0"
                                  className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-col justify-end pb-2">
                              <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-zinc-900/30">
                                <span className="text-sm text-zinc-300">
                                  Statut actif
                                </span>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-indigo-500"
                                  />
                                </FormControl>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-normal">
                              Action à déclencher
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-900/50 border-white/5 text-white focus:ring-indigo-500/50 focus:border-indigo-500/50 h-12">
                                  <SelectValue placeholder="Sélectionner une action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem
                                  value="block"
                                  className="text-rose-400 focus:text-rose-400"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                                    <span>Bloquer la transaction</span>
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="review"
                                  className="text-orange-400 focus:text-orange-400"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                                    <span>Marquer pour révision</span>
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="require_3ds"
                                  className="text-indigo-400 focus:text-indigo-400"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500" />
                                    <span>Exiger 3D Secure</span>
                                  </div>
                                </SelectItem>
                                <SelectItem
                                  value="alert_only"
                                  className="text-zinc-300 focus:text-white"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-zinc-500" />
                                    <span>Alerte uniquement</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-normal">
                              Seuil de déclenchement (optionnel)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={(field.value as number) ?? ""}
                                type="number"
                                placeholder="Ex: 5"
                                className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 transition-colors"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-zinc-500">
                              Nombre d'occurrences nécessaires
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="conditionField"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-400 font-normal">
                              Champ à analyser
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: amount"
                                className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 transition-colors"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="conditionOperator"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-400 font-normal">
                                Opérateur
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-900/50 border-white/5 text-white focus:ring-indigo-500/50 focus:border-indigo-500/50 h-11">
                                    <SelectValue placeholder="Opérateur" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                  <SelectItem value="gt">
                                    Supérieur à {">"}
                                  </SelectItem>
                                  <SelectItem value="lt">
                                    Inférieur à {"<"}
                                  </SelectItem>
                                  <SelectItem value="eq">Égal à =</SelectItem>
                                  <SelectItem value="in">
                                    Dans la liste
                                  </SelectItem>
                                  <SelectItem value="contains">
                                    Contient
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="conditionValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-400 font-normal">
                                Valeur
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ex: 1000"
                                  className="bg-zinc-900/50 border-white/5 text-white placeholder:text-zinc-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500/50 h-11 transition-colors"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4 mt-6">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-zinc-200">
                              Aperçu de la condition
                            </p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              Si{" "}
                              <span className="text-indigo-300 font-mono bg-indigo-500/10 px-1 rounded">
                                {form.watch("conditionField") || "champ"}
                              </span>{" "}
                              est{" "}
                              <span className="text-zinc-300">
                                {form.watch("conditionOperator") === "gt"
                                  ? "supérieur à"
                                  : form.watch("conditionOperator") === "lt"
                                    ? "inférieur à"
                                    : form.watch("conditionOperator") === "eq"
                                      ? "égal à"
                                      : form.watch("conditionOperator") === "in"
                                        ? "dans"
                                        : "contient"}
                              </span>{" "}
                              <span className="text-indigo-300 font-mono bg-indigo-500/10 px-1 rounded">
                                {form.watch("conditionValue") || "valeur"}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="px-6 py-4 border-t border-white/5 bg-zinc-900/30">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="text-zinc-500 hover:text-white hover:bg-white/5"
                >
                  Annuler
                </Button>

                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={prevStep}
                      className="text-zinc-400 hover:text-white hover:bg-white/5"
                    >
                      Retour
                    </Button>
                  )}

                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-white text-black hover:bg-zinc-200"
                    >
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createRuleMutation.isPending}
                      className="bg-indigo-500 text-white hover:bg-indigo-600 border border-indigo-400/20"
                    >
                      {createRuleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          Créer la règle
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

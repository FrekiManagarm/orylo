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
  DialogDescription,
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
  ChevronLeft,
  Check,
  Info,
  Zap,
  Filter,
  Sparkles,
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
  action: z.enum(["block", "review", "require_3ds", "alert_only"], {
    required_error: "Veuillez sélectionner une action",
  }),
  conditionField: z.string().min(1, "Le champ est requis"),
  conditionOperator: z.enum(["gt", "lt", "eq", "in", "contains"], {
    required_error: "Veuillez sélectionner un opérateur",
  }),
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
    description: "Nom et priorité de la règle",
    icon: Info,
  },
  {
    id: 2,
    title: "Action",
    description: "Type d'action à effectuer",
    icon: Zap,
  },
  {
    id: 3,
    title: "Conditions",
    description: "Critères de déclenchement",
    icon: Filter,
  },
];

export function CreateRuleDialog({ organizationId }: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();

  const form = useForm<CreateRuleFormValues>({
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
        <Button className="bg-white text-black hover:bg-zinc-200 group">
          <Plus className="mr-2 h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
          Créer une règle
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900/95 border-white/10 text-white max-w-3xl max-h-[90vh] overflow-hidden backdrop-blur-xl">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

        <DialogHeader className="relative z-10 pb-6">
          <DialogTitle className="text-2xl font-bold text-white">
            Créer une nouvelle règle
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Étape {currentStep} sur {steps.length}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="relative z-10 mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-all duration-300 mb-2",
                        isCompleted &&
                        "bg-indigo-500 border-indigo-500 shadow-lg shadow-indigo-500/30",
                        isCurrent &&
                        "bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-110",
                        !isCompleted &&
                        !isCurrent &&
                        "bg-zinc-900/50 border-white/10"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6 text-white" />
                      ) : (
                        <StepIcon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isCurrent ? "text-indigo-400" : "text-zinc-500"
                          )}
                        />
                      )}
                    </div>
                    <div className="text-center">
                      <p
                        className={cn(
                          "text-sm font-semibold transition-colors",
                          isCurrent || isCompleted
                            ? "text-white"
                            : "text-zinc-500"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-zinc-500 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1 mx-2 transition-all duration-300 mb-8",
                        isCompleted
                          ? "bg-indigo-500"
                          : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="relative z-10">
            <div className="min-h-[400px] overflow-hidden">
              <AnimatePresence mode="wait">
                {/* Étape 1: Informations de base */}
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-5 w-5 text-indigo-400" />
                        <h3 className="text-base font-semibold text-white">
                          Informations de base
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">
                        Donnez un nom unique à votre règle et définissez sa
                        priorité d'exécution.
                      </p>

                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">
                              Nom de la règle
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: Transactions à haut montant"
                                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-11"
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
                            <FormLabel className="text-zinc-300">
                              Description (optionnelle)
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Décrivez l'objectif de cette règle..."
                                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 min-h-[100px] resize-none"
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
                              <FormLabel className="text-zinc-300">
                                Priorité
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  min="0"
                                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-11"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-zinc-500">
                                Plus élevée = exécutée en premier
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="enabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-zinc-900/50">
                              <div className="space-y-0.5">
                                <FormLabel className="text-zinc-300">
                                  Active
                                </FormLabel>
                                <FormDescription className="text-xs text-zinc-500">
                                  Activer immédiatement
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-indigo-500"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Étape 2: Action */}
                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-orange-400" />
                        <h3 className="text-base font-semibold text-white">
                          Action à effectuer
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">
                        Choisissez l'action qui sera déclenchée lorsque les
                        conditions de cette règle seront remplies.
                      </p>

                      <FormField
                        control={form.control}
                        name="action"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">
                              Type d'action
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white focus:ring-indigo-500 h-11">
                                  <SelectValue placeholder="Sélectionner une action" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-900 border-white/10">
                                <SelectItem
                                  value="block"
                                  className="text-rose-400 focus:bg-rose-500/10 focus:text-rose-400"
                                >
                                  🛑 BLOCK - Bloquer la transaction
                                </SelectItem>
                                <SelectItem
                                  value="review"
                                  className="text-orange-400 focus:bg-orange-500/10 focus:text-orange-400"
                                >
                                  ⚠️ REVIEW - Marquer pour révision
                                </SelectItem>
                                <SelectItem
                                  value="require_3ds"
                                  className="text-indigo-400 focus:bg-indigo-500/10 focus:text-indigo-400"
                                >
                                  🔐 REQUIRE 3DS - Exiger 3D Secure
                                </SelectItem>
                                <SelectItem
                                  value="alert_only"
                                  className="text-zinc-300 focus:bg-white/10 focus:text-white"
                                >
                                  🔔 ALERT ONLY - Alerte uniquement
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs text-zinc-400">
                              L'action sera exécutée automatiquement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="threshold"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">
                              Seuil (optionnel)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder="Ex: 5"
                                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-11"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-zinc-500">
                              Nombre d'occurrences avant déclenchement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Étape 3: Conditions */}
                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-xl bg-zinc-900/50 border border-white/5 backdrop-blur-sm space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Filter className="h-5 w-5 text-purple-400" />
                        <h3 className="text-base font-semibold text-white">
                          Conditions de déclenchement
                        </h3>
                      </div>
                      <p className="text-sm text-zinc-400 mb-4">
                        Définissez les critères qui déclencheront l'exécution
                        de cette règle.
                      </p>

                      <FormField
                        control={form.control}
                        name="conditionField"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-300">
                              Champ à analyser
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ex: amount, country, ip, velocity_ip_1h"
                                className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-11"
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-zinc-500">
                              Le champ de transaction à analyser
                            </FormDescription>
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
                              <FormLabel className="text-zinc-300">
                                Opérateur
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-900/50 border-white/10 text-white focus:ring-indigo-500 h-11">
                                    <SelectValue placeholder="Opérateur" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                  <SelectItem value="gt">
                                    {">"} Supérieur à
                                  </SelectItem>
                                  <SelectItem value="lt">
                                    {"<"} Inférieur à
                                  </SelectItem>
                                  <SelectItem value="eq">= Égal à</SelectItem>
                                  <SelectItem value="in">
                                    ⊂ Dans la liste
                                  </SelectItem>
                                  <SelectItem value="contains">
                                    ⊃ Contient
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
                              <FormLabel className="text-zinc-300">
                                Valeur
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Ex: 1000 ou FR,DE"
                                  className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500 h-11"
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-zinc-500">
                                Liste: séparez par des virgules
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="mt-6 p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-indigo-300">
                              Exemple de règle
                            </p>
                            <p className="text-xs text-zinc-400 mt-1">
                              Pour bloquer les transactions supérieures à
                              1000€, utilisez: <br />
                              <span className="text-indigo-300">
                                amount {">"} 100000
                              </span>{" "}
                              (montant en centimes)
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DialogFooter className="relative z-10 gap-3 mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between w-full">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleOpenChange(false)}
                  className="text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  Annuler
                </Button>

                <div className="flex items-center gap-2">
                  {currentStep > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      className="border-white/10 text-white hover:bg-white/5"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                  )}

                  {currentStep < steps.length ? (
                    <Button
                      type="button"
                      onClick={nextStep}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                    >
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={createRuleMutation.isPending}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                    >
                      {createRuleMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Création...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Créer la règle
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

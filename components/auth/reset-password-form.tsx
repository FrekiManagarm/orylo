"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { resetPassword } from "@/lib/auth/auth.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, ArrowLeft } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    }),
    confirmPassword: z.string().min(8, {
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export function ResetPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    setIsLoading(true);
    try {
      const { error } = await resetPassword({
        newPassword: values.password,
      });

      if (error) {
        toast.error("Erreur", {
          description:
            error.message || "Impossible de réinitialiser le mot de passe.",
        });
      } else {
        toast.success("Mot de passe réinitialisé !");
        router.push("/sign-in");
      }
    } catch (err) {
      toast.error("Une erreur est survenue", {
        description: "Veuillez réessayer plus tard.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-white">
          Réinitialisation
        </CardTitle>
        <CardDescription className="text-center text-zinc-400">
          Entrez votre nouveau mot de passe
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Nouveau mot de passe
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">
                    Confirmer le mot de passe
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-white text-black hover:bg-zinc-200"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Réinitialiser le mot de passe
            </Button>
            <Button
              asChild
              variant="link"
              className="w-full font-normal text-zinc-400 hover:text-white"
            >
              <Link href="/sign-in">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Link>
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

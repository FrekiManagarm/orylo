"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, LogOut, Shield, Sparkles } from "lucide-react";

import { createOrganizationAction } from "@/lib/actions/create-organization";
import { signOut } from "@/lib/auth/auth.client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const organizationSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name is too long."),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with no spaces.",
    ),
  logo: z
    .string()
    .url("Please provide a valid URL.")
    .max(256, "URL is too long.")
    .optional()
    .or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 64);

export function CreateOrganizationForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slugEdited, setSlugEdited] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: "",
      slug: "",
      logo: "",
    },
  });

  const watchedName = form.watch("name");

  useEffect(() => {
    if (!slugEdited) {
      form.setValue("slug", slugify(watchedName), { shouldValidate: true });
    }
  }, [watchedName, slugEdited, form]);

  const friendlyUserName = useMemo(
    () => userName?.trim() || "your team",
    [userName],
  );

  const onSubmit = (values: OrganizationFormValues) => {
    startTransition(async () => {
      const result = await createOrganizationAction({
        name: values.name,
        slug: values.slug,
        logo: values.logo?.trim() || null,
      });

      if ("error" in result) {
        toast.error("Could not create organization", {
          description: result.error,
        });
        return;
      }

      toast.success("Organization created", {
        description: "You can now access the dashboard.",
      });
      router.push("/dashboard/connect");
    });
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to sign out. Please try again.";
      toast.error("Sign out failed", { description: message });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <Card className="w-full border-white/10 bg-zinc-900/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-indigo-500/10 p-2 border border-indigo-500/30 text-indigo-300">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">
                Create your organization
              </CardTitle>
              <CardDescription className="text-zinc-400">
                This workspace will protect your business from fraud.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5 rounded-full px-3 py-1.5"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing out…</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </div>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="col-span-2">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Organization name
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Acme Payments"
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
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Slug (identifier)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="acme-payments"
                          className="bg-zinc-900/50 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-indigo-500"
                          {...field}
                          disabled
                          onChange={(event) => {
                            setSlugEdited(true);
                            field.onChange(event);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-300">
                        Logo URL (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://cdn.orylo.app/logo.png"
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
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Launch my secure workspace
                </Button>
              </form>
            </Form>
          </div>
          <div className="rounded-xl border border-white/10 bg-linear-to-br from-indigo-500/10 via-zinc-900/60 to-zinc-900/60 p-4 shadow-inner space-y-4">
            <div className="flex items-center gap-3 text-indigo-300">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-medium">Why create an organization?</p>
            </div>
            <Separator className="bg-white/5" />
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex gap-2">
                <span className="text-indigo-300">•</span>
                Centralize rules, alerts, and Stripe connections.
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-300">•</span>
                Add members and manage your organization permissions.
              </li>
              <li className="flex gap-2">
                <span className="text-indigo-300">•</span>
                Enable fraud protections before opening the dashboard.
              </li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

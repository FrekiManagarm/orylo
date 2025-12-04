"use client";

import { ThemeProvider } from "./theme-provider";
import { NuqsAdapter } from "nuqs/adapters/next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AutumnProvider } from "autumn-js/react";
import { Toaster } from "sonner";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <AutumnProvider
      includeCredentials
      betterAuthUrl={process.env.BETTER_AUTH_URL}
    >
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            {children}
            <Toaster />
          </ThemeProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </AutumnProvider>
  );
};

export default Providers;

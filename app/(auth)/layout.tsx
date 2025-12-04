import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black selection:bg-primary/20 selection:text-primary">
      {/* Background Patterns */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%) pointer-events-none" />

      {/* Radial Gradient */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 flex flex-col items-center max-w-md px-4 mx-auto">
        <div className="mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-2xl font-bold text-white"
          >
            <Image
              src="/orylo-logo.png"
              alt="Orylo Logo"
              width={40}
              height={40}
              className="w-10 h-10 rounded-lg"
              priority
            />
            Orylo
          </Link>
        </div>

        {children}

        <div className="mt-8">
          <Button
            asChild
            variant="ghost"
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Home, Search, ArrowRight, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { usePageMeta } from "@/hooks/usePageMeta";

const SUGGESTED_PAGES = [
  { label: "Accueil", path: "/", icon: Home },
  { label: "Trouver un artisan", path: "/technicians", icon: Search },
  { label: "Poster un job", path: "/post-job", icon: Wrench },
];

export default function NotFound() {
  const [, setLocation] = useLocation();

  usePageMeta({
    title: "Page non trouvee - Erreur 404",
    description: "La page que vous recherchez n'existe pas. Retrouvez un artisan qualifie sur AlloBricolage.",
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-4 text-center space-y-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="relative inline-block">
              <span className="text-[150px] font-black text-transparent bg-clip-text bg-gradient-to-br from-primary via-primary/80 to-accent leading-none select-none">
                404
              </span>
              <motion.div
                className="absolute -top-4 -right-4 w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                ?
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            className="space-y-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Page introuvable
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Cette page semble s etre perdue dans les travaux. Pas de panique, nous allons vous remettre sur la bonne voie.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-4 sm:grid-cols-3 max-w-xl mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {SUGGESTED_PAGES.map((page) => (
              <Button
                key={page.path}
                variant="outline"
                className="flex flex-col h-auto py-6 gap-3 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                onClick={() => setLocation(page.path)}
              >
                <page.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                <span className="font-semibold">{page.label}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            ))}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              size="lg"
              className="rounded-full px-8 shadow-lg shadow-primary/25"
              onClick={() => setLocation("/")}
            >
              <Home className="w-5 h-5 mr-2" />
              Retour a l accueil
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { User, Wrench, ArrowRight } from "lucide-react";

export default function Signup() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Rejoignez AlloBricolage</h1>
            <p className="text-muted-foreground">
              Choisissez votre type de compte pour commencer
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Card 
              className="p-6 cursor-pointer transition-all hover-elevate group"
              onClick={() => setLocation("/signup/client")}
              data-testid="card-signup-client"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Je suis un Client</h2>
                  <p className="text-muted-foreground text-sm">
                    Je recherche des artisans qualifiés pour mes projets de bricolage et maintenance
                  </p>
                </div>
                <ul className="text-sm text-left space-y-2 w-full">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Trouvez des techniciens vérifiés
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Comparez les prix et avis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    Réservez en quelques clics
                  </li>
                </ul>
                <Button className="w-full group-hover:bg-primary/90" data-testid="button-signup-client">
                  S'inscrire comme client
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>

            <Card 
              className="p-6 cursor-pointer transition-all hover-elevate group"
              onClick={() => setLocation("/signup/technician")}
              data-testid="card-signup-technician"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Je suis un Technicien</h2>
                  <p className="text-muted-foreground text-sm">
                    Je suis un artisan professionnel et je souhaite proposer mes services
                  </p>
                </div>
                <ul className="text-sm text-left space-y-2 w-full">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Recevez des demandes de clients
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Gérez votre planning facilement
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                    Augmentez vos revenus
                  </li>
                </ul>
                <Button variant="outline" className="w-full" data-testid="button-signup-technician">
                  S'inscrire comme technicien
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              Vous avez déjà un compte?{" "}
              <button
                onClick={() => setLocation("/login")}
                className="text-primary hover:underline font-medium"
                data-testid="link-to-login"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

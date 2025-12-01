import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Wrench, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🔐 Login form submitted");
    
    if (!formData.username || !formData.password) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 Calling login function...");
      await login(formData.username, formData.password);
      console.log("✅ Login function completed");
      
      toast({ title: "Succès", description: "Connecté avec succès" });
      
      // Redirect based on user role
      // Get the user from localStorage after login
      const currentUserStr = localStorage.getItem('allobricolage_current_user');
      console.log("🔐 Current user from localStorage:", currentUserStr);
      
      if (currentUserStr) {
        const currentUser = JSON.parse(currentUserStr);
        console.log("🔐 Redirecting to:", currentUser.role === "technician" ? "/technician-dashboard" : "/client-dashboard");
        
        if (currentUser.role === "technician") {
          setLocation("/technician-dashboard");
        } else {
          setLocation("/client-dashboard");
        }
      } else {
        console.log("🔐 No user in localStorage, redirecting to home");
        setLocation("/");
      }
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast({ title: "Erreur", description: "Identifiants invalides", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-md p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary">
              <Wrench className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Connexion</h1>
          <p className="text-center text-muted-foreground mb-6">Accédez à votre compte AlloBricolage</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                placeholder="john_doe"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                disabled={isLoading}
                data-testid="input-login-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                disabled={isLoading}
                data-testid="input-login-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login-submit">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          <GoogleSignInButton />

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Pas encore de compte?{" "}
              <button
                onClick={() => setLocation("/signup")}
                className="text-primary hover:underline font-medium"
                data-testid="link-to-signup"
              >
                S'inscrire
              </button>
            </p>
          </div>
        </Card>
      </main>
      <Footer />
    </div>
  );
}

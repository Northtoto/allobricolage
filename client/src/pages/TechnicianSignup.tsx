import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Wrench, Loader2, Phone, MapPin, Briefcase, Award } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { MOROCCAN_CITIES, SERVICE_CATEGORIES } from "@shared/schema";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

const SERVICE_LABELS: Record<string, string> = {
  plomberie: "Plomberie",
  electricite: "Électricité", 
  peinture: "Peinture",
  menuiserie: "Menuiserie",
  climatisation: "Climatisation",
  maconnerie: "Maçonnerie",
  carrelage: "Carrelage",
  serrurerie: "Serrurerie",
  jardinage: "Jardinage",
  nettoyage: "Nettoyage",
};

export default function TechnicianSignup() {
  const [, setLocation] = useLocation();
  const { signupTechnician } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    bio: "",
    yearsExperience: "",
    hourlyRate: "",
  });

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.username || !formData.password || !formData.phone || !formData.city) {
      toast({ title: "Erreur", description: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    if (selectedServices.length === 0) {
      toast({ title: "Erreur", description: "Sélectionnez au moins un service", variant: "destructive" });
      return;
    }

    if (formData.password.length < 6) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 6 caractères", variant: "destructive" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await signupTechnician({
        username: formData.username,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        city: formData.city,
        services: selectedServices,
        yearsExperience: formData.yearsExperience,
        hourlyRate: formData.hourlyRate,
        bio: formData.bio,
      });
      toast({ 
        title: "Bienvenue!", 
        description: "Votre compte technicien a été créé. Notre équipe vérifiera votre profil sous 24h." 
      });
      setLocation("/technician-dashboard");
    } catch (error) {
      toast({ title: "Erreur", description: "Cet utilisateur existe déjà", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-8 px-4">
        <Card className="w-full max-w-2xl p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
              <Wrench className="h-7 w-7 text-primary" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center mb-2">Inscription Technicien</h1>
          <p className="text-center text-muted-foreground mb-6">
            Rejoignez notre réseau d'artisans professionnels au Maroc
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Informations personnelles
              </h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Mohamed Alami"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="mohamed_alami"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-username"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+212 6XX-XXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={isLoading}
                      className="pl-10"
                      data-testid="input-tech-signup-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                    <SelectTrigger data-testid="select-tech-signup-city">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Votre ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOROCCAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Compétences et services
              </h3>

              <div className="space-y-2">
                <Label>Services proposés * (sélectionnez au moins un)</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {SERVICE_CATEGORIES.map((service) => (
                    <label
                      key={service}
                      htmlFor={`service-${service}`}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedServices.includes(service)
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid={`checkbox-service-${service}`}
                    >
                      <Checkbox
                        id={`service-${service}`}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      <span className="text-sm">{SERVICE_LABELS[service] || service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="yearsExperience">Années d'expérience</Label>
                  <Input
                    id="yearsExperience"
                    type="number"
                    placeholder="5"
                    min="0"
                    max="50"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Tarif horaire (MAD)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="150"
                    min="50"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-rate"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Présentation (optionnel)</Label>
                <Textarea
                  id="bio"
                  placeholder="Décrivez votre expérience et vos spécialités..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={isLoading}
                  rows={3}
                  data-testid="input-tech-signup-bio"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Sécurité du compte</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe *</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    data-testid="input-tech-signup-confirm-password"
                  />
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Note importante:</p>
              <p>Votre profil sera vérifié par notre équipe avant d'être activé. Vous recevrez une confirmation sous 24 heures.</p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading} data-testid="button-tech-signup-submit">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création du compte...
                </>
              ) : (
                "Créer mon compte technicien"
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou s'inscrire avec</span>
            </div>
          </div>

          <GoogleSignInButton text="S'inscrire avec Google" />

          <div className="mt-6 text-center text-sm space-y-2">
            <p className="text-muted-foreground">
              Vous êtes un client?{" "}
              <button
                onClick={() => setLocation("/signup/client")}
                className="text-primary hover:underline font-medium"
                data-testid="link-to-client-signup"
              >
                Inscrivez-vous comme client
              </button>
            </p>
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
        </Card>
      </main>
      <Footer />
    </div>
  );
}

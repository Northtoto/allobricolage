import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Briefcase, 
  Clock, 
  CheckCircle, 
  Wallet,
  MapPin, 
  Calendar,
  ChevronRight,
  Plus,
  Star,
  Phone,
  MessageCircle
} from "lucide-react";

interface ClientJob {
  id: string;
  description: string;
  service: string;
  city: string;
  urgency: string;
  status: string;
  estimatedCost: number;
  technicianName?: string;
  technicianRating?: number;
  scheduledDate?: string;
  createdAt: string;
}

interface ClientStats {
  activeJobs: number;
  completedJobs: number;
  totalSpent: number;
  averageRating: number;
}

export default function ClientDashboard() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<ClientStats>({
    queryKey: ["/api/client/stats"],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<ClientJob[]>({
    queryKey: ["/api/client/jobs"],
  });

  const activeJobs = jobs?.filter(j => j.status === "pending" || j.status === "accepted") || [];
  const completedJobs = jobs?.filter(j => j.status === "completed") || [];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      accepted: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      in_progress: "bg-accent/10 text-accent border-accent/20",
      completed: "bg-green-500/10 text-green-600 border-green-500/20",
      cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    const labels: Record<string, string> = {
      pending: "En attente",
      accepted: "Accepté",
      in_progress: "En cours",
      completed: "Terminé",
      cancelled: "Annulé",
    };
    return (
      <Badge className={`${styles[status] || styles.pending} border`}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold" data-testid="text-client-dashboard-title">
                {t("client.dashboard")}
              </h1>
              <p className="text-muted-foreground">
                Bienvenue, {user?.name || user?.username}
              </p>
            </div>
            <Link href="/post-job">
              <Button data-testid="button-new-job">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau travail
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="text-active-jobs-count">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  stats?.activeJobs || activeJobs.length || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("client.activeJobs")}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="text-completed-jobs-count">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  stats?.completedJobs || completedJobs.length || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("client.completedJobs")}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-accent" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" data-testid="text-total-spent">
                {statsLoading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : (
                  <>{(stats?.totalSpent || 0).toLocaleString()} {t("common.mad")}</>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("client.totalSpent")}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1 flex items-center gap-2">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  <>
                    {(stats?.averageRating || 4.5).toFixed(1)}
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Note donnée</p>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" data-testid="tab-client-overview">
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-client-active">
                Travaux actifs ({activeJobs.length})
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-client-history">
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Travaux récents
                  </h3>
                  {activeJobs.length > 0 ? (
                    <div className="space-y-3">
                      {activeJobs.slice(0, 3).map((job) => (
                        <div 
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                          data-testid={`card-recent-job-${job.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{job.service}</p>
                              <p className="text-xs text-muted-foreground">{job.city}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(job.status)}
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>{t("client.noJobs")}</p>
                      <Link href="/post-job">
                        <Button variant="outline" className="mt-4" data-testid="button-post-first-job">
                          <Plus className="h-4 w-4 mr-2" />
                          {t("client.postFirst")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-accent" />
                    Besoin d'aide?
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Notre support DarijaChat est disponible 24/7 pour vous aider en Darija, Français ou Arabe.
                  </p>
                  <Button variant="outline" className="w-full" data-testid="button-open-chat">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Ouvrir le chat
                  </Button>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="active">
              <div className="space-y-4">
                {jobsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="animate-pulse space-y-4">
                          <div className="h-6 bg-muted rounded w-1/3" />
                          <div className="h-4 bg-muted rounded w-2/3" />
                          <div className="h-10 bg-muted rounded w-1/4" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : activeJobs.length > 0 ? (
                  activeJobs.map((job) => (
                    <Card key={job.id} className="p-6" data-testid={`card-active-job-${job.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="font-medium">
                              {job.service}
                            </Badge>
                            {getStatusBadge(job.status)}
                          </div>

                          <p className="text-lg mb-3">{job.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                            {job.technicianName && (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {job.technicianName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {job.technicianName}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-accent">
                              ~{job.estimatedCost} {t("common.mad")}
                            </span>
                            <span className="text-sm text-muted-foreground">estimé</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          {job.technicianName && (
                            <Button variant="outline" data-testid={`button-contact-${job.id}`}>
                              <Phone className="h-4 w-4 mr-2" />
                              Contacter
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            Voir détails
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">{t("client.noJobs")}</h3>
                    <p className="text-muted-foreground mb-4">
                      Publiez une demande pour trouver le technicien idéal
                    </p>
                    <Link href="/post-job">
                      <Button data-testid="button-post-job-empty">
                        <Plus className="h-4 w-4 mr-2" />
                        {t("client.postFirst")}
                      </Button>
                    </Link>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                {completedJobs.length > 0 ? (
                  completedJobs.map((job) => (
                    <Card key={job.id} className="p-6" data-testid={`card-completed-job-${job.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="font-medium">
                              {job.service}
                            </Badge>
                            {getStatusBadge(job.status)}
                            {job.technicianRating && (
                              <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 border">
                                <Star className="h-3 w-3 mr-1 fill-yellow-500" />
                                {job.technicianRating}
                              </Badge>
                            )}
                          </div>

                          <p className="text-lg mb-3">{job.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                            {job.technicianName && (
                              <div className="flex items-center gap-1">
                                <Avatar className="h-5 w-5">
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {job.technicianName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                {job.technicianName}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xl font-bold text-accent">
                            {job.estimatedCost} {t("common.mad")}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucun historique</h3>
                    <p className="text-muted-foreground">
                      Vos travaux terminés apparaîtront ici
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

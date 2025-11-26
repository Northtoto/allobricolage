import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wallet, 
  Clock, 
  Star, 
  CheckCircle, 
  MapPin, 
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Users,
  Zap,
  Phone,
  Loader2
} from "lucide-react";

interface PendingJob {
  id: string;
  description: string;
  service: string;
  city: string;
  urgency: string;
  clientName: string;
  estimatedCost: number;
  distance: number;
  matchScore: number;
  createdAt: string;
}

interface TechnicianStats {
  totalEarnings: number;
  pendingJobs: number;
  completedJobs: number;
  averageRating: number;
  responseRate: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
}

export default function TechnicianDashboard() {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<TechnicianStats>({
    queryKey: ["/api/technician/stats"],
  });

  // Fetch pending jobs
  const { data: pendingJobs, isLoading: jobsLoading } = useQuery<PendingJob[]>({
    queryKey: ["/api/technician/pending-jobs"],
  });

  // Accept job mutation
  const acceptMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/technician/jobs/${jobId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician/stats"] });
      toast({
        title: "Travail accepté",
        description: "Le client a été notifié.",
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: "Impossible d'accepter ce travail.",
        variant: "destructive",
      });
    },
  });

  // Decline job mutation
  const declineMutation = useMutation({
    mutationFn: async (jobId: string) => {
      return apiRequest("POST", `/api/technician/jobs/${jobId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-jobs"] });
      toast({
        title: "Travail refusé",
        description: "Ce travail a été retiré de votre liste.",
      });
    },
  });

  const getUrgencyBadge = (urgency: string) => {
    const colors: Record<string, string> = {
      emergency: "bg-red-500/10 text-red-500 border-red-500/20",
      high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      low: "bg-green-500/10 text-green-500 border-green-500/20",
    };
    const labels: Record<string, string> = {
      emergency: "Urgence",
      high: "Urgent",
      normal: "Normal",
      low: "Pas pressé",
    };
    return (
      <Badge className={`${colors[urgency] || colors.normal} border`}>
        {labels[urgency] || urgency}
      </Badge>
    );
  };

  const earningsGrowth = stats 
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / Math.max(stats.lastMonthEarnings, 1)) * 100
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">{t("tech.dashboard")}</h1>
              <p className="text-muted-foreground">Gérez vos travaux et suivez vos revenus</p>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 border">
              <Zap className="h-3 w-3 mr-1" />
              En ligne
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-chart-2" />
                </div>
                {earningsGrowth !== 0 && (
                  <Badge className={earningsGrowth > 0 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-red-500/10 text-red-500"
                  }>
                    <TrendingUp className={`h-3 w-3 mr-1 ${earningsGrowth < 0 ? "rotate-180" : ""}`} />
                    {earningsGrowth > 0 ? "+" : ""}{Math.round(earningsGrowth)}%
                  </Badge>
                )}
              </div>
              <div className="text-2xl font-bold mb-1">
                {statsLoading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : (
                  <>{stats?.thisMonthEarnings?.toLocaleString() || 0} {t("common.mad")}</>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("tech.earnings")} ce mois</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  stats?.pendingJobs || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("tech.pendingJobs")}</p>
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
                    {stats?.averageRating?.toFixed(1) || "0.0"}
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("tech.rating")}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1">
                {statsLoading ? (
                  <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                ) : (
                  stats?.completedJobs || 0
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("tech.completedJobs")}</p>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" data-testid="tab-overview">
                Vue d'ensemble
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending">
                Demandes ({pendingJobs?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                Historique
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Response Rate */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Taux de réponse
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-4xl font-bold text-primary">
                      {stats?.responseRate || 0}%
                    </div>
                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 border">
                      Excellent
                    </Badge>
                  </div>
                  <Progress value={stats?.responseRate || 0} className="h-3 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Un taux de réponse élevé améliore votre visibilité
                  </p>
                </Card>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Activité récente</h3>
                  {pendingJobs && pendingJobs.length > 0 ? (
                    <div className="space-y-3">
                      {pendingJobs.slice(0, 3).map((job) => (
                        <div 
                          key={job.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {job.clientName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{job.clientName}</p>
                              <p className="text-xs text-muted-foreground">{job.service}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p>Aucune activité récente</p>
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pending">
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
                ) : pendingJobs && pendingJobs.length > 0 ? (
                  pendingJobs.map((job) => (
                    <Card key={job.id} className="p-6" data-testid={`card-pending-job-${job.id}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Badge variant="secondary" className="font-medium">
                              {job.service}
                            </Badge>
                            {getUrgencyBadge(job.urgency)}
                            <Badge className="bg-primary/10 text-primary border-primary/20 border">
                              {Math.round(job.matchScore * 100)}% Match
                            </Badge>
                          </div>

                          <p className="text-lg mb-3">{job.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.city} ({job.distance} km)
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(job.createdAt).toLocaleDateString("fr-FR")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {job.clientName}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-chart-2">
                              ~{job.estimatedCost} {t("common.mad")}
                            </span>
                            <span className="text-sm text-muted-foreground">estimé</span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 min-w-[120px]">
                          <Button
                            onClick={() => acceptMutation.mutate(job.id)}
                            disabled={acceptMutation.isPending}
                            data-testid={`button-accept-${job.id}`}
                          >
                            {acceptMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("tech.accept")
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => declineMutation.mutate(job.id)}
                            disabled={declineMutation.isPending}
                            data-testid={`button-decline-${job.id}`}
                          >
                            {t("tech.decline")}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-12 text-center">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Aucune demande en attente</h3>
                    <p className="text-muted-foreground">
                      Les nouvelles demandes apparaîtront ici automatiquement
                    </p>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Historique des travaux</h3>
                <p className="text-muted-foreground">
                  Vos travaux complétés apparaîtront ici
                </p>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

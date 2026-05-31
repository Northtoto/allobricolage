import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, Wrench, DollarSign, AlertTriangle, CheckCircle,
  Shield, Clock, TrendingUp, UserCheck
} from "lucide-react";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  interface Metrics {
    users: number;
    technicians: number;
    clients: number;
    bookings: number;
    completedBookings: number;
    totalRevenue: number;
    pendingVerifications: number;
  }

  const { data: metricsRaw, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/admin/metrics"],
  });
  const metrics = metricsRaw as Metrics | undefined;

  interface VerificationQueueItem { document: { id: string; documentType: string; documentUrl: string }; technician: { name: string; email: string | null; phone: string | null } }
  interface TopTechItem { technician: { id: string; rating: number; completedJobs: number; hourlyRate: number; isVerified: boolean }; user: { name: string; city: string | null; phone: string | null } }

  const { data: verificationsRaw, isLoading: verifLoading } = useQuery({
    queryKey: ["/api/admin/verification-queue"],
  });
  const verifications = verificationsRaw as VerificationQueueItem[] | undefined;

  const { data: topTechsRaw, isLoading: topTechLoading } = useQuery({
    queryKey: ["/api/admin/top-technicians"],
  });
  const topTechs = topTechsRaw as TopTechItem[] | undefined;

  const handleVerify = async (docId: string, status: "verified" | "rejected") => {
    try {
      await apiRequest("POST", `/api/verification/review/${docId}`, { status });
      toast({ title: "Document mis à jour", description: `Statut: ${status}` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  if (metricsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-1/3 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Administration</h1>
            <p className="text-muted-foreground text-sm">Tableau de bord AlloBricolage</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs</p>
                  <p className="text-3xl font-bold">{metrics?.users ?? 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Artisans</p>
                  <p className="text-3xl font-bold">{metrics?.technicians ?? 0}</p>
                </div>
                <Wrench className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservations</p>
                  <p className="text-3xl font-bold">{metrics?.bookings ?? 0}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus</p>
                  <p className="text-3xl font-bold">{metrics?.totalRevenue ?? 0} <span className="text-sm font-normal">MAD</span></p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="verifications">
              Verifications {(metrics?.pendingVerifications ?? 0) > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px]">{metrics?.pendingVerifications}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="technicians">Top Artisans</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Alertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(metrics?.pendingVerifications ?? 0) > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium">Documents en attente de verification</span>
                        </div>
                        <Badge>{metrics?.pendingVerifications ?? 0}</Badge>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Aucune alerte en cours.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reservations completées</span>
                    <span className="font-semibold">{metrics?.completedBookings ?? 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taux de conversion</span>
                    <span className="font-semibold">
                      {(metrics?.bookings ?? 0) > 0 ? Math.round(((metrics?.completedBookings ?? 0) / (metrics?.bookings ?? 1)) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenu moyen/Reservation</span>
                    <span className="font-semibold">
                      {(metrics?.bookings ?? 0) > 0 ? Math.round((metrics?.totalRevenue ?? 0) / (metrics?.bookings ?? 1)) : 0} MAD
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verifications">
            <Card>
              <CardHeader>
                <CardTitle>File de verification</CardTitle>
                <CardDescription>
                  Documents soumis par les artisans en attente de validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verifLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : !verifications?.length ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-muted" />
                    <p>Aucune verification en attente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {verifications.map((item: any) => (
                      <div key={item.document.id} className="flex items-start gap-4 p-4 rounded-lg border bg-card/50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">{item.technician.name}</span>
                            <Badge variant="outline">{item.document.documentType.toUpperCase()}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.technician.phone}</p>
                          <a
                            href={item.document.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            Voir le document
                          </a>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleVerify(item.document.id, "rejected")}
                          >
                            Refuser
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleVerify(item.document.id, "verified")}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Verifier
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technicians">
            <Card>
              <CardHeader>
                <CardTitle>Top Artisans</CardTitle>
                <CardDescription>Classement par nombre de travaux completés</CardDescription>
              </CardHeader>
              <CardContent>
                {topTechLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topTechs?.map((item: any, idx: number) => (
                      <div key={item.technician.id} className="flex items-center gap-4 p-4 rounded-lg border">
                        <div className="w-8 text-center font-bold text-muted-foreground">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{item.user.name}</span>
                            {item.technician.isVerified && (
                              <Badge className="bg-emerald-500 text-white"><UserCheck className="h-3 w-3 mr-1" />Verifie</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {item.technician.completedJobs} travaux
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              {item.technician.hourlyRate} MAD/h
                            </span>
                            <span>Note: {item.technician.rating.toFixed(1)}/5</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

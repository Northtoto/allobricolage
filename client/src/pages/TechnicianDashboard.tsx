import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Booking {
  id: string;
  status: string;
  estimatedCost?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  clientName?: string;
  clientPhone?: string;
  technicianId?: string;
  [key: string]: any;
}

interface DashboardStats {
  thisMonthEarnings?: number;
  totalEarnings?: number;
  totalBookings?: number;
  completedJobs?: number;
  averageRating?: number;
  pendingJobs?: number;
  responseRate?: number;
  lastMonthEarnings?: number;
}

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/technician/stats"],
  });

  const { data: pendingJobs } = useQuery<Booking[]>({
    queryKey: ["/api/technician/pending-jobs"],
  });

  const { data: allBookings } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Get technician record for current user
  const { data: technicianProfile } = useQuery<any>({
    queryKey: ["/api/technicians/me"],
    enabled: !!user && user.role === "technician"
  });

  // Filter bookings assigned to this technician
  const myJobs = allBookings && technicianProfile 
    ? allBookings.filter((b: Booking) => b.technicianId === (technicianProfile as any).id) 
    : [];
  const activeJobs = myJobs.filter((b: Booking) => ["accepted", "in_progress"].includes(b.status));
  const completedJobs = myJobs.filter((b: Booking) => b.status === "completed");

  const acceptJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest("POST", `/api/technician/jobs/${jobId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Mission acceptée!", description: "Le client sera notifié." });
    },
  });

  const declineJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      await apiRequest("POST", `/api/technician/jobs/${jobId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technician/pending-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      toast({ title: "Mission refusée" });
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Espace Artisan</h1>
              <p className="text-muted-foreground">Bonjour, {user?.name}</p>
            </div>
            <div className="flex gap-4">
              <Card className="p-4 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gains du mois</p>
                  <p className="font-bold text-lg">{stats?.thisMonthEarnings || 0} MAD</p>
                </div>
              </Card>
            </div>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="pending">Offres ({pendingJobs?.length || 0})</TabsTrigger>
              <TabsTrigger value="active">En cours ({activeJobs.length})</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="earnings">Finances</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              {pendingJobs?.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune nouvelle offre pour le moment.
                </div>
              ) : (
                pendingJobs?.map((job: any) => (
                  <Card key={job.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">Nouvelle demande</Badge>
                          <h3 className="font-semibold text-lg">{job.service}</h3>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.city}</span>
                            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Urgent: {job.urgency}</span>
                          </div>
                          <p className="mt-3 text-sm">{job.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">{job.estimatedCost} MAD</p>
                          <p className="text-xs text-muted-foreground">Estimation</p>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-6 justify-end">
                        <Button variant="outline" onClick={() => declineJobMutation.mutate(job.id)}>Refuser</Button>
                        <Button onClick={() => acceptJobMutation.mutate(job.id)}>Accepter la mission</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              {activeJobs.map((job: any) => (
                <Card key={job.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold">{job.service || "Service"}</h3>
                        <p className="text-sm text-muted-foreground">Client: {job.clientName}</p>
                        <p className="text-sm text-muted-foreground">Date: {job.scheduledDate} à {job.scheduledTime}</p>
                      </div>
                      <Badge>{job.status}</Badge>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">Contacter Client</Button>
                      <Button size="sm" onClick={() => setLocation(`/technician/track/${job.id}`)}>
                        <MapPin className="h-4 w-4 mr-2" />
                        Aller au chantier
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Missions Terminées</CardTitle>
                </CardHeader>
                <CardContent>
                  {completedJobs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">Aucune mission terminée.</p>
                  ) : (
                    <div className="space-y-4">
                      {completedJobs.map((job: any) => (
                        <div key={job.id} className="flex justify-between items-center border-b pb-4 last:border-0">
                          <div>
                            <p className="font-medium">{job.service}</p>
                            <p className="text-sm text-muted-foreground">{new Date(job.scheduledDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{job.estimatedCost} MAD</p>
                            <Badge variant="secondary">Terminé</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="earnings">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Revenu Total</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats?.totalEarnings} MAD</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ce Mois</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats?.thisMonthEarnings} MAD</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Missions</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats?.completedJobs}</div></CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Note Moyenne</CardTitle></CardHeader>
                  <CardContent><div className="text-2xl font-bold">{stats?.averageRating}/5</div></CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

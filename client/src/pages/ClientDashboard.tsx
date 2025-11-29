import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Download, Star, User, Settings, FileText } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface Booking {
  id: string;
  status: string;
  estimatedCost?: number;
  scheduledDate?: string;
  scheduledTime?: string;
  clientName?: string;
  clientPhone?: string;
  userId?: string;
  [key: string]: any;
}

export default function ClientDashboard() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
  });

  // Filter bookings for current user - show only bookings created by this client
  const myBookings = bookings ? bookings.filter((b: Booking) => b.clientId === user?.id) : [];

  const activeBookings = myBookings.filter((b: Booking) => ["pending", "accepted"].includes(b.status));
  const pastBookings = myBookings.filter((b: Booking) => ["completed", "cancelled"].includes(b.status));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mon Espace Client</h1>
              <p className="text-muted-foreground">Bienvenue, {user?.name}</p>
            </div>
            <Link href="/post-job">
              <Button>Nouvelle demande</Button>
            </Link>
          </div>

          <Tabs defaultValue="active" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="active">En cours</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="profile">Profil</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {activeBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Aucune réservation en cours.
                  </CardContent>
                </Card>
              ) : (
                activeBookings.map((booking: any) => (
                  <BookingCard key={booking.id} booking={booking} isActive />
                ))
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    Aucun historique disponible.
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map((booking: any) => (
                  <BookingCard key={booking.id} booking={booking} />
                ))
              )}
            </TabsContent>

            <TabsContent value="invoices">
              <Card>
                <CardHeader>
                  <CardTitle>Mes Factures</CardTitle>
                  <CardDescription>Téléchargez vos factures pour les services terminés</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastBookings.filter((b: any) => b.status === "completed").map((booking: any) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-medium">Service de {booking.service || "Maintenance"}</p>
                            <p className="text-sm text-muted-foreground">{new Date(booking.scheduledDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => window.open(`/api/invoices/${booking.id}`, '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    ))}
                    {pastBookings.filter((b: any) => b.status === "completed").length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucune facture disponible</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Mes Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={user?.profilePicture} />
                      <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{user?.name}</h3>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nom d'utilisateur</label>
                      <p>{user?.username}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Rôle</label>
                      <p className="capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Modifier le profil
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function BookingCard({ booking, isActive }: { booking: any, isActive?: boolean }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{booking.service || "Service de Maintenance"}</h3>
                <div className="flex items-center gap-2 text-muted-foreground mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(booking.scheduledDate).toLocaleDateString()}</span>
                  <Clock className="h-4 w-4 ml-2" />
                  <span>{booking.scheduledTime}</span>
                </div>
              </div>
              <Badge variant={booking.status === "completed" ? "secondary" : "default"}>
                {booking.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              {isActive ? (
                <>
                  {booking.status === "accepted" ? (
                    <Link href={`/track/${booking.id}`}>
                      <Button size="sm" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Suivre le technicien
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">En attente de confirmation...</span>
                  )}
                </>
              ) : (
                <>
                  {booking.status === "completed" && (
                    <div className="flex gap-2">
                      <Link href={`/payment/${booking.id}`}>
                        <Button size="sm">
                          Régler / Facture
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm">
                        Laisser un avis
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

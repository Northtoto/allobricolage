import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Download, Star, User, Settings, FileText, Loader2, Heart, Gift, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { WarrantyClaimButton } from "@/components/booking/WarrantyClaimButton";
import { QuoteReviewCard } from "@/components/booking/QuoteReviewCard";

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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated or not a client
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    } else if (!authLoading && user && user.role !== "client") {
      setLocation("/technician-dashboard");
    }
  }, [user, authLoading, setLocation]);

  const { data: bookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/bookings"],
    enabled: !!user,
  });

  interface FavoriteItem {
    id: string;
    technician: {
      id: string;
      name: string;
      photo: string | null;
      rating: number;
      hourlyRate: number;
      services: string[];
      isVerified: boolean;
    };
  }

  interface ReferralCode { code: string; discountAmount: number }
  interface ReferralSummary {
    referrals: any[];
    total: number;
    completed: number;
    totalRewards: number;
  }

  const { data: favoritesData } = useQuery<FavoriteItem[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const { data: referralData } = useQuery<ReferralCode>({
    queryKey: ["/api/referrals/my-code"],
    enabled: !!user,
  });

  const { data: myReferrals } = useQuery<ReferralSummary>({
    queryKey: ["/api/referrals/my-referrals"],
    enabled: !!user,
  });

  // Filter bookings for current user - show only bookings created by this client
  const myBookings = bookings ? bookings.filter((b: Booking) => b.clientId === user?.id) : [];

  const activeBookings = myBookings.filter((b: Booking) => ["pending", "accepted"].includes(b.status));
  const pastBookings = myBookings.filter((b: Booking) => ["completed", "cancelled"].includes(b.status));

  if (authLoading || bookingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
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
            <TabsList className="grid w-full grid-cols-3 lg:w-[700px] lg:grid-cols-6">
              <TabsTrigger value="active">En cours</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
              <TabsTrigger value="favorites">Favoris</TabsTrigger>
              <TabsTrigger value="invoices">Factures</TabsTrigger>
              <TabsTrigger value="referrals">Parrainage</TabsTrigger>
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

            <TabsContent value="favorites" className="space-y-4">
              {(!favoritesData || favoritesData.length === 0) ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground">
                    <Heart className="h-12 w-12 mx-auto mb-3 text-muted" />
                    <p>Aucun artisan favori.</p>
                    <p className="text-sm mt-1">Ajoutez des artisans a vos favoris depuis leur profil.</p>
                    <Link href="/technicians">
                      <Button className="mt-4" variant="outline">Parcourir les artisans</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoritesData.map((fav: any) => (
                    <Card key={fav.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14">
                            <AvatarImage src={fav.technician.photo} />
                            <AvatarFallback>{fav.technician.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold truncate">{fav.technician.name}</h3>
                              {fav.technician.isVerified && (
                                <Badge className="bg-emerald-500 text-white text-[10px]">Verifie</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span>{fav.technician.rating?.toFixed(1) ?? "N/A"}</span>
                              <span className="mx-1">·</span>
                              <span>{fav.technician.hourlyRate} DH/h</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {fav.technician.services?.slice(0, 3).join(", ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Link href={`/technician/${fav.technician.id}`} className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">Voir le profil</Button>
                          </Link>
                          <Link href={`/post-job?technician=${fav.technician.id}`} className="flex-1">
                            <Button size="sm" className="w-full">Re-reserver</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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

            <TabsContent value="referrals">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Parrainage
                  </CardTitle>
                  <CardDescription>Invitez vos amis et gagnez 50 DH de reduction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center py-6">
                    <div className="text-center mb-6">
                      <p className="text-4xl font-bold text-primary mb-2">50 DH</p>
                      <p className="text-muted-foreground">par ami parraine</p>
                    </div>

                    {referralData?.code ? (
                      <div className="w-full max-w-md">
                        <div className="flex items-center gap-2 p-4 bg-primary/5 rounded-xl border-2 border-dashed border-primary/30">
                          <code className="flex-1 text-center font-mono text-lg font-bold text-primary">
                            {referralData.code}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(referralData.code);
                              toast({ title: "Code copie!", description: "Collez-le ou partagez-le avec vos amis." });
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 text-center">
                          <Button
                            onClick={() => {
                              const text = `Rejoins-moi sur M3allem et profite de 50 DH de reduction avec mon code: ${referralData.code}`;
                              navigator.clipboard.writeText(text);
                              toast({ title: "Message copie!", description: "Partagez-le avec vos amis." });
                            }}
                          >
                            <Gift className="h-4 w-4 mr-2" />
                            Copier le message de partage
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button onClick={async () => {
                        const res = await apiRequest("GET", "/api/referrals/my-code");
                        await res.json();
                        toast({ title: "Code genere!" });
                      }}>
                        Generer mon code
                      </Button>
                    )}

                    {myReferrals && (
                      <div className="mt-8 w-full">
                        <h3 className="font-semibold mb-3">Vos parrainages</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold">{myReferrals.total ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Total</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold">{myReferrals.completed ?? 0}</p>
                            <p className="text-xs text-muted-foreground">Completes</p>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{myReferrals.totalRewards ?? 0} DH</p>
                            <p className="text-xs text-muted-foreground">Gagnes</p>
                          </div>
                        </div>
                      </div>
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
                      <AvatarImage src={user?.profilePicture ?? undefined} />
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
              ) : null}
            </div>

            {/* Written-devis step: shows any pending quote so the client can
                validate the price before work starts (locks booking.estimatedCost). */}
            {isActive && <QuoteReviewCard bookingId={booking.id} />}

            {!isActive && (
              <>
                {booking.status === "completed" && (
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/payment/${booking.id}`}>
                      <Button size="sm">
                        Régler / Facture
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      Laisser un avis
                    </Button>
                    <WarrantyClaimButton bookingId={booking.id} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

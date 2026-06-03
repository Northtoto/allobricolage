import { Switch, Route } from "wouter";
import { Suspense, lazy } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OrganizationSchema, LocalBusinessSchema, WebsiteSearchSchema } from "@/components/seo/StructuredData";
import { Loader2 } from "lucide-react";

const Home = lazy(() => import("@/pages/Home"));
const PostJob = lazy(() => import("@/pages/PostJob"));
const TechnicianDashboard = lazy(() => import("@/pages/TechnicianDashboard"));
const ClientDashboard = lazy(() => import("@/pages/ClientDashboard"));
const TechnicianProfile = lazy(() => import("@/pages/TechnicianProfile"));
const TechnicianDirectory = lazy(() => import("@/pages/TechnicianDirectory"));
const PaymentPage = lazy(() => import("@/pages/PaymentPage"));
const TrackTechnician = lazy(() => import("@/pages/TrackTechnician").then((m) => ({ default: m.TrackTechnician })));
const TechnicianJobTracking = lazy(() => import("@/pages/TechnicianJobTracking"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const ClientSignup = lazy(() => import("@/pages/ClientSignup"));
const TechnicianSignup = lazy(() => import("@/pages/TechnicianSignup"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const SubscriptionPage = lazy(() => import("@/pages/SubscriptionPage"));
const BusinessLanding = lazy(() => import("@/pages/BusinessLanding"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Chargement">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/post-job" component={PostJob} />
        <Route path="/technician-dashboard" component={TechnicianDashboard} />
        <Route path="/client-dashboard" component={ClientDashboard} />
        <Route path="/technicians" component={TechnicianDirectory} />
        <Route path="/technician/:id" component={TechnicianProfile} />
        <Route path="/payment/:bookingId" component={PaymentPage} />
        <Route path="/track/:bookingId" component={TrackTechnician} />
        <Route path="/technician/track/:bookingId" component={TechnicianJobTracking} />
        <Route path="/login" component={Login} />
        <Route path="/connexion" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/inscription" component={Signup} />
        <Route path="/signup/client" component={ClientSignup} />
        <Route path="/signup/technician" component={TechnicianSignup} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/entreprises" component={BusinessLanding} />
        <Route path="/business" component={BusinessLanding} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function GlobalSEO() {
  return (
    <>
      <OrganizationSchema
        name="M3allem"
        url="https://allobricolage.ma"
        logo="https://allobricolage.ma/logo.png"
        description="Plateforme intelligente pour trouver les meilleurs artisans au Maroc. Matching IA, tarification transparente, service disponible 24/7."
        telephone="+212522123456"
        email="contact@allobricolage.ma"
        sameAs={[
          "https://facebook.com/allobricolage",
          "https://instagram.com/allobricolage",
          "https://linkedin.com/company/allobricolage",
        ]}
        address={{
          streetAddress: "123 Boulevard Mohammed VI",
          addressLocality: "Casablanca",
          addressCountry: "MA",
        }}
      />
      <LocalBusinessSchema
        name="M3allem"
        description="Service de mise en relation avec des artisans qualifies au Maroc. Plomberie, electricite, peinture, menuiserie et plus."
        url="https://allobricolage.ma"
        telephone="+212522123456"
        email="contact@allobricolage.ma"
        address={{
          streetAddress: "123 Boulevard Mohammed VI",
          addressLocality: "Casablanca",
          addressRegion: "Casablanca-Settat",
          postalCode: "20000",
          addressCountry: "MA",
        }}
        geo={{ latitude: "33.5731", longitude: "-7.5898" }}
        openingHours={["Monday 08:00-20:00", "Tuesday 08:00-20:00", "Wednesday 08:00-20:00", "Thursday 08:00-20:00", "Friday 08:00-20:00", "Saturday 08:00-18:00"]}
        priceRange="$$"
        image="https://allobricolage.ma/og-image.png"
      />
      <WebsiteSearchSchema
        siteUrl="https://allobricolage.ma"
        searchUrl="https://allobricolage.ma/technicians"
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider>
              <TooltipProvider>
                <GlobalSEO />
                <Toaster />
                <Router />
              </TooltipProvider>
            </I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

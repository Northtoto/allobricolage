import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { DarijaChat } from "@/components/chat/DarijaChat";
import Home from "@/pages/Home";
import PostJob from "@/pages/PostJob";
import TechnicianDashboard from "@/pages/TechnicianDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import TechnicianProfile from "@/pages/TechnicianProfile";
import TechnicianDirectory from "@/pages/TechnicianDirectory";
import PaymentPage from "@/pages/PaymentPage";
import { TrackTechnician } from "@/pages/TrackTechnician";
import TechnicianJobTracking from "@/pages/TechnicianJobTracking";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ClientSignup from "@/pages/ClientSignup";
import TechnicianSignup from "@/pages/TechnicianSignup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <I18nProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
              <DarijaChat />
            </TooltipProvider>
          </I18nProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

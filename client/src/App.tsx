import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import PlotMapping from "@/pages/plot-mapping";
import LegalityAssessment from "@/pages/legality-assessment";
import DeforestationMonitoring from "@/pages/deforestation-monitoring";
import SupplyChain from "@/pages/supply-chain";
import DDSReports from "@/pages/dds-reports";
import SatelliteImagery from "@/pages/satellite-imagery";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/mapping" component={PlotMapping} />
      <ProtectedRoute path="/legality" component={LegalityAssessment} />
      <ProtectedRoute path="/monitoring" component={DeforestationMonitoring} />
      <ProtectedRoute path="/supply-chain" component={SupplyChain} />
      <ProtectedRoute path="/satellite" component={SatelliteImagery} />
      <ProtectedRoute path="/reports" component={DDSReports} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

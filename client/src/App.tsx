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
import LegalityAssessment from "@/pages/legality-assessment-expanded";
import UnifiedMonitoring from "@/pages/unified-monitoring";
import UnifiedSupplyChain from "@/pages/unified-supply-chain";
import DeforestationMonitoring from "@/pages/deforestation-monitoring";
import DDSReports from "@/pages/dds-reports";
import EstateDataTablePage from "@/pages/estate-data-table";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/deforestation-monitoring" component={DeforestationMonitoring} />
      <ProtectedRoute path="/legality" component={LegalityAssessment} />
      <ProtectedRoute path="/supply-chain" component={UnifiedSupplyChain} />
      <ProtectedRoute path="/reports" component={DDSReports} />
      <ProtectedRoute path="/estate-data" component={EstateDataTablePage} />
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

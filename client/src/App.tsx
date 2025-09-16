import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SupplierProvider } from "@/hooks/use-supplier-context";
import { ProtectedRoute } from "@/lib/protected-route";
import { WorkflowGuard } from "@/components/route-guards/WorkflowGuard";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import PlotMapping from "@/pages/plot-mapping";
import LegalityAssessment from "@/pages/data-collection";
import LegalityCompliance from "@/pages/legality-compliance";
import RiskAssessment from "@/pages/risk-assessment";
import UnifiedMonitoring from "@/pages/unified-monitoring";
import SupplyChainSimple from "@/pages/supply-chain-simple";
import DeforestationMonitoring from "@/pages/deforestation-monitoring";
import MapViewer from "@/pages/map-viewer";
import EditPolygon from "@/pages/edit-polygon";
import DataVerification from "@/pages/data-verification";
import DDSReports from "@/pages/dds-reports";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { VoiceAssistantToggle } from "@/components/voice-assistant/VoiceAssistantToggle";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <Dashboard />} />
      <ProtectedRoute path="/spatial-analysis" component={() => <DeforestationMonitoring />} />
      <ProtectedRoute path="/map-viewer" component={() => <MapViewer />} />
      <ProtectedRoute path="/edit-polygon" component={() => <EditPolygon />} />
      <ProtectedRoute path="/data-verification" component={() => <DataVerification />} />
      <ProtectedRoute path="/data-collection" component={() => (
        <WorkflowGuard step={1}>
          <LegalityAssessment />
        </WorkflowGuard>
      )} />
      <ProtectedRoute path="/legality-compliance" component={() => (
        <WorkflowGuard step={2}>
          <LegalityCompliance />
        </WorkflowGuard>
      )} />
      <ProtectedRoute path="/risk-assessment" component={() => (
        <WorkflowGuard step={3}>
          <RiskAssessment />
        </WorkflowGuard>
      )} />
      <ProtectedRoute path="/supply-chain" component={() => <SupplyChainSimple />} />
      <ProtectedRoute path="/reports" component={() => <DDSReports />} />
      <ProtectedRoute path="/dds-reports" component={() => <DDSReports />} />

      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SupplierProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </SupplierProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

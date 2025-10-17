import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SupplierProvider } from "@/hooks/use-supplier-context";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CompanyProvider } from "@/hooks/use-company";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import PlotMapping from "@/pages/plot-mapping";
import SupplyChainAnalysis from "@/pages/supply-chain-analysis";
import LegalityAssessment from "@/pages/data-collection";
import LegalityCompliance from "@/pages/legality-compliance";
import RiskAnalysis from "@/pages/risk-analysis";
import UnifiedMonitoring from "@/pages/unified-monitoring";
import SupplyChainSimple from "@/pages/supply-chain-simple";
import DeforestationMonitoring from "@/pages/deforestation-monitoring";
import MapViewer from "@/pages/map-viewer";
import EditPolygon from "@/pages/edit-polygon";
import DataVerification from "@/pages/data-verification";
import DueDiligenceReport from "@/pages/due-diligence-report";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import UserManagement from "@/pages/admin/user-management";
import RoleManagement from "@/pages/admin/role-management";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { VoiceAssistantToggle } from "@/components/voice-assistant/VoiceAssistantToggle";

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto pt-16">
          {children}
        </main>
        <VoiceAssistantToggle />
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kpn-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Switch>
      <Route path="/">
        <PageLayout><Dashboard /></PageLayout>
      </Route>
      <Route path="/dashboard">
        <PageLayout><Dashboard /></PageLayout>
      </Route>
      <Route path="/deforestation-monitoring">
        <PageLayout><DeforestationMonitoring /></PageLayout>
      </Route>
      <Route path="/spatial-analysis">
        <PageLayout><DeforestationMonitoring /></PageLayout>
      </Route>
      <Route path="/map-viewer">
        <PageLayout><MapViewer /></PageLayout>
      </Route>
      <Route path="/edit-polygon">
        <PageLayout><EditPolygon /></PageLayout>
      </Route>
      <Route path="/data-verification">
        <PageLayout><DataVerification /></PageLayout>
      </Route>
      <Route path="/supply-chain-analysis">
        <PageLayout><SupplyChainAnalysis /></PageLayout>
      </Route>
      <Route path="/data-collection">
        <PageLayout><LegalityAssessment /></PageLayout>
      </Route>
      <Route path="/legality-assessment">
        <PageLayout><LegalityAssessment /></PageLayout>
      </Route>
      <Route path="/legality-compliance">
        <PageLayout><LegalityCompliance /></PageLayout>
      </Route>
      <Route path="/risk-analysis">
        <PageLayout><RiskAnalysis /></PageLayout>
      </Route>
      <Route path="/supply-chain">
        <PageLayout><SupplyChainSimple /></PageLayout>
      </Route>
      <Route path="/unified-supply-chain">
        <PageLayout><SupplyChainSimple /></PageLayout>
      </Route>
      <Route path="/due-diligence-report">
        <PageLayout><DueDiligenceReport /></PageLayout>
      </Route>
      <Route path="/dds-reports">
        <PageLayout><DueDiligenceReport /></PageLayout>
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin">
        <PageLayout><AdminDashboard /></PageLayout>
      </Route>
      <Route path="/admin/dashboard">
        <PageLayout><AdminDashboard /></PageLayout>
      </Route>
      <Route path="/admin/users">
        <PageLayout><UserManagement /></PageLayout>
      </Route>
      <Route path="/admin/roles">
        <PageLayout><RoleManagement /></PageLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>
          <SupplierProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </SupplierProvider>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
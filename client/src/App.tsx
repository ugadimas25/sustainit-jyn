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
import LegalityAssessment from "@/pages/data-collection";
import LegalityCompliance from "@/pages/legality-compliance";
import UnifiedMonitoring from "@/pages/unified-monitoring";
import SupplyChainSimple from "@/pages/supply-chain-simple";
import DeforestationMonitoring from "@/pages/deforestation-monitoring";
import MapViewer from "@/pages/map-viewer";
import DDSReports from "@/pages/dds-reports";
import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import VoiceAssistantToggle from "@/components/voice-assistant-toggle";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <Dashboard />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/deforestation-monitoring">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <DeforestationMonitoring />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/map-viewer">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <MapViewer />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/data-collection">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <LegalityAssessment />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/legality-compliance">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <LegalityCompliance />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/supply-chain">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <SupplyChainSimple />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>
      <Route path="/reports">
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-auto">
              <DDSReports />
            </main>
            <VoiceAssistantToggle />
          </div>
        </div>
      </Route>

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

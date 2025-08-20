import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { VoiceAssistantToggle } from "@/components/voice-assistant/VoiceAssistantToggle";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Component />
          </main>
          <VoiceAssistantToggle />
        </div>
      </div>
    </Route>
  );
}

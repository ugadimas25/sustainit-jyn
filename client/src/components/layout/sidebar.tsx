import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { 
  BarChart3, 
  Shield, 
  Scale,
  Satellite, 
  Link, 
  FileText, 
  Leaf,
  LogOut,
  User,
  Activity,
  TrendingUp,
  Users,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  testId: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: BarChart3, testId: 'nav-dashboard' },
  { name: 'Spatial Analysis', href: '/spatial-analysis', icon: Satellite, testId: 'nav-spatial-analysis' },
  { name: 'Supplier Assessment', href: '/supplier-assessment', icon: Users, testId: 'nav-supplier-assessment' },
  { name: 'Data Collection', href: '/data-collection', icon: Shield, testId: 'nav-data-collection' },
  { name: 'Legality Compliance', href: '/legality-compliance', icon: Scale, testId: 'nav-legality-compliance' },
  { name: 'Risk Assessment', href: '/risk-assessment', icon: AlertTriangle, testId: 'nav-risk-assessment' },
  { name: 'Supply Chain', href: '/supply-chain', icon: Link, testId: 'nav-supply-chain' },
  { name: 'DDS Reports', href: '/reports', icon: FileText, testId: 'nav-reports' },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Temporarily bypass authentication for direct access
  const user = { name: 'Demo User', role: 'compliance_officer' };
  const logoutMutation = { mutate: () => {} };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logoutMutation.mutate();
    }
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isActive = location === item.href;
    return (
      <button
        key={item.name}
        onClick={() => item.href ? setLocation(item.href) : undefined}
        className={`w-full text-left px-4 py-3 rounded-lg flex items-center transition-colors duration-200 ${
          isActive 
            ? 'bg-forest text-white' 
            : 'text-gray-700 hover:bg-forest hover:text-white'
        }`}
        data-testid={item.testId}
      >
        <item.icon className="w-5 h-5" />
        <span className="ml-3">{item.name}</span>
      </button>
    );
  };

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-neutral-border flex flex-col">
      <div className="p-6 border-b border-neutral-border">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h2 className="font-bold text-gray-800">KPN EUDR</h2>
            <p className="text-sm text-gray-500">Compliance Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map(renderNavigationItem)}
        </div>
      </div>
      
      <div className="p-4 border-t border-neutral-border bg-white">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-800" data-testid="text-user-name">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500" data-testid="text-user-role">
              {user?.role?.replace('_', ' ') || 'Compliance Officer'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-gray-400 hover:text-gray-600"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
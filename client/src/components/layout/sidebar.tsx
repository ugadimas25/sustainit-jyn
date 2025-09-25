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
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Lock,
  Settings,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSupplierStepAccess } from "@/hooks/use-supplier-context";

interface SubModule {
  name: string;
  href: string;
  icon: any;
  step: number;
  testId: string;
}

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  testId: string;
  subModules?: SubModule[];
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: BarChart3, testId: 'nav-dashboard' },
  { 
    name: 'Supply Chain Analysis', 
    href: '/supply-chain-analysis', 
    icon: Users, 
    testId: 'nav-supply-chain-analysis',
    subModules: [
      { name: '1. Data Collection', href: '/data-collection', icon: Shield, step: 1, testId: 'nav-supply-chain-analysis-step-1' },
      { name: '2. Spatial Analysis', href: '/spatial-analysis', icon: Satellite, step: 2, testId: 'nav-supply-chain-analysis-step-2' },
      { name: '3. Legality Compliance', href: '/legality-compliance', icon: Scale, step: 3, testId: 'nav-supply-chain-analysis-step-3' },
      { name: '4. Risk Analysis', href: '/risk-assessment', icon: AlertTriangle, step: 4, testId: 'nav-supply-chain-analysis-step-4' },
    ]
  },
  { name: 'Supply Chain Linkage', href: '/supply-chain', icon: Link, testId: 'nav-supply-chain' },
  { name: 'Due Diligence Report', href: '/due-diligence-report', icon: FileText, testId: 'nav-due-diligence-report' },
];

// Admin navigation (only for admin users)
const adminNavigation: NavigationItem[] = [
  { 
    name: 'System Administration', 
    href: '/admin', 
    icon: Settings, 
    testId: 'nav-admin',
    subModules: [
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: BarChart3, step: 1, testId: 'nav-admin-dashboard' },
      { name: 'User Management', href: '/admin/users', icon: Users, step: 2, testId: 'nav-admin-users' },
      { name: 'Role Management', href: '/admin/roles', icon: Shield, step: 3, testId: 'nav-admin-roles' },
    ]
  },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [expandedModules, setExpandedModules] = useState<string[]>(['Supply Chain Analysis']);
  const { toast } = useToast();

  // Use real authentication
  const auth = useAuth();
  const user = auth?.user;
  const logoutMutation = auth?.logoutMutation || { mutate: () => {} };

  // Check if user has admin permissions (check actual user role)
  const isAdmin = user?.role === 'admin' || user?.role === 'system_admin' || user?.role === 'organization_admin';
  
  // Combine navigation arrays
  const allNavigation = isAdmin ? [...navigation, ...adminNavigation] : navigation;

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logoutMutation.mutate();
    }
  };

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(name => name !== moduleName)
        : [...prev, moduleName]
    );
  };

  const isSubModuleActive = (item: NavigationItem) => {
    // Check if on parent page or any submodule page
    if (location === item.href) return true;
    return item.subModules?.some(sub => location === sub.href) || false;
  };

  const checkStepAccess = (step: number, navigate: () => void) => {
    navigate(); // Navigate - access check will be handled by the step access query
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const hasSubModules = item.subModules && item.subModules.length > 0;

    if (hasSubModules) {
      const isExpanded = expandedModules.includes(item.name);
      const hasActiveSubModule = isSubModuleActive(item);

      return (
        <div key={item.name} className="space-y-1">
          {/* Parent Module */}
          <div
            className={`w-full rounded-lg flex items-center transition-colors duration-200 ${
              hasActiveSubModule
                ? 'bg-forest text-white' 
                : 'text-gray-700 hover:bg-forest hover:text-white'
            }`}
          >
            {/* Main clickable area for navigation */}
            <button
              onClick={() => item.href ? setLocation(item.href) : undefined}
              className="flex-1 text-left px-4 py-3 flex items-center"
              data-testid={item.testId}
            >
              <item.icon className="w-5 h-5" />
              <span className="ml-3">{item.name}</span>
            </button>

            {/* Separate chevron button for toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleModule(item.name);
              }}
              className="px-3 py-3 hover:bg-black hover:bg-opacity-10 rounded-r-lg"
              data-testid={`${item.testId}-toggle`}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Sub Modules */}
          {isExpanded && (
            <div className="ml-4 space-y-1">
              {item.subModules!.map((subModule) => {
                const isActive = location === subModule.href;

                return (
                  <WorkflowStepButton
                    key={subModule.name}
                    subModule={subModule}
                    isActive={isActive}
                    onNavigate={checkStepAccess}
                    setLocation={setLocation}
                  />
                );
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Regular navigation item
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
    }
  };

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-neutral-border flex flex-col">
      <div className="p-6 border-b border-neutral-border">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-forest rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div className="ml-3">
            <h2 className="font-bold text-gray-800">KPN Compliance</h2>
            <p className="text-sm text-gray-500">Compliance Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="space-y-1">
          {navigation.map(renderNavigationItem)}
          
          {/* Admin Navigation Section */}
          {isAdmin && (
            <>
              <div className="my-4">
                <div className="px-4 py-2">
                  <div className="h-px bg-gray-300 dark:bg-gray-700"></div>
                </div>
              </div>
              {adminNavigation.map(renderNavigationItem)}
            </>
          )}
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

// WorkflowStepButton component for supplier assessment steps
interface WorkflowStepButtonProps {
  subModule: SubModule;
  isActive: boolean;
  onNavigate: (step: number, navigate: () => void) => void;
  setLocation: (href: string) => void;
}

function WorkflowStepButton({ subModule, isActive, onNavigate, setLocation }: WorkflowStepButtonProps) {
  const { data: accessData, isLoading } = useSupplierStepAccess(subModule.step);
  const { toast } = useToast();

  const hasAccess = accessData?.hasAccess ?? (subModule.step === 1 || subModule.step === 2 || subModule.step === 3 || subModule.step === 4); // Default to allow all steps
  const isAccessible = !isLoading && hasAccess;

  const handleClick = () => {
    if (isLoading) return;

    // Spatial Analysis (step 2) is always available
    if (subModule.step === 2) {
      onNavigate(subModule.step, () => setLocation(subModule.href));
      return;
    }

    if (!hasAccess) {
      let requiredStep = "";
      if (subModule.step === 3) requiredStep = "Data Collection and Spatial Analysis";
      if (subModule.step === 4) requiredStep = "Data Collection, Spatial Analysis, and Legality Compliance";

      toast({
        title: "Step Locked",
        description: `Please complete ${requiredStep} first before accessing ${subModule.name}.`,
        variant: "destructive"
      });
      return;
    }

    onNavigate(subModule.step, () => setLocation(subModule.href));
  };

  return (
    <button
      onClick={handleClick}
      disabled={false}
      className={`w-full text-left px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm ${
        isActive 
          ? 'bg-forest-light text-forest font-medium' 
          : (isAccessible || subModule.step === 2)
          ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          : 'text-gray-400 cursor-not-allowed'
      }`}
      data-testid={subModule.testId}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : (!isAccessible && subModule.step !== 2) ? (
            <Lock className="w-4 h-4 opacity-50" />
          ) : (
            <subModule.icon className="w-4 h-4" />
          )}
          <span className="ml-3">{subModule.name}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isActive 
            ? 'bg-forest text-white' 
            : (isAccessible || subModule.step === 2)
            ? 'bg-gray-200 text-gray-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {isLoading ? '...' : (hasAccess || subModule.step === 2) ? 'Available' : 'Locked'}
        </span>
      </div>
    </button>
  );
}
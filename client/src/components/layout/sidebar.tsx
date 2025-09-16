import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useSupplierContext, useSupplierStepAccess } from "@/hooks/use-supplier-context";
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
  ChevronDown,
  ChevronRight,
  Users,
  AlertTriangle,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SubModule {
  name: string;
  href: string;
  icon: any;
  testId: string;
  step: number;
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
  { name: 'Spatial Analysis', href: '/spatial-analysis', icon: Satellite, testId: 'nav-spatial-analysis' },
  { 
    name: 'Supplier Assessment', 
    icon: Users, 
    testId: 'nav-supplier-assessment',
    subModules: [
      { name: 'Data Collection', href: '/data-collection', icon: Shield, testId: 'nav-data-collection', step: 1 },
      { name: 'Legality Compliance', href: '/legality-compliance', icon: Scale, testId: 'nav-legality-compliance', step: 2 },
      { name: 'Risk Assessment', href: '/risk-assessment', icon: AlertTriangle, testId: 'nav-risk-assessment', step: 3 },
    ]
  },
  { name: 'Supply Chain', href: '/supply-chain', icon: Link, testId: 'nav-supply-chain' },
  { name: 'DDS Reports', href: '/reports', icon: FileText, testId: 'nav-reports' },
];

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const [expandedModules, setExpandedModules] = useState<string[]>(['Supplier Assessment']);
  const { currentSupplier, setCurrentSupplier, availableSuppliers, isLoading } = useSupplierContext();
  const { toast } = useToast();
  
  // Temporarily bypass authentication for direct access
  const user = { name: 'Demo User', role: 'compliance_officer' };
  const logoutMutation = { mutate: () => {} };

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

  const isSubModuleActive = (subModules: SubModule[]) => {
    return subModules.some(sub => location === sub.href);
  };

  // Real workflow enforcement function
  const checkStepAccess = (step: number, navigate: () => void) => {
    if (!currentSupplier) {
      if (step === 1) {
        navigate(); // Allow Data Collection without supplier selection
        return;
      }
      toast({
        title: "Supplier Required",
        description: "Please select a supplier before accessing this step.",
        variant: "destructive"
      });
      return;
    }
    navigate(); // Navigate - access check will be handled by the step access query
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const hasSubModules = item.subModules && item.subModules.length > 0;
    
    if (hasSubModules) {
      const isExpanded = expandedModules.includes(item.name);
      const hasActiveSubModule = isSubModuleActive(item.subModules!);
      
      return (
        <div key={item.name} className="space-y-1">
          {/* Parent Module */}
          <button
            onClick={() => toggleModule(item.name)}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors duration-200 ${
              hasActiveSubModule
                ? 'bg-forest text-white' 
                : 'text-gray-700 hover:bg-forest hover:text-white'
            }`}
            data-testid={item.testId}
          >
            <div className="flex items-center">
              <item.icon className="w-5 h-5" />
              <span className="ml-3">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
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
                    currentSupplier={currentSupplier}
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
            <h2 className="font-bold text-gray-800">KPN EUDR</h2>
            <p className="text-sm text-gray-500">Compliance Platform</p>
          </div>
        </div>
      </div>
      
      {/* Supplier Selection */}
      <div className="p-4 border-b border-neutral-border">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Current Supplier</label>
          <Select value={currentSupplier || ""} onValueChange={setCurrentSupplier}>
            <SelectTrigger className="w-full" data-testid="select-current-supplier">
              <SelectValue placeholder={isLoading ? "Loading..." : "Select supplier..."} />
            </SelectTrigger>
            <SelectContent>
              {availableSuppliers.map((supplier) => (
                <SelectItem key={supplier} value={supplier}>
                  {supplier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {currentSupplier && (
            <p className="text-xs text-gray-500">
              Workflow enforcement active for {currentSupplier}
            </p>
          )}
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

// WorkflowStepButton component for supplier assessment steps
interface WorkflowStepButtonProps {
  subModule: SubModule;
  isActive: boolean;
  currentSupplier: string | null;
  onNavigate: (step: number, navigate: () => void) => void;
  setLocation: (href: string) => void;
}

function WorkflowStepButton({ subModule, isActive, currentSupplier, onNavigate, setLocation }: WorkflowStepButtonProps) {
  const { data: accessData, isLoading } = useSupplierStepAccess(subModule.step);
  const { toast } = useToast();
  
  const hasAccess = accessData?.hasAccess ?? (subModule.step === 1); // Default to allow step 1
  const isAccessible = !isLoading && hasAccess;
  
  const handleClick = () => {
    if (isLoading) return;
    
    if (!hasAccess) {
      let requiredStep = "";
      if (subModule.step === 2) requiredStep = "Data Collection";
      if (subModule.step === 3) requiredStep = "Data Collection and Legality Compliance";
      
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
      disabled={isLoading || !isAccessible}
      className={`w-full text-left px-4 py-2 rounded-lg flex items-center transition-colors duration-200 text-sm ${
        isActive 
          ? 'bg-forest-light text-forest font-medium' 
          : isAccessible
          ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
          : 'text-gray-400 cursor-not-allowed'
      }`}
      data-testid={subModule.testId}
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : !isAccessible ? (
            <Lock className="w-4 h-4 opacity-50" />
          ) : (
            <subModule.icon className="w-4 h-4" />
          )}
          <span className="ml-3">{subModule.name}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          isActive 
            ? 'bg-forest text-white' 
            : isAccessible 
            ? 'bg-gray-200 text-gray-700'
            : 'bg-gray-100 text-gray-400'
        }`}>
          {subModule.step}
        </span>
      </div>
    </button>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  CheckCircle2, Clock, AlertTriangle, Building, Link2, Package, 
  Users, FileCheck, Shield, Target, TrendingUp, Activity
} from "lucide-react";

interface ComplianceStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending' | 'blocked';
  progress: number;
  icon: React.ComponentType<any>;
  requirements: string[];
  completedRequirements: string[];
  estimatedTime: string;
  dependencies?: string[];
}

interface ComplianceProgressTrackerProps {
  suppliers: any[];
  supplierLinks: any[];
  shipments: any[];
  onStepClick?: (stepId: string) => void;
}

export default function ComplianceProgressTracker({ 
  suppliers, 
  supplierLinks, 
  shipments, 
  onStepClick 
}: ComplianceProgressTrackerProps) {
  const [currentStep, setCurrentStep] = useState<string>("");
  const [overallProgress, setOverallProgress] = useState(0);

  // Define compliance workflow steps
  const complianceSteps: ComplianceStep[] = [
    {
      id: "supplier-registration",
      title: "Supplier Registration",
      description: "Register suppliers with complete company details and compliance documentation",
      status: suppliers.length > 0 ? 'completed' : 'pending',
      progress: suppliers.length > 0 ? 100 : 0,
      icon: Building,
      requirements: [
        "Company registration details",
        "Contact information",
        "Business type classification",
        "Tier assignment",
        "Legality assessment",
        "Certification documentation"
      ],
      completedRequirements: suppliers.length > 0 ? [
        "Company registration details",
        "Contact information", 
        "Business type classification",
        "Tier assignment"
      ] : [],
      estimatedTime: "2-3 hours per supplier"
    },
    {
      id: "tier-linkage",
      title: "Tier-based Linkage",
      description: "Create supply chain connections between business tiers",
      status: supplierLinks.length > 0 ? 'completed' : suppliers.length > 1 ? 'in-progress' : 'pending',
      progress: supplierLinks.length > 0 ? 100 : suppliers.length > 1 ? 50 : 0,
      icon: Link2,
      requirements: [
        "Parent-child supplier relationships",
        "Tier hierarchy validation",
        "Link type specification",
        "Supply chain mapping",
        "Relationship documentation"
      ],
      completedRequirements: supplierLinks.length > 0 ? [
        "Parent-child supplier relationships",
        "Tier hierarchy validation",
        "Link type specification"
      ] : [],
      estimatedTime: "1-2 hours",
      dependencies: ["supplier-registration"]
    },
    {
      id: "shipment-tracking",
      title: "Shipment Tracking",
      description: "Track shipments from tier 1 suppliers with complete documentation",
      status: shipments.length > 0 ? 'completed' : supplierLinks.length > 0 ? 'in-progress' : 'pending',
      progress: shipments.length > 0 ? 100 : supplierLinks.length > 0 ? 25 : 0,
      icon: Package,
      requirements: [
        "Shipment documentation",
        "Product type specification",
        "Quantity and quality tracking",
        "Batch number assignment",
        "Destination verification",
        "Status monitoring"
      ],
      completedRequirements: shipments.length > 0 ? [
        "Shipment documentation",
        "Product type specification",
        "Quantity and quality tracking"
      ] : [],
      estimatedTime: "30 minutes per shipment",
      dependencies: ["tier-linkage"]
    },
    {
      id: "compliance-verification",
      title: "Compliance Verification",
      description: "Verify all suppliers meet EUDR and certification requirements",
      status: getComplianceStatus(),
      progress: getComplianceProgress(),
      icon: Shield,
      requirements: [
        "EUDR compliance verification",
        "Certification validation",
        "Risk assessment completion",
        "Deforestation monitoring",
        "Legal status confirmation",
        "Documentation review"
      ],
      completedRequirements: getComplianceCompletedRequirements(),
      estimatedTime: "1-2 days"
    },
    {
      id: "documentation-export",
      title: "Documentation & Export",
      description: "Generate compliance reports and export documentation",
      status: isDocumentationReady() ? 'completed' : getComplianceStatus() === 'completed' ? 'in-progress' : 'pending',
      progress: isDocumentationReady() ? 100 : getComplianceStatus() === 'completed' ? 75 : 0,
      icon: FileCheck,
      requirements: [
        "Compliance summary report",
        "Supply chain visualization",
        "Traceability documentation",
        "Risk assessment report",
        "Certification portfolio",
        "EUDR compliance certificate"
      ],
      completedRequirements: isDocumentationReady() ? [
        "Compliance summary report",
        "Supply chain visualization"
      ] : [],
      estimatedTime: "2-3 hours",
      dependencies: ["compliance-verification"]
    }
  ];

  // Calculate compliance status
  function getComplianceStatus(): 'completed' | 'in-progress' | 'pending' | 'blocked' {
    if (suppliers.length === 0) return 'pending';
    
    const verifiedSuppliers = suppliers.filter((s: any) => s.legalityStatus === 'verified');
    const totalSuppliers = suppliers.length;
    
    if (verifiedSuppliers.length === totalSuppliers && totalSuppliers > 0) return 'completed';
    if (verifiedSuppliers.length > 0) return 'in-progress';
    if (totalSuppliers > 0) return 'in-progress';
    return 'pending';
  }

  function getComplianceProgress(): number {
    if (suppliers.length === 0) return 0;
    const verifiedSuppliers = suppliers.filter((s: any) => s.legalityStatus === 'verified');
    return Math.round((verifiedSuppliers.length / suppliers.length) * 100);
  }

  function getComplianceCompletedRequirements(): string[] {
    const completed = [];
    if (suppliers.some((s: any) => s.legalityStatus === 'verified')) {
      completed.push("EUDR compliance verification", "Risk assessment completion");
    }
    if (suppliers.some((s: any) => s.certifications?.length > 0)) {
      completed.push("Certification validation");
    }
    return completed;
  }

  function isDocumentationReady(): boolean {
    return suppliers.length > 0 && supplierLinks.length > 0 && shipments.length > 0 && 
           getComplianceStatus() === 'completed';
  }

  // Calculate overall progress
  useEffect(() => {
    const totalSteps = complianceSteps.length;
    const totalProgress = complianceSteps.reduce((sum, step) => sum + step.progress, 0);
    setOverallProgress(Math.round(totalProgress / totalSteps));

    // Determine current step
    const activeStep = complianceSteps.find(step => 
      step.status === 'in-progress' || (step.status === 'pending' && step.progress === 0)
    );
    setCurrentStep(activeStep?.id || "");
  }, [suppliers, supplierLinks, shipments]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'blocked':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'blocked':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getNextActions = () => {
    const pendingStep = complianceSteps.find(step => step.status === 'pending' || step.status === 'in-progress');
    if (!pendingStep) return [];

    switch (pendingStep.id) {
      case 'supplier-registration':
        return ['Add new suppliers', 'Complete legality assessments', 'Upload certifications'];
      case 'tier-linkage':
        return ['Create supplier relationships', 'Validate tier hierarchy', 'Map supply chain flow'];
      case 'shipment-tracking':
        return ['Add tier 1 shipments', 'Complete documentation', 'Verify destinations'];
      case 'compliance-verification':
        return ['Review supplier compliance', 'Update risk assessments', 'Validate certifications'];
      case 'documentation-export':
        return ['Generate compliance reports', 'Export documentation', 'Review final compliance'];
      default:
        return [];
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Compliance Workflow Progress
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Track your EUDR compliance workflow completion
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{overallProgress}%</div>
              <div className="text-sm text-gray-500">Complete</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Started</span>
            <span>{overallProgress === 100 ? 'Completed' : 'In Progress'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Progress */}
      <div className="grid gap-4">
        {complianceSteps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`transition-all hover:shadow-md cursor-pointer ${
              currentStep === step.id ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : ''
            }`}
            onClick={() => onStepClick?.(step.id)}
            data-testid={`progress-step-${step.id}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Step Number & Icon */}
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    step.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20' :
                    step.status === 'in-progress' ? 'bg-blue-100 dark:bg-blue-900/20' :
                    'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <step.icon className={`h-5 w-5 ${
                      step.status === 'completed' ? 'text-green-600' :
                      step.status === 'in-progress' ? 'text-blue-600' :
                      'text-gray-400'
                    }`} />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Step {index + 1}</div>
                </div>

                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">{step.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(step.status)}
                      <Badge className={getStatusColor(step.status)}>
                        {step.status.replace('-', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {step.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{step.progress}%</span>
                    </div>
                    <Progress value={step.progress} className="h-2" />
                  </div>

                  {/* Requirements */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Requirements</h4>
                      <div className="space-y-1">
                        {step.requirements.map((req, reqIndex) => (
                          <div key={reqIndex} className="flex items-center gap-2 text-xs">
                            {step.completedRequirements.includes(req) ? (
                              <CheckCircle2 className="h-3 w-3 text-green-600" />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600" />
                            )}
                            <span className={step.completedRequirements.includes(req) ? 
                              'text-green-700 dark:text-green-300 line-through' : 
                              'text-gray-600 dark:text-gray-300'
                            }>
                              {req}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Details</h4>
                      <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                        <div className="flex justify-between">
                          <span>Estimated Time:</span>
                          <span>{step.estimatedTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>{step.completedRequirements.length}/{step.requirements.length}</span>
                        </div>
                        {step.dependencies && (
                          <div className="flex justify-between">
                            <span>Dependencies:</span>
                            <span>{step.dependencies.length} step(s)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Next Actions */}
      {getNextActions().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recommended Next Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {getNextActions().map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span>{action}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Summary */}
      {overallProgress === 100 && (
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-300">
                  Compliance Workflow Complete!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-400">
                  All steps have been completed successfully. Your supply chain is now fully compliant and documented.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useSupplierContext, useSupplierStepAccess } from '@/hooks/use-supplier-context';
import { useToast } from '@/hooks/use-toast';

interface WorkflowGuardProps {
  step: number;
  children: React.ReactNode;
}

export function WorkflowGuard({ step, children }: WorkflowGuardProps) {
  const [, setLocation] = useLocation();
  const { currentSupplier } = useSupplierContext();
  const { toast } = useToast();
  const { data: accessData, isLoading } = useSupplierStepAccess(step);

  useEffect(() => {
    if (!isLoading) {
      // Handle error cases (network errors, endpoint missing, etc.)
      if (!accessData || accessData.error) {
        const errorReason = accessData?.error || "Unable to verify access";
        toast({
          title: "Access Check Failed",
          description: `${errorReason}. Redirecting to Data Collection to ensure safe workflow progression.`,
          variant: "destructive"
        });
        setLocation("/data-collection");
        return;
      }

      // Handle access denied cases
      if (!accessData.hasAccess) {
        let requiredStep = "";

        if (step === 2) {
          requiredStep = "Data Collection";
        } else if (step === 3) {
          requiredStep = "Data Collection and Legality Compliance";
        }

        toast({
          title: "Access Denied",
          description: `Please complete ${requiredStep} first before accessing this step.`,
          variant: "destructive"
        });

        setLocation("/data-collection");
      }
    }
  }, [accessData, isLoading, step, currentSupplier, setLocation, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Show loading while checking access or redirecting on denied/error cases
  if (!accessData?.hasAccess || accessData?.error) {
    return null; // Component will redirect via useEffect
  }

  return <>{children}</>;
}
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';

interface SupplierContextType {
  currentSupplier: string | null;
  setCurrentSupplier: (supplier: string | null) => void;
  availableSuppliers: string[];
  isLoading: boolean;
}

const SupplierContext = createContext<SupplierContextType | undefined>(undefined);

export function SupplierProvider({ children }: { children: ReactNode }) {
  const [currentSupplier, setCurrentSupplierState] = useState<string | null>(() => {
    // Try to get supplier from localStorage or URL params
    const stored = localStorage.getItem('currentSupplier');
    const urlParams = new URLSearchParams(window.location.search);
    const urlSupplier = urlParams.get('supplier');
    return urlSupplier || stored || null;
  });

  // Fetch available suppliers from backend (with demo fallback)
  const { data: suppliersData = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/suppliers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/suppliers', { credentials: 'include' });
        if (response.ok) {
          return response.json();
        }
        
        // Fallback to demo suppliers for development/demo purposes
        return [
          { name: 'PT Permata Hijau Estate', type: 'Estate' },
          { name: 'Sumber Makmur Mill', type: 'Mill' },
          { name: 'Riau Smallholder Cooperative', type: 'Smallholder' },
        ];
      } catch (error) {
        console.warn('Failed to fetch suppliers, using demo data:', error);
        return [
          { name: 'PT Permata Hijau Estate', type: 'Estate' },
          { name: 'Sumber Makmur Mill', type: 'Mill' },
          { name: 'Riau Smallholder Cooperative', type: 'Smallholder' },
        ];
      }
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const availableSuppliers = suppliersData.map(s => s.name || s.supplierName).filter(Boolean);

  const setCurrentSupplier = (supplier: string | null) => {
    setCurrentSupplierState(supplier);
    if (supplier) {
      localStorage.setItem('currentSupplier', supplier);
      // Update URL params to maintain supplier context across navigation
      const url = new URL(window.location.href);
      url.searchParams.set('supplier', supplier);
      window.history.replaceState({}, '', url.toString());
    } else {
      localStorage.removeItem('currentSupplier');
      const url = new URL(window.location.href);
      url.searchParams.delete('supplier');
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Auto-select first supplier if none is selected and suppliers are available
  useEffect(() => {
    if (!currentSupplier && availableSuppliers.length > 0 && !isLoading) {
      setCurrentSupplier(availableSuppliers[0]);
    }
  }, [currentSupplier, availableSuppliers, isLoading]);

  return (
    <SupplierContext.Provider value={{
      currentSupplier,
      setCurrentSupplier,
      availableSuppliers,
      isLoading
    }}>
      {children}
    </SupplierContext.Provider>
  );
}

export function useSupplierContext() {
  const context = useContext(SupplierContext);
  if (context === undefined) {
    throw new Error('useSupplierContext must be used within a SupplierProvider');
  }
  return context;
}

// Hook for checking supplier step access
export function useSupplierStepAccess(step: number) {
  const { currentSupplier } = useSupplierContext();
  
  return useQuery({
    queryKey: ['/api/supplier-step-access', currentSupplier, step],
    queryFn: async () => {
      if (!currentSupplier) {
        return { hasAccess: step === 1 || step === 2 }; // Allow Data Collection and Spatial Analysis without supplier
      }
      
      const response = await fetch(`/api/supplier-step-access/${encodeURIComponent(currentSupplier)}/${step}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        console.warn(`Step access check failed with status ${response.status}`);
        return { hasAccess: step === 1 || step === 2, error: `HTTP ${response.status}` }; // Allow steps 1 and 2 on error
      }
      return response.json();
    },
    enabled: !!currentSupplier || step === 1 || step === 2, // Always check for steps 1 and 2, others need supplier
    staleTime: 30 * 1000, // 30 seconds
  });
}
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { DashboardFilters } from "@shared/schema";

interface DashboardFilterContextValue {
  filters: DashboardFilters;
  updateFilters: (newFilters: Partial<DashboardFilters>) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const DashboardFilterContext = createContext<DashboardFilterContextValue | undefined>(undefined);

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error("useDashboardFilters must be used within a DashboardFilterProvider");
  }
  return context;
}

interface DashboardFilterProviderProps {
  children: ReactNode;
}

export function DashboardFilterProvider({ children }: DashboardFilterProviderProps) {
  const [filters, setFilters] = useState<DashboardFilters>({
    businessUnit: undefined,
    dateFrom: undefined,
    dateTo: undefined,
  });

  const updateFilters = useCallback((newFilters: Partial<DashboardFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      businessUnit: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  }, []);

  const hasActiveFilters = Boolean(
    filters.businessUnit || 
    filters.dateFrom || 
    filters.dateTo
  );

  const value: DashboardFilterContextValue = {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}
import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

interface Company {
  organizationId: string;
  organizationName: string;
  organizationSlug?: string;
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  isLoading: boolean;
}

const CompanyContext = createContext<CompanyContextType | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null);

  // Fetch user's companies
  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["/api/user/companies"],
    enabled: !!user,
  });

  // Set default active company when companies load
  useEffect(() => {
    if (companies.length > 0 && !activeCompany) {
      // Check localStorage for saved company
      const savedCompanyId = localStorage.getItem("activeCompanyId");
      const savedCompany = companies.find(c => c.organizationId === savedCompanyId);
      
      if (savedCompany) {
        setActiveCompanyState(savedCompany);
      } else {
        // Set first company as default
        setActiveCompanyState(companies[0]);
      }
    }
  }, [companies, activeCompany]);

  const setActiveCompany = (company: Company) => {
    setActiveCompanyState(company);
    localStorage.setItem("activeCompanyId", company.organizationId);
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        isLoading,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within a CompanyProvider");
  }
  return context;
}

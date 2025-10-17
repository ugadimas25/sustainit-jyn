import { useCompany } from "@/hooks/use-company";
import { Check, Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function CompanySwitcher() {
  const { companies, activeCompany, setActiveCompany, isLoading } = useCompany();

  // Don't show if user has no companies or only one company
  if (isLoading || companies.length === 0) {
    return null;
  }

  if (companies.length === 1) {
    return (
      <div className="px-4 py-2 flex items-center gap-2 text-sm text-gray-600">
        <Building2 className="w-4 h-4" />
        <span>{activeCompany?.organizationName || companies[0].organizationName}</span>
      </div>
    );
  }

  // Show dropdown if user has multiple companies
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between"
          data-testid="button-company-switcher"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>{activeCompany?.organizationName || "Select Company"}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.organizationId}
            onClick={() => setActiveCompany(company)}
            data-testid={`company-option-${company.organizationSlug}`}
          >
            <div className="flex items-center justify-between w-full">
              <span>{company.organizationName}</span>
              {activeCompany?.organizationId === company.organizationId && (
                <Check className="w-4 h-4 text-kpn-red" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

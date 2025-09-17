import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { useDashboardFilters } from "@/components/dashboard-filter-context";

interface SupplierData {
  supplierId: string;
  supplierName: string;
  totalPlots: number;
  compliantPlots: number;
  totalArea: number;
  complianceRate: number;
  riskStatus: "low" | "medium" | "high";
  legalityStatus: "compliant" | "under_review" | "non_compliant";
  region?: string;
  businessUnit?: string;
  lastUpdated: Date;
}

interface SortConfig {
  key: keyof SupplierData;
  direction: 'asc' | 'desc';
}

export function SupplierComplianceTable() {
  const { filters } = useDashboardFilters();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'complianceRate', direction: 'desc' });

  // Build query key with filters for cache invalidation
  const queryKey = ['/api/supplier-summaries', filters.region, filters.businessUnit, filters.dateFrom, filters.dateTo];

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      // Mock data for now - in real implementation this would call the API with filters
      const mockSuppliers: SupplierData[] = [
        {
          supplierId: "SUP001",
          supplierName: "PT Sawit Makmur",
          totalPlots: 45,
          compliantPlots: 42,
          totalArea: 1250.5,
          complianceRate: 93.3,
          riskStatus: "low",
          legalityStatus: "compliant",
          region: "Indonesia",
          businessUnit: "Estate Operations",
          lastUpdated: new Date("2024-08-15")
        },
        {
          supplierId: "SUP002", 
          supplierName: "Kalimantan Palm Industries",
          totalPlots: 23,
          compliantPlots: 18,
          totalArea: 678.2,
          complianceRate: 78.3,
          riskStatus: "medium",
          legalityStatus: "under_review",
          region: "Indonesia",
          businessUnit: "Smallholder Program",
          lastUpdated: new Date("2024-08-12")
        },
        {
          supplierId: "SUP003",
          supplierName: "Green Valley Plantation",
          totalPlots: 67,
          compliantPlots: 45,
          totalArea: 2156.7,
          complianceRate: 67.2,
          riskStatus: "high",
          legalityStatus: "non_compliant",
          region: "Malaysia",
          businessUnit: "Third Party Suppliers",
          lastUpdated: new Date("2024-08-10")
        },
        {
          supplierId: "SUP004",
          supplierName: "Sustainable Oils Sdn Bhd",
          totalPlots: 89,
          compliantPlots: 85,
          totalArea: 3421.8,
          complianceRate: 95.5,
          riskStatus: "low",
          legalityStatus: "compliant",
          region: "Malaysia",
          businessUnit: "Mill Operations",
          lastUpdated: new Date("2024-08-14")
        }
      ];
      return mockSuppliers;
    }
  });

  const handleSort = (key: keyof SupplierData) => {
    const direction = (sortConfig.key === key && sortConfig.direction === 'desc') ? 'asc' : 'desc';
    setSortConfig({ key, direction });
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortConfig.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return 0;
  });

  const getRiskBadgeColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLegalityBadgeColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non_compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const SortButton = ({ column, children }: { column: keyof SupplierData; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 font-medium text-gray-700 hover:bg-gray-50"
      onClick={() => handleSort(column)}
      data-testid={`sort-button-${column}`}
    >
      {children}
      {sortConfig.key === column && (
        sortConfig.direction === 'asc' ? 
          <ChevronUp className="ml-1 h-3 w-3" /> : 
          <ChevronDown className="ml-1 h-3 w-3" />
      )}
    </Button>
  );

  if (isLoading) {
    return (
      <Card data-testid="supplier-compliance-table">
        <CardHeader>
          <CardTitle>Supplier Compliance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading suppliers...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="supplier-compliance-table">
      <CardHeader>
        <CardTitle>Supplier Compliance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="supplier-table">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">
                  <SortButton column="supplierName">Supplier Name</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton column="totalPlots">Total Plots</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton column="compliantPlots">Compliant</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton column="totalArea">Area (ha)</SortButton>
                </th>
                <th className="text-right py-3 px-2">
                  <SortButton column="complianceRate">Compliance %</SortButton>
                </th>
                <th className="text-center py-3 px-2">
                  <SortButton column="riskStatus">Risk Status</SortButton>
                </th>
                <th className="text-center py-3 px-2">
                  <SortButton column="legalityStatus">Legality Status</SortButton>
                </th>
                <th className="text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSuppliers.map((supplier) => (
                <tr 
                  key={supplier.supplierId} 
                  className="border-b border-gray-100 hover:bg-gray-50"
                  data-testid={`supplier-row-${supplier.supplierId}`}
                >
                  <td className="py-3 px-2 font-medium text-gray-900">
                    {supplier.supplierName}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {supplier.totalPlots}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {supplier.compliantPlots}
                  </td>
                  <td className="py-3 px-2 text-right">
                    {supplier.totalArea.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      supplier.complianceRate >= 90 ? 'bg-green-100 text-green-800' :
                      supplier.complianceRate >= 75 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {supplier.complianceRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge 
                      variant="outline" 
                      className={getRiskBadgeColor(supplier.riskStatus)}
                      data-testid={`risk-badge-${supplier.supplierId}`}
                    >
                      {supplier.riskStatus.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Badge 
                      variant="outline" 
                      className={getLegalityBadgeColor(supplier.legalityStatus)}
                      data-testid={`legality-badge-${supplier.supplierId}`}
                    >
                      {supplier.legalityStatus.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 text-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="gap-1"
                      data-testid={`view-details-${supplier.supplierId}`}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedSuppliers.length === 0 && (
          <div className="text-center py-8 text-gray-500" data-testid="no-suppliers-message">
            No suppliers found matching the current filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
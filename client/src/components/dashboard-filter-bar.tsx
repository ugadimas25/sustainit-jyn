import { useState } from "react";
import { Calendar, Building, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useDashboardFilters } from "./dashboard-filter-context";

// Sample data for the dropdowns - in a real app this would come from an API
const businessUnits = [
  "Estate Operations",
  "Mill Operations", 
  "Smallholder Program",
  "Third Party Suppliers",
  "All Units"
];

export function DashboardFilterBar() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useDashboardFilters();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const handleBusinessUnitChange = (value: string) => {
    const businessUnit = value === "All Units" ? undefined : value;
    updateFilters({ businessUnit });
  };

  const handleDateFromChange = (date: Date | undefined) => {
    updateFilters({ dateFrom: date });
    setDateFromOpen(false);
  };

  const handleDateToChange = (date: Date | undefined) => {
    updateFilters({ dateTo: date });
    setDateToOpen(false);
  };

  return (
    <Card className="mb-6" data-testid="dashboard-filter-bar">
      <CardContent className="py-4">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
          <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            {/* Business Unit Filter */}
            <div className="flex items-center space-x-2" data-testid="business-unit-filter">
              <Building className="h-4 w-4 text-muted-foreground" />
              <Select
                value={filters.businessUnit || "All Units"}
                onValueChange={handleBusinessUnitChange}
              >
                <SelectTrigger className="w-[200px]" data-testid="business-unit-select">
                  <SelectValue placeholder="Select Business Unit" />
                </SelectTrigger>
                <SelectContent>
                  {businessUnits.map((unit) => (
                    <SelectItem key={unit} value={unit} data-testid={`business-unit-option-${unit}`}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="flex items-center space-x-2" data-testid="date-range-filter">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              
              {/* Date From */}
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !filters.dateFrom && "text-muted-foreground"
                    )}
                    data-testid="date-from-trigger"
                  >
                    {filters.dateFrom ? (
                      format(filters.dateFrom, "PPP")
                    ) : (
                      "From date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={handleDateFromChange}
                    disabled={(date) =>
                      date > new Date() || (filters.dateTo ? date > filters.dateTo : false)
                    }
                    initialFocus
                    data-testid="date-from-calendar"
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[150px] justify-start text-left font-normal",
                      !filters.dateTo && "text-muted-foreground"
                    )}
                    data-testid="date-to-trigger"
                  >
                    {filters.dateTo ? (
                      format(filters.dateTo, "PPP")
                    ) : (
                      "To date"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={handleDateToChange}
                    disabled={(date) =>
                      date > new Date() || (filters.dateFrom ? date < filters.dateFrom : false)
                    }
                    initialFocus
                    data-testid="date-to-calendar"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center space-x-2"
              data-testid="clear-filters-button"
            >
              <X className="h-4 w-4" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t" data-testid="active-filters-summary">
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {filters.region && (
                <span className="px-2 py-1 bg-secondary rounded-md" data-testid={`active-filter-region-${filters.region}`}>
                  Region: {filters.region}
                </span>
              )}
              {filters.businessUnit && (
                <span className="px-2 py-1 bg-secondary rounded-md" data-testid={`active-filter-business-unit-${filters.businessUnit}`}>
                  Business Unit: {filters.businessUnit}
                </span>
              )}
              {filters.dateFrom && (
                <span className="px-2 py-1 bg-secondary rounded-md" data-testid="active-filter-date-from">
                  From: {format(filters.dateFrom, "PP")}
                </span>
              )}
              {filters.dateTo && (
                <span className="px-2 py-1 bg-secondary rounded-md" data-testid="active-filter-date-to">
                  To: {format(filters.dateTo, "PP")}
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { Bell, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TopBar() {
  return (
    <header className="bg-gradient-to-r from-kpn-red to-kpn-red-dark border-b border-kpn-red-dark px-6 py-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search plots, suppliers, or reports..." 
              className="pl-10 w-80 bg-white"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20" data-testid="button-notifications">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white hover:bg-opacity-20" data-testid="button-settings">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

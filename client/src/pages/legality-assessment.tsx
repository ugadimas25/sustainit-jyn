import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  MapPin
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FarmerData {
  id: string;
  respondentSerialNumber: string;
  dataCollectionOfficer: string;
  
  // A. Farmer Identity
  farmerName: string;
  nationalId: string;
  birthPlaceDate: string;
  sex: 'Male' | 'Female';
  education: 'None' | 'Primary school (SD)' | 'Junior secondary (SMP)' | 'Senior secondary (SMA)' | 'Diploma/Associate degree' | 'Bachelor (D4/S1)';
  province: string;
  regencyCity: string;
  district: string;
  village: string;
  farmerAddress: string;
  
  // B. Farm/Plot Information
  farmPlotNumber: string;
  landTenure: 'SHM (freehold title)' | 'Girik/SKT/SKGR/Management Right' | 'Communal/customary land' | 'Other legal arrangement' | 'Forest Production/Social Use Area' | 'Protected/Conservation Forest Area';
  landDocumentNumber: string;
  landAreaPerDocument: number;
  croppingPattern: 'Monoculture' | 'Polyculture';
  mainCommodity: string;
  otherCommodities: string;
  plantedArea: number;
  yearPlanted: string;
  yearReplanted: string;
  standingTrees: number;
  annualProduction: number;
  productivity: number;
  seedSource: 'Certified seed' | 'Non-certified seed' | "Don't know";
  landType: 'Mineral soil' | 'Wetland (tidal/peat)';
  fertilizerType: 'Organic' | 'Inorganic' | 'Mixed';
  salesPartner: 'Cooperative' | 'Processing company' | 'Other';
  
  // C. Farmer Organization Information
  organizationName: string;
  groupNumber: string;
  organizationCommodities: string;
  organizationAddress: string;
  
  // D. Farm Location (GPS Coordinates)
  coordinates: {
    longitude: string;
    latitude: string;
  }[];
}

export default function LegalityAssessmentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');

  // Fetch farmer data
  const { data: farmers, isLoading, refetch } = useQuery<FarmerData[]>({
    queryKey: ['/api/farmers'],
    queryFn: async () => {
      const response = await fetch('/api/farmers');
      if (!response.ok) throw new Error('Failed to fetch farmer data');
      return response.json();
    }
  });

  // Filter farmers based on search and filters
  const filteredFarmers = useMemo(() => {
    if (!farmers) return [];
    
    return farmers.filter(farmer => {
      const matchesSearch = searchQuery === '' || 
        farmer.farmerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.respondentSerialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farmer.mainCommodity.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvince = selectedProvince === 'all' || farmer.province === selectedProvince;
      const matchesEducation = selectedEducation === 'all' || farmer.education === selectedEducation;
      
      return matchesSearch && matchesProvince && matchesEducation;
    });
  }, [farmers, searchQuery, selectedProvince, selectedEducation]);

  const provinces = [...new Set(farmers?.map(f => f.province) || [])];
  const educationLevels = ['None', 'Primary school (SD)', 'Junior secondary (SMP)', 'Senior secondary (SMA)', 'Diploma/Associate degree', 'Bachelor (D4/S1)'];

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Users className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading farmer data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-600" />
                  Farmer & Plot Information
                </h1>
                <p className="text-gray-600 mt-1">Detailed farmer identity, farm/plot details, and GPS coordinates</p>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" data-testid="button-export">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button size="sm" data-testid="button-add-farmer">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Farmer
                </Button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Farmers</p>
                      <p className="text-2xl font-bold text-blue-600">{farmers?.length || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Plots</p>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round((farmers?.reduce((acc, f) => acc + (f.plantedArea || 0), 0) || 0) / 10000)} ha
                      </p>
                    </div>
                    <MapPin className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Provinces</p>
                      <p className="text-2xl font-bold text-purple-600">{provinces.length}</p>
                    </div>
                    <div className="h-8 w-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {provinces.length}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Production</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {Math.round((farmers?.reduce((acc, f) => acc + (f.annualProduction || 0), 0) || 0) / (farmers?.length || 1))} tons
                      </p>
                    </div>
                    <div className="h-8 w-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      AVG
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by name, serial number, or commodity..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-48" data-testid="select-province">
                      <SelectValue placeholder="All Provinces" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Provinces</SelectItem>
                      {provinces.map(province => (
                        <SelectItem key={province} value={province}>{province}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedEducation} onValueChange={setSelectedEducation}>
                    <SelectTrigger className="w-48" data-testid="select-education">
                      <SelectValue placeholder="All Education Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Education Levels</SelectItem>
                      {educationLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" size="sm" onClick={() => refetch()} data-testid="button-refresh">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Farmer & Plot Information ({filteredFarmers.length} records)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-32">Serial No.</TableHead>
                        <TableHead>Data Officer</TableHead>
                        <TableHead>Farmer Name</TableHead>
                        <TableHead>National ID</TableHead>
                        <TableHead>Birth Place & Date</TableHead>
                        <TableHead>Sex</TableHead>
                        <TableHead>Education</TableHead>
                        <TableHead>Province</TableHead>
                        <TableHead>Regency/City</TableHead>
                        <TableHead>District</TableHead>
                        <TableHead>Village</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Farm/Plot No.</TableHead>
                        <TableHead>Land Tenure</TableHead>
                        <TableHead>Land Document</TableHead>
                        <TableHead>Land Area (m²)</TableHead>
                        <TableHead>Cropping Pattern</TableHead>
                        <TableHead>Main Commodity</TableHead>
                        <TableHead>Other Commodities</TableHead>
                        <TableHead>Planted Area (m²)</TableHead>
                        <TableHead>Year Planted</TableHead>
                        <TableHead>Year Replanted</TableHead>
                        <TableHead>Standing Trees</TableHead>
                        <TableHead>Annual Production (tons)</TableHead>
                        <TableHead>Productivity (tons/ha)</TableHead>
                        <TableHead>Seed Source</TableHead>
                        <TableHead>Land Type</TableHead>
                        <TableHead>Fertilizer Type</TableHead>
                        <TableHead>Sales Partner</TableHead>
                        <TableHead>Organization Name</TableHead>
                        <TableHead>Group Number</TableHead>
                        <TableHead>Organization Commodities</TableHead>
                        <TableHead>Organization Address</TableHead>
                        <TableHead>GPS Coordinates</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFarmers.length > 0 ? (
                        filteredFarmers.map((farmer) => (
                          <TableRow key={farmer.id}>
                            <TableCell className="font-medium">{farmer.respondentSerialNumber}</TableCell>
                            <TableCell>{farmer.dataCollectionOfficer}</TableCell>
                            <TableCell>{farmer.farmerName}</TableCell>
                            <TableCell>{farmer.nationalId}</TableCell>
                            <TableCell>{farmer.birthPlaceDate}</TableCell>
                            <TableCell>{farmer.sex}</TableCell>
                            <TableCell className="max-w-32 truncate" title={farmer.education}>{farmer.education}</TableCell>
                            <TableCell>{farmer.province}</TableCell>
                            <TableCell>{farmer.regencyCity}</TableCell>
                            <TableCell>{farmer.district}</TableCell>
                            <TableCell>{farmer.village}</TableCell>
                            <TableCell className="max-w-48 truncate" title={farmer.farmerAddress}>{farmer.farmerAddress}</TableCell>
                            <TableCell>{farmer.farmPlotNumber}</TableCell>
                            <TableCell className="max-w-32 truncate" title={farmer.landTenure}>{farmer.landTenure}</TableCell>
                            <TableCell>{farmer.landDocumentNumber}</TableCell>
                            <TableCell className="text-right">{farmer.landAreaPerDocument?.toLocaleString()}</TableCell>
                            <TableCell>{farmer.croppingPattern}</TableCell>
                            <TableCell>{farmer.mainCommodity}</TableCell>
                            <TableCell className="max-w-32 truncate" title={farmer.otherCommodities}>{farmer.otherCommodities}</TableCell>
                            <TableCell className="text-right">{farmer.plantedArea?.toLocaleString()}</TableCell>
                            <TableCell>{farmer.yearPlanted}</TableCell>
                            <TableCell>{farmer.yearReplanted}</TableCell>
                            <TableCell className="text-right">{farmer.standingTrees?.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{farmer.annualProduction}</TableCell>
                            <TableCell className="text-right">{farmer.productivity}</TableCell>
                            <TableCell>{farmer.seedSource}</TableCell>
                            <TableCell>{farmer.landType}</TableCell>
                            <TableCell>{farmer.fertilizerType}</TableCell>
                            <TableCell>{farmer.salesPartner}</TableCell>
                            <TableCell>{farmer.organizationName}</TableCell>
                            <TableCell>{farmer.groupNumber}</TableCell>
                            <TableCell className="max-w-32 truncate" title={farmer.organizationCommodities}>{farmer.organizationCommodities}</TableCell>
                            <TableCell className="max-w-48 truncate" title={farmer.organizationAddress}>{farmer.organizationAddress}</TableCell>
                            <TableCell>
                              <div className="text-xs">
                                {farmer.coordinates?.map((coord, index) => (
                                  <div key={index}>
                                    {coord.longitude}, {coord.latitude}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-edit-${farmer.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  data-testid={`button-delete-${farmer.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={35} className="text-center py-8">
                            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No farmer data found matching your criteria</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
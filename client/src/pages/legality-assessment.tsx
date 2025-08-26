import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIAssistant } from "@/components/ai-assistant";
import { 
  Users, 
  Search, 
  Plus,
  Edit,
  Trash2,
  Download,
  Filter,
  MapPin,
  CheckCircle,
  XCircle,
  FileText,
  X,
  Languages
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface FarmerData {
  id: string;
  respondentSerialNumber: string;
  dataCollectionOfficer: string;
  dataStatus: 'completed' | 'not-completed';
  
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
  const [selectedFarmer, setSelectedFarmer] = useState<FarmerData | null>(null);
  const [showSTDBDialog, setShowSTDBDialog] = useState(false);
  const [certificateLanguage, setCertificateLanguage] = useState<'en' | 'id'>('en');
  const [editingFarmer, setEditingFarmer] = useState<FarmerData | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

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

  const provinces = Array.from(new Set(farmers?.map(f => f.province) || []));
  const educationLevels = ['None', 'Primary school (SD)', 'Junior secondary (SMP)', 'Senior secondary (SMA)', 'Diploma/Associate degree', 'Bachelor (D4/S1)'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading farmer data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
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
                        <TableHead>Data Status</TableHead>
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
                              <div 
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  farmer.dataStatus === 'completed' 
                                    ? 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                                onClick={() => {
                                  if (farmer.dataStatus === 'completed') {
                                    setSelectedFarmer(farmer);
                                    setShowSTDBDialog(true);
                                  }
                                }}
                                data-testid={`status-${farmer.id}`}
                              >
                                {farmer.dataStatus === 'completed' ? (
                                  <>
                                    <CheckCircle className="h-3 w-3" />
                                    Completed
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-3 w-3" />
                                    Not Completed
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingFarmer(farmer);
                                    setShowEditDialog(true);
                                  }}
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
                          <TableCell colSpan={36} className="text-center py-8">
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

            {/* STDB Certificate Dialog */}
            <Dialog open={showSTDBDialog} onOpenChange={setShowSTDBDialog}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                  <DialogTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {certificateLanguage === 'en' ? 'CULTIVATION REGISTRATION CERTIFICATE (STDB)' : 'SURAT TANDA DAFTAR BUDIDAYA (STDB)'}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                      <Button 
                        variant={certificateLanguage === 'en' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCertificateLanguage('en')}
                        data-testid="button-lang-en"
                        className="px-2 py-1 text-xs"
                      >
                        EN
                      </Button>
                      <Button 
                        variant={certificateLanguage === 'id' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setCertificateLanguage('id')}
                        data-testid="button-lang-id"
                        className="px-2 py-1 text-xs"
                      >
                        ID
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowSTDBDialog(false)}
                      data-testid="button-close-stdb"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </DialogHeader>
                
                {selectedFarmer && (
                  <div className="bg-white p-8 border border-gray-200 rounded-lg font-mono text-sm leading-relaxed">
                    {certificateLanguage === 'en' ? (
                      // English Version
                      <>
                        {/* Header */}
                        <div className="text-center mb-8">
                          <h1 className="text-xl font-bold mb-2">REPUBLIC OF INDONESIA</h1>
                          <h2 className="text-lg font-bold mb-2">MINISTRY OF AGRICULTURE</h2>
                          <h3 className="text-lg font-bold mb-4 underline">CULTIVATION REGISTRATION CERTIFICATE</h3>
                          <h4 className="text-base font-bold">(SURAT TANDA DAFTAR BUDIDAYA - STDB)</h4>
                          <div className="mt-4 text-sm">
                            <p>Certificate No: STDB/{selectedFarmer.respondentSerialNumber}/2024</p>
                            <p>Registration Date: {new Date().toLocaleDateString('en-GB')}</p>
                          </div>
                        </div>

                        {/* Farmer Identity Section */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            A. FARMER IDENTITY
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Name:</td>
                                <td className="border border-black p-2">{selectedFarmer.farmerName}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">National ID (KTP):</td>
                                <td className="border border-black p-2">{selectedFarmer.nationalId}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Place & Date of Birth:</td>
                                <td className="border border-black p-2">{selectedFarmer.birthPlaceDate}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Sex:</td>
                                <td className="border border-black p-2">{selectedFarmer.sex}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Education:</td>
                                <td className="border border-black p-2">{selectedFarmer.education}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Province:</td>
                                <td className="border border-black p-2">{selectedFarmer.province}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Regency/City:</td>
                                <td className="border border-black p-2">{selectedFarmer.regencyCity}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">District:</td>
                                <td className="border border-black p-2">{selectedFarmer.district}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Village:</td>
                                <td className="border border-black p-2 col-span-3" colSpan={3}>{selectedFarmer.village}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Address:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.farmerAddress}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Farm/Plot Information Section */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            B. FARM/PLOT INFORMATION
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Farm/Plot Number:</td>
                                <td className="border border-black p-2">{selectedFarmer.farmPlotNumber}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Land Tenure:</td>
                                <td className="border border-black p-2">{selectedFarmer.landTenure}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Land Document:</td>
                                <td className="border border-black p-2">{selectedFarmer.landDocumentNumber}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Land Area:</td>
                                <td className="border border-black p-2">{selectedFarmer.landAreaPerDocument?.toLocaleString()} m²</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Cropping Pattern:</td>
                                <td className="border border-black p-2">{selectedFarmer.croppingPattern}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Main Commodity:</td>
                                <td className="border border-black p-2">{selectedFarmer.mainCommodity}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Other Commodities:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.otherCommodities || 'None'}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Planted Area:</td>
                                <td className="border border-black p-2">{selectedFarmer.plantedArea?.toLocaleString()} m²</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Year Planted:</td>
                                <td className="border border-black p-2">{selectedFarmer.yearPlanted}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Year Replanted:</td>
                                <td className="border border-black p-2">{selectedFarmer.yearReplanted || 'N/A'}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Standing Trees:</td>
                                <td className="border border-black p-2">{selectedFarmer.standingTrees?.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Annual Production:</td>
                                <td className="border border-black p-2">{selectedFarmer.annualProduction} tons</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Productivity:</td>
                                <td className="border border-black p-2">{selectedFarmer.productivity} tons/ha</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Seed Source:</td>
                                <td className="border border-black p-2">{selectedFarmer.seedSource}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Land Type:</td>
                                <td className="border border-black p-2">{selectedFarmer.landType}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Fertilizer Type:</td>
                                <td className="border border-black p-2">{selectedFarmer.fertilizerType}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Sales Partner:</td>
                                <td className="border border-black p-2">{selectedFarmer.salesPartner}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Organization Information Section */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            C. FARMER ORGANIZATION INFORMATION
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Organization Name:</td>
                                <td className="border border-black p-2">{selectedFarmer.organizationName}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">SIMLUHTAN Group Number:</td>
                                <td className="border border-black p-2">{selectedFarmer.groupNumber}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Organization Commodities:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.organizationCommodities}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Organization Address:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.organizationAddress}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Farm Location Section */}
                        <div className="mb-8">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            D. FARM LOCATION (GPS COORDINATES)
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <thead>
                              <tr>
                                <th className="border border-black p-2 font-bold bg-gray-100">Point</th>
                                <th className="border border-black p-2 font-bold bg-gray-100">Longitude</th>
                                <th className="border border-black p-2 font-bold bg-gray-100">Latitude</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedFarmer.coordinates?.map((coord, index) => (
                                <tr key={index}>
                                  <td className="border border-black p-2 font-bold bg-gray-50">Point {index + 1}</td>
                                  <td className="border border-black p-2">{coord.longitude}</td>
                                  <td className="border border-black p-2">{coord.latitude}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Certification Statement */}
                        <div className="mb-8 p-4 border border-black rounded">
                          <h3 className="text-base font-bold mb-3 text-center">CERTIFICATION STATEMENT</h3>
                          <p className="text-justify mb-4">
                            This certificate confirms that the above-mentioned farmer and cultivation plot have been registered 
                            in accordance with Indonesian agricultural regulations and EU Deforestation Regulation (EUDR) requirements. 
                            The cultivation activities are conducted on legally designated agricultural land with proper documentation.
                          </p>
                          <p className="text-justify">
                            This registration is valid for commercial cultivation activities and serves as proof of compliance 
                            with applicable laws and regulations governing sustainable agricultural practices.
                          </p>
                        </div>

                        {/* Signatures */}
                        <div className="grid grid-cols-3 gap-8 text-center">
                          <div>
                            <p className="mb-16">Data Collection Officer</p>
                            <p className="border-t border-black pt-2">
                              <strong>{selectedFarmer.dataCollectionOfficer}</strong>
                            </p>
                          </div>
                          <div>
                            <p className="mb-16">Regional Supervisor</p>
                            <p className="border-t border-black pt-2">
                              <strong>Dr. Siti Rahayu, S.P., M.Si.</strong>
                            </p>
                          </div>
                          <div>
                            <p className="mb-16">Authorized Officer</p>
                            <p className="border-t border-black pt-2">
                              <strong>Ir. Bambang Wijaya, M.P.</strong>
                            </p>
                            <p className="text-xs mt-2">Ministry of Agriculture</p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-gray-600">
                          <p>This certificate is issued in accordance with Government Regulation No. 17/2023</p>
                          <p>Valid until: {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')}</p>
                        </div>
                      </>
                    ) : (
                      // Indonesian Version
                      <>
                        {/* Header */}
                        <div className="text-center mb-8">
                          <h1 className="text-xl font-bold mb-2">REPUBLIK INDONESIA</h1>
                          <h2 className="text-lg font-bold mb-2">KEMENTERIAN PERTANIAN</h2>
                          <h3 className="text-lg font-bold mb-4 underline">SURAT TANDA DAFTAR BUDIDAYA</h3>
                          <h4 className="text-base font-bold">(STDB)</h4>
                          <div className="mt-4 text-sm">
                            <p><strong>Nomor Urut Responden:</strong> {selectedFarmer.respondentSerialNumber}</p>
                            <p><strong>Nama Petugas Pendataan:</strong> {selectedFarmer.dataCollectionOfficer}</p>
                          </div>
                        </div>

                        {/* A. Identitas Pekebun */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            A. IDENTITAS PEKEBUN
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Nama:</td>
                                <td className="border border-black p-2">{selectedFarmer.farmerName}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">No. KTP:</td>
                                <td className="border border-black p-2">{selectedFarmer.nationalId}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Tempat tanggal lahir:</td>
                                <td className="border border-black p-2">{selectedFarmer.birthPlaceDate}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Jenis kelamin:</td>
                                <td className="border border-black p-2">{selectedFarmer.sex === 'Male' ? 'Laki-laki' : 'Perempuan'}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Pendidikan:</td>
                                <td className="border border-black p-2">{selectedFarmer.education}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Provinsi:</td>
                                <td className="border border-black p-2">{selectedFarmer.province}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Kabupaten/Kota:</td>
                                <td className="border border-black p-2">{selectedFarmer.regencyCity}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Kecamatan:</td>
                                <td className="border border-black p-2">{selectedFarmer.district}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Desa/Kelurahan:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.village}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Alamat Pekebun:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.farmerAddress}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* B. Keterangan Kebun */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            B. KETERANGAN KEBUN
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Kebun Ke-:</td>
                                <td className="border border-black p-2">{selectedFarmer.farmPlotNumber}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Status lahan yang diusahakan:</td>
                                <td className="border border-black p-2">{selectedFarmer.landTenure}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Nomor/dokumen lahan yang diusahakan:</td>
                                <td className="border border-black p-2">{selectedFarmer.landDocumentNumber}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Luas lahan berdasarkan Dokumen (m²):</td>
                                <td className="border border-black p-2">{selectedFarmer.landAreaPerDocument?.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Pola tanam:</td>
                                <td className="border border-black p-2">{selectedFarmer.croppingPattern === 'Monoculture' ? 'Monokultur' : 'Polikultur'}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Komoditas Utama:</td>
                                <td className="border border-black p-2">{selectedFarmer.mainCommodity}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Komoditas Lainnya:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.otherCommodities || 'Tidak ada'}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Luas areal tertanam (m²):</td>
                                <td className="border border-black p-2">{selectedFarmer.plantedArea?.toLocaleString()}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Tahun tanam:</td>
                                <td className="border border-black p-2">{selectedFarmer.yearPlanted}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Tahun tanam sebelum peremajaan:</td>
                                <td className="border border-black p-2">{selectedFarmer.yearReplanted || 'Tidak ada'}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Jumlah tegakan pohon:</td>
                                <td className="border border-black p-2">{selectedFarmer.standingTrees?.toLocaleString()}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Produksi per tahun (ton):</td>
                                <td className="border border-black p-2">{selectedFarmer.annualProduction}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Produktivitas (Ton/Ha):</td>
                                <td className="border border-black p-2">{selectedFarmer.productivity}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Asal benih:</td>
                                <td className="border border-black p-2">{
                                  selectedFarmer.seedSource === 'Certified seed' ? 'Benih bersertifikat' :
                                  selectedFarmer.seedSource === 'Non-certified seed' ? 'Benih tidak bersertifikat' :
                                  'Tidak Tahu'
                                }</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Jenis lahan:</td>
                                <td className="border border-black p-2">{selectedFarmer.landType === 'Mineral soil' ? 'Lahan Mineral' : 'Lahan Basa (Pasang Surut, Gambut)'}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Jenis Pupuk:</td>
                                <td className="border border-black p-2">{
                                  selectedFarmer.fertilizerType === 'Organic' ? 'Organik' :
                                  selectedFarmer.fertilizerType === 'Inorganic' ? 'Non Organik' :
                                  'Campuran'
                                }</td>
                                <td className="border border-black p-2 font-bold bg-gray-50">Mitra penjualan:</td>
                                <td className="border border-black p-2">{
                                  selectedFarmer.salesPartner === 'Cooperative' ? 'Koperasi' :
                                  selectedFarmer.salesPartner === 'Processing company' ? 'Perusahaan Pengolahan' :
                                  'Lainnya'
                                }</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* C. Keterangan Kelembagaan Tani */}
                        <div className="mb-6">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            C. KETERANGAN KELEMBAGAAN TANI
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <tbody>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Nama kelembagaan tani:</td>
                                <td className="border border-black p-2">{selectedFarmer.organizationName}</td>
                                <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Nomor kelompok dalam SIMLUHTAN:</td>
                                <td className="border border-black p-2">{selectedFarmer.groupNumber}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Komoditas kelembagaan tani:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.organizationCommodities}</td>
                              </tr>
                              <tr>
                                <td className="border border-black p-2 font-bold bg-gray-50">Alamat kelembagaan tani:</td>
                                <td className="border border-black p-2" colSpan={3}>{selectedFarmer.organizationAddress}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* D. Lokasi Kebun */}
                        <div className="mb-8">
                          <h3 className="text-base font-bold mb-3 border-b border-black pb-1">
                            D. LOKASI KEBUN
                          </h3>
                          <table className="w-full border-collapse border-2 border-black">
                            <thead>
                              <tr>
                                <th className="border border-black p-2 font-bold bg-gray-100">Titik</th>
                                <th className="border border-black p-2 font-bold bg-gray-100">Longitude</th>
                                <th className="border border-black p-2 font-bold bg-gray-100">Latitude</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedFarmer.coordinates?.map((coord, index) => (
                                <tr key={index}>
                                  <td className="border border-black p-2 font-bold bg-gray-50">Titik {index + 1}</td>
                                  <td className="border border-black p-2">{coord.longitude}</td>
                                  <td className="border border-black p-2">{coord.latitude}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Pernyataan Sertifikasi */}
                        <div className="mb-8 p-4 border border-black rounded">
                          <h3 className="text-base font-bold mb-3 text-center">PERNYATAAN SERTIFIKASI</h3>
                          <p className="text-justify mb-4">
                            Sertifikat ini menyatakan bahwa pekebun dan plot budidaya tersebut di atas telah terdaftar
                            sesuai dengan peraturan pertanian Indonesia dan persyaratan Regulasi Anti-Deforestasi Uni Eropa (EUDR).
                            Kegiatan budidaya dilakukan di lahan pertanian yang ditunjuk secara legal dengan dokumentasi yang proper.
                          </p>
                          <p className="text-justify">
                            Pendaftaran ini berlaku untuk kegiatan budidaya komersial dan berfungsi sebagai bukti kepatuhan
                            terhadap hukum dan peraturan yang berlaku dalam praktek pertanian berkelanjutan.
                          </p>
                        </div>

                        {/* Tanda Tangan */}
                        <div className="grid grid-cols-3 gap-8 text-center">
                          <div>
                            <p className="mb-16">Petugas Pendataan</p>
                            <p className="border-t border-black pt-2">
                              <strong>{selectedFarmer.dataCollectionOfficer}</strong>
                            </p>
                          </div>
                          <div>
                            <p className="mb-16">Supervisor Regional</p>
                            <p className="border-t border-black pt-2">
                              <strong>Dr. Siti Rahayu, S.P., M.Si.</strong>
                            </p>
                          </div>
                          <div>
                            <p className="mb-16">Pejabat Berwenang</p>
                            <p className="border-t border-black pt-2">
                              <strong>Ir. Bambang Wijaya, M.P.</strong>
                            </p>
                            <p className="text-xs mt-2">Kementerian Pertanian</p>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-gray-600">
                          <p>Sertifikat ini diterbitkan sesuai dengan Peraturan Pemerintah No. 17/2023</p>
                          <p>Berlaku hingga: {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID')}</p>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" data-testid="button-print-stdb">
                    <Download className="h-4 w-4 mr-2" />
                    {certificateLanguage === 'en' ? 'Print Certificate' : 'Cetak Sertifikat'}
                  </Button>
                  <Button onClick={() => setShowSTDBDialog(false)} data-testid="button-close-dialog">
                    {certificateLanguage === 'en' ? 'Close' : 'Tutup'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Edit Farmer Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Edit className="h-5 w-5 text-blue-600" />
                      Edit Farmer Information - {editingFarmer?.farmerName}
                    </div>
                    <div className="flex items-center gap-2">
                      <AIAssistant 
                        farmerData={editingFarmer} 
                        onApplySuggestion={(field, value) => {
                          console.log('Apply suggestion:', field, value);
                          // TODO: Update farmer data with AI suggestion
                        }}
                      />
                    </div>
                  </DialogTitle>
                </DialogHeader>

                {editingFarmer && (
                  <Tabs defaultValue="identity" className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="identity">A. Farmer Identity</TabsTrigger>
                      <TabsTrigger value="farm">B. Farm Information</TabsTrigger>
                      <TabsTrigger value="organization">C. Organization</TabsTrigger>
                      <TabsTrigger value="location">D. GPS Location</TabsTrigger>
                      <TabsTrigger value="estate">E. Estate Collection</TabsTrigger>
                    </TabsList>

                    {/* A. Farmer Identity Tab */}
                    <TabsContent value="identity" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="respondentSerial">Respondent Serial Number</Label>
                          <Input
                            id="respondentSerial"
                            value={editingFarmer.respondentSerialNumber}
                            placeholder="e.g., RESP-001-2024"
                            data-testid="input-respondent-serial"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dataOfficer">Data Collection Officer</Label>
                          <Input
                            id="dataOfficer"
                            value={editingFarmer.dataCollectionOfficer}
                            placeholder="e.g., Ahmad Susanto"
                            data-testid="input-data-officer"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="farmerName">Farmer Name *</Label>
                          <Input
                            id="farmerName"
                            value={editingFarmer.farmerName}
                            placeholder="Full name of farmer"
                            data-testid="input-farmer-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="nationalId">National ID (KTP) *</Label>
                          <Input
                            id="nationalId"
                            value={editingFarmer.nationalId}
                            placeholder="16-digit KTP number"
                            data-testid="input-national-id"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="birthPlace">Place & Date of Birth</Label>
                          <Input
                            id="birthPlace"
                            value={editingFarmer.birthPlaceDate}
                            placeholder="e.g., Jakarta, 15/08/1980"
                            data-testid="input-birth-place"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="sex">Sex</Label>
                          <Select value={editingFarmer.sex}>
                            <SelectTrigger data-testid="select-sex">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="education">Education Level</Label>
                          <Select value={editingFarmer.education}>
                            <SelectTrigger data-testid="select-education">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="None">None</SelectItem>
                              <SelectItem value="Primary school (SD)">Primary school (SD)</SelectItem>
                              <SelectItem value="Junior secondary (SMP)">Junior secondary (SMP)</SelectItem>
                              <SelectItem value="Senior secondary (SMA)">Senior secondary (SMA)</SelectItem>
                              <SelectItem value="Diploma/Associate degree">Diploma/Associate degree</SelectItem>
                              <SelectItem value="Bachelor (D4/S1)">Bachelor (D4/S1)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="province">Province *</Label>
                          <Input
                            id="province"
                            value={editingFarmer.province}
                            placeholder="e.g., West Java"
                            data-testid="input-province"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="regencyCity">Regency/City</Label>
                          <Input
                            id="regencyCity"
                            value={editingFarmer.regencyCity}
                            placeholder="e.g., Bogor"
                            data-testid="input-regency"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="district">District</Label>
                          <Input
                            id="district"
                            value={editingFarmer.district}
                            placeholder="e.g., Ciawi"
                            data-testid="input-district"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="village">Village</Label>
                          <Input
                            id="village"
                            value={editingFarmer.village}
                            placeholder="e.g., Bendungan"
                            data-testid="input-village"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="address">Complete Address</Label>
                          <Textarea
                            id="address"
                            value={editingFarmer.farmerAddress}
                            placeholder="Complete residential address"
                            rows={3}
                            data-testid="textarea-address"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* B. Farm Information Tab */}
                    <TabsContent value="farm" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="farmPlot">Farm/Plot Number</Label>
                          <Input
                            id="farmPlot"
                            value={editingFarmer.farmPlotNumber}
                            placeholder="e.g., PLOT-001"
                            data-testid="input-farm-plot"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="landTenure">Land Tenure *</Label>
                          <Select value={editingFarmer.landTenure}>
                            <SelectTrigger data-testid="select-land-tenure">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SHM (freehold title)">SHM (freehold title)</SelectItem>
                              <SelectItem value="Girik/SKT/SKGR/Management Right">Girik/SKT/SKGR/Management Right</SelectItem>
                              <SelectItem value="Communal/customary land">Communal/customary land</SelectItem>
                              <SelectItem value="Other legal arrangement">Other legal arrangement</SelectItem>
                              <SelectItem value="Forest Production/Social Use Area">Forest Production/Social Use Area</SelectItem>
                              <SelectItem value="Protected/Conservation Forest Area">Protected/Conservation Forest Area</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="landDocument">Land Document Number</Label>
                          <Input
                            id="landDocument"
                            value={editingFarmer.landDocumentNumber}
                            placeholder="Document reference number"
                            data-testid="input-land-document"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="landArea">Land Area per Document (m²)</Label>
                          <Input
                            id="landArea"
                            type="number"
                            value={editingFarmer.landAreaPerDocument}
                            placeholder="Area in square meters"
                            data-testid="input-land-area"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="croppingPattern">Cropping Pattern</Label>
                          <Select value={editingFarmer.croppingPattern}>
                            <SelectTrigger data-testid="select-cropping-pattern">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Monoculture">Monoculture</SelectItem>
                              <SelectItem value="Polyculture">Polyculture</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="mainCommodity">Main Commodity *</Label>
                          <Input
                            id="mainCommodity"
                            value={editingFarmer.mainCommodity}
                            placeholder="e.g., Oil Palm"
                            data-testid="input-main-commodity"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="otherCommodities">Other Commodities</Label>
                          <Input
                            id="otherCommodities"
                            value={editingFarmer.otherCommodities || ''}
                            placeholder="Additional crops (if any)"
                            data-testid="input-other-commodities"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plantedArea">Planted Area (m²)</Label>
                          <Input
                            id="plantedArea"
                            type="number"
                            value={editingFarmer.plantedArea}
                            placeholder="Cultivation area"
                            data-testid="input-planted-area"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearPlanted">Year Planted</Label>
                          <Input
                            id="yearPlanted"
                            value={editingFarmer.yearPlanted}
                            placeholder="e.g., 2015"
                            data-testid="input-year-planted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="yearReplanted">Year Replanted (if applicable)</Label>
                          <Input
                            id="yearReplanted"
                            value={editingFarmer.yearReplanted || ''}
                            placeholder="Year of replanting"
                            data-testid="input-year-replanted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="standingTrees">Number of Standing Trees</Label>
                          <Input
                            id="standingTrees"
                            type="number"
                            value={editingFarmer.standingTrees}
                            placeholder="Total tree count"
                            data-testid="input-standing-trees"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="annualProduction">Annual Production (tons)</Label>
                          <Input
                            id="annualProduction"
                            type="number"
                            step="0.01"
                            value={editingFarmer.annualProduction}
                            placeholder="Yearly output"
                            data-testid="input-annual-production"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="productivity">Productivity (tons/ha)</Label>
                          <Input
                            id="productivity"
                            type="number"
                            step="0.01"
                            value={editingFarmer.productivity}
                            placeholder="Output per hectare"
                            data-testid="input-productivity"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="seedSource">Seed Source</Label>
                          <Select value={editingFarmer.seedSource}>
                            <SelectTrigger data-testid="select-seed-source">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Certified seed">Certified seed</SelectItem>
                              <SelectItem value="Non-certified seed">Non-certified seed</SelectItem>
                              <SelectItem value="Don't know">Don't know</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="landType">Land Type</Label>
                          <Select value={editingFarmer.landType}>
                            <SelectTrigger data-testid="select-land-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mineral soil">Mineral soil</SelectItem>
                              <SelectItem value="Wetland (tidal/peat)">Wetland (tidal/peat)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="fertilizerType">Fertilizer Type</Label>
                          <Select value={editingFarmer.fertilizerType}>
                            <SelectTrigger data-testid="select-fertilizer">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Organic">Organic</SelectItem>
                              <SelectItem value="Inorganic">Inorganic</SelectItem>
                              <SelectItem value="Mixed">Mixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="salesPartner">Sales Partner</Label>
                          <Select value={editingFarmer.salesPartner}>
                            <SelectTrigger data-testid="select-sales-partner">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Cooperative">Cooperative</SelectItem>
                              <SelectItem value="Processing company">Processing company</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* C. Organization Information Tab */}
                    <TabsContent value="organization" className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="organizationName">Organization Name</Label>
                          <Input
                            id="organizationName"
                            value={editingFarmer.organizationName}
                            placeholder="Farmer group or cooperative name"
                            data-testid="input-organization-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="groupNumber">SIMLUHTAN Group Number</Label>
                          <Input
                            id="groupNumber"
                            value={editingFarmer.groupNumber}
                            placeholder="e.g., GRP-001-2024"
                            data-testid="input-group-number"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="orgCommodities">Organization Commodities</Label>
                          <Input
                            id="orgCommodities"
                            value={editingFarmer.organizationCommodities}
                            placeholder="Commodities handled by organization"
                            data-testid="input-org-commodities"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label htmlFor="orgAddress">Organization Address</Label>
                          <Textarea
                            id="orgAddress"
                            value={editingFarmer.organizationAddress}
                            placeholder="Complete organization address"
                            rows={3}
                            data-testid="textarea-org-address"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* D. GPS Location Tab */}
                    <TabsContent value="location" className="space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">GPS Coordinates (Polygon Points)</h3>
                          <Badge variant="outline">Minimum 4 points required</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          Enter at least 4 GPS coordinate points to form a polygon representing the plot boundaries.
                        </p>
                        
                        <div className="grid gap-4">
                          {editingFarmer.coordinates?.map((coord, index) => (
                            <div key={index} className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                              <div className="flex items-center">
                                <Label className="font-medium">Point {index + 1}</Label>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`longitude-${index}`}>Longitude</Label>
                                <Input
                                  id={`longitude-${index}`}
                                  value={coord.longitude}
                                  placeholder="e.g., 106.8456"
                                  data-testid={`input-longitude-${index}`}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`latitude-${index}`}>Latitude</Label>
                                <Input
                                  id={`latitude-${index}`}
                                  value={coord.latitude}
                                  placeholder="e.g., -6.4823"
                                  data-testid={`input-latitude-${index}`}
                                />
                              </div>
                            </div>
                          ))}
                          
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-add-coordinate"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Coordinate Point
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              data-testid="button-validate-polygon"
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Validate Polygon
                            </Button>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* E. Estate Data Collection Tab */}
                    <TabsContent value="estate" className="space-y-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">Estate Data Collection Form</h3>
                          <Badge variant="outline">Based on EUDR Requirements</Badge>
                        </div>
                        
                        {/* Section 1: General Information */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Section 1 - General Information</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="supplier-name">Supplier Name *</Label>
                                <Input id="supplier-name" placeholder="Enter supplier name" data-testid="input-supplier-name" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="group-parent-company">Group/Parent Company Name</Label>
                                <Input id="group-parent-company" placeholder="Enter group/parent company" data-testid="input-group-parent-company" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="establishment-act">Company Establishment Act</Label>
                                <Input id="establishment-act" placeholder="Act number" data-testid="input-establishment-act" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="amendment-act">Amendment Act (if any)</Label>
                                <Input id="amendment-act" placeholder="Amendment act number" data-testid="input-amendment-act" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="business-license">Business License (NIB)</Label>
                                <Input id="business-license" placeholder="Business identification number" data-testid="input-business-license" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="certification-type">Certification Type</Label>
                                <Select>
                                  <SelectTrigger data-testid="select-certification-type">
                                    <SelectValue placeholder="Select certification" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="ISPO">ISPO</SelectItem>
                                    <SelectItem value="RSPO">RSPO</SelectItem>
                                    <SelectItem value="ISCC">ISCC</SelectItem>
                                    <SelectItem value="PROPER">PROPER Environment</SelectItem>
                                    <SelectItem value="SMK3">SMK3</SelectItem>
                                    <SelectItem value="multiple">Multiple Certifications</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="certificate-number">Certificate Number</Label>
                                <Input id="certificate-number" placeholder="Certificate number" data-testid="input-certificate-number" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="certification-body">Certification Body</Label>
                                <Input id="certification-body" placeholder="Certifying organization" data-testid="input-certification-body" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="certificate-validity">Certificate Validity</Label>
                                <Input id="certificate-validity" type="date" data-testid="input-certificate-validity" />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="certification-scope">Certification Scope</Label>
                              <Textarea id="certification-scope" placeholder="Describe certification scope" data-testid="textarea-certification-scope" />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="document-link">Document Link</Label>
                              <Input id="document-link" placeholder="Google Drive or website link" data-testid="input-document-link" />
                            </div>
                          </CardContent>
                        </Card>

                        {/* Addresses and Coordinates */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Addresses & Coordinates</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="office-address">Office Address</Label>
                                <Textarea id="office-address" placeholder="Head office address" data-testid="textarea-office-address" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="estate-address">Estate Address</Label>
                                <Textarea id="estate-address" placeholder="Estate/plantation address" data-testid="textarea-estate-address" />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="office-coordinates">Office Coordinates</Label>
                                <Input id="office-coordinates" placeholder="Lat, Long (e.g., 3.1390, 101.6869)" data-testid="input-office-coordinates" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="estate-coordinates">Estate Coordinates</Label>
                                <Input id="estate-coordinates" placeholder="Lat, Long (e.g., 3.1390, 101.6869)" data-testid="input-estate-coordinates" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Section 2: FFB Sources */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Section 2 - FFB Sources</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-600">Add plantation details for FFB sources</p>
                                <Button variant="outline" size="sm" data-testid="button-add-ffb-source">
                                  <Plus className="h-4 w-4 mr-2" />
                                  Add Estate
                                </Button>
                              </div>
                              
                              <div className="overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>No.</TableHead>
                                      <TableHead>Estate Name</TableHead>
                                      <TableHead>Address</TableHead>
                                      <TableHead>Land Area (Ha)</TableHead>
                                      <TableHead>Longitude</TableHead>
                                      <TableHead>Latitude</TableHead>
                                      <TableHead>Planting Year</TableHead>
                                      <TableHead>Seed Type</TableHead>
                                      <TableHead>Annual Production (tons)</TableHead>
                                      <TableHead>Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell>1</TableCell>
                                      <TableCell>
                                        <Input placeholder="Estate name" className="min-w-32" data-testid="input-estate-name-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input placeholder="Address" className="min-w-40" data-testid="input-estate-address-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" placeholder="0" className="min-w-20" data-testid="input-estate-area-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input placeholder="101.6869" className="min-w-24" data-testid="input-estate-longitude-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input placeholder="3.1390" className="min-w-24" data-testid="input-estate-latitude-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" placeholder="2010" className="min-w-20" data-testid="input-estate-planting-year-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input placeholder="Certified seed" className="min-w-32" data-testid="input-estate-seed-type-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Input type="number" placeholder="0" className="min-w-24" data-testid="input-estate-production-1" />
                                      </TableCell>
                                      <TableCell>
                                        <Button variant="ghost" size="sm" data-testid="button-remove-estate-1">
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                              
                              <p className="text-xs text-gray-500">
                                * For areas &gt; 4Ha, polygon data (SHP/GeoJSON) is required
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Section 3: Forest and Peat Protection */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Section 3 - Forest and Peat Protection</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            {/* 2.1 Policy */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.1 Forest and Peat Protection Policy</h4>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Do you have a policy covering forest and peat protection?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="policy-yes" name="forestPeatPolicy" value="yes" data-testid="radio-policy-yes" />
                                      <Label htmlFor="policy-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="policy-no" name="forestPeatPolicy" value="no" data-testid="radio-policy-no" />
                                      <Label htmlFor="policy-no">No</Label>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="policy-notes">Notes</Label>
                                  <Textarea id="policy-notes" placeholder="Additional information" data-testid="textarea-policy-notes" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="policy-document">Document Link</Label>
                                  <Input id="policy-document" placeholder="Google Drive link if not published on website" data-testid="input-policy-document" />
                                </div>
                              </div>
                            </div>

                            {/* 2.2 NDPE Workshop */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.2 NDPE Workshop Participation</h4>
                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label>Have you attended NDPE policy commitment workshops?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="ndpe-yes" name="ndpeWorkshop" value="yes" data-testid="radio-ndpe-yes" />
                                      <Label htmlFor="ndpe-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="ndpe-no" name="ndpeWorkshop" value="no" data-testid="radio-ndpe-no" />
                                      <Label htmlFor="ndpe-no">No</Label>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="ndpe-notes">Notes</Label>
                                  <Textarea id="ndpe-notes" placeholder="Workshop details" data-testid="textarea-ndpe-notes" />
                                </div>
                              </div>
                            </div>

                            {/* 2.3 Conservation Procedures */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.3 Conservation Area Management</h4>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Do you have SOP for Conservation Area Management (HCV & HCS)?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="conservation-sop-yes" name="conservationSop" value="yes" data-testid="radio-conservation-sop-yes" />
                                      <Label htmlFor="conservation-sop-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="conservation-sop-no" name="conservationSop" value="no" data-testid="radio-conservation-sop-no" />
                                      <Label htmlFor="conservation-sop-no">No</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Do you have SOP for Land Opening and Soil/Water Conservation?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="land-opening-sop-yes" name="landOpeningSop" value="yes" data-testid="radio-land-opening-sop-yes" />
                                      <Label htmlFor="land-opening-sop-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="land-opening-sop-no" name="landOpeningSop" value="no" data-testid="radio-land-opening-sop-no" />
                                      <Label htmlFor="land-opening-sop-no">No</Label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2.4 Implementation Evidence */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.4 Implementation Evidence</h4>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Do you conduct High Conservation Value (HCV) assessments?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcv-yes" name="hcvAssessment" value="yes" data-testid="radio-hcv-yes" />
                                      <Label htmlFor="hcv-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcv-no" name="hcvAssessment" value="no" data-testid="radio-hcv-no" />
                                      <Label htmlFor="hcv-no">No</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Do you submit HCV management reports to relevant authorities?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcv-report-yes" name="hcvReport" value="yes" data-testid="radio-hcv-report-yes" />
                                      <Label htmlFor="hcv-report-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcv-report-no" name="hcvReport" value="no" data-testid="radio-hcv-report-no" />
                                      <Label htmlFor="hcv-report-no">No</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label>Do you conduct High Carbon Stock (HCS) assessments?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcs-yes" name="hcsAssessment" value="yes" data-testid="radio-hcs-yes" />
                                      <Label htmlFor="hcs-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hcs-no" name="hcsAssessment" value="no" data-testid="radio-hcs-no" />
                                      <Label htmlFor="hcs-no">No</Label>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2.5 Peatland */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.5 Peatland Management</h4>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Do you have plantings on peatland?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="peatland-yes" name="peatlandPlanting" value="yes" data-testid="radio-peatland-yes" />
                                      <Label htmlFor="peatland-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="peatland-no" name="peatlandPlanting" value="no" data-testid="radio-peatland-no" />
                                      <Label htmlFor="peatland-no">No</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="peatland-area">If yes, specify area (Ha)</Label>
                                    <Input id="peatland-area" type="number" placeholder="Area in hectares" data-testid="input-peatland-area" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="peatland-opening-year">Year of opening</Label>
                                    <Input id="peatland-opening-year" type="number" placeholder="Year" data-testid="input-peatland-opening-year" />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2.6 Hydrological Restoration */}
                            <div className="space-y-4">
                              <h4 className="font-medium">2.6 Hydrological Restoration Permit</h4>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Do you have KLHK permit for peat hydrological restoration?</Label>
                                  <div className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hydro-permit-yes" name="hydroPermit" value="yes" data-testid="radio-hydro-permit-yes" />
                                      <Label htmlFor="hydro-permit-yes">Yes</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <input type="radio" id="hydro-permit-no" name="hydroPermit" value="no" data-testid="radio-hydro-permit-no" />
                                      <Label htmlFor="hydro-permit-no">No</Label>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="hydro-permit-notes">Notes (Fill if you have peatland plantings)</Label>
                                  <Textarea id="hydro-permit-notes" placeholder="Additional information" data-testid="textarea-hydro-permit-notes" />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="hydro-permit-document">Permit Document Link</Label>
                                  <Input id="hydro-permit-document" placeholder="Document link" data-testid="input-hydro-permit-document" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex justify-end gap-3">
                          <Button variant="outline" data-testid="button-save-draft">
                            Save as Draft
                          </Button>
                          <Button data-testid="button-submit-estate-form">
                            Submit Form
                          </Button>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                <DialogFooter className="gap-2 border-t pt-4 mt-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label>Data Status:</Label>
                      <Select value={editingFarmer?.dataStatus}>
                        <SelectTrigger className="w-40" data-testid="select-data-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="not-completed">Not Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-500 border-l pl-4">
                      Use AI assistance to auto-complete missing information and validate EUDR compliance
                    </div>
                  </div>
                  <div className="flex-1" />
                  <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
                    Cancel
                  </Button>
                  <Button data-testid="button-save-farmer">
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
    </>
  );
}
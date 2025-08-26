import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download,
  Filter,
  FileText,
  MapPin,
  Building,
  Leaf
} from "lucide-react";

interface EstateDataCollection {
  id: string;
  supplierName: string;
  groupParentCompanyName?: string;
  establishmentAct?: string;
  businessLicense?: string;
  certificationType?: string;
  certificateNumber?: string;
  certificationBody?: string;
  certificateValidity?: string;
  officeAddress?: string;
  estateAddress?: string;
  estateCoordinates?: string;
  officeCoordinates?: string;
  supplierType?: string;
  totalAnnualProduction?: number;
  formFillingDate?: string;
  responsiblePersonName?: string;
  responsiblePersonPosition?: string;
  responsiblePersonEmail?: string;
  responsiblePersonPhone?: string;
  ffbSources?: Array<{
    no: number;
    estateName: string;
    address: string;
    landArea: number;
    longitude: string;
    latitude: string;
    plantingYear: string;
    seedType: string;
    annualProduction: number;
  }>;
  hasForestPeatPolicy?: boolean;
  attendedNdpeWorkshop?: boolean;
  hasConservationAreaSop?: boolean;
  hasLandOpeningSop?: boolean;
  conductedHcvAssessment?: boolean;
  submittedHcvReport?: boolean;
  conductedHcsAssessment?: boolean;
  plantingOnPeatland?: boolean;
  peatlandArea?: number;
  peatlandOpeningYear?: number;
  hasHydrologicalRestorationPermit?: boolean;
  status: string;
  completionPercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export default function EstateDataTablePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCertification, setSelectedCertification] = useState<string>('all');

  // Fetch estate data collection
  const { data: estateData, isLoading, refetch } = useQuery<EstateDataCollection[]>({
    queryKey: ['/api/estate-data-collection'],
    queryFn: async () => {
      const response = await fetch('/api/estate-data-collection');
      if (!response.ok) throw new Error('Failed to fetch estate data collection');
      return response.json();
    }
  });

  // Filter estate data based on search and filters
  const filteredData = useMemo(() => {
    if (!estateData) return [];
    
    return estateData.filter(estate => {
      const matchesSearch = searchQuery === '' || 
        estate.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (estate.groupParentCompanyName && estate.groupParentCompanyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (estate.certificationType && estate.certificationType.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = selectedStatus === 'all' || estate.status === selectedStatus;
      const matchesCertification = selectedCertification === 'all' || estate.certificationType === selectedCertification;
      
      return matchesSearch && matchesStatus && matchesCertification;
    });
  }, [estateData, searchQuery, selectedStatus, selectedCertification]);

  const statuses = Array.from(new Set(estateData?.map(e => e.status) || []));
  const certifications = Array.from(new Set(estateData?.map(e => e.certificationType).filter(Boolean) || []));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading estate data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-green-600" />
            Estate Data Collection
          </h1>
          <p className="text-gray-600 mt-1">EUDR compliance data collection for palm oil estates</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Estates</p>
                <p className="text-2xl font-bold text-blue-600">{estateData?.length || 0}</p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Submitted Forms</p>
                <p className="text-2xl font-bold text-green-600">
                  {estateData?.filter(e => e.status === 'submitted').length || 0}
                </p>
              </div>
              <FileText className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Production</p>
                <p className="text-2xl font-bold text-orange-600">
                  {Math.round((estateData?.reduce((acc, e) => acc + (e.totalAnnualProduction || 0), 0) || 0))} tons
                </p>
              </div>
              <Leaf className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">FFB Sources</p>
                <p className="text-2xl font-bold text-purple-600">
                  {estateData?.reduce((acc, e) => acc + (e.ffbSources?.length || 0), 0) || 0}
                </p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
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
                  placeholder="Search by supplier name, group, or certification..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48" data-testid="select-status">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCertification} onValueChange={setSelectedCertification}>
              <SelectTrigger className="w-48" data-testid="select-certification">
                <SelectValue placeholder="All Certifications" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Certifications</SelectItem>
                {certifications.map(cert => (
                  <SelectItem key={cert} value={cert}>{cert}</SelectItem>
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
            Estate Data Collection ({filteredData.length} records)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier Name</TableHead>
                  <TableHead>Group/Parent Company</TableHead>
                  <TableHead>Business License</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Certificate Number</TableHead>
                  <TableHead>Certificate Validity</TableHead>
                  <TableHead>Office Address</TableHead>
                  <TableHead>Estate Address</TableHead>
                  <TableHead>Estate Coordinates</TableHead>
                  <TableHead>Supplier Type</TableHead>
                  <TableHead>Annual Production (tons)</TableHead>
                  <TableHead>FFB Sources</TableHead>
                  <TableHead>Forest/Peat Policy</TableHead>
                  <TableHead>NDPE Workshop</TableHead>
                  <TableHead>HCV Assessment</TableHead>
                  <TableHead>HCS Assessment</TableHead>
                  <TableHead>Peatland Planting</TableHead>
                  <TableHead>Peatland Area (Ha)</TableHead>
                  <TableHead>Responsible Person</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completion %</TableHead>
                  <TableHead>Form Date</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((estate) => (
                    <TableRow key={estate.id}>
                      <TableCell className="font-medium">{estate.supplierName}</TableCell>
                      <TableCell>{estate.groupParentCompanyName || '-'}</TableCell>
                      <TableCell>{estate.businessLicense || '-'}</TableCell>
                      <TableCell>
                        {estate.certificationType ? (
                          <Badge variant="outline">{estate.certificationType}</Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>{estate.certificateNumber || '-'}</TableCell>
                      <TableCell>{estate.certificateValidity || '-'}</TableCell>
                      <TableCell className="max-w-48 truncate" title={estate.officeAddress}>
                        {estate.officeAddress || '-'}
                      </TableCell>
                      <TableCell className="max-w-48 truncate" title={estate.estateAddress}>
                        {estate.estateAddress || '-'}
                      </TableCell>
                      <TableCell>{estate.estateCoordinates || '-'}</TableCell>
                      <TableCell>{estate.supplierType || '-'}</TableCell>
                      <TableCell className="text-right">
                        {estate.totalAnnualProduction?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.ffbSources?.length || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.hasForestPeatPolicy ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.attendedNdpeWorkshop ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.conductedHcvAssessment ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.conductedHcsAssessment ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.plantingOnPeatland ? (
                          <Badge variant="destructive">Yes</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {estate.peatlandArea?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>{estate.responsiblePersonName || '-'}</TableCell>
                      <TableCell>{estate.responsiblePersonPosition || '-'}</TableCell>
                      <TableCell>{estate.responsiblePersonEmail || '-'}</TableCell>
                      <TableCell>{estate.responsiblePersonPhone || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={estate.status === 'submitted' ? 'default' : 'outline'}
                          className={
                            estate.status === 'submitted' ? 'bg-green-100 text-green-800' :
                            estate.status === 'reviewed' ? 'bg-blue-100 text-blue-800' :
                            estate.status === 'approved' ? 'bg-purple-100 text-purple-800' :
                            'text-gray-600'
                          }
                        >
                          {estate.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {estate.completionPercentage || 0}%
                      </TableCell>
                      <TableCell>{estate.formFillingDate || '-'}</TableCell>
                      <TableCell>
                        {new Date(estate.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={26} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No estate data collection records found</p>
                        <p className="text-sm text-gray-400">Start by filling out the Estate Collection form in the Legality Assessment module</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
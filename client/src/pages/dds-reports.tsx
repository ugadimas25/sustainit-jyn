import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Upload, Download, Eye, Edit, FileText, Code, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DDSReports() {
  const [selectedBatch, setSelectedBatch] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [reportTemplate, setReportTemplate] = useState("eudr_annex_ii");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: reports, isLoading } = useQuery({
    queryKey: ["/api/dds-reports"],
  });

  const { data: shipments } = useQuery({
    queryKey: ["/api/shipments"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: { 
      shipmentId: string; 
      destinationCountry: string; 
      template: string; 
      format: string;
    }) => {
      const response = await apiRequest("POST", "/api/dds-reports", {
        shipmentId: data.shipmentId,
        reportId: `DDS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        operatorInfo: {
          name: "KPN Plantations Berhad",
          address: "Indonesia",
          eoriNumber: "ID123456789"
        },
        productInfo: {
          name: "Crude Palm Oil",
          hsCode: "1511.10",
          quantity: "752.3 tonnes"
        },
        geolocations: [],
        riskAssessment: {
          level: "low",
          mitigation: "All source plots verified compliant"
        },
        status: "draft"
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dds-reports"] });
      toast({
        title: "Report generated",
        description: `DDS report ${data.reportId} has been created`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const response = await apiRequest("GET", `/api/dds-reports/${reportId}/download`);
      return response.blob();
    },
    onSuccess: (blob, reportId) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DDS-Report-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download complete",
        description: "DDS report has been downloaded",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedShipment = Array.isArray(shipments) ? shipments.find((s: any) => s.shipmentId === selectedBatch) : null;

  const filteredReports = Array.isArray(reports) ? reports.filter((report: any) => {
    const matchesSearch = searchQuery === "" || 
      report.reportId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.shipmentId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="flex h-screen bg-neutral-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Due Diligence Statements</h1>
              <p className="text-gray-600 mt-1">Generate and manage EUDR compliance reports</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                className="bg-forest text-white hover:bg-forest-dark"
                onClick={() => {
                  if (selectedBatch && destinationCountry) {
                    generateReportMutation.mutate({
                      shipmentId: selectedBatch,
                      destinationCountry,
                      template: reportTemplate,
                      format: "pdf"
                    });
                  } else {
                    toast({
                      title: "Missing information",
                      description: "Please select a batch and destination country",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={generateReportMutation.isPending}
                data-testid="button-generate-dds"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate DDS
              </Button>
              <Button className="bg-professional text-white hover:bg-blue-700" data-testid="button-submit-traces">
                <Upload className="w-4 h-4 mr-2" />
                Submit to TRACES
              </Button>
            </div>
          </div>

          {/* DDS Generator */}
          <Card className="border-neutral-border mb-6">
            <CardHeader>
              <CardTitle>Generate New DDS Report</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Create Due Diligence Statement for export batch</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Export Batch</Label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger data-testid="select-batch">
                      <SelectValue placeholder="Select batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shipments?.map((shipment: any) => (
                        <SelectItem key={shipment.id} value={shipment.shipmentId}>
                          {shipment.shipmentId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Destination Country</Label>
                  <Select value={destinationCountry} onValueChange={setDestinationCountry}>
                    <SelectTrigger data-testid="select-destination">
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="netherlands">Netherlands</SelectItem>
                      <SelectItem value="germany">Germany</SelectItem>
                      <SelectItem value="france">France</SelectItem>
                      <SelectItem value="spain">Spain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Report Template</Label>
                  <Select value={reportTemplate} onValueChange={setReportTemplate}>
                    <SelectTrigger data-testid="select-template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eudr_annex_ii">EUDR Annex II Standard</SelectItem>
                      <SelectItem value="eudr_rspo">EUDR + RSPO Combined</SelectItem>
                      <SelectItem value="custom">Custom Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Report Preview */}
              {selectedShipment && (
                <div className="mt-6 border border-neutral-border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-800 mb-3">Report Preview: {selectedBatch}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Operator:</span>
                      <span className="font-medium ml-1">KPN Plantations Berhad</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Product:</span>
                      <span className="font-medium ml-1">Crude Palm Oil (HS: 1511.10)</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium ml-1">{selectedShipment.totalWeight} tonnes</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Destination:</span>
                      <span className="font-medium ml-1 capitalize">{destinationCountry || 'Not selected'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ship Date:</span>
                      <span className="font-medium ml-1">
                        {new Date(selectedShipment.shipmentDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Compliance Status:</span>
                      <span className="font-medium ml-1 text-forest-light">Deforestation-Free</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                <Button 
                  className="bg-forest text-white hover:bg-forest-dark"
                  disabled={!selectedBatch || !destinationCountry || generateReportMutation.isPending}
                  onClick={() => generateReportMutation.mutate({
                    shipmentId: selectedBatch,
                    destinationCountry,
                    template: reportTemplate,
                    format: "pdf"
                  })}
                  data-testid="button-generate-pdf"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Generate PDF
                </Button>
                <Button 
                  className="bg-professional text-white hover:bg-blue-700"
                  disabled={!selectedBatch || !destinationCountry}
                  data-testid="button-generate-xml"
                >
                  <Code className="w-4 h-4 mr-2" />
                  Generate XML
                </Button>
                <Button variant="outline" data-testid="button-preview">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Reports History */}
          <Card className="border-neutral-border">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Reports History</CardTitle>
                <div className="flex items-center space-x-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="generated">Generated</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input 
                    placeholder="Search reports..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-48"
                    data-testid="input-search-reports"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report ID</TableHead>
                      <TableHead>Shipment</TableHead>
                      <TableHead>Destination</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports && filteredReports.length > 0 ? (
                      filteredReports.map((report: any) => (
                        <TableRow key={report.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium" data-testid={`text-report-id-${report.id}`}>
                            {report.reportId}
                          </TableCell>
                          <TableCell>{report.shipmentId || 'N/A'}</TableCell>
                          <TableCell className="capitalize">
                            {report.productInfo?.destination || 'Unknown'}
                          </TableCell>
                          <TableCell>{report.productInfo?.quantity || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                report.status === 'submitted' ? 'default' :
                                report.status === 'generated' ? 'secondary' :
                                'outline'
                              }
                              data-testid={`badge-status-${report.id}`}
                            >
                              {report.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(report.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => downloadReportMutation.mutate(report.reportId)}
                                disabled={downloadReportMutation.isPending}
                                data-testid={`button-download-${report.id}`}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-view-${report.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" data-testid={`button-edit-${report.id}`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No reports found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {Array.isArray(filteredReports) && filteredReports.length > 0 && (
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Showing {filteredReports.length} of {Array.isArray(reports) ? reports.length : 0} reports
                  </span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" className="bg-forest text-white">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">Next</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

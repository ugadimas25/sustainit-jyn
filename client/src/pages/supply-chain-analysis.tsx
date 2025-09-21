import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, FileText, AlertTriangle, CheckCircle, XCircle, Clock, Shield, MapPin } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

// Dummy data for supplier analysis results
const supplierAssessments = [
  {
    id: 1,
    supplierName: "PT Permata Hijau Estate",
    supplierType: "Estate",
    dataCollectionStatus: "completed",
    dataCollectionScore: 95,
    dataCollectionDate: "2024-12-10",
    legalityStatus: "completed",
    legalityScore: 88,
    legalityDate: "2024-12-12",
    riskAssessmentStatus: "completed",
    riskAssessmentScore: 92,
    riskAssessmentDate: "2024-12-15",
    overallStatus: "compliant",
    overallScore: 92,
    lastUpdated: "2024-12-15"
  },
  {
    id: 2,
    supplierName: "Sumber Makmur Mill",
    supplierType: "Mill",
    dataCollectionStatus: "completed",
    dataCollectionScore: 87,
    dataCollectionDate: "2024-12-08",
    legalityStatus: "completed",
    legalityScore: 90,
    legalityDate: "2024-12-11",
    riskAssessmentStatus: "in_progress",
    riskAssessmentScore: null,
    riskAssessmentDate: null,
    overallStatus: "in_progress",
    overallScore: 89,
    lastUpdated: "2024-12-11"
  },
  {
    id: 3,
    supplierName: "Riau Smallholder Cooperative",
    supplierType: "Smallholder",
    dataCollectionStatus: "completed",
    dataCollectionScore: 78,
    dataCollectionDate: "2024-12-05",
    legalityStatus: "pending",
    legalityScore: null,
    legalityDate: null,
    riskAssessmentStatus: "pending",
    riskAssessmentScore: null,
    riskAssessmentDate: null,
    overallStatus: "pending",
    overallScore: 78,
    lastUpdated: "2024-12-05"
  },
  {
    id: 4,
    supplierName: "Borneo KCP Station",
    supplierType: "KCP",
    dataCollectionStatus: "completed",
    dataCollectionScore: 82,
    dataCollectionDate: "2024-12-07",
    legalityStatus: "completed",
    legalityScore: 85,
    legalityDate: "2024-12-10",
    riskAssessmentStatus: "completed",
    riskAssessmentScore: 88,
    riskAssessmentDate: "2024-12-13",
    overallStatus: "compliant",
    overallScore: 85,
    lastUpdated: "2024-12-13"
  },
  {
    id: 5,
    supplierName: "Central Bulking Facility",
    supplierType: "Bulking",
    dataCollectionStatus: "completed",
    dataCollectionScore: 91,
    dataCollectionDate: "2024-12-09",
    legalityStatus: "completed",
    legalityScore: 94,
    legalityDate: "2024-12-12",
    riskAssessmentStatus: "in_progress",
    riskAssessmentScore: null,
    riskAssessmentDate: null,
    overallStatus: "in_progress",
    overallScore: 93,
    lastUpdated: "2024-12-12"
  }
];

// Status badge component
const StatusBadge = ({ status, score }: { status: string; score?: number | null }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'compliant':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'compliant':
        return <CheckCircle className="w-3 h-3 mr-1" />;
      case 'in_progress':
        return <Clock className="w-3 h-3 mr-1" />;
      case 'pending':
        return <XCircle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'compliant':
        return 'Compliant';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col space-y-1">
      <Badge className={`${getStatusColor(status)} flex items-center text-xs`}>
        {getStatusIcon(status)}
        {getStatusText(status)}
      </Badge>
      {score && (
        <span className="text-xs text-gray-600 font-medium">{score}%</span>
      )}
    </div>
  );
};

export default function SupplyChainAnalysis() {
  const [, setLocation] = useLocation();

  const getOverallProgress = () => {
    const totalSuppliers = supplierAssessments.length;
    const completedSuppliers = supplierAssessments.filter(s => s.overallStatus === 'compliant').length;
    return Math.round((completedSuppliers / totalSuppliers) * 100);
  };

  const getAverageScore = () => {
    const scores = supplierAssessments.map(s => s.overallScore);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(average);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supply Chain Analysis</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of supplier compliance status across all assessment stages</p>
        </div>
      </div>

      {/* Consolidated Results Hub - Four Module Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" data-testid="consolidated-results-hub">
        <Card data-testid="card-data-collection-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="title-data-collection-results">
              <FileText className="w-5 h-5" />
              Hasil Koleksi Data
            </CardTitle>
            <CardDescription>Summary of data collection completeness and AI scoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">85%</div>
              <div className="text-sm text-gray-600">Avg completeness</div>
              <Progress value={85} className="mt-2" />
              <Button className="mt-3" size="sm" onClick={() => setLocation('/data-collection')} data-testid="button-view-data-collection">View Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-spatial-analysis-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="title-spatial-analysis-results">
              <MapPin className="w-5 h-5" />
              Spatial Analysis Results
            </CardTitle>
            <CardDescription>Deforestation monitoring and risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">15</span><span className="text-sm text-gray-600">Plots Analyzed</span></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">3</span><span className="text-sm text-gray-600">High Risk</span></div>
              <Button className="mt-3" size="sm" onClick={() => setLocation('/spatial-analysis')} data-testid="button-view-spatial">View Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-legality-compliance-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="title-legality-compliance-results">
              <CheckCircle className="w-5 h-5" />
              Legality Compliance Results
            </CardTitle>
            <CardDescription>Compliant, under review, and gaps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">42</span><span className="text-sm text-gray-600">Compliant</span></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">8</span><span className="text-sm text-gray-600">Under Review</span></div>
              <Button className="mt-3" size="sm" onClick={() => setLocation('/legality-compliance')} data-testid="button-view-legality">View Details</Button>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-risk-assessment-results">
          <CardHeader>
            <CardTitle className="flex items-center gap-2" data-testid="title-risk-assessment-results">
              <AlertTriangle className="w-5 h-5" />
              Risk Assessment Results
            </CardTitle>
            <CardDescription>Risk distribution and score</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">38</span><span className="text-sm text-gray-600">Low</span></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">12</span><span className="text-sm text-gray-600">Medium</span></div>
              <div className="flex items-baseline gap-2"><span className="text-2xl font-bold">3</span><span className="text-sm text-gray-600">High</span></div>
              <Button className="mt-3" size="sm" onClick={() => setLocation('/risk-assessment')} data-testid="button-view-risk">View Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{supplierAssessments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {supplierAssessments.filter(s => s.overallStatus === 'compliant').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getOverallProgress()}%</div>
            <Progress value={getOverallProgress()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{getAverageScore()}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Supply Chain Analysis Results
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each supplier's progress through the 3-stage assessment workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Supplier Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Data Collection</TableHead>
                  <TableHead className="text-center">Legality Assessment</TableHead>
                  <TableHead className="text-center">Risk Assessment</TableHead>
                  <TableHead className="text-center">Overall Status</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierAssessments.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{supplier.supplierName}</div>
                        <div className="text-xs text-gray-500">Last updated: {supplier.lastUpdated}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {supplier.supplierType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={supplier.dataCollectionStatus}
                        score={supplier.dataCollectionScore}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={supplier.legalityStatus}
                        score={supplier.legalityScore}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge
                        status={supplier.riskAssessmentStatus}
                        score={supplier.riskAssessmentScore}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <StatusBadge status={supplier.overallStatus} />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-lg font-bold text-gray-900">
                          {supplier.overallScore}%
                        </span>
                        <Progress
                          value={supplier.overallScore}
                          className="w-16 h-2 mt-1"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex space-x-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/data-collection')}
                          data-testid={`view-details-${supplier.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation('/due-diligence-report')}
                          data-testid={`generate-report-${supplier.id}`}
                        >
                          <FileText className="w-3 h-3 mr-1" />
                          Report
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Workflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Assessment Workflow
          </CardTitle>
          <CardDescription>
            4-step comprehensive risk evaluation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  1
                </div>
                <div>
                  <p className="font-medium text-green-900">Data Collection</p>
                  <p className="text-sm text-green-700">Complete supplier data collection and documentation</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  2
                </div>
                <div>
                  <p className="font-medium text-purple-900">Spatial Analysis</p>
                  <p className="text-sm text-purple-700">Analyze geospatial data and deforestation risks</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-900">Legality Compliance</p>
                  <p className="text-sm text-blue-700">Verify legal compliance and regulatory requirements</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  4
                </div>
                <div>
                  <p className="font-medium text-orange-900">Risk Assessment</p>
                  <p className="text-sm text-orange-700">Comprehensive risk evaluation and scoring</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hasil Koleksi Data */}
      <Card data-testid="card-data-collection-results">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="title-data-collection-results">
            <FileText className="w-5 h-5 text-blue-600" />
            Hasil Koleksi Data
          </CardTitle>
          <CardDescription>
            Data collection results with AI-based quality scoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">15</div>
                <div className="text-sm text-gray-600">Estate Records</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">8</div>
                <div className="text-sm text-gray-600">Mill Records</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">23</div>
                <div className="text-sm text-gray-600">Smallholder Records</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">85%</div>
                <div className="text-sm text-gray-600">Avg AI Score</div>
              </div>
            </div>

            {/* Recent Data Collection */}
            <div>
              <h4 className="font-semibold mb-3">Recent Data Collections</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">PT Permata Hijau Estate</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">92% Complete</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/data-collection')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Sumber Makmur Mill</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">78% Complete</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/data-collection')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Riau Smallholder Cooperative</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">95% Complete</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/data-collection')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spatial Analysis Results */}
      <Card data-testid="card-spatial-analysis-detailed-results">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="title-spatial-analysis-detailed-results">
            <MapPin className="w-5 h-5 text-purple-600" />
            Spatial Analysis Results
          </CardTitle>
          <CardDescription>
            Geospatial risk assessment and deforestation monitoring results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">15</div>
                <div className="text-sm text-gray-600">Plots Analyzed</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">14</div>
                <div className="text-sm text-gray-600">High Risk</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">1</div>
                <div className="text-sm text-gray-600">Compliant</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0.42</div>
                <div className="text-sm text-gray-600">Avg Loss (ha)</div>
              </div>
            </div>

            {/* Recent Spatial Analysis */}
            <div>
              <h4 className="font-semibold mb-3">Recent Spatial Analysis</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">GKIB124133 - High Deforestation</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/spatial-analysis')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Map
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">GKIB124126 - Forest Loss Detected</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">High Risk</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/spatial-analysis')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Map
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">GKIB124129 - No Forest Loss</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/spatial-analysis')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Map
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legality Compliance Results */}
      <Card data-testid="card-legality-compliance-results">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="title-legality-compliance-results">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Legality Compliance Results
          </CardTitle>
          <CardDescription>
            Legal compliance verification results and indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Compliance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">42</div>
                <div className="text-sm text-gray-600">Compliant Suppliers</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">8</div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-gray-600">Non-Compliant</div>
              </div>
            </div>

            {/* Recent Assessments */}
            <div>
              <h4 className="font-semibold mb-3">Recent Legality Assessments</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">PT Permata Hijau Estate</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Compliant</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/legality-compliance')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Sumber Makmur Mill</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/legality-compliance')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Results */}
      <Card data-testid="card-risk-assessment-results">
        <CardHeader>
          <CardTitle className="flex items-center gap-2" data-testid="title-risk-assessment-results">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Risk Assessment Results
          </CardTitle>
          <CardDescription>
            Comprehensive risk evaluation and mitigation recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Risk Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">38</div>
                <div className="text-sm text-gray-600">Low Risk</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <div className="text-sm text-gray-600">Medium Risk</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-gray-600">High Risk</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">7.2</div>
                <div className="text-sm text-gray-600">Avg Risk Score</div>
              </div>
            </div>

            {/* Recent Risk Assessments */}
            <div>
              <h4 className="font-semibold mb-3">Recent Risk Assessments</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">PT Permata Hijau Estate</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800">Low Risk (6.2)</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/risk-assessment')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium">Sumber Makmur Mill</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">High Risk (8.7)</Badge>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/risk-assessment')}>
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
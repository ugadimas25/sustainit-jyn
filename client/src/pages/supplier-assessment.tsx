import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Eye, FileText, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useLocation } from 'wouter';

// Dummy data for supplier assessment results
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

export default function SupplierAssessment() {
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
          <h1 className="text-3xl font-bold text-gray-900">Supplier Assessment</h1>
          <p className="text-gray-600 mt-1">Comprehensive overview of supplier compliance status across all assessment stages</p>
        </div>
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

      {/* Assessment Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Supplier Assessment Results
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
                          onClick={() => setLocation('/reports')}
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
            Step-by-step risk evaluation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Data Collection</p>
                  <p className="text-sm text-gray-600">Complete supplier data collection</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">Legality Compliance</p>
                  <p className="text-sm text-gray-600">Verify legal compliance status</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-semibold text-white">
                  3
                </div>
                <div>
                  <p className="font-medium text-blue-900">Risk Assessment</p>
                  <p className="text-sm text-blue-700">Comprehensive risk evaluation</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
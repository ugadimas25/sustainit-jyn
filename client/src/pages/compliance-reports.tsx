import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Download, 
  Share2, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Building,
  MapPin,
  Users,
  Calendar,
  Leaf,
  Shield,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface ComplianceScore {
  indicator: string;
  score: number;
  status: "compliant" | "partial" | "non-compliant";
  details: string;
}

interface ComplianceReportData {
  id: string;
  supplierName: string;
  supplierType: string;
  location: string;
  assessmentDate: string;
  status: string;
  overallScore: number;
  complianceScores: ComplianceScore[];
  riskLevel: "low" | "medium" | "high";
  certifications: string[];
  keyMetrics: {
    landArea: number;
    employeeCount: number;
    forestStatus: string;
    permitType: string;
  };
}

const COMPLIANCE_INDICATORS = [
  { id: "landTenure", name: "Land Tenure", icon: MapPin },
  { id: "environmental", name: "Environmental Laws", icon: Leaf },
  { id: "forest", name: "Forest Regulations", icon: Shield },
  { id: "thirdParty", name: "Third-Party Rights", icon: Users },
  { id: "labour", name: "Labour Standards", icon: Building },
  { id: "humanRights", name: "Human Rights", icon: Shield },
  { id: "taxAntiCorruption", name: "Tax & Anti-Corruption", icon: BarChart3 },
  { id: "otherLaws", name: "Other National Laws", icon: FileText }
];

export default function ComplianceReportsPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [reportData, setReportData] = useState<ComplianceReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch EUDR assessments
  const { data: assessments, isLoading } = useQuery({
    queryKey: ['/api/eudr-assessments'],
    queryFn: async () => {
      const response = await fetch('/api/eudr-assessments');
      if (!response.ok) throw new Error('Failed to fetch assessments');
      return response.json();
    }
  });

  // Generate compliance scores from assessment data
  const generateComplianceReport = (assessmentId: string) => {
    const assessment = assessments?.find((a: any) => a.id === assessmentId);
    if (!assessment) return;

    // Calculate compliance scores for each indicator
    const complianceScores: ComplianceScore[] = [
      {
        indicator: "Land Tenure",
        score: calculateLandTenureScore(assessment),
        status: calculateLandTenureStatus(assessment),
        details: `${assessment.tenureType} - ${assessment.landArea} hectares`
      },
      {
        indicator: "Environmental Laws",
        score: calculateEnvironmentalScore(assessment),
        status: calculateEnvironmentalStatus(assessment),
        details: `${assessment.permitType} permit - ${assessment.environmentalStatus}`
      },
      {
        indicator: "Forest Regulations",
        score: calculateForestScore(assessment),
        status: calculateForestStatus(assessment),
        details: `${assessment.forestStatus} - Protected: ${assessment.protectedAreaStatus ? 'Yes' : 'No'}`
      },
      {
        indicator: "Third-Party Rights",
        score: calculateThirdPartyScore(assessment),
        status: calculateThirdPartyStatus(assessment),
        details: `FPIC: ${assessment.fpicStatus ? 'Obtained' : 'N/A'} - Conflicts: ${assessment.landConflict ? 'Yes' : 'No'}`
      },
      {
        indicator: "Labour Standards",
        score: calculateLabourScore(assessment),
        status: calculateLabourStatus(assessment),
        details: `${assessment.employeeCount} employees - BPJS: ${assessment.bpjsKetenagakerjaanNumber ? 'Yes' : 'No'}`
      },
      {
        indicator: "Human Rights",
        score: calculateHumanRightsScore(assessment),
        status: calculateHumanRightsStatus(assessment),
        details: `Policy adherence: ${assessment.policyAdherence ? 'Yes' : 'No'}`
      },
      {
        indicator: "Tax & Anti-Corruption",
        score: calculateTaxScore(assessment),
        status: calculateTaxStatus(assessment),
        details: `NPWP: ${assessment.npwpNumber ? 'Valid' : 'Missing'} - Anti-bribery: ${assessment.antiBriberyPolicy ? 'Yes' : 'No'}`
      },
      {
        indicator: "Other National Laws",
        score: calculateOtherLawsScore(assessment),
        status: calculateOtherLawsStatus(assessment),
        details: `Business license: ${assessment.businessLicense ? 'Valid' : 'Missing'}`
      }
    ];

    const overallScore = Math.round(complianceScores.reduce((sum, score) => sum + score.score, 0) / complianceScores.length);
    const riskLevel: "low" | "medium" | "high" = overallScore >= 80 ? "low" : overallScore >= 60 ? "medium" : "high";

    const report: ComplianceReportData = {
      id: assessment.id,
      supplierName: assessment.supplierName,
      supplierType: assessment.supplierType,
      location: assessment.location,
      assessmentDate: new Date(assessment.createdAt).toLocaleDateString(),
      status: assessment.status,
      overallScore,
      complianceScores,
      riskLevel,
      certifications: [], // Can be expanded based on assessment data
      keyMetrics: {
        landArea: parseFloat(assessment.landArea),
        employeeCount: assessment.employeeCount,
        forestStatus: assessment.forestStatus,
        permitType: assessment.permitType
      }
    };

    setReportData(report);
  };

  // Scoring functions for each indicator
  const calculateLandTenureScore = (assessment: any): number => {
    let score = 0;
    if (assessment.landTitleNumber) score += 40;
    if (assessment.tenureType && assessment.tenureType !== 'Other') score += 30;
    if (assessment.gpsCoordinates) score += 20;
    if (assessment.landArea > 0) score += 10;
    return Math.min(score, 100);
  };

  const calculateEnvironmentalScore = (assessment: any): number => {
    let score = 0;
    if (assessment.permitNumber) score += 50;
    if (assessment.environmentalStatus) score += 30;
    if (assessment.issuanceYear && assessment.issuanceYear > 2015) score += 20;
    return Math.min(score, 100);
  };

  const calculateForestScore = (assessment: any): number => {
    let score = 0;
    if (assessment.forestStatus === 'Non-Forest Area') score += 60;
    else if (assessment.forestStatus === 'Forest Area' && assessment.forestLicenseNumber) score += 40;
    if (!assessment.protectedAreaStatus) score += 40;
    return Math.min(score, 100);
  };

  const calculateThirdPartyScore = (assessment: any): number => {
    let score = 60; // Base score
    if (assessment.landConflict) score -= 30;
    if (assessment.communalRights && assessment.fpicStatus) score += 30;
    if (assessment.communalRights && !assessment.fpicStatus) score -= 20;
    return Math.max(0, Math.min(score, 100));
  };

  const calculateLabourScore = (assessment: any): number => {
    let score = 0;
    if (assessment.hasWorkerContracts) score += 30;
    if (assessment.bpjsKetenagakerjaanNumber) score += 35;
    if (assessment.bpjsKesehatanNumber) score += 35;
    return Math.min(score, 100);
  };

  const calculateHumanRightsScore = (assessment: any): number => {
    let score = 50; // Base score
    if (assessment.policyAdherence) score += 25;
    if (!assessment.humanRightsViolations) score += 25;
    return Math.min(score, 100);
  };

  const calculateTaxScore = (assessment: any): number => {
    let score = 0;
    if (assessment.npwpNumber) score += 30;
    if (assessment.pbbPaymentProof) score += 25;
    if (assessment.antiBriberyPolicy) score += 25;
    if (assessment.codeOfEthics) score += 20;
    return Math.min(score, 100);
  };

  const calculateOtherLawsScore = (assessment: any): number => {
    let score = 0;
    if (assessment.businessLicense) score += 40;
    if (assessment.corporateRegistration) score += 30;
    if (assessment.tradeLicenses && assessment.tradeLicenses.length > 0) score += 30;
    return Math.min(score, 100);
  };

  // Status calculation helpers
  const calculateLandTenureStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateLandTenureScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateEnvironmentalStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateEnvironmentalScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateForestStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateForestScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateThirdPartyStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateThirdPartyScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateLabourStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateLabourScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateHumanRightsStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateHumanRightsScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateTaxStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateTaxScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const calculateOtherLawsStatus = (assessment: any): "compliant" | "partial" | "non-compliant" => {
    const score = calculateOtherLawsScore(assessment);
    return score >= 80 ? "compliant" : score >= 50 ? "partial" : "non-compliant";
  };

  const getStatusIcon = (status: "compliant" | "partial" | "non-compliant") => {
    switch (status) {
      case "compliant": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "partial": return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "non-compliant": return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: "compliant" | "partial" | "non-compliant") => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800 border-green-200";
      case "partial": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "non-compliant": return "bg-red-100 text-red-800 border-red-200";
    }
  };

  const getRiskLevelColor = (risk: "low" | "medium" | "high") => {
    switch (risk) {
      case "low": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "high": return "bg-red-100 text-red-800";
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current || !reportData) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${reportData.supplierName}-compliance-report.pdf`);
      
      toast({
        title: "Report Exported",
        description: "Compliance report has been downloaded as PDF."
      });
    } catch (error) {
      toast({
        title: "Export Failed", 
        description: "Failed to export report as PDF.",
        variant: "destructive"
      });
    }
    setIsGenerating(false);
  };

  const shareReport = async () => {
    if (!reportData) return;
    
    const shareData = {
      title: `${reportData.supplierName} - EUDR Compliance Report`,
      text: `Overall compliance score: ${reportData.overallScore}% | Risk level: ${reportData.riskLevel.toUpperCase()}`,
      url: window.location.href
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast({
          title: "Link Copied",
          description: "Report link copied to clipboard."
        });
      }
    } else {
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
      toast({
        title: "Link Copied", 
        description: "Report link copied to clipboard."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance Reports</h1>
          <p className="text-muted-foreground">
            Generate and share visual compliance reports for EUDR assessments
          </p>
        </div>
      </div>

      {/* Assessment Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Select value={selectedAssessment} onValueChange={setSelectedAssessment}>
                <SelectTrigger data-testid="select-assessment">
                  <SelectValue placeholder="Select EUDR assessment" />
                </SelectTrigger>
                <SelectContent>
                  {assessments?.map((assessment: any) => (
                    <SelectItem key={assessment.id} value={assessment.id}>
                      {assessment.supplierName} - {assessment.supplierType} ({assessment.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => generateComplianceReport(selectedAssessment)}
              disabled={!selectedAssessment || isLoading}
              data-testid="button-generate-report"
            >
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Report */}
      {reportData && (
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={exportToPDF} disabled={isGenerating} data-testid="button-export-pdf">
              <Download className="w-4 h-4 mr-2" />
              {isGenerating ? "Generating..." : "Export PDF"}
            </Button>
            <Button variant="outline" onClick={shareReport} data-testid="button-share-report">
              <Share2 className="w-4 h-4 mr-2" />
              Share Report
            </Button>
          </div>

          {/* Report Content */}
          <div ref={reportRef} className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">EUDR Compliance Report</h2>
                  <p className="text-gray-600">European Union Deforestation Regulation Assessment</p>
                </div>
                <Badge className={getRiskLevelColor(reportData.riskLevel)}>
                  Risk Level: {reportData.riskLevel.toUpperCase()}
                </Badge>
              </div>
              
              <Separator className="mb-6" />
              
              {/* Supplier Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{reportData.supplierName}</p>
                      <p className="text-sm text-gray-600">{reportData.supplierType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <p className="text-sm">{reportData.location}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Assessment Date</p>
                      <p className="text-sm text-gray-600">{reportData.assessmentDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">Status</p>
                      <p className="text-sm text-gray-600">{reportData.status}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Score */}
            <div className="mb-8">
              <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                <div className="text-6xl font-bold text-gray-900 mb-2">{reportData.overallScore}%</div>
                <p className="text-xl font-medium text-gray-700">Overall Compliance Score</p>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{reportData.keyMetrics.landArea.toLocaleString()}</div>
                  <p className="text-sm text-gray-600">Hectares</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{reportData.keyMetrics.employeeCount}</div>
                  <p className="text-sm text-gray-600">Employees</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-medium text-gray-900">{reportData.keyMetrics.forestStatus}</div>
                  <p className="text-sm text-gray-600">Forest Status</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-medium text-gray-900">{reportData.keyMetrics.permitType}</div>
                  <p className="text-sm text-gray-600">Permit Type</p>
                </div>
              </div>
            </div>

            {/* Compliance Breakdown */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4">Compliance Indicators</h3>
              <div className="space-y-4">
                {reportData.complianceScores.map((score, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(score.status)}
                      <div>
                        <p className="font-medium">{score.indicator}</p>
                        <p className="text-sm text-gray-600">{score.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(score.status)}>
                        {score.status.replace('-', ' ')}
                      </Badge>
                      <div className="text-right">
                        <p className="font-bold">{score.score}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 mt-8 pt-6 border-t">
              <p>Generated by KPN EUDR Platform • {new Date().toLocaleDateString()}</p>
              <p>This report is automatically generated based on submitted assessment data</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}